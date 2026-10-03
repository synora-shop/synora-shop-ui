import { cache } from "react";
import { db, requireShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import { getFeaturedProducts } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { getThemeLayout } from "@/lib/data/theme";
import { getSiteText, text } from "@/lib/site-text";
import { getMenus, headerLinks } from "@/lib/data/menus";
import { toGlobalEdits } from "@/lib/global-edits";
import { formatMoney } from "@/lib/money";
import { resolveStoreDefaults } from "@/lib/store-defaults";
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
  const layout = await getThemeLayout();
  const wantsArticles = shop.businessType === "BLOG";
  const wantsPlace = shop.businessType === "RESTAURANT";

  const [catalog, siteText, settings, articles, hours, locations, dishes] =
    await Promise.all([
    // The two reads every storefront page made from the database, now made
    // once per shop per five minutes instead of once per visitor.
    //
    // React's cache() above deduplicates within one render — which is what
    // stopped each section querying for itself — and caches nothing between
    // requests. So every visitor to a home page paid for a category list
    // *with a product-count join* plus a featured-product read, and a thousand
    // concurrent visitors paid for them a thousand times over, for rows that
    // are identical for all of them.
    //
    // **One callback returning both halves, not two calls under one kind.**
    // cachedForShop keys on the shop and the kind and nothing else, so two
    // callbacks sharing a kind are the same entry: whichever ran first would
    // win and the second would be handed the wrong shape. That has already
    // happened once here, under "theme", and threw `rows.find is not a
    // function` on every request. Adding a second kind would work too and is
    // worse — two tags to drop, and a writer only has to forget one.
    //
    // Dropped by whoever writes a product or a category; check:cache asserts
    // the pairing, the same as for the other six kinds.
    cachedForShop(shop.id, "catalog", async (t) => ({
      categories: await t.category.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          // For the sections that offer to show it. One join, on a list that is
          // already being fetched — cheaper than a setting that does nothing,
          // which is what "show how many products" would otherwise have been.
          _count: { select: { products: true } },
        },
      }),
      featured: await t.product.findMany({
        where: { isActive: true, isFeatured: true, status: "PUBLISHED", deletedAt: null },
        include: { variants: true, categories: true },
        omit: { costPrice: true },
        take: 8,
      }),
    })),
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

  // Settings is already loaded above, so this is a lookup rather than a query.
  const { currency } = resolveStoreDefaults(settings);

  const { categories, featured: featuredProducts } = catalog;

  // Every menu the shop has, keyed by id, for sections that point at one.
  //
  // getMenus is already cached per shop and already fetched for the header and
  // footer, so a section offering a menu costs no query of its own — which is
  // the only reason a picker like this is affordable on a page that may hold a
  // dozen sections.
  //
  // Flattened with headerLinks because a row of buttons has no second level:
  // a nested menu renders its parents, and its children belong to the page the
  // parent goes to.
  const menus: Record<string, { id: string; href: string; label: string }[]> = {};
  for (const menu of await getMenus()) {
    menus[menu.id] = headerLinks(menu.items).map((l) => ({
      id: l.id,
      href: l.href,
      label: l.label,
    }));
  }

  return {
    menus,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      productCount: c._count.products,
    })),
    featuredProducts,
    saleBadgeLabel: text(siteText, "product.saleBadge"),
    currency,
    edits: toGlobalEdits(settings),
    // The theme's card shape, resolved once for the page rather than per card.
    cardLayout: layout.productCard,
    cardFeatures: layout,
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
          price: formatMoney(dish.salePrice ?? dish.basePrice, currency),
          image: dish.images[0] ?? null,
          dietary: dish.dietary as string[],
        })),
    })),
  };
});
