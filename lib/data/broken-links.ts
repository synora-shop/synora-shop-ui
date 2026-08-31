import { db } from "@/lib/data/shop";
import { requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { vocabularyFor } from "@/lib/themes/vocabulary";

export type BrokenLink = { href: string; labels: string[]; reason: string };

/**
 * Menu links that lead nowhere.
 *
 * These are the ones that actually 404 for customers. The store's first menu
 * was seeded from a fixed list that included Sale and Unstitched, and those
 * entries hold a plain `href` string rather than pointing at a Page — so when
 * those categories were later deleted, the cascade that cleans up
 * page-linked menu items had nothing to act on and the links survived.
 *
 * Menu items that DO point at a Page can't end up here: deleting a category
 * cascades to its page and then to the menu item, by design.
 */
export async function findBrokenMenuLinks(): Promise<BrokenLink[]> {
  // The merchant's own word for it. Telling a restaurant that its "lawn
  // collection" no longer exists is the admin describing their shop in a
  // vocabulary they never chose.
  const shop = await requireShop();
  const words = vocabularyFor(registryBusinessType(shop.businessType));

  const [items, categories, pages, redirects] = await Promise.all([
    (await db()).menuItem.findMany({
      where: { pageId: null },
      select: { label: true, href: true },
    }),
    (await db()).category.findMany({ select: { slug: true } }),
    (await db()).page.findMany({ select: { slug: true } }),
    (await db()).redirect.findMany({ where: { isActive: true }, select: { fromPath: true } }),
  ]);

  const liveCollections = new Set(categories.map((c) => c.slug));
  const livePages = new Set(pages.map((p) => p.slug));
  const alreadyRedirected = new Set(redirects.map((r) => r.fromPath));

  // Routes with their own files rather than a Page row behind them.
  const fixedRoutes = new Set(["/shop", "/cart", "/checkout", "/contact", "/account", "/account/orders", "/about", "/faq", "/"]);

  const grouped = new Map<string, BrokenLink>();

  for (const item of items) {
    const href = item.href.trim();
    if (!href.startsWith("/")) continue; // external links aren't ours to judge
    if (alreadyRedirected.has(href) || fixedRoutes.has(href)) continue;

    let reason: string | null = null;
    const collection = /^\/collections\/([^/?#]+)$/.exec(href);
    const custom = /^\/p\/([^/?#]+)$/.exec(href);

    if (collection && !liveCollections.has(collection[1])) {
      reason = `The "${collection[1]}" ${words.category.toLowerCase()} no longer exists.`;
    } else if (custom && !livePages.has(custom[1])) {
      reason = `The "${custom[1]}" page no longer exists.`;
    }
    if (!reason) continue;

    const entry = grouped.get(href) ?? { href, labels: [], reason };
    if (!entry.labels.includes(item.label)) entry.labels.push(item.label);
    grouped.set(href, entry);
  }

  return [...grouped.values()];
}
