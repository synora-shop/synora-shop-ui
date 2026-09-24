/**
 * Builds the theme store's demo shops, and takes them away again.
 *
 *   npx tsx scripts/seed-theme-store.ts                 both themes
 *   npx tsx scripts/seed-theme-store.ts --theme kite    one of them
 *   npx tsx scripts/seed-theme-store.ts --undo          remove them entirely
 *   npx tsx scripts/seed-theme-store.ts --status        what is there now
 *
 * Each theme in the store has one real Shop behind it — `kite-demo`,
 * `loom-demo` — so `/theme-store/kite` renders through the ordinary storefront
 * with no second code path. See docs/THEMES.md §5b for the whole model and
 * lib/themes/demo.ts for the routing.
 *
 * **These shops are ours, not a merchant's**, which is what makes `--undo` a
 * plain delete rather than the careful marked-row surgery `scripts/seed-demo.ts`
 * has to perform. Nothing here was typed by anybody; the row cascades and the
 * demo is gone.
 *
 * Deterministic. The same theme seeded twice produces the same shop — same
 * ids are not reused, but same slugs, prices, stock and photographs are — so a
 * screenshot taken today still matches next week, and re-running after an
 * `--undo` gives back what was there.
 *
 * Writes with the base client and an explicit shopId rather than through
 * forShop(), because a script has no request and therefore no tenant context.
 */
import { randomBytes } from "crypto";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEMO_CATALOGUES, type DemoCatalogue } from "./theme-store-catalogue";
import { DEMO_SLUGS, THEME_STORE_SLUGS, demoSubdomain } from "../lib/themes/demo";
import type { Prisma } from "../lib/generated/prisma/client";

