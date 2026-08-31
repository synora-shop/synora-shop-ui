import type { Prisma } from "@/lib/generated/prisma/client";
import { db, currentShop, currentShopId } from "@/lib/data/shop";
import { cachedForShop, invalidateShop } from "@/lib/data/cached";

// Reproduces the previously-hardcoded header nav (site-header.tsx's old
// NAV_LINKS) and footer columns (site-footer.tsx's old Shop/Help/Company
// lists) exactly, so the very first render after this migration looks
// identical — same lazy-seed-on-first-read pattern as getOrCreateHomePage.
type StarterItem = { menu: "main" | "footer" } & Omit<
  Prisma.MenuItemCreateManyInput,
  "shopId" | "menuId" | "location"
>;

const DEFAULT_MENU_ITEMS: StarterItem[] = [
  { menu: "main", label: "Shop All", href: "/shop", order: 0 },
  { menu: "main", label: "Lawn", href: "/collections/lawn", order: 1 },
  { menu: "main", label: "Formal", href: "/collections/formal", order: 2 },
  { menu: "main", label: "Unstitched", href: "/collections/unstitched", order: 3 },
  { menu: "main", label: "Sale", href: "/collections/sale", order: 4 },

  { menu: "footer", groupLabel: "Shop", label: "All Products", href: "/shop", order: 0 },
  { menu: "footer", groupLabel: "Shop", label: "Lawn", href: "/collections/lawn", order: 1 },
  { menu: "footer", groupLabel: "Shop", label: "Formal", href: "/collections/formal", order: 2 },
  { menu: "footer", groupLabel: "Shop", label: "Sale", href: "/collections/sale", order: 3 },

  { menu: "footer", groupLabel: "Help", label: "FAQs", href: "/faq", order: 4 },
  { menu: "footer", groupLabel: "Help", label: "Contact Us", href: "/contact", order: 5 },
  { menu: "footer", groupLabel: "Help", label: "Track Order", href: "/account/orders", order: 6 },

  { menu: "footer", groupLabel: "Company", label: "Our Story", href: "/about", order: 7 },
];

const MENU_ITEM_INCLUDE = { page: { include: { category: true } } } as const;

/** Where a menu can be shown. The slots the storefront actually renders. */
export const MENU_SLOTS = ["header", "footer"] as const;
export type MenuSlot = (typeof MENU_SLOTS)[number];

/**
 * The menu a slot uses when nothing is assigned to it.
 *
 * These are the handles the migration gives the menus it creates, so a shop
 * that has never opened Settings still gets its footer links in the footer
 * rather than a second copy of the header.
 */
const DEFAULT_HANDLE: Record<MenuSlot, string> = {
  header: "main-menu",
  footer: "footer-menu",
};

/**
 * Every menu this shop has, each with its items in order.
 *
 * A shop that has never had one gets the starter pair created on first read —
 * the same lazy-seed the single header/footer lists used, so a new store still
 * opens with navigation rather than two empty boxes.
 */
export async function getMenus() {
  const load = async () =>
    (await db()).menu.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: { orderBy: { order: "asc" }, include: MENU_ITEM_INCLUDE } },
    });

  const shop = await currentShop();
  if (!shop) return [];

  // Only the read is cached. The seeding below writes, which must not happen
  // inside a cache scope, and would be wrong to cache anyway.
  const existing = await cachedForShop(shop.id, "menus", (t) =>
    t.menu.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: { orderBy: { order: "asc" }, include: MENU_ITEM_INCLUDE } },
    })
  );
  if (existing.length > 0) return existing;

  try {
    const sid = await currentShopId();
    await (await db()).menu.create({
      data: {
        shopId: sid,
        name: "Main menu",
        handle: "main-menu",
        items: {
          create: DEFAULT_MENU_ITEMS.filter((i) => i.menu === "main").map(
            ({ menu: _menu, ...item }) => ({ ...item, shopId: sid })
          ),
        },
      },
    });
    await (await db()).menu.create({
      data: {
        shopId: sid,
        name: "Footer menu",
        handle: "footer-menu",
        items: {
          create: DEFAULT_MENU_ITEMS.filter((i) => i.menu === "footer").map(
            ({ menu: _menu, ...item }) => ({ ...item, shopId: sid })
          ),
        },
      },
    });
  } catch {
    // Lost a create race against a concurrent first request — rows exist now.
  }
  // The cache still holds the empty list that led here, so it has to go before
  // the fresh read — otherwise the first visitor to a new shop seeds the menus
  // and then keeps being served the emptiness for the life of the entry.
  invalidateShop(shop.id, "menus");
  return load();
}

