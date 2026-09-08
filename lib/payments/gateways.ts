import "server-only";
import { prisma } from "@/lib/prisma";
import { credentialContext, open, paymentCryptoReady, seal } from "@/lib/payments/crypto";
import { payfast } from "@/lib/payments/payfast";
import {
  gatewayMeta,
  providerSupportsCurrency,
  type GatewayModeValue,
  type GatewayProviderValue,
} from "@/lib/payments/providers";
import type { GatewayAdapter, GatewayCredentials } from "@/lib/payments/adapter";
import type { PaymentGateway } from "@/lib/generated/prisma/client";

/**
 * A shop's gateway connections: storing them, opening them, and the rules about
 * when one may be used.
 *
 * The credentials never leave this file in readable form except into an
 * adapter's network call. Nothing here returns them to a caller, and the shape
 * that *is* returned to a screen — `describeGateway` — has no field that could
 * carry one by accident.
 */

const ADAPTERS: Record<GatewayProviderValue, GatewayAdapter> = {
  PAYFAST: payfast,
};

export function adapterFor(provider: GatewayProviderValue): GatewayAdapter {
  return ADAPTERS[provider];
}

/** What a screen is allowed to know about a connection. */
export type GatewayView = {
  provider: GatewayProviderValue;
  label: string;
  blurb: string;
  signupUrl: string;
  flow: string;
  connected: boolean;
  isActive: boolean;
  mode: GatewayModeValue;
  /** Whether LIVE may be selected yet. */
  canGoLive: boolean;
  connectedAt: Date | null;
  credentialsUpdatedAt: Date | null;
  sandboxVerifiedAt: Date | null;
  liveVerifiedAt: Date | null;
  lastCheckedAt: Date | null;
  lastError: string | null;
  /** Why this gateway cannot currently be offered, if it cannot. */
  blockedReason: string | null;
};

export function describeGateway(
  provider: GatewayProviderValue,
  row: PaymentGateway | null,
  currency: string
): GatewayView {
  const meta = gatewayMeta(provider)!;
  const connected = !!row?.secret;
  return {
    provider,
    label: meta.label,
    blurb: meta.blurb,
    signupUrl: meta.signupUrl,
    flow: meta.flow,
    connected,
    isActive: !!row?.isActive,
    mode: (row?.mode ?? "SANDBOX") as GatewayModeValue,
    canGoLive: !!row?.sandboxVerifiedAt,
    connectedAt: row?.connectedAt ?? null,
    credentialsUpdatedAt: row?.credentialsUpdatedAt ?? null,
    sandboxVerifiedAt: row?.sandboxVerifiedAt ?? null,
    liveVerifiedAt: row?.liveVerifiedAt ?? null,
    lastCheckedAt: row?.lastCheckedAt ?? null,
    lastError: row?.lastError ?? null,
    blockedReason: blockedReason(row, currency, provider),
  };
}

/**
 * Why a gateway is not being offered at checkout.
 *
 * Returned rather than the gateway silently not appearing, because "I switched
 * it on and nothing happened" is the complaint the payment-methods file already
 * exists because of, and a gateway has more ways to be quietly off than a
 * bank account number does.
 */
function blockedReason(
  row: PaymentGateway | null,
  currency: string,
  provider: GatewayProviderValue
): string | null {
  if (!paymentCryptoReady()) return "Card payments are not configured on this platform yet.";
  if (!row?.secret) return null; // Simply not connected; not a fault.
  if (!providerSupportsCurrency(provider, currency)) {
    const meta = gatewayMeta(provider)!;
    return `${meta.label} settles in ${meta.currencies.join(", ")}, and this store prices in ${currency}.`;
  }
  if (!row.isActive) return "Switched off. Customers are not being offered it.";
  if (row.mode === "SANDBOX") {
    return "In test mode. Real customers cannot pay with it until you go live.";
  }
  return null;
}