const newId = () => `ts${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;

/** The same marks scripts/seed-demo.ts uses, so a sweep for demo data finds these too. */
const MARK = "DEMO-";
const PHOTOS = "https://picsum.photos/seed/";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const has = (name: string) => process.argv.includes(`--${name}`);

/** Deterministic pseudo-randomness, seeded per product slug. */
function seeded(text: string): number {
  let h = 5381;
  for (const ch of text) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** A photograph for a slug — stable, and self-marking as demo data. */
const photo = (slug: string, w = 900, h = 1200) => `${PHOTOS}${slug}/${w}/${h}`;

/* -------------------------------------------------------------------------- */

async function seedOne(
  prisma: PrismaClient,
  slug: string,
  themeKey: string,
  cat: DemoCatalogue
) {
  const subdomain = demoSubdomain(slug);

  /* --- the shop --------------------------------------------------------- */
  const shop = await prisma.shop.upsert({
    where: { subdomain },
    update: { name: cat.storeName, status: "ACTIVE", businessType: "ECOMMERCE" },
    create: {
      name: cat.storeName,
      subdomain,
      status: "ACTIVE",
      businessType: "ECOMMERCE",
      // Marked as onboarded so nothing in the app tries to walk a shop with no
      // owner through a welcome flow.
      onboardedAt: new Date(),
    },
    select: { id: true },
  });
  const shopId = shop.id;
  console.log(`\n${cat.storeName}  (${subdomain} · ${themeKey})`);

  /* --- settings --------------------------------------------------------- */
  const settings = {
    storeName: cat.storeName,
    currency: "PKR",
    maintenanceMode: false,
    // Indexed on purpose: a theme demo exists to be found by somebody looking
    // for a shop design. The duplicate-content risk is handled by address, not
    // by hiding — guardDemoShop keeps the raw subdomain out of the index.
    searchIndexing: true,
    footerCopyrightText: `© {year} ${cat.storeName}. A demo store for the ${cat.storeName.split(" ")[0]} theme.`,
    // The shop's own announcement, not a warning about the demo. Saying "this
    // is a demo" here as well as in the Synora bar directly above it put two
    // stacked bars on the page repeating each other, the lower one in the
    // platform's default dark red, which belongs to neither of these shops.
    //
    // The bar stays because it is a feature a merchant is judging, and an
    // empty one demos nothing.
    announcementText: cat.announcement.text,
    announcementBgColor: cat.announcement.background,
  };
  await prisma.storeSettings.upsert({
    where: { shopId },
    update: settings,
    create: { shopId, ...settings },
  });

  /* --- the theme -------------------------------------------------------- */
  //
  // The demo shop *runs* the theme rather than previewing it, which is why
  // nothing needs a `?__theme=` override: `/theme-store/kite` resolves the kite
  // demo, and the kite demo's live theme is Kite.
  const existing = await prisma.installedTheme.findFirst({ where: { shopId, themeKey } });
  const copy =
    existing ??
    (await prisma.installedTheme.create({ data: { shopId, themeKey, version: "1.0.0" } }));

  await prisma.themeSettings.upsert({
    where: { shopId_businessType: { shopId, businessType: "ECOMMERCE" } },
    update: { themeKey, installedThemeId: copy.id },
    create: {
      shopId,
      businessType: "ECOMMERCE",
      themeKey,
      installedThemeId: copy.id,
      tokens: {} as Prisma.InputJsonValue,
    },
  });

  /* --- categories ------------------------------------------------------- */
  for (const c of cat.categories) {
    await prisma.category.upsert({
      where: { shopId_slug: { shopId, slug: c.slug } },
      update: { name: c.name, description: c.description, image: photo(`cat-${c.slug}`, 1200, 900) },
      create: {
        shopId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: photo(`cat-${c.slug}`, 1200, 900),
      },
    });
  }
  const categories = await prisma.category.findMany({
    where: { shopId },
    select: { id: true, slug: true },
  });
  const byslug = new Map(categories.map((c) => [c.slug, c.id]));
  console.log(`  categories  ${categories.length}`);

  /* --- products --------------------------------------------------------- */
  let made = 0;
  for (const [i, p] of cat.products.entries()) {
    const r = seeded(p.slug);
    const images = [photo(p.slug), photo(`${p.slug}-2`), photo(`${p.slug}-3`)];

    const product = await prisma.product.upsert({
      where: { shopId_slug: { shopId, slug: p.slug } },
      update: {
        title: p.title,
        description: p.blurb,
        images,
        basePrice: p.price,
        salePrice: p.sale ?? null,
        isFeatured: !!p.featured,
      },
      create: {
        shopId,
        title: p.title,
        slug: p.slug,
        description: p.blurb,
        images,
        basePrice: p.price,
        salePrice: p.sale ?? null,
        costPrice: Math.round(p.price * 0.45),
        // Every product published. A demo with a quarter of it in draft is a
        // demo with a quarter of its grid missing, and there is no draft
        // filter on a storefront for anyone to notice it with.
        status: "PUBLISHED",
        isFeatured: !!p.featured,
        vendor: cat.storeName,
        tags: ["demo"],
        option1Name: cat.options.name,
        option2Name: cat.option2?.name ?? null,
        // Spread over the last few months so "New" badges and newest-first
        // sorting have something real to order by.
        createdAt: new Date(Date.now() - ((i * 11) % 150) * 86_400_000),
      },
      select: { id: true },
    });
    made++;

    const categoryId = byslug.get(p.category);
    if (categoryId) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_CategoryToProduct" ("A","B") VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        categoryId,
        product.id
      );
    }

    // One variant per size, on a single colour or shade — enough for the size
    // picker, the swatch and the stock states to have something to render,
    // without forty rows per product for a shop nobody buys from.
    const colour = cat.option2?.values[r % cat.option2.values.length] ?? null;
    for (const [n, size] of cat.options.values.entries()) {
      const sku = `${MARK}${p.slug.toUpperCase().slice(0, 12)}-${n + 1}`;
      await prisma.productVariant.upsert({
        where: { shopId_sku: { shopId, sku } },
        update: {},
        create: {
          shopId,
          productId: product.id,
          sku,
          size,
          // `color` is a required column, not a nullable one — the empty
          // string is what "this catalogue has only one axis" looks like in
          // the schema, and it keeps (product, size, color) unique either way.
          color: colour?.[0] ?? "",
          colorHex: colour?.[1],
          option1: size,
          option2: colour?.[0] ?? "",
          // One size in five sold out, so the out-of-stock treatment a theme
          // ships with is visible on the demo rather than only in theory.
          stock: (r + n) % 5 === 0 ? 0 : 6 + ((r + n * 7) % 40),
        },
      });
    }
  }
  console.log(`  products    ${made}`);

  /* --- the media library ------------------------------------------------ */
  await prisma.mediaAsset.createMany({
    data: cat.products.map((p, i) => ({
      id: newId(),
      shopId,
      url: photo(p.slug),
      filename: `${p.slug}.jpg`,
      format: "jpg",
      size: 90_000 + ((i * 37_211) % 700_000),
      folder: "products",
    })),
    skipDuplicates: true,
  });

  /* --- navigation ------------------------------------------------------- */
  const menus: { handle: string; name: string; items: { label: string; href: string }[] }[] = [
    {
      handle: "main-menu",
      name: "Main menu",
      items: [
        { label: "Shop all", href: "/shop" },
        ...cat.categories.slice(0, 4).map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
        { label: "About", href: "/about" },
      ],
    },
    {
      handle: "footer-menu",
      name: "Footer menu",
      items: [
        { label: "Shop all", href: "/shop" },
        { label: "About", href: "/about" },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

  const assigned: Record<string, string> = {};
  for (const m of menus) {
    const menu = await prisma.menu.upsert({
      where: {
        shopId_businessType_handle: { shopId, businessType: "ECOMMERCE", handle: m.handle },
      },
      update: { name: m.name },
      create: { shopId, businessType: "ECOMMERCE", handle: m.handle, name: m.name },
      select: { id: true },
    });
    // Rebuilt rather than merged: these links are ours and a re-run should
    // produce the navigation the catalogue currently describes, not that plus
    // whatever an older catalogue left behind.
    await prisma.menuItem.deleteMany({ where: { shopId, menuId: menu.id } });
    await prisma.menuItem.createMany({
      data: m.items.map((it, order) => ({
        id: newId(),
        shopId,
        menuId: menu.id,
        businessType: "ECOMMERCE" as const,
        label: it.label,
        href: it.href,
        order,
      })),
    });
    assigned[m.handle] = menu.id;
  }
  await prisma.storeSettings.update({
    where: { shopId },
    data: { headerMenuId: assigned["main-menu"], footerMenuId: assigned["footer-menu"] },
  });
  console.log(`  menus       ${menus.length}`);

  /* --- the home page ---------------------------------------------------- */
  //
  // Seeded rather than left to getOrCreateHomePage, whose defaults describe a
  // Pakistani lawn brand — right for a merchant's first day, wrong for a page
  // whose whole job is to show what a theme looks like when it is being used
  // properly.
  const home = await prisma.page.upsert({
    where: {
      shopId_businessType_systemKey: { shopId, businessType: "ECOMMERCE", systemKey: "home" },
    },
    update: { title: "Homepage" },
    create: {
      shopId,
      businessType: "ECOMMERCE",
      slug: "home",
      systemKey: "home",
      title: "Homepage",
      isSystem: true,
    },
    select: { id: true },
  });

  const sections: { type: Prisma.SectionCreateManyInput["type"]; data: Prisma.InputJsonValue }[] = [
    {
      type: "HERO_SLIDESHOW",
      data: {
        height: "large",
        overlayOpacity: 35,
        slides: [
          {
            image: photo(`${slug}-hero`, 2000, 1100),
            eyebrow: cat.hero.eyebrow,
            headline: cat.hero.headline,
            subheading: cat.hero.subheading,
            ctaLabel: cat.hero.cta,
            ctaHref: "/shop",
          },
        ],
      },
    },
    { type: "CATEGORY_GRID", data: { heading: "Browse", columns: 4 } },
    { type: "FEATURED_PRODUCTS", data: { heading: "What people buy", limit: 8, columns: 4 } },
    {
      type: "HIGHLIGHT_TEXT",
      data: { text: cat.statement, size: "large", align: "center", ctaLabel: "", ctaHref: "" },
    },
    {
      type: "COLLECTION_SHOWCASE",
      data: {
        collection: cat.categories[0].slug,
        heading: "",
        body: cat.categories[0].description,
        limit: 4,
        imagePosition: "left",
      },
    },
    {
      type: "STORY",
      data: {
        heading: cat.story.heading,
        body: cat.story.body,
        ctaLabel: "Read more",
        ctaHref: "/about",
      },
    },
  ];

  await prisma.section.deleteMany({ where: { shopId, pageId: home.id } });
  await prisma.section.createMany({
    data: sections.map((s, order) => ({
      id: newId(),
      shopId,
      pageId: home.id,
      type: s.type,
      order,
      data: s.data,
    })),
  });
  console.log(`  sections    ${sections.length}`);
}

/* -------------------------------------------------------------------------- */

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  const only = arg("theme");
  if (only && !DEMO_SLUGS.includes(only)) {
    throw new Error(`--theme must be one of ${DEMO_SLUGS.join(", ")} (got "${only}")`);
  }
  const slugs = only ? [only] : [...DEMO_SLUGS];

  if (has("status")) {
    for (const slug of slugs) {
      const subdomain = demoSubdomain(slug);
      const shop = await prisma.shop.findUnique({ where: { subdomain }, select: { id: true } });
      if (!shop) {
        console.log(`${subdomain.padEnd(12)} not seeded`);
        continue;
      }
      const [products, categories, sections] = await Promise.all([
        prisma.product.count({ where: { shopId: shop.id } }),
        prisma.category.count({ where: { shopId: shop.id } }),
        prisma.section.count({ where: { shopId: shop.id } }),
      ]);
      console.log(`${subdomain.padEnd(12)} ${products} products · ${categories} categories · ${sections} sections`);
    }
    await prisma.$disconnect();
    return;
  }

  if (has("undo")) {
    for (const slug of slugs) {
      const subdomain = demoSubdomain(slug);
      // A plain delete, and only safe because these shops are ours. Every child
      // row cascades from Shop, and nothing here was typed by a person — which
      // is exactly the property scripts/seed-demo.ts cannot rely on and is why
      // that one has to pick its rows out by mark.
      const gone = await prisma.shop.deleteMany({ where: { subdomain } });
      console.log(`${subdomain.padEnd(12)} ${gone.count ? "removed" : "was not there"}`);
    }
    await prisma.$disconnect();
    return;
  }

  for (const slug of slugs) {
    const themeKey = THEME_STORE_SLUGS[slug];
    const cat = DEMO_CATALOGUES[slug];
    if (!cat) throw new Error(`No catalogue for "${slug}" in scripts/theme-store-catalogue.ts`);
    await seedOne(prisma, slug, themeKey, cat);
    console.log(`  live at     https://app.synoradigitals.com/theme-store/${slug}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