export type MenuWithItems = Awaited<ReturnType<typeof getMenus>>[number];

/**
 * The menu to render in a slot.
 *
 * Three steps, and the middle one matters. An unassigned slot used to fall
 * straight through to the shop's first menu, which put the header's links in
 * the footer for every shop that had never saved its settings — there was no
 * row to hold an assignment, so both slots resolved to the same menu.
 *
 * So an unassigned slot looks for the menu conventionally meant for it first.
 * Only if that is gone too does it fall back to the first menu, which is still
 * better than rendering nothing: a merchant who deleted the assigned menu
 * should see their remaining navigation, not a header that silently emptied.
 */
export function menuForSlot(
  menus: MenuWithItems[],
  assignedId: string | null | undefined,
  slot: MenuSlot
): MenuWithItems | undefined {
  return (
    menus.find((m) => m.id === assignedId) ??
    menus.find((m) => m.handle === DEFAULT_HANDLE[slot]) ??
    menus[0]
  );
}

type MenuItemRow = MenuWithItems["items"][number];

/**
 * The single place a menu item's real destination/label gets computed. When `page` is set,
 * the stored `href`/`label` are ignored entirely in favor of the live Page (and, for
 * collection pages, Category) values — this is what makes renaming a category or a custom
 * page's title show up in every menu that links to it with zero additional sync code.
 */
function resolveDestination(item: MenuItemRow): { href: string; label: string } {
  const page = item.page;
  if (!page) return { href: item.href, label: item.label };

  if (page.category) {
    return { href: `/collections/${page.category.slug}`, label: page.category.name };
  }
  if (page.routePath) {
    return { href: page.routePath, label: page.title };
  }
  // Home/About/FAQ have their own dedicated route files (not the /p/[slug] catch-all);
  // every other Page row is an admin-created custom page rendered there.
  const dedicatedRoute: Record<string, string> = { home: "/", about: "/about", faq: "/faq" };
  return { href: dedicatedRoute[page.slug] ?? `/p/${page.slug}`, label: page.title };
}

/**
 * Header nav as a two-level tree — visible items only, already ordered.
 *
 * A child whose parent is hidden or deleted is promoted to the top level
 * rather than disappearing with it. Silently losing a link that was never
 * touched is the worse failure: the merchant hid one thing and lost several,
 * with nothing on screen to explain where they went.
 */
export function headerLinks(items: MenuItemRow[]): NavLink[] {
  const visible = items.filter((i) => i.isVisible);
  const visibleIds = new Set(visible.map((i) => i.id));

  const tops = visible.filter((i) => !i.parentId || !visibleIds.has(i.parentId));
  return tops.map((item) => {
    const children = visible
      .filter((c) => c.parentId === item.id && c.id !== item.id)
      .map((c) => ({ ...resolveDestination(c), id: c.id }));
    return {
      ...resolveDestination(item),
      id: item.id,
      children: children.length > 0 ? children : undefined,
    };
  });
}

export type NavLink = {
  id: string;
  href: string;
  label: string;
  children?: { id: string; href: string; label: string }[];
};

/**
 * Footer items grouped into columns by groupLabel, preserving first-seen order.
 *
 * Grouping belongs to the *slot*, not the menu: the same menu shows as a flat
 * row in the header and as columns in the footer, which is what lets one menu
 * be assigned to both.
 */
export function footerColumns(items: MenuItemRow[]) {
  const order: string[] = [];
  const byGroup = new Map<string, { id: string; href: string; label: string }[]>();
  for (const item of items) {
    if (!item.isVisible) continue;
    const key = item.groupLabel ?? "";
    if (!byGroup.has(key)) {
      byGroup.set(key, []);
      order.push(key);
    }
    byGroup.get(key)!.push({ id: item.id, ...resolveDestination(item) });
  }
  return order.map((heading) => ({ heading, links: byGroup.get(heading)! }));
}
