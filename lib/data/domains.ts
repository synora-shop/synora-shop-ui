import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { checkDomain } from "@/lib/dns";
import { hostingProvider } from "@/lib/hosting";
import { MAX_AUTOMATIC_CHECKS, backoffMs } from "@/lib/domains";
import { PLATFORM_DOMAIN, normaliseHost } from "@/lib/shop-context";

// Moving a domain from "typed into a box" to "serving a store".
//
// The steps are always the same and always in this order:
//
//   1. The merchant adds it. We store it PENDING with a random token and show
//      them the records to create.
//   2. DNS is checked. The TXT record proves they own it; the A or CNAME record
//      proves it points here. Both, or it stays PENDING.
//   3. The hosting provider is told about it, so a certificate is issued.
//   4. When the provider says it is serving, it becomes ACTIVE.
//
// Every step is idempotent, because the checker runs on a schedule and the
// merchant has a "check now" button, and both can happen at once.

/**
 * How many checks in a row a live domain may fail before it stops being served.
 *
 * Not one. See verifyDomain: a single unlucky DNS query would otherwise take a
 * working store off its own domain. Three, at the sweep's six-hour spacing, is
 * most of a day of genuinely broken records before anything changes — and the
 * merchant sees the error on the screen from the first failure.
 */
const LIVE_FAILURES_BEFORE_DEMOTION = 3;

/** A domain's verification secret. Random per domain. */
function newVerificationToken(): string {
  // Base64url of 24 bytes: short enough to paste into a registrar field that
  // may have a length limit, long enough that guessing is not a strategy.
  return `synora-verify=${randomBytes(24).toString("base64url")}`;
}

/**
 * Gives a new shop its free address.
 *
 * Called when a shop is created. The platform domain is a Domain row like any
 * other so that host resolution has one path, and it starts ACTIVE because
 * there is nothing to verify — we own the zone and the wildcard certificate
 * already covers it.
 */
export async function createPlatformDomain(shopId: string, subdomain: string) {
  const hostname = `${subdomain}.${PLATFORM_DOMAIN}`;
  return prisma.domain.create({
    data: {
      shopId,
      hostname,
      status: "ACTIVE",
      isPlatform: true,
      // The first domain a shop has is necessarily its canonical one. Adding a
      // custom domain later moves this.
      isPrimary: true,
      verificationToken: "",
      verifiedAt: new Date(),
      activatedAt: new Date(),
    },
  });
}

export type AddResult =
  | { ok: true; domainId: string }
  | { ok: false; error: string };

/**
 * Claims a hostname for a shop.
 *
 * The interesting case is a hostname somebody else already added. A row that is
 * merely PENDING is not a claim — anyone can type any domain into a box, and
 * letting an unverified row block a real owner would make squatting trivial. So
 * a PENDING row belonging to another shop is released and re-issued here. A
 * VERIFIED or ACTIVE row is a proven claim and is never taken.
 */
export async function addDomain(shopId: string, hostname: string): Promise<AddResult> {
  const host = normaliseHost(hostname);

  const existing = await prisma.domain.findUnique({
    where: { hostname: host },
    select: { id: true, shopId: true, status: true },
  });

  if (existing) {
    if (existing.shopId === shopId) {
      return { ok: false, error: "That domain is already on this store." };
    }
    if (existing.status === "VERIFIED" || existing.status === "ACTIVE") {
      // Deliberately does not say which store. That would turn this form into
      // a way to ask "who runs this domain?".
      return {
        ok: false,
        error: "That domain is already in use. If it's yours, remove it from the other store first.",
      };
    }
    // An unproven claim by someone else. Release it.
    await prisma.domain.delete({ where: { id: existing.id } });
  }

  const domain = await prisma.domain.create({
    data: { shopId, hostname: host, verificationToken: newVerificationToken() },
  });
  return { ok: true, domainId: domain.id };
}

export type VerifyOutcome = {
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED";
  /** What to tell the merchant. Null when it is serving. */
  message: string | null;
};