/** The stored connection, or null. Never includes anything readable. */
export async function gatewayRow(
  shopId: string,
  provider: GatewayProviderValue
): Promise<PaymentGateway | null> {
  return prisma.paymentGateway.findUnique({
    where: { shopId_provider: { shopId, provider } },
  });
}

export async function allGatewayRows(shopId: string): Promise<PaymentGateway[]> {
  return prisma.paymentGateway.findMany({ where: { shopId }, orderBy: { provider: "asc" } });
}

/**
 * Open a connection's credentials.
 *
 * Throws rather than returning null on every failure path: a caller that got
 * `null` would be tempted to carry on with a half-configured payment, and there
 * is no useful thing to do with a credential that will not open.
 */
export function openCredentials(row: PaymentGateway): GatewayCredentials {
  if (!row.secret) throw new Error("This gateway has no credentials stored.");
  const json = open(row.secret, row.keyVersion, credentialContext(row.shopId, row.provider));
  const parsed = JSON.parse(json) as GatewayCredentials;
  if (!parsed?.merchantId || !parsed?.securedKey) {
    throw new Error("Stored credentials are incomplete.");
  }
  return parsed;
}

/**
 * Whether this connection may take a real customer's money right now.
 *
 * Every condition, in one place, so no call site can satisfy three of four and
 * think it is done.
 */
export function isUsable(row: PaymentGateway | null, currency: string): row is PaymentGateway {
  if (!row?.secret) return false;
  if (!row.isActive) return false;
  if (row.mode !== "LIVE") return false;
  if (!providerSupportsCurrency(row.provider, currency)) return false;
  if (!paymentCryptoReady()) return false;
  return true;
}

/**
 * The gateways a customer may actually be offered.
 *
 * Note what is *not* here: a gateway in test mode. A merchant mid-setup must
 * not be quietly taking sandbox payments from real shoppers, who would receive
 * an order confirmation for money that never moved.
 */
export async function usableGateways(shopId: string, currency: string): Promise<PaymentGateway[]> {
  const rows = await allGatewayRows(shopId);
  return rows.filter((r) => isUsable(r, currency));
}

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Store credentials, replacing any that are there.
 *
 * The order of operations is the whole point:
 *
 *   1. Prove the new credentials work, against the provider, before anything is
 *      written. A typo is refused here.
 *   2. Only then seal and save, in one update.
 *
 * A "delete the old ones first" version of this is worse in two ways that both
 * cost the merchant money: between the delete and the save the shop's checkout
 * is broken, and a rejected new key leaves them with no working key at all.
 * Nothing is destroyed until something better is proven.
 *
 * Replacing credentials also clears the go-live proof. A new key is a new
 * claim, and the old sandbox run proved something about a secret that is no
 * longer there.
 */
export async function saveCredentials(args: {
  shopId: string;
  provider: GatewayProviderValue;
  credentials: GatewayCredentials;
  /** Which environment these keys belong to. Probed in that environment. */
  mode: GatewayModeValue;
}): Promise<SaveResult> {
  const { shopId, provider, credentials, mode } = args;

  if (!paymentCryptoReady()) {
    return { ok: false, error: "This platform cannot store gateway keys yet. Nothing was saved." };
  }
  if (!credentials.merchantId.trim() || !credentials.securedKey.trim()) {
    return { ok: false, error: "Both the Merchant ID and the Secured key are needed." };
  }

  const probe = await adapterFor(provider).probe(credentials, mode);
  if (!probe.ok) {
    // Recorded against the existing row so the merchant can see the attempt,
    // but nothing about the stored credential changes.
    await prisma.paymentGateway.updateMany({
      where: { shopId, provider },
      data: { lastCheckedAt: new Date(), lastError: probe.error.slice(0, 300) },
    });
    return { ok: false, error: probe.error };
  }

  const { blob, keyVersion } = seal(
    JSON.stringify({
      merchantId: credentials.merchantId.trim(),
      securedKey: credentials.securedKey.trim(),
      ...(credentials.storeId?.trim() ? { storeId: credentials.storeId.trim() } : {}),
    }),
    credentialContext(shopId, provider)
  );

  const now = new Date();
  await prisma.paymentGateway.upsert({
    where: { shopId_provider: { shopId, provider } },
    create: {
      shopId,
      provider,
      mode,
      secret: blob,
      keyVersion,
      connectedAt: now,
      credentialsUpdatedAt: now,
      lastCheckedAt: now,
      lastError: null,
      // Never switched on by saving a key. Turning it on is a separate,
      // deliberate act, after the merchant has seen a test payment work.
      isActive: false,
    },
    update: {
      secret: blob,
      keyVersion,
      mode,
      credentialsUpdatedAt: now,
      lastCheckedAt: now,
      lastError: null,
      // A new secret has proved nothing yet, whatever the old one proved.
      sandboxVerifiedAt: null,
      liveVerifiedAt: null,
      // And it must not keep taking money on the strength of the old one.
      isActive: false,
    },
  });

  return { ok: true };
}

