import {
  PLATFORM_DOMAIN,
  RESERVED_SUBDOMAINS,
  classifyHost,
  normaliseHost,
} from "@/lib/shop-context";

// What a merchant may point at us, and what they have to do to prove it.
//
// Client-safe on purpose: no Prisma, no DNS, no next/headers. The form that
// takes a domain needs these rules to give live feedback, and the server needs
// the same rules to enforce them. One copy, both places — a domain accepted by
// the form and refused by the server is a support ticket every time.
//
// The actual DNS lookups live in lib/dns.ts and the provider calls in
// lib/hosting/, both server-only.

/** Where a merchant's records should point. Set per environment. */
export const DNS_TARGET = {
  /** For a subdomain like `shop.example.com` — a CNAME. */
  cname: process.env.DOMAIN_CNAME_TARGET ?? `cname.${PLATFORM_DOMAIN}`,
  /**
   * For an apex like `example.com`, where CNAME is not allowed by the DNS spec.
   * An A record to a fixed address is the portable answer; registrars that
   * support ALIAS/ANAME can use the CNAME target instead.
   */
  a: process.env.DOMAIN_A_RECORD ?? "76.76.21.21",
} as const;

/** The TXT record name a verification token is published under. */
export const VERIFICATION_RECORD = "_synora-verify";

export type DomainResult = { ok: true; value: string } | { ok: false; error: string };

/**
 * Hostnames nobody may claim, whatever their DNS says.
 *
 * Someone who verified `synoradigitals.com` — or a lookalike of it — could serve a
 * sign-in page from inside our own certificate. Proving you control a name is
 * not the same as being allowed to use it here.
 */
function isPlatformOwned(host: string): boolean {
  // Asked of classifyHost rather than answered a second time here, because the
  // two must agree: a hostname this accepts but classifyHost calls ours is a
  // domain a merchant can add, verify, and never be served on. Deployment URLs
  // were exactly that — ours, and a second copy of the rule did not know it.
  //
  // Both kinds count. "platform" is our apex, www, the reserved names and the
  // deployment URLs; "subdomain" is another merchant's free address, which is
  // no more claimable than ours.
  const { kind } = classifyHost(host);
  return kind === "platform" || kind === "subdomain";
}

/**
 * Validates and normalises a hostname in one step.
 *
 * Returns the cleaned value rather than a verdict, for the same reason
 * parseSubdomain does: a caller that validated `"Shop.Example.COM "` and then
 * stored the raw input would put a mixed-case, space-padded string into a
 * certificate request.
 */
export function parseDomain(raw: string): DomainResult {
  // People paste URLs. Taking the hostname out of one is friendlier than
  // refusing it and is unambiguous — a URL has exactly one host.
  let input = (raw ?? "").trim();
  input = input.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

  const host = normaliseHost(input);
  const error = domainProblem(host);
  if (error) return { ok: false, error };
  return { ok: true, value: host };
}