/**
 * Runs one full check of a domain and records the result.
 *
 * Safe to call as often as you like; `respectBackoff` is what the scheduled
 * checker passes so it does not query a registrar every minute for a domain
 * nobody is fixing. A merchant pressing "check now" passes false, because they
 * have just changed something and waiting is exactly the wrong answer.
 */
export async function verifyDomain(
  domainId: string,
  { respectBackoff = false }: { respectBackoff?: boolean } = {}
): Promise<VerifyOutcome> {
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  if (!domain) return { status: "FAILED", message: "That domain is no longer set up." };

  if (domain.isPlatform) {
    return { status: "ACTIVE", message: null };
  }

  if (respectBackoff && domain.lastCheckedAt) {
    const due = domain.lastCheckedAt.getTime() + backoffMs(domain.failedChecks);
    if (Date.now() < due) {
      return { status: domain.status, message: domain.lastError };
    }
  }

  const dns = await checkDomain(domain.hostname, domain.verificationToken);

  if (!dns.ok) {
    const failedChecks = domain.failedChecks + 1;

    // A domain that is already serving customers is not taken off the air by
    // one bad answer.
    //
    // A resolver blip, a registrar's momentary NXDOMAIN, a nameserver
    // migration that takes ten minutes — any of these fails a single lookup on
    // a domain that is perfectly fine. Demoting on the first failure would drop
    // it out of resolveShopByHost, and the merchant's store would 404 on their
    // own domain because our DNS query was unlucky. So a live domain keeps
    // serving until it has failed LIVE_FAILURES_BEFORE_DEMOTION times in a
    // row, and the error is shown to the merchant throughout.
    //
    // The asymmetry is deliberate: refusing to serve a domain that works is a
    // far worse mistake than serving one whose records have just been removed.
    const holdsService =
      domain.status === "ACTIVE" && failedChecks < LIVE_FAILURES_BEFORE_DEMOTION;

    const status = holdsService
      ? "ACTIVE"
      : // Only ever FAILED after we have genuinely stopped looking. Until then
        // it is PENDING, because "we haven't seen it yet" and "this is wrong"
        // are different things to a merchant halfway through a DNS change.
        failedChecks >= MAX_AUTOMATIC_CHECKS
        ? "FAILED"
        : "PENDING";

    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        status,
        // A domain that used to verify and now does not has genuinely stopped
        // being proven, and must not keep an old proof — unless it is still
        // serving, where the proof is what is keeping it up.
        verifiedAt: holdsService ? domain.verifiedAt : null,
        activatedAt: holdsService ? domain.activatedAt : null,
        lastError: dns.error,
        lastCheckedAt: new Date(),
        failedChecks,
      },
    });
    return { status, message: dns.error };
  }

  // DNS is right. Ask the provider to serve it — idempotent, so repeating this
  // on every check costs one API call and keeps a domain that was removed at
  // the vendor from silently staying broken.
  const provider = hostingProvider();
  try {
    await provider.add(domain.hostname);
  } catch (error) {
    // A vendor failure is ours, not the merchant's, and must not be recorded as
    // a failed check — otherwise an outage at the provider walks every domain
    // on the platform towards FAILED.
    const message = error instanceof Error ? error.message : "Couldn't set up the certificate.";
    console.error("[domains] provider add failed", domain.hostname, error);
    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        lastError: message,
        lastCheckedAt: new Date(),
      },
    });
    return { status: "VERIFIED", message };
  }

  const state = await provider.status(domain.hostname).catch(() => null);
  const serving = state?.serving === true;

  await prisma.domain.update({
    where: { id: domain.id },
    data: {
      status: serving ? "ACTIVE" : "VERIFIED",
      verifiedAt: new Date(),
      activatedAt: serving ? (domain.activatedAt ?? new Date()) : null,
      lastError: serving ? null : (state?.problem ?? null),
      lastCheckedAt: new Date(),
      failedChecks: 0,
    },
  });

  return {
    status: serving ? "ACTIVE" : "VERIFIED",
    message: serving ? null : (state?.problem ?? "Waiting for the certificate."),
  };
}

/**
 * Makes one domain the canonical address for a shop.
 *
 * Both writes together: a shop with two primaries has an ambiguous canonical
 * URL, and one with none would have every domain redirecting to nothing.
 */
