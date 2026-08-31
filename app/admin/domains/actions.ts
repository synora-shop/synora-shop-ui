"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { audit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseDomain } from "@/lib/domains";
import { domainExists } from "@/lib/dns";
import {
  addDomain,
  domainsForShop,
  removeDomain,
  setPrimaryDomain,
  verifyDomain,
} from "@/lib/data/domains";

// Connecting a merchant's own domain.
//
// Every one of these is ADMIN-level. A domain change can take a store off the
// internet or hand its traffic somewhere else, which puts it alongside staff
// and billing rather than alongside editing a product.

export type Result = { ok: true; message?: string } | { ok: false; error: string };

export async function connectDomain(hostname: string): Promise<Result> {
  const me = await requireRole("ADMIN");

  // Each add is a certificate request at a vendor and a DNS lookup, both of
  // which cost someone else something.
  const limited = await rateLimit("domainAdd", `${me.shop.id}:${await clientIp()}`);
  if (!limited.ok) return { ok: false, error: limited.message };

  const parsed = parseDomain(hostname);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  // Advisory only — a domain registered ten minutes ago may not resolve yet,
  // and refusing it would be wrong. This catches the typo case, where the
  // merchant is about to spend an afternoon wondering why nothing verifies.
  if (!(await domainExists(parsed.value))) {
    return {
      ok: false,
      error: `We can't find ${parsed.value} on the internet. Check the spelling, if you've just registered it, try again in a few minutes.`,
    };
  }

  const result = await addDomain(me.shop.id, parsed.value);
  if (!result.ok) return { ok: false, error: result.error };

  await audit({
    shopId: me.shop.id,
    action: "domain.add",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Domain",
    entityId: result.domainId,
    detail: { hostname: parsed.value },
  });

  revalidatePath("/admin/domains");
  return {
    ok: true,
    message: `${parsed.value} added. Create the two records below at your registrar, then check.`,
  };
}

/** The merchant pressing "check now", having just changed their DNS. */
export async function checkDomain(domainId: string): Promise<Result> {
  const me = await requireRole("ADMIN");

  const limited = await rateLimit("domainCheck", `${me.shop.id}:${domainId}`);
  if (!limited.ok) return { ok: false, error: limited.message };

  // Belongs-to check before anything else: domainId comes from the client, and
  // verifyDomain takes an id rather than a shop.
  const domains = await domainsForShop(me.shop.id);
  if (!domains.some((d) => d.id === domainId)) {
    return { ok: false, error: "That domain isn't set up on this store." };
  }

  // respectBackoff is false: they have just changed something, and telling them
  // to wait an hour is the least useful possible answer.
  const outcome = await verifyDomain(domainId, { respectBackoff: false });

  revalidatePath("/admin/domains");

  if (outcome.status === "ACTIVE") {
    return { ok: true, message: "That domain is live." };
  }
  if (outcome.status === "VERIFIED") {
    return {
      ok: true,
      message: outcome.message ?? "Records confirmed. The certificate is being issued.",
    };
  }
  return { ok: false, error: outcome.message ?? "Not there yet." };
}

export async function makePrimary(domainId: string): Promise<Result> {
  const me = await requireRole("ADMIN");

  const error = await setPrimaryDomain(me.shop.id, domainId);
  if (error) return { ok: false, error };

  await audit({
    shopId: me.shop.id,
    action: "domain.primary",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Domain",
    entityId: domainId,
  });

  revalidatePath("/admin/domains");
  return { ok: true, message: "That's now your main address. The others redirect to it." };
}

export async function disconnectDomain(domainId: string): Promise<Result> {
  const me = await requireRole("ADMIN");

  const error = await removeDomain(me.shop.id, domainId);
  if (error) return { ok: false, error };

  await audit({
    shopId: me.shop.id,
    action: "domain.remove",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Domain",
    entityId: domainId,
  });

  revalidatePath("/admin/domains");
  return { ok: true, message: "Domain removed." };
}