/** Switch a connected gateway on or off without touching its credentials. */
export async function setActive(
  shopId: string,
  provider: GatewayProviderValue,
  active: boolean
): Promise<SaveResult> {
  const row = await gatewayRow(shopId, provider);
  if (!row?.secret) return { ok: false, error: "Connect this gateway before switching it on." };
  await prisma.paymentGateway.update({
    where: { shopId_provider: { shopId, provider } },
    data: { isActive: active },
  });
  return { ok: true };
}

/**
 * Move between test mode and live.
 *
 * Going live is gated twice. A sandbox payment must have completed end to end —
 * `sandboxVerifiedAt`, which only the verification path can write — and the
 * credentials are probed again against the live host before the switch is
 * allowed, because a sandbox that worked proves nothing about a live endpoint
 * or a live key. A merchant finds out here, in a screen they are looking at,
 * rather than through a customer who could not pay.
 */
export async function setMode(
  shopId: string,
  provider: GatewayProviderValue,
  mode: GatewayModeValue
): Promise<SaveResult> {
  const row = await gatewayRow(shopId, provider);
  if (!row?.secret) return { ok: false, error: "Connect this gateway first." };

  if (mode === "LIVE") {
    if (!row.sandboxVerifiedAt) {
      return {
        ok: false,
        error: "Complete one test payment first. Going live is unlocked by a test that actually worked.",
      };
    }
    const probe = await adapterFor(provider).probe(openCredentials(row), "LIVE");
    if (!probe.ok) {
      await prisma.paymentGateway.update({
        where: { shopId_provider: { shopId, provider } },
        data: { lastCheckedAt: new Date(), lastError: probe.error.slice(0, 300) },
      });
      return {
        ok: false,
        error: `Your live keys were refused: ${probe.error}. Still in test mode — nothing changed.`,
      };
    }
  }

  await prisma.paymentGateway.update({
    where: { shopId_provider: { shopId, provider } },
    data: { mode, lastCheckedAt: new Date(), lastError: null },
  });
  return { ok: true };
}

/**
 * Forget a gateway's credentials.
 *
 * The row stays — it is the record that this shop was once connected, and the
 * payments that reference it must keep resolving — but the secret is nulled,
 * not merely ignored. Deactivation is the reversible one; this is not.
 */
export async function disconnect(
  shopId: string,
  provider: GatewayProviderValue
): Promise<SaveResult> {
  await prisma.paymentGateway.updateMany({
    where: { shopId, provider },
    data: {
      secret: null,
      isActive: false,
      mode: "SANDBOX",
      sandboxVerifiedAt: null,
      liveVerifiedAt: null,
      connectedAt: null,
      credentialsUpdatedAt: null,
      lastError: null,
      lastCheckedAt: new Date(),
    },
  });
  return { ok: true };
}