export async function setPrimaryDomain(shopId: string, domainId: string): Promise<string | null> {
  const domain = await prisma.domain.findFirst({ where: { id: domainId, shopId } });
  if (!domain) return "That domain isn't set up on this store.";
  if (domain.isPrimary) return null;
  if (domain.status !== "ACTIVE") {
    // Pointing the canonical URL at a domain that does not serve would take the
    // store off the internet as far as a search engine is concerned.
    return "That domain isn't live yet. It has to be working before it can be your main address.";
  }

  await prisma.$transaction([
    prisma.domain.updateMany({ where: { shopId, isPrimary: true }, data: { isPrimary: false } }),
    prisma.domain.update({ where: { id: domainId }, data: { isPrimary: true } }),
  ]);
  return null;
}

/**
 * Removes a domain from a shop.
 *
 * The free address cannot be removed: it is the fallback that keeps a store
 * reachable when a merchant's own domain expires or is misconfigured, and a
 * store with no working address is one that can only be recovered by support.
 */
export async function removeDomain(shopId: string, domainId: string): Promise<string | null> {
  const domain = await prisma.domain.findFirst({ where: { id: domainId, shopId } });
  if (!domain) return "That domain isn't set up on this store.";
  if (domain.isPlatform) {
    return "Your free address can't be removed, it's what keeps your store reachable.";
  }

  // Told to stop serving before the row goes, so a hostname is never left
  // attached at the vendor with nothing here that knows about it. A vendor
  // failure is logged rather than fatal: the merchant asked for this domain to
  // go away, and refusing would leave them stuck.
  try {
    await hostingProvider().remove(domain.hostname);
  } catch (error) {
    console.error("[domains] provider remove failed", domain.hostname, error);
  }

  if (domain.isPrimary) {
    // Hand primary back to the free address rather than leaving the shop
    // without one.
    const platform = await prisma.domain.findFirst({ where: { shopId, isPlatform: true } });
    if (platform) {
      await prisma.$transaction([
        prisma.domain.delete({ where: { id: domainId } }),
        prisma.domain.update({ where: { id: platform.id }, data: { isPrimary: true } }),
      ]);
      return null;
    }
  }

  await prisma.domain.delete({ where: { id: domainId } });
  return null;
}

export type AddressMove =
  | { ok: true; from: string; to: string; keptOld: boolean }
  | { ok: false; error: string };

/**
 * Moves a shop's free address, because its name changed.
 *
 * `<subdomain>.shop.synoradigitals.com` is derived from the shop's name, so
 * renaming a store leaves the old address pointing at a name nobody uses. This
 * moves it — and decides what happens to the address people have already
 * shared.
 *
 * Three things it must not do, and each has cost somebody a storefront
 * somewhere:
 *
 *   It must not touch a custom domain. A merchant who has connected their own
 *   domain has an address that has nothing to do with their store's name, and
 *   renaming the shop must not take it off the air or move the canonical URL
 *   off it. The custom domain stays primary if it was primary; the free address
 *   moves underneath it.
 *
 *   It must not silently break shared links. `keepOld` leaves the previous
 *   hostname behind as a resolvable row, which resolveShopByHost finds and
 *   guardCanonicalHost then redirects — permanently — to the new address. The
 *   merchant is asked which they want; there is no sensible default, which is
 *   why the question is not skippable.
 *
 *   It must not take a name somebody else is using. The unique index on
 *   Domain.hostname is the real gate; this checks first so the merchant gets a
 *   sentence rather than a constraint violation.
 */
