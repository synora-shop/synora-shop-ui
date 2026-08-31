import { Resolver } from "node:dns/promises";
import { DNS_TARGET, VERIFICATION_RECORD } from "@/lib/domains";
import { normaliseHost } from "@/lib/shop-context";

// Asking the internet whether a merchant actually did what we told them to.
//
// Server-only: node:dns has no browser equivalent.
//
// Two things are checked and both matter. The TXT record proves the person who
// added the domain controls it — without that, anyone could claim a competitor's
// domain and, the moment that competitor's DNS ever pointed here, serve their
// own store from it. The A/CNAME record is what actually routes traffic.
//
// Queries go to public resolvers rather than the system one. A container's
// resolver may be an internal cache with its own idea of a zone, and a stale
// negative answer here reads to the merchant as "you did it wrong".

const RESOLVERS = (process.env.DNS_RESOLVERS ?? "1.1.1.1,8.8.8.8")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Long enough for a slow authoritative server, short enough not to hang a form. */
const TIMEOUT_MS = 5_000;

function resolver(): Resolver {
  const r = new Resolver({ timeout: TIMEOUT_MS, tries: 2 });
  if (RESOLVERS.length) r.setServers(RESOLVERS);
  return r;
}

/** A lookup that treats "no such record" as an empty answer, not an error. */
async function lookup<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // ENODATA: the name exists, this record type does not.
    // ENOTFOUND / NXDOMAIN: the name does not exist yet.
    // All three are ordinary states for a domain mid-setup.
    if (code === "ENODATA" || code === "ENOTFOUND" || code === "NXDOMAIN") return [];
    throw error;
  }
}

export type DnsCheck = {
  /** Both records correct. */
  ok: boolean;
  ownershipProven: boolean;
  routingCorrect: boolean;
  /** What to tell the merchant. Empty when ok. */
  error: string | null;
};

/**
 * Checks a domain's records.
 *
 * Never throws for a DNS-level answer — a domain that does not resolve is a
 * result, not a failure. It does throw if the resolver itself is unreachable,
 * because that is our problem and should not be reported to a merchant as
 * "your domain is wrong".
 */
export async function checkDomain(hostname: string, verificationToken: string): Promise<DnsCheck> {
  const host = normaliseHost(hostname);
  const r = resolver();

  // The same in both cases: a registrar's "name" field is relative to the zone,
  // so `_synora-verify` on example.com and `_synora-verify.shop` on
  // example.com both resolve to this.
  const txtName = `${VERIFICATION_RECORD}.${host}`;

  // Both queries at once: they are independent, and a merchant waiting on a
  // form should wait for the slower of the two rather than their sum.
  const [txtRecords, routing] = await Promise.all([
    lookup(() => r.resolveTxt(txtName)),
    checkRouting(r, host),
  ]);

  // resolveTxt returns each record as an array of strings, because a long TXT
  // value is split into 255-byte chunks on the wire. Joining is what the record
  // actually says.
  const values = txtRecords.map((chunks) => chunks.join(""));
  const ownershipProven = values.includes(verificationToken);

  if (!ownershipProven && !routing.correct) {
    return {
      ok: false,
      ownershipProven,
      routingCorrect: false,
      error:
        values.length || routing.found.length
          ? "The records for this domain don't match the ones below. Check them at your registrar."
          : "No records found yet. DNS changes can take up to an hour to spread.",
    };
  }

  if (!ownershipProven) {
    return {
      ok: false,
      ownershipProven: false,
      routingCorrect: routing.correct,
      error: values.length
        ? `The ${VERIFICATION_RECORD} record has a different value. Replace it with the one below.`
        : `The ${VERIFICATION_RECORD} record isn't there yet.`,
    };
  }

  if (!routing.correct) {
    return {
      ok: false,
      ownershipProven: true,
      routingCorrect: false,
      error: routing.found.length
        ? `This domain currently points at ${routing.found.join(", ")}. Change it to the value below.`
        : "The record that sends visitors to your store isn't there yet.",
    };
  }

  return { ok: true, ownershipProven: true, routingCorrect: true, error: null };
}

/**
 * Whether traffic for this host would reach us.
 *
 * An apex needs an A record; anything below it normally has a CNAME, but a
 * registrar offering ALIAS/ANAME flattens that into an A record at query time,
 * so both are accepted for both. What matters is where it ends up, not which
 * record type got it there.
 */
async function checkRouting(
  r: Resolver,
  host: string
): Promise<{ correct: boolean; found: string[] }> {
  const [cnames, addresses] = await Promise.all([
    lookup(() => r.resolveCname(host)),
    lookup(() => r.resolve4(host)),
  ]);

  const cnameTarget = normaliseHost(DNS_TARGET.cname);
  const cnameOk = cnames.some((c) => normaliseHost(c) === cnameTarget);
  const aOk = addresses.includes(DNS_TARGET.a);

  return {
    correct: cnameOk || aOk,
    found: [...cnames.map(normaliseHost), ...addresses],
  };
}

/**
 * Whether a hostname resolves at all.
 *
 * Used before adding a domain, purely to catch a typo early: a name with no
 * nameservers is almost always a mistake rather than a domain awaiting setup.
 * Not a gate — a freshly registered domain can take a while to appear, and
 * refusing it would be worse than accepting it and reporting PENDING.
 */
export async function domainExists(hostname: string): Promise<boolean> {
  const r = resolver();
  const host = normaliseHost(hostname);
  try {
    const ns = await lookup(() => r.resolveNs(host));
    if (ns.length) return true;
    // A subdomain has no NS records of its own; ask about its parent.
    const parent = host.split(".").slice(1).join(".");
    if (parent.includes(".")) {
      return (await lookup(() => r.resolveNs(parent))).length > 0;
    }
    return false;
  } catch {
    // A resolver problem is ours, not the merchant's. Say yes and let the
    // full check report the real state later.
    return true;
  }
}
