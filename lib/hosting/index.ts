import type { HostingProvider } from "./types";
import { manualProvider } from "./manual";
import { vercelProvider } from "./vercel";
import { cloudflareProvider } from "./cloudflare";

// Telling whoever terminates TLS that a new hostname is ours.
//
// Verifying DNS proves a merchant owns a domain. It does not make the domain
// work: something still has to hold a certificate for it and route it to this
// app. That something is a vendor, and which vendor is a decision that should
// be reversible.
//
// Hence this seam. Everything above it — the Domain table, the checks, the
// admin screens — is written against one small interface, so moving from
// Vercel to Cloudflare to a pair of machines running Caddy is a new file here
// and an environment variable, not a rewrite. The interface is deliberately
// the smallest thing that works: add a hostname, remove it, ask about it.

export type { HostingProvider, HostnameState } from "./types";

const PROVIDERS = {
  manual: manualProvider,
  vercel: vercelProvider,
  cloudflare: cloudflareProvider,
} as const;

export type ProviderName = keyof typeof PROVIDERS;

/**
 * The provider this deployment uses.
 *
 * Defaults to `manual`, which does nothing and reports success. That is the
 * right default: local development and CI have no vendor and no certificates,
 * and a missing credential should not stop someone working on the domain
 * screens. What it must never do is silently stand in for a real provider in
 * production — see the warning below.
 */
export function hostingProvider(): HostingProvider {
  const name = (process.env.HOSTING_PROVIDER ?? "manual") as ProviderName;
  const provider = PROVIDERS[name];

  if (!provider) {
    console.error(
      `[hosting] Unknown HOSTING_PROVIDER "${name}". Falling back to manual; custom domains will not get certificates.`
    );
    return manualProvider;
  }

  if (name === "manual" && process.env.NODE_ENV === "production") {
    // Loud, because the failure is quiet otherwise: domains verify, the screen
    // says ACTIVE, and nothing serves. Once a day at startup is enough.
    console.warn(
      "[hosting] Running in production with no hosting provider configured. " +
        "Custom domains will verify but will not be issued certificates. " +
        "Set HOSTING_PROVIDER and its credentials."
    );
  }

  return provider;
}

/** Whether this deployment can actually bring a custom domain online. */
export function canIssueCertificates(): boolean {
  return hostingProvider().name !== "manual";
}