export async function moveFreeAddress(
  shopId: string,
  nextSubdomain: string,
  { keepOld }: { keepOld: boolean }
): Promise<AddressMove> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { subdomain: true },
  });
  if (!shop) return { ok: false, error: "That store is no longer here." };

  const from = `${shop.subdomain}.${PLATFORM_DOMAIN}`;
  const to = `${nextSubdomain}.${PLATFORM_DOMAIN}`;
  if (shop.subdomain === nextSubdomain) {
    return { ok: true, from, to, keptOld: false };
  }

  // Taken by another shop, either as its own free address or as a row left
  // behind by one of its own renames.
  const clashingShop = await prisma.shop.findUnique({
    where: { subdomain: nextSubdomain },
    select: { id: true },
  });
  if (clashingShop && clashingShop.id !== shopId) {
    return { ok: false, error: "That address is taken. Try another." };
  }
  const clashingDomain = await prisma.domain.findUnique({
    where: { hostname: to },
    select: { shopId: true },
  });
  if (clashingDomain && clashingDomain.shopId !== shopId) {
    return { ok: false, error: "That address is taken. Try another." };
  }

  const old = await prisma.domain.findFirst({
    where: { shopId, hostname: from },
    select: { id: true, isPrimary: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.shop.update({ where: { id: shopId }, data: { subdomain: nextSubdomain } });

    if (!old) {
      // No row to move — ensurePlatformDomain will make one on the next read.
      return;
    }

    // The address being moved to may already exist as a row: going *back* to a
    // name this shop used before is exactly that, and it is the ordinary case
    // rather than an edge one. Creating a second row for the same hostname
    // violates the unique index — which is what happened the first time this
    // was written, and only showed when the revert button was actually pressed.
    const target = await tx.domain.findUnique({
      where: { hostname: to },
      select: { id: true },
    });

    if (keepOld) {
      // The old hostname stops being *the* free address and becomes a row that
      // still resolves. isPlatform goes false deliberately: it is no longer the
      // address this shop is guaranteed, ensurePlatformDomain must not mistake
      // it for one, and the merchant is now allowed to remove it — which is
      // how they release the name when they no longer want the redirect.
      //
      // Demoted before the other is promoted, so there is never a moment with
      // two primaries for one shop; the database refuses that outright.
      await tx.domain.update({
        where: { id: old.id },
        data: { isPlatform: false, isPrimary: false },
      });

      const becomes = {
        status: "ACTIVE" as const,
        isPlatform: true,
        // Only if the old one was. A shop with a custom domain as its canonical
        // address keeps that; the free address moves underneath it.
        isPrimary: old.isPrimary,
        verifiedAt: new Date(),
        activatedAt: new Date(),
        lastError: null,
        failedChecks: 0,
      };

      if (target) {
        await tx.domain.update({ where: { id: target.id }, data: becomes });
      } else {
        await tx.domain.create({
          data: { shopId, hostname: to, verificationToken: "", ...becomes },
        });
      }
      return;
    }

    // Not kept: nothing is left resolving on the old name, and it returns to
    // the pool. A row already sitting on the new name is removed first, or the
    // rename below collides with it.
    if (target) await tx.domain.delete({ where: { id: target.id } });
    await tx.domain.update({
      where: { id: old.id },
      data: { hostname: to, isPlatform: true },
    });
  });

  return { ok: true, from, to, keptOld: keepOld };
}

/**
 * Makes sure a shop's free address exists and is spelled correctly.
 *
 * Two things it repairs. A shop created before the Domain table has no platform
 * row at all; and one whose row was written by the migration carries the
 * production apex, which is wrong anywhere PLATFORM_DOMAIN differs — a preview
 * deployment, or local development. Both would show the merchant a URL that
 * does not work.
 *
 * Cheap and idempotent, so it runs whenever the domain list is read rather than
 * needing anyone to remember it.
 */
export async function ensurePlatformDomain(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { subdomain: true },
  });
  if (!shop) return;

  const expected = `${shop.subdomain}.${PLATFORM_DOMAIN}`;
  const existing = await prisma.domain.findFirst({ where: { shopId, isPlatform: true } });

  if (!existing) {
    // Primary only if the shop has no other canonical domain — a merchant who
    // already made their own domain primary should not lose it to a repair.
    const hasPrimary = await prisma.domain.count({ where: { shopId, isPrimary: true } });
    await prisma.domain
      .create({
        data: {
          shopId,
          hostname: expected,
          status: "ACTIVE",
          isPlatform: true,
          isPrimary: hasPrimary === 0,
          verificationToken: "",
          verifiedAt: new Date(),
          activatedAt: new Date(),
        },
      })
      // Another request may have created it in the meantime; the unique index
      // is what decides, and losing that race is a success.
      .catch(() => undefined);
    return;
  }

  if (existing.hostname !== expected) {
    await prisma.domain
      .update({ where: { id: existing.id }, data: { hostname: expected } })
      .catch(() => undefined);
  }
}

