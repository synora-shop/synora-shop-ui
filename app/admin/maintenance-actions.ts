"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { audit } from "@/lib/audit";
import { safeAssetUrl } from "@/lib/icon-validation";
import {
  HEADING_MAX,
  MESSAGE_MAX,
  type HoldingPage,
  headingProblem,
  messageProblem,
} from "@/lib/holding-page";

/**
 * The holding page, and who has asked to hear when the store opens again.
 *
 * Its own file rather than a corner of the preferences save, for the reason
 * that split gave: a merchant writing the words on their holding page should
 * not be rewriting their blocked-country list as a side effect.
 */

export type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Writes the words, the logo, and whether to collect addresses. */
export async function saveHoldingPage(input: HoldingPage): Promise<Result> {
  await requireRole("ADMIN");

  const heading = (input.heading ?? "").trim();
  const message = (input.message ?? "").trim();

  // Checked here as well as in the form. The form gives live feedback; this is
  // the rule, because a hand-made request reaches this and not the form.
  const problem = headingProblem(heading) ?? messageProblem(message);
  if (problem) return { ok: false, error: problem };

  const data = {
    maintenanceHeading: heading.slice(0, HEADING_MAX),
    maintenanceMessage: message.slice(0, MESSAGE_MAX),
    // Through the same guard every other uploaded URL goes through, so a
    // hand-edited value cannot put a foreign script tag's worth of URL on a
    // page that is served to the public.
    maintenanceLogoUrl: safeAssetUrl(input.logoUrl ?? "") ?? "",
    maintenanceShowLogo: input.showLogo !== false,
    maintenanceSignups: input.signups === true,
  };

  const shopId = await currentShopId();
  await (await db()).storeSettings.upsert({
    where: { shopId },
    update: data,
    create: { shopId, ...data },
  });

  invalidateShop(shopId, "settings");
  revalidatePath("/admin/maintenance");
  // The storefront reads these on every closed request, and the page itself is
  // force-dynamic, but the layout above it is not.
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

/**
 * Turns the holding page on or off.
 *
 * The same switch that used to live in Preferences → Visibility. It moved
 * here, next to the words it puts on screen: a merchant who turns the store
 * off and cannot find what it now says has been given half a feature.
 */
export async function setMaintenanceMode(on: boolean): Promise<Result> {
  const me = await requireRole("ADMIN");
  const shopId = await currentShopId();

  await (await db()).storeSettings.upsert({
    where: { shopId },
    update: { maintenanceMode: on },
    create: { shopId, maintenanceMode: on },
  });

  // Worth recording. Taking a storefront off the internet is the kind of thing
  // somebody later says they did not do.
  await audit({
    action: on ? "shop.maintenance.on" : "shop.maintenance.off",
    shopId,
    entity: "shop",
    entityId: shopId,
    userId: me.userId,
    actorEmail: me.email,
  });

  invalidateShop(shopId, "settings");
  revalidatePath("/admin/maintenance");
  revalidatePath("/admin/preferences");
  revalidatePath("/", "layout");

  // Turning this off does not necessarily open the store. A paused shop shows
  // the same page for a different reason, and "your store is visible again"
  // would be a sentence the merchant acts on — telling customers they are back
  // when they are not. The switch did what it says; the shop is still shut.
  if (!on && me.shop.status === "PAUSED") {
    return {
      ok: true,
      message: "Switched off — but your store is still paused, so customers keep seeing this page.",
    };
  }

  return {
    ok: true,
    message: on ? "Customers now see your holding page." : "Your store is visible again.",
  };
}

/**
 * Forgets one person who asked to be told.
 *
 * They gave one field on a page belonging to a shut shop; removing it has to
 * be one click and has to actually delete, not hide. There is no bin for this
 * and there should not be one.
 */
export async function removeSignup(id: string): Promise<Result> {
  await requireRole("ADMIN");
  const shopId = await currentShopId();

  // deleteMany with the shop in the where, rather than delete by id: the id
  // comes from the client, and this is the one shape that cannot delete
  // another shop's row even if the id is guessed.
  const { count } = await (await db()).reopenSignup.deleteMany({ where: { id, shopId } });
  if (count === 0) return { ok: false, error: "That address is already gone." };

  revalidatePath("/admin/maintenance");
  return { ok: true, message: "Removed." };
}

/** Marks everyone as told, so reopening twice does not mean writing twice. */
export async function markSignupsNotified(): Promise<Result> {
  await requireRole("ADMIN");
  const shopId = await currentShopId();

  const { count } = await (await db()).reopenSignup.updateMany({
    where: { shopId, notifiedAt: null },
    data: { notifiedAt: new Date() },
  });

  revalidatePath("/admin/maintenance");
  return {
    ok: true,
    message: count === 0 ? "Everyone was already marked." : `Marked ${count} as told.`,
  };
}
