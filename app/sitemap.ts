import type { MetadataRoute } from "next";
import { currentShop, canonicalUrl, isServingCustomers } from "@/lib/data/shop";
import { forShop } from "@/lib/tenant";
import { appUrl } from "@/lib/shop-context";
import { isDemoShop } from "@/lib/theme-store";
import { DEMO_SLUGS, THEME_STORE_ROOT } from "@/lib/themes/demo";

// One shop's sitemap, at that shop's canonical address.
//
// This route used to read `prisma.product.findMany()` with no shop filter and
// build every URL from a single hardcoded site URL. On a one-shop deployment
// that was fine. On a platform it published every merchant's product slugs to
// every other merchant's sitemap, under the wrong domain — a competitor's full
// catalogue, handed over by an endpoint search engines are pointed at.
//
// Now: scoped to the requesting shop, addressed at that shop's canonical
// domain, and empty for a shop that is not open.

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shop = await currentShop();
  // A request to the platform's own apex is not a store and has no catalogue —
  // but it does have the theme store, which is public and meant to be found.
  // One entry per theme: the demo's home page, which is what a crawler should
  // start from and is the address the theme is published at.
  if (!shop) {
    return DEMO_SLUGS.map((slug) => ({
      url: appUrl(`${THEME_STORE_ROOT}/${slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  }

  // A theme demo reached through /theme-store has no sitemap of its own: it is
  // listed in the platform's, above, at the address it is actually published
  // at. Emitting one here would advertise the demo's raw subdomain — the one
  // address guardDemoShop exists to keep out of the index.
  if (isDemoShop(shop.subdomain)) return [];
  // A paused, closed or suspended store should not be inviting crawlers in.
  if (!isServingCustomers(shop)) return [];

  const base = await canonicalUrl(shop.id);
  const db = forShop(shop.id);

  // The sitemap is generated on demand rather than at build time, but a
  // database that is briefly unreachable should still produce the static
  // routes rather than a 500 in front of a crawler.
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];
  try {
    [products, categories] = await Promise.all([
      db.product.findMany({
        // Exactly what the storefront will serve, and that is the point: a
        // product is kept off the shop by **two** switches, and this query
        // checked one. `isActive` alone listed every DRAFT product too — 41
        // URLs for 30 real pages on the development shop — so every crawler
        // was handed the address of an unlaunched product, which then returned
        // "not found". The page stayed hidden; the address did not, and a slug
        // usually carries the product's name. `getProductBySlug` filters on all
        // three, and a second copy of a where clause that drifted from the
        // first is the whole of this bug.
        where: { isActive: true, status: "PUBLISHED", deletedAt: null },
        select: { slug: true, updatedAt: true },
        // A sitemap is fetched by crawlers, repeatedly, and this one renders a
        // shop's whole catalogue into a single response. The protocol's own
        // ceiling is 50,000 URLs per file; this stays well under it and under
        // the point where one response becomes the slowest thing a shop
        // serves. A catalogue past this needs a sitemap index rather than a
        // bigger number here.
        take: 5000,
        orderBy: { updatedAt: "desc" },
      }),
      db.category.findMany({ select: { slug: true }, take: 1000, orderBy: { name: "asc" } }),
    ]);
  } catch (error) {
    console.error("[sitemap] database unavailable, serving static routes only", error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/collections/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