/**
 * How often a domain that is already live is checked again.
 *
 * Less often than one that is still being set up, because nothing is waiting
 * on it — but not never. A domain whose records are deleted, or whose
 * registration lapses, stops reaching us and nobody finds out: the screen goes
 * on saying "live" and the merchant's store is simply gone. Six hours is the
 * gap between that happening and us saying so.
 */
const LIVE_RECHECK_MS = 6 * 60 * 60 * 1000;

export type SweepReport = {
  checked: number;
  wentLive: number;
  brokeDown: number;
  stillWaiting: number;
  skipped: number;
};

/**
 * Checks every custom domain on the platform that is due one.
 *
 * This is the caller `backoffMs` and MAX_AUTOMATIC_CHECKS were written for.
 * Without it, a merchant who corrects their DNS at two in the morning stays
 * PENDING until they come back and press a button, and a domain that breaks
 * after going live is never noticed at all.
 *
 * Two populations, and they are due at different times:
 *
 *   - Not live yet (PENDING, VERIFIED). Someone is waiting, so these run on
 *     the backoff — a minute after the first failure, doubling to six hours,
 *     and stopping after MAX_AUTOMATIC_CHECKS so a domain nobody is fixing
 *     does not have us querying a registrar forever.
 *   - Live (ACTIVE). Nobody is waiting, so every six hours is enough. The only
 *     thing being watched for is a domain that has stopped working.
 *
 * FAILED is deliberately excluded: it means we genuinely stopped looking, and
 * the merchant restarts it with the button. Platform subdomains are excluded
 * because there is nothing to check — we own the zone.
 *
 * Never throws for one bad domain. A vendor timeout on the fortieth domain
 * must not cost the other thirty-nine their check.
 */
export async function sweepDomains(): Promise<SweepReport> {
  const now = Date.now();

  const candidates = await prisma.domain.findMany({
    where: { isPlatform: false, status: { in: ["PENDING", "VERIFIED", "ACTIVE"] } },
    select: { id: true, hostname: true, status: true, lastCheckedAt: true, failedChecks: true },
    orderBy: { lastCheckedAt: { sort: "asc", nulls: "first" } },
  });

  const report: SweepReport = {
    checked: 0,
    wentLive: 0,
    brokeDown: 0,
    stillWaiting: 0,
    skipped: 0,
  };

  for (const domain of candidates) {
    const due =
      domain.status === "ACTIVE"
        ? !domain.lastCheckedAt || now - domain.lastCheckedAt.getTime() >= LIVE_RECHECK_MS
        : !domain.lastCheckedAt ||
          now - domain.lastCheckedAt.getTime() >= backoffMs(domain.failedChecks);

    if (!due) {
      report.skipped += 1;
      continue;
    }

    try {
      // respectBackoff is false because the decision was just made above, with
      // the ACTIVE case folded in; asking twice would skip every live domain.
      const outcome = await verifyDomain(domain.id, { respectBackoff: false });
      report.checked += 1;

      if (outcome.status === "ACTIVE") {
        if (domain.status !== "ACTIVE") report.wentLive += 1;
      } else if (domain.status === "ACTIVE") {
        report.brokeDown += 1;
      } else {
        report.stillWaiting += 1;
      }
    } catch (error) {
      // One domain's failure is not the sweep's. Logged and stepped over.
      console.error("[domains] sweep failed for", domain.hostname, error);
    }
  }

  return report;
}

/** Every domain for a shop, canonical first, then live ones, then the rest. */
export async function domainsForShop(shopId: string) {
  await ensurePlatformDomain(shopId);

  const domains = await prisma.domain.findMany({
    where: { shopId },
    orderBy: { createdAt: "asc" },
  });

  const rank = (d: (typeof domains)[number]) =>
    d.isPrimary ? 0 : d.status === "ACTIVE" ? 1 : d.status === "VERIFIED" ? 2 : 3;

  return domains.sort((a, b) => rank(a) - rank(b) || a.hostname.localeCompare(b.hostname));
}
