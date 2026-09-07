"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, requireShop } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { prisma } from "@/lib/prisma";
import { safeAssetUrl } from "@/lib/icon-validation";
import { faviconProblem, type BrandMarks } from "@/lib/brand-marks";
import { PLATFORM_DOMAIN, parseSubdomain } from "@/lib/shop-context";
import { moveFreeAddress } from "@/lib/data/domains";

export type StoreIdentity = {
  storeName: string;
  /**
   * The shop's free address, without the platform suffix.
   *
   * Suggested from the name and editable, because "Bashinda Clothing Co" makes
   * a long address a merchant may want shortened. Changing it moves the
   * storefront's public URL, which is why saving one asks a question first.
   */
  subdomain: string;
  /** The four logo slots and the favicon — see lib/brand-marks.ts. */
  marks: BrandMarks;
  address: string;
  city: string;
  phone: string;
  contactEmail: string;
};

/**
 * The four things a shop is: its name, its marks, where it is and how to reach
 * it.
 *
 * They are stored in two places — the name, email and marks on the shop's
 * settings, the address and phone on a Location row — because each is read by
 * something different. A merchant should not have to know that, so this writes
 * both from one form.
 *
 * The marks used to be a third place: the theme's tokens, stored per business
 * type, which meant a merchant who switched type lost their logo. They are the
 * shop's now, and this is the only action in the panel that writes them.
 *
 * The location is upserted rather than assumed. A shop that has never opened
 * the Locations screen has no row at all, and "the address" is the first thing
 * a new merchant fills in.
 */
export type SaveOptions = {
  /**
   * Whether the previous address keeps resolving and redirecting.
   *
   * Not optional in the UI: the dialog that asks cannot be dismissed, because
   * there is no sensible default. Defaulting to keeping it would leave names
   * held forever by shops that did not want them; defaulting to dropping it
   * would break links silently.
   */
  keepOldAddress?: boolean;
};

export async function saveStoreIdentity(
  values: StoreIdentity,
  options: SaveOptions = {}
): Promise<{ ok: true; addressMoved?: { from: string; to: string; keptOld: boolean } } | { ok: false; error: string }> {
  await requireRole("ADMIN");

  const shop = await requireShop();
  const shopId = await currentShopId();

  const storeName = values.storeName.trim().slice(0, 60);
  const address = values.address.trim().slice(0, 200);
  const city = values.city.trim().slice(0, 80);
  const phone = values.phone.trim().slice(0, 40);
  const contactEmail = values.contactEmail.trim().slice(0, 120);

  // Every mark is a URL the upload endpoint gave us. Each is passed through the
  // same guard the theme editor uses rather than trusted, because these reach
  // an <img src>, a CSS url() and a <link href> on every page of the
  // storefront — a hand-edited value must not be able to put an arbitrary
  // scheme into any of them.
  const marks: BrandMarks = {
    logoUrl: safeAssetUrl(values.marks?.logoUrl) ?? "",
    logoDarkUrl: safeAssetUrl(values.marks?.logoDarkUrl) ?? "",
    logoCompactUrl: safeAssetUrl(values.marks?.logoCompactUrl) ?? "",
    logoCompactDarkUrl: safeAssetUrl(values.marks?.logoCompactDarkUrl) ?? "",
    faviconUrl: safeAssetUrl(values.marks?.faviconUrl) ?? "",
  };

  // A favicon in a format browsers do not draw is refused here rather than
  // stored. The screen says which formats before the upload, and checks again
  // as you pick — this is the rule, for anything that reaches the action
  // another way.
  const badFavicon = faviconProblem(marks.faviconUrl);
  if (badFavicon) return { ok: false, error: badFavicon };

  // The address, before anything else is written. It is the only field here
  // that can fail for a reason the merchant cannot see coming — somebody else
  // holding the name — and failing after the rest had been saved would leave
  // the store renamed with an address that does not match it.
  let addressMoved: { from: string; to: string; keptOld: boolean } | undefined;
  const wantedSubdomain = (values.subdomain ?? "").trim().toLowerCase();
  if (wantedSubdomain && wantedSubdomain !== shop.subdomain) {
    const parsed = parseSubdomain(wantedSubdomain);
    if (!parsed.ok) return { ok: false, error: parsed.error };

    const move = await moveFreeAddress(shopId, parsed.value, {
      keepOld: options.keepOldAddress === true,
    });
    if (!move.ok) return { ok: false, error: move.error };
    addressMoved = { from: move.from, to: move.to, keptOld: move.keptOld };
  }

  await prisma.$transaction(async (tx) => {
    await tx.storeSettings.upsert({
      where: { shopId },
      update: { storeName, contactEmail: contactEmail || null, ...marks },
      create: { shopId, storeName, contactEmail: contactEmail || null, ...marks },
    });

    // The shop's own name follows the storefront's, so the store switcher and
    // the top bar do not disagree with the shop's own home page.
    if (storeName) await tx.shop.update({ where: { id: shopId }, data: { name: storeName } });

    // The theme is not touched. It used to be written here, to store the logo
    // among its tokens; the marks are the shop's now and the theme only
    // decides how they are drawn.

    // One primary location, created on first save. A restaurant with several
    // manages the rest on the Locations screen; this is the one that answers
    // "where is this business".
    if (address || phone || city) {
      const primary = await tx.location.findFirst({
        where: { shopId, isPrimary: true },
        select: { id: true },
      });
      if (primary) {
        await tx.location.update({
          where: { id: primary.id },
          data: { address, city: city || null, phone: phone || null },
        });
      } else {
        await tx.location.create({
          data: {
            shopId,
            name: storeName || "Main location",
            address,
            city: city || null,
            phone: phone || null,
            isPrimary: true,
          },
        });
      }
    }
  });

  // Both: the storefront reads the marks from settings and draws them with the
  // theme, and a stale copy of either shows the wrong header for five minutes.
  invalidateShop(shopId, "settings");
  invalidateShop(shopId, "theme");
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true, addressMoved };
}

/**
 * Whether a free address can be taken, asked before the question is put to the
 * merchant.
 *
 * The move itself checks this too — that is the rule, and the unique index
 * behind it is the real gate. This exists so a merchant is told "that one is
 * taken" while they are still editing, rather than after answering a dialog
 * about an address they were never going to get.
 */
export async function checkAddressAvailable(
  raw: string
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
  await requireRole("ADMIN");

  const parsed = parseSubdomain(raw ?? "");
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const shop = await requireShop();
  if (parsed.value === shop.subdomain) {
    return { ok: true, address: `${parsed.value}.${PLATFORM_DOMAIN}` };
  }

  const hostname = `${parsed.value}.${PLATFORM_DOMAIN}`;
  const [takenByShop, takenByDomain] = await Promise.all([
    prisma.shop.findUnique({ where: { subdomain: parsed.value }, select: { id: true } }),
    prisma.domain.findUnique({ where: { hostname }, select: { shopId: true } }),
  ]);

  if (
    (takenByShop && takenByShop.id !== shop.id) ||
    (takenByDomain && takenByDomain.shopId !== shop.id)
  ) {
    return { ok: false, error: "That address is taken. Try another." };
  }
  return { ok: true, address: hostname };
}
