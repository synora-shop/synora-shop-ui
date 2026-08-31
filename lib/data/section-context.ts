import { cache } from "react";
import { db, requireShop } from "@/lib/data/shop";
import { getFeaturedProducts } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { getSiteText, text } from "@/lib/site-text";
import { toGlobalEdits } from "@/lib/global-edits";
import { formatPKR } from "@/lib/utils";
import type { SectionContext } from "@/components/storefront/sections/render";

/**
 * Fetches the live catalog data every section might need, once per request.
 *
 * Previously each section queried for itself (Category Grid and Featured
 * Products both hit the DB independently); hoisting it here means one query
 * each per page, and — more importantly — gives the customizer a serialisable
 * snapshot it can hand to the client-side preview.
 */
export const getSectionContext = cache(async (): Promise<SectionContext> => {
  const shop = await requireShop();

  // Fetched only where they can be used. An online store cannot place a menu
  // or an opening-hours section — its themes do not offer them — so three
  // extra queries on every one of its pages would buy nothing. This is the
  // whole reason the business type is on the shop rather than inferred.
  const wantsArticles = shop.businessType === "BLOG";
  const wantsPlace = shop.businessType === "RESTAURANT";

  const [categories, featuredProducts, siteText, settings, articles, hours, locations, dishes] =
    await Promise.all([
    (await db()).category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, image: true },
    }),
    getFeaturedProducts(),
    getSiteText(),
    getStoreSettings(),

    wantsArticles
      ? (await db()).article.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 12,
          select: {
            slug: true,
            title: true,
            excerpt: true,
            coverImage: true,
            authorName: true,
            publishedAt: true,
          },
        })
      : [],

    wantsPlace
      ? (await db()).openingHours.findMany({ orderBy: { day: "asc" } })
      : [],

    wantsPlace
      ? (await db()).location.findMany({
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
          take: 3,
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            mapUrl: true,
          },
        })
      : [],

    // Every published dish, not a page of them: a menu is read whole.
    wantsPlace
      ? (await db()).product.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { title: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            basePrice: true,
            salePrice: true,
            images: true,
            dietary: true,
            // Many-to-many: a dish may sit in more than one course, and a menu
            // listing it under both "Starters" and "Vegetarian" is right rather
            // than a duplicate.
            categories: { select: { id: true } },
          },
        })
      : [],
  ]);

  return {
    categories,
    featuredProducts,
    saleBadgeLabel: text(siteText, "product.saleBadge"),
    edits: toGlobalEdits(settings),
    // Dates are serialised, because this snapshot is handed to the client-side
    // preview and a Date does not survive that crossing.
    articles: articles.map((a) => ({
      ...a,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    })),
    hours: hours.map((h) => ({
      day: h.day,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
      reopensAt: h.reopensAt,
      reclosesAt: h.reclosesAt,
      closed: h.closed,
    })),
    locations,
    // Grouped here rather than in the renderer so the customizer's client-side
    // preview gets the same shape the server rendered.
    menu: categories.map((category) => ({
      id: category.id,
      name: category.name,
      dishes: dishes
        .filter((dish) => dish.categories.some((c) => c.id === category.id))
        .map((dish) => ({
          id: dish.id,
          title: dish.title,
          description: dish.description,
          price: formatPKR(dish.salePrice ?? dish.basePrice),
          image: dish.images[0] ?? null,
          dietary: dish.dietary as string[],
        })),
    })),
  };
});
