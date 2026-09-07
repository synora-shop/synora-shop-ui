"use server";

import { prisma } from "@/lib/prisma";
import { currentShop } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { looksAutomated } from "@/lib/spam";
import { storefrontClosure } from "@/lib/maintenance";
import { emailProblem, normaliseEmail } from "@/lib/holding-page";

export type SignupResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * "Tell me when you reopen", from the holding page.
 *
 * Public and unauthenticated, on a store that is otherwise entirely shut. That
 * combination is why every gate below is here rather than one of them:
 *
 *   - The shop must actually be shut, and shut for a reason a merchant may
 *     write for. Otherwise this is a write endpoint that stays open on a
 *     trading store with no form anywhere that points at it.
 *   - The merchant must have turned it on. A shop that never asked to collect
 *     addresses must not collect them because somebody found the action.
 *   - The honeypot, and a per-address rate limit, because the form is exactly
 *     the shape a bot fills in.
 *
 * It never says whether the address was already there. "Thanks, we'll be in
 * touch" for both cases — the alternative turns a holding page into a way to
 * ask whether a particular person is waiting for this shop to reopen.
 */
export async function signupForReopening(
  email: string,
  honeypot?: string
): Promise<SignupResult> {
  const shop = await currentShop();
  if (!shop) return { ok: false, error: "This store isn't available." };

  // Silently accepted, deliberately. A bot told it failed tries something
  // else; one told it succeeded goes away.
  if (looksAutomated(honeypot)) {
    return { ok: true, message: "Thanks — we'll let you know when we're back." };
  }

  const reason = await storefrontClosure();
  if (reason !== "maintenance" && reason !== "paused") {
    return { ok: false, error: "This store is open — no need to wait." };
  }

  const settings = await getStoreSettings();
  if (settings.maintenanceSignups !== true) {
    return { ok: false, error: "This store isn't collecting addresses." };
  }

  const problem = emailProblem(email);
  if (problem) return { ok: false, error: problem };

  const address = normaliseEmail(email);

  // Keyed on the address as well as the caller, so one person retrying is
  // limited and a shared office address is not locked out by a colleague.
  const limited = await rateLimit("reopenSignup", `${shop.id}:${await clientIp()}:${address}`);
  if (!limited.ok) return { ok: false, error: limited.message };

  // Not `db()`: this runs for a visitor with no session, and the tenant client
  // is built from the request's shop either way. The shop is stamped
  // explicitly from the resolved host, which is the same thing it would do.
  //
  // upsert rather than create, so a reload is not an error the visitor sees.
  // The update is empty on purpose: signing up twice must not move the
  // consent timestamp, which is the record of when they actually agreed.
  await prisma.reopenSignup.upsert({
    where: { shopId_email: { shopId: shop.id, email: address } },
    update: {},
    create: { shopId: shop.id, email: address },
  });

  return { ok: true, message: "Thanks — we'll let you know when we're back." };
}
