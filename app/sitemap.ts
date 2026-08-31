import type { MetadataRoute } from "next";
import { currentShop, canonicalUrl, isServingCustomers } from "@/lib/data/shop";
import { forShop } from "@/lib/tenant";

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
  // A request to the platform's own apex is not a store and has no catalogue.
  if (!shop) return [];
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
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      db.category.findMany({ select: { slug: true } }),
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
