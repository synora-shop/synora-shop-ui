"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { audit } from "@/lib/audit";
import { isGatewayProvider, type GatewayProviderValue } from "@/lib/payments/providers";
import {
  disconnect,
  gatewayRow,
  saveCredentials,
  setActive,
  setMode,
} from "@/lib/payments/gateways";

/**
 * Connecting a shop to a payment gateway.
 *
 * Every action here is ADMIN-level. These credentials are the keys to a
 * merchant's takings — anyone holding them can speak to the provider as that
 * merchant — so they sit alongside staff and domains, not alongside editing a
 * product. Every one is recorded in the audit log, including the attempts that
 * fail, because "who put those keys in" is a question worth being able to
 * answer.
 *
 * Nothing here ever returns a credential. There is no action that reads one
 * back, deliberately: a merchant who loses their secured key gets a new one
 * from the provider, and a stolen session gets nothing.
 */

export type Result = { ok: true; message?: string } | { ok: false; error: string };

function provider(value: string): GatewayProviderValue | null {
  const upper = value.toUpperCase();
  return isGatewayProvider(upper) ? upper : null;
}

function done(): void {
  revalidatePath("/admin/payments");
}

/**
 * Store new credentials, or replace the ones that are there.
 *
 * One action for both, because they are the same operation and splitting them
 * would invite a "delete first" version of replace. The credentials are proved
 * against the provider before anything is written, so a typo is refused with
 * the old keys untouched — see saveCredentials for why that ordering matters.
 */
export async function connectGateway(input: {
  provider: string;
  merchantId: string;
  securedKey: string;
  storeId?: string;
}): Promise<Result> {
  const me = await requireRole("ADMIN");
  const p = provider(input.provider);
  if (!p) return { ok: false, error: "Unknown payment provider." };

  const existing = await gatewayRow(me.shop.id, p);
  const replacing = !!existing?.secret;

  const saved = await saveCredentials({
    shopId: me.shop.id,
    provider: p,
    credentials: {
      merchantId: input.merchantId,
      securedKey: input.securedKey,
      storeId: input.storeId,
    },
    // New or replaced keys always land in test mode. Going live is a separate,
    // deliberate act that needs a test payment behind it.
    mode: "SANDBOX",
  });

  await audit({
    shopId: me.shop.id,
    action: replacing ? "payments.gateway.replace" : "payments.gateway.connect",
    userId: me.userId,
    actorEmail: me.email,
    entity: "PaymentGateway",
    entityId: p,
    // The merchant id is an account number, not a secret; the secured key is
    // never recorded anywhere, including here.
    detail: { provider: p, merchantId: input.merchantId.trim(), accepted: saved.ok },
  });

  if (!saved.ok) return saved;
  done();
  return {
    ok: true,
    message: replacing
      ? "Keys replaced. It's back in test mode until one test payment goes through."
      : "Connected in test mode. Place one test order to unlock going live.",
  };
}

/** Switch a connected gateway on or off. Never touches the credentials. */
export async function setGatewayActive(providerName: string, active: boolean): Promise<Result> {
  const me = await requireRole("ADMIN");
  const p = provider(providerName);
  if (!p) return { ok: false, error: "Unknown payment provider." };

  const result = await setActive(me.shop.id, p, active);
  if (!result.ok) return result;

  await audit({
    shopId: me.shop.id,
    action: active ? "payments.gateway.activate" : "payments.gateway.deactivate",
    userId: me.userId,
    actorEmail: me.email,
    entity: "PaymentGateway",
    entityId: p,
    detail: { provider: p },
  });

  done();
  return {
    ok: true,
    message: active ? "Switched on." : "Switched off. Your keys are kept.",
  };
}

/**
 * Move between test mode and live.
 *
 * Refused unless a sandbox payment has actually confirmed, and the live keys
 * are proved against the live endpoint before the switch — so a merchant finds
 * out here that something is wrong, rather than through a customer who could
 * not pay.
 */
export async function setGatewayMode(providerName: string, live: boolean): Promise<Result> {
  const me = await requireRole("ADMIN");
  const p = provider(providerName);
  if (!p) return { ok: false, error: "Unknown payment provider." };

  const result = await setMode(me.shop.id, p, live ? "LIVE" : "SANDBOX");
  if (!result.ok) return result;

  await audit({
    shopId: me.shop.id,
    action: live ? "payments.gateway.golive" : "payments.gateway.testmode",
    userId: me.userId,
    actorEmail: me.email,
    entity: "PaymentGateway",
    entityId: p,
    detail: { provider: p },
  });

  done();
  return {
    ok: true,
    message: live
      ? "Live. Real customers can pay with it now."
      : "Back in test mode. Customers are not being offered it.",
  };
}

/**
 * Forget the credentials entirely.
 *
 * The irreversible one. Switching off is what a merchant wants nine times in
 * ten, and the screen says so before this is offered.
 */
export async function disconnectGateway(providerName: string): Promise<Result> {
  const me = await requireRole("ADMIN");
  const p = provider(providerName);
  if (!p) return { ok: false, error: "Unknown payment provider." };

  const result = await disconnect(me.shop.id, p);
  if (!result.ok) return result;

  await audit({
    shopId: me.shop.id,
    action: "payments.gateway.disconnect",
    userId: me.userId,
    actorEmail: me.email,
    entity: "PaymentGateway",
    entityId: p,
    detail: { provider: p },
  });

  done();
  return { ok: true, message: "Disconnected. The keys have been erased." };
}
