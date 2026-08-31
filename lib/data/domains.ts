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
    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        // Only ever FAILED after we have genuinely stopped looking. Until then
        // it is PENDING, because "we haven't seen it yet" and "this is wrong"
        // are different things to a merchant halfway through a DNS change.
        status: failedChecks >= MAX_AUTOMATIC_CHECKS ? "FAILED" : "PENDING",
        // A domain that used to verify and now does not has genuinely stopped
        // being proven, and must not keep an old proof.
        verifiedAt: null,
        lastError: dns.error,
        lastCheckedAt: new Date(),
        failedChecks,
      },
    });
    return {
      status: failedChecks >= MAX_AUTOMATIC_CHECKS ? "FAILED" : "PENDING",
      message: dns.error,
    };
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
