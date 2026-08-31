"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { parseCountryList } from "@/lib/region";

async function requireAdmin() {
  await requireRole("STAFF");
}

function revalidateRegions() {
  revalidatePath("/admin/regions");
  // Every storefront page renders the header, footer and announcement bar
  // through the layout, and which of those a visitor sees depends on region.
  revalidatePath("/", "layout");
}

function handleFor(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "region"
  );
}

export async function createRegion(name: string): Promise<{ error?: string; id?: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give the region a name." };
  if (trimmed.length > 60) return { error: "Keep the name under 60 characters." };

  const shopId = await currentShopId();
  const base = handleFor(trimmed);
  const taken = new Set(
    (await (await db()).region.findMany({ select: { handle: true } })).map((r) => r.handle)
  );
  let handle = base;
  for (let n = 2; taken.has(handle); n++) handle = `${base}-${n}`;

  // The first region a shop creates becomes the default, because a set of
  // regions none of which is the fallback would leave visitors from everywhere
  // else with nothing selected and no way to tell.
  const isFirst = (await (await db()).region.count()) === 0;

  const region = await (await db()).region.create({
    data: { shopId, name: trimmed, handle, isDefault: isFirst },
  });
  revalidateRegions();
  return { id: region.id };
}

export type RegionDetails = {
  name: string;
  countries: string;
  isActive: boolean;
  headerMenuId: string | null;
  footerMenuId: string | null;
  announcementText: string | null;
  announcementBgColor: string | null;
};

export async function updateRegion(id: string, details: RegionDetails): Promise<{ error?: string }> {
  await requireAdmin();

  const name = details.name.trim();
  if (!name) return { error: "Give the region a name." };
  if (name.length > 60) return { error: "Keep the name under 60 characters." };

  // Anything that is not a two-letter code is dropped rather than refused: the
  // field accepts a pasted list, and rejecting the whole thing over one stray
  // character would be tedious for no gain.
  const countries = parseCountryList(details.countries);

  const text = details.announcementText?.trim() ?? "";
  if (text.length > 200) return { error: "Keep the announcement under 200 characters." };

  const color = details.announcementBgColor?.trim() ?? "";
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { error: "The announcement colour needs to be a hex value like #1a1a1a." };
  }

  // The handle is left alone on rename, so ?__region= links and anything
  // pointing at this region keep working.
  await (await db()).region.update({
    where: { id },
    data: {
      name,
      countries,
      isActive: details.isActive,
      headerMenuId: details.headerMenuId || null,
      footerMenuId: details.footerMenuId || null,
      announcementText: text || null,
      announcementBgColor: color || null,
    },
  });

  revalidateRegions();
  return {};
}

/**
 * Makes one region the fallback for visitors matching no other.
 *
 * Exactly one at a time: two defaults would mean the one that wins depends on
 * row order, which is not something a merchant can see or reason about.
 */
export async function setDefaultRegion(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const region = await (await db()).region.findUnique({ where: { id }, select: { id: true } });
  if (!region) return { error: "Region not found." };

  await (await db()).region.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  await (await db()).region.update({ where: { id }, data: { isDefault: true } });

  revalidateRegions();
  return {};
}

export async function deleteRegion(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const region = await (await db()).region.findUnique({
    where: { id },
    select: { isDefault: true },
  });
  if (!region) return { error: "Region not found." };

  await (await db()).region.delete({ where: { id } });

  // Losing the default silently would leave everyone outside the named regions
  // on the shop's plain settings with nothing saying why, so the oldest
  // remaining region takes over.
  if (region.isDefault) {
    const next = await (await db()).region.findFirst({ orderBy: { createdAt: "asc" } });
    if (next) await (await db()).region.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  revalidateRegions();
  return {};
}
