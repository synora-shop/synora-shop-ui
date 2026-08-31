"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import type { MenuSlot } from "@/lib/data/menus";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function revalidateMenus() {
  // Both kinds: assigning a menu to a slot writes the assignment onto
  // StoreSettings, so caching only the menus would leave the storefront
  // rendering the old slot assignment.
  invalidateShop(await currentShopId(), "menus", "settings");
  revalidatePath("/admin/menus");
  revalidatePath("/admin/settings");
}

async function requireAdmin() {
  await requireRole("STAFF");
}

// A menu item points at exactly one of these — see the Page model comment in schema.prisma
// and resolveDestination() in lib/data/menus.ts for how each resolves to a real href/label.
export type MenuTarget = { pageId: string } | { href: string; label: string };

function targetData(target: MenuTarget) {
  return "pageId" in target
    ? { pageId: target.pageId, href: "", label: "" }
    : { pageId: null, href: target.href, label: target.label };
}

// The header/footer are rendered by the storefront's (storefront)/layout.tsx,
// which is already `force-dynamic` (re-fetches on every request) — so no
// storefront revalidation is needed here, just the admin editor itself.
export async function addMenuItem(menuId: string, target: MenuTarget, groupLabel?: string) {
  await requireAdmin();
  // New items go on the end of whichever menu they belong to.
  const last = await (await db()).menuItem.findFirst({
    where: { menuId },
    orderBy: { order: "desc" },
  });
  await (await db()).menuItem.create({
    data: {
      shopId: await currentShopId(),
      menuId,
      ...targetData(target),
      groupLabel: groupLabel || null,
      order: (last?.order ?? -1) + 1,
    },
  });
  await revalidateMenus();
}

export async function updateMenuItem(id: string, target: MenuTarget, groupLabel?: string) {
  await requireAdmin();
  await (await db()).menuItem.update({
    where: { id },
    data: { ...targetData(target), groupLabel: groupLabel || null },
  });
  await revalidateMenus();
}

export async function deleteMenuItem(id: string) {
  await requireAdmin();
  await (await db()).menuItem.delete({ where: { id } });
  await revalidateMenus();
}

export async function toggleMenuItemVisibility(id: string) {
  await requireAdmin();
  const item = await (await db()).menuItem.findUniqueOrThrow({ where: { id } });
  await (await db()).menuItem.update({ where: { id }, data: { isVisible: !item.isVisible } });
  await revalidateMenus();
}

/**
 * Saves both order and nesting after a drag.
 *
 * Written in one transaction because a half-applied move is a broken menu: an
 * item pointing at a parent that has since moved below it would render as a
 * dropdown containing its own ancestor.
 *
 * Depth is re-derived here rather than trusted from the client — the two-level
 * limit is a rule about the data, so it is enforced where the data is written.
 */
export async function saveMenuStructure(
  menuId: string,
  rows: { id: string; parentId: string | null }[]
) {
  await requireAdmin();

  const ids = new Set(rows.map((r) => r.id));
  const parentOf = new Map(rows.map((r) => [r.id, r.parentId]));

  const clean = rows.map((row, order) => {
    let parentId = row.parentId;
    // A parent that isn't in this list, is the item itself, or is a child of
    // something else would all produce an impossible tree.
    if (parentId && (!ids.has(parentId) || parentId === row.id || parentOf.get(parentId))) {
      parentId = null;
    }
    return { id: row.id, parentId, order };
  });

  const t = await db();
  await prisma.$transaction(
    clean.map((row) =>
      t.menuItem.update({
        where: { id: row.id },
        data: { parentId: row.parentId, order: row.order },
      })
    )
  );
  await revalidateMenus();
}


// ---------------------------------------------------------------------------
// The menus themselves
// ---------------------------------------------------------------------------

/** A url-safe, stable identifier so renaming a menu never breaks an assignment. */
function handleFor(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "menu"
  );
}

export async function createMenu(name: string): Promise<{ error?: string; id?: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give the menu a name." };
  if (trimmed.length > 60) return { error: "Keep the name under 60 characters." };

  const shopId = await currentShopId();
  const base = handleFor(trimmed);

  // Two menus may share a name — a merchant can reasonably have two called
  // "Sale" — but not a handle, so it is the handle that gets a suffix.
  const taken = new Set(
    (await (await db()).menu.findMany({ select: { handle: true } })).map((m) => m.handle)
  );
  let handle = base;
  for (let n = 2; taken.has(handle); n++) handle = `${base}-${n}`;

  const menu = await (await db()).menu.create({ data: { shopId, name: trimmed, handle } });
  await revalidateMenus();
  return { id: menu.id };
}

export async function renameMenu(id: string, name: string): Promise<{ error?: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give the menu a name." };
  if (trimmed.length > 60) return { error: "Keep the name under 60 characters." };

  // Only the name — the handle stays put, so whatever this menu is assigned to
  // keeps pointing at it.
  await (await db()).menu.update({ where: { id }, data: { name: trimmed } });
  await revalidateMenus();
  return {};
}

/**
 * Deletes a menu and its items.
 *
 * Refused while it is the only one: a store with no menu has no navigation and
 * no way back to building one, and the storefront falls back to the first menu
 * precisely because there is always meant to be one.
 */
export async function deleteMenu(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const menus = await (await db()).menu.findMany({ select: { id: true } });
  if (menus.length <= 1) return { error: "This is your only menu, create another one first." };
  if (!menus.some((m) => m.id === id)) return { error: "Menu not found." };

  // The slot columns are ON DELETE SET NULL, so anything pointing here is
  // cleared and falls back rather than pointing at a menu that is gone.
  await (await db()).menu.delete({ where: { id } });
  await revalidateMenus();
  return {};
}

/** Puts a menu in a slot, or clears the slot when given null. */
export async function assignMenu(slot: MenuSlot, menuId: string | null): Promise<{ error?: string }> {
  await requireAdmin();

  if (menuId) {
    const menu = await (await db()).menu.findUnique({ where: { id: menuId }, select: { id: true } });
    if (!menu) return { error: "Menu not found." };
  }

  const shopId = await currentShopId();
  const field = slot === "header" ? "headerMenuId" : "footerMenuId";
  await (await db()).storeSettings.upsert({
    where: { shopId },
    update: { [field]: menuId },
    create: { shopId, [field]: menuId },
  });

  await revalidateMenus();
  revalidatePath("/", "layout");
  return {};
}