/** The reason a hostname can't be used, or null if it can. */
export function domainProblem(raw: string): string | null {
  const host = normaliseHost((raw ?? "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, ""));

  if (!host) return "Enter the domain you want to use.";
  if (host.length > 253) return "That domain is too long.";
  if (!host.includes(".")) {
    return "Include the full domain, like example.com, not just a name.";
  }
  // A wildcard would let one merchant claim every name under a suffix.
  if (host.includes("*")) return "Wildcards aren't supported. Add each domain you want.";
  if (host.includes("_")) return "Domains can't contain underscores.";
  if (/[^a-z0-9.-]/.test(host)) {
    // Unicode domains are real, but the punycode form is what DNS and TLS
    // actually use, and accepting the pretty form silently would mean showing
    // records that don't match what a registrar expects.
    return "Use the domain's plain ASCII form. For an international domain, enter its xn-- version.";
  }
  if (host.startsWith(".") || host.endsWith(".")) return "That doesn't look like a domain.";
  if (host.includes("..")) return "That doesn't look like a domain.";

  const labels = host.split(".");
  if (labels.some((l) => l.length === 0)) return "That doesn't look like a domain.";
  if (labels.some((l) => l.length > 63)) return "One part of that domain is too long.";
  if (labels.some((l) => l.startsWith("-") || l.endsWith("-"))) {
    return "No part of a domain can start or end with a hyphen.";
  }

  const tld = labels[labels.length - 1];
  if (tld.length < 2) return "That doesn't look like a real domain ending.";
  if (/^\d+$/.test(tld)) return "That looks like an IP address, not a domain.";

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return "That's a local-only name and can't be reached from the internet.";
  }

  if (isPlatformOwned(host)) {
    return `${PLATFORM_DOMAIN} addresses are managed for you, your free store address is already set up.`;
  }
  // Not a security rule (nothing under a reserved word is ours), but it catches
  // someone typing "www" into a field expecting their apex.
  if (labels.length === 2 && RESERVED_SUBDOMAINS.has(labels[0])) {
    return "That doesn't look like a domain you own.";
  }

  return null;
}

/**
 * Whether this is the apex of a domain rather than something under it.
 *
 * Matters because the two need different DNS records: an apex cannot be a
 * CNAME, so it takes an A record instead. This is the naive form — label count
 * — which gets `example.com` right and `example.co.uk` wrong, calling the
 * latter a subdomain. That error is in the safe direction: we'd show CNAME
 * instructions for a name that also accepts a CNAME at that level. A correct
 * answer needs the public suffix list, which is a 200KB download that changes
 * weekly, and this does not justify one.
 */
export function isApex(hostname: string): boolean {
  return normaliseHost(hostname).split(".").length === 2;
}

export type DnsRecord = {
  type: "A" | "CNAME" | "TXT";
  /** What to put in the registrar's "name"/"host" field. */
  name: string;
  value: string;
  /** Why this record exists, for the merchant. */
  purpose: string;
};

/**
 * The records a merchant has to create, in the order they should create them.
 *
 * Registrars disagree about whether the name field wants the full hostname or
 * just the part before the domain, so both forms are shown in the UI. This
 * returns the sub-part, which is what most of them want.
 */
export function requiredRecords(hostname: string, verificationToken: string): DnsRecord[] {
  const host = normaliseHost(hostname);
  const apex = isApex(host);
  // A registrar's "name" field is relative to the zone, so everything except
  // the registrable domain goes in it. `shop.example.com` gives "shop";
  // `eu.shop.example.com` gives "eu.shop" — taking only the first label would
  // silently produce a record one level too high.
  const subLabel = apex ? "@" : host.split(".").slice(0, -2).join(".");

  return [
    {
      type: "TXT",
      name: apex ? VERIFICATION_RECORD : `${VERIFICATION_RECORD}.${subLabel}`,
      value: verificationToken,
      purpose: "Proves the domain is yours. It can be removed once the domain is live.",
    },
    apex
      ? {
          type: "A",
          name: "@",
          value: DNS_TARGET.a,
          purpose: "Sends visitors to your store.",
        }
      : {
          type: "CNAME",
          name: subLabel,
          value: DNS_TARGET.cname,
          purpose: "Sends visitors to your store.",
        },
  ];
}

/**
 * How long to wait before checking again, given how many checks have failed.
 *
 * DNS changes propagate in minutes but registrars can take hours, and a merchant
 * who mistypes a record should not have us querying their nameservers every
 * thirty seconds for a week. Doubling, capped at six hours.
 */
export function backoffMs(failedChecks: number): number {
  const base = 60_000;
  const capped = Math.min(failedChecks, 9);
  return Math.min(base * 2 ** capped, 6 * 60 * 60 * 1000);
}

/** After this many consecutive failures, stop checking until asked again. */
export const MAX_AUTOMATIC_CHECKS = 20;

/** The address to show for a domain. */
export function domainUrl(hostname: string): string {
  return `https://${normaliseHost(hostname)}`;
}
