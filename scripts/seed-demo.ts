/**
 * Fills a shop with believable demo data, and takes it out again.
 *
 *   npx tsx scripts/seed-demo.ts --shop ahad1v
 *   npx tsx scripts/seed-demo.ts --shop ahad1v --undo
 *
 * Two flags for setting a shop up to be tested, both reversible from the admin:
 *
 *   --set-type ecommerce   what kind of business this shop is
 *   --hide / --show        maintenance mode, i.e. whether the public can see it
 *
 * Switching type deletes and migrates nothing. The rows describing a storefront
 * are partitioned by type, so the old one stops being the one on screen and
 * switching back brings it all straight back — see
 * app/admin/settings/business-type-actions.ts, which this mirrors.
 *
 * Everything it writes is marked, so `--undo` is exact rather than a guess:
 *
 *   products    every variant SKU begins DEMO-
 *   customers   every address is at @demo.invalid
 *   orders      placed by those customers
 *   enquiries   sent from those addresses
 *
 * `.invalid` is reserved by RFC 2606 and can never resolve, so no demo address
 * can ever receive real mail — which matters, because orders and enquiries here
 * are the two things the app emails about.
 *
 * Deterministic: the same shop seeded twice produces the same catalogue, and
 * re-running after an --undo gives back what was there. Nothing is random
 * between runs, so a screenshot taken today still matches next week.
 *
 * Writes with the base client and an explicit shopId rather than through
 * forShop(), because a script has no request and therefore no tenant context.
 *
 * Everything is inserted in bulk, and that is not premature: the database is in
 * us-east-1 and a laptop in Karachi is ~220ms from it. Row-at-a-time upserts
 * meant roughly eight hundred round trips and the better part of ten minutes.
 * The same data goes in as a dozen multi-row INSERTs in a few seconds, so ids
 * are generated here rather than by the database's own defaults.
 */
import { randomBytes } from "crypto";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** An id in the shape Prisma's cuid() produces: short, sortable enough, unique. */
const newId = () => `dm${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;

const MARK = "DEMO-";
const MAIL = "@demo.invalid";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const has = (name: string) => process.argv.includes(`--${name}`);

/* A small deterministic PRNG, so two runs produce the same shop. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const between = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

const CATEGORIES = [
  ["T-shirts", "t-shirts"], ["Hoodies", "hoodies"], ["Jackets", "jackets"],
  ["Shirts", "shirts"], ["Trousers", "trousers"], ["Footwear", "footwear"],
  ["Accessories", "accessories"], ["Sale", "sale"],
] as const;

const ADJECTIVES = ["Everyday", "Heavyweight", "Relaxed", "Classic", "Boxy", "Tailored", "Washed", "Oversized", "Slim", "Textured"];
const NOUNS = ["Tee", "Hoodie", "Bomber", "Oxford Shirt", "Chino", "Sneaker", "Cap", "Overshirt", "Crewneck", "Trouser"];
const COLOURS = [["Black", "#111111"], ["Ecru", "#e8e1d5"], ["Navy", "#1c2a44"], ["Olive", "#4a5340"], ["Rust", "#9c4a2a"]] as const;
const SIZES = ["S", "M", "L", "XL"];
const FIRST = ["Ayesha", "Bilal", "Hina", "Omar", "Sana", "Zain", "Mariam", "Faisal", "Noor", "Danish", "Iqra", "Hamza", "Areeba", "Usman", "Laiba", "Talha", "Sadia", "Kamran", "Rida", "Shahid", "Anum", "Bilquis", "Junaid", "Mehak", "Adeel"];
const LAST = ["Khan", "Ahmed", "Malik", "Sheikh", "Butt", "Qureshi", "Raza", "Iqbal", "Chaudhry", "Siddiqui"];
const CITIES = [["Karachi", "Sindh"], ["Lahore", "Punjab"], ["Islamabad", "Islamabad"], ["Faisalabad", "Punjab"], ["Peshawar", "KPK"]] as const;

const ORDER_STATUS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "DELIVERED", "DELIVERED", "CANCELLED"] as const;
const PAY_METHOD = ["COD", "COD", "BANK_TRANSFER", "JAZZCASH", "EASYPAISA"] as const;
const ENQ_STATUS = ["NEW", "NEW", "IN_PROGRESS", "QUOTED", "WON", "LOST"] as const;

/**
 * A short order id, unique across shops.
 *
 * An Order's id is its primary key and is global, not per-shop. The first
 * version of this used `D0001` upward, which meant seeding a second shop hit a
 * primary-key conflict on every row — and because the insert used
 * `skipDuplicates`, all sixty orders were dropped in silence while their line
 * items were inserted anyway, pointing at the *first* shop's orders. A
 * merchant's order lines attached to another merchant's orders, from one
 * helper script.
 *
 * So the shop is in the id. The check below is the belt to this brace: items
 * are only written for orders that came back from the database belonging to
 * this shop.
 */
const shopKey = (shopId: string) =>
  shopId.split("").reduce((h, ch) => (h * 33 + ch.charCodeAt(0)) >>> 0, 5381).toString(36).slice(-3).toUpperCase();

const orderId = (shopId: string, n: number) =>
  `D${shopKey(shopId)}${n.toString(36).toUpperCase().padStart(3, "0")}`;

async function main() {
  const subdomain = arg("shop");
  if (!subdomain) throw new Error("Pass --shop <subdomain>, e.g. --shop ahad1v");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  const shop = await prisma.shop.findFirst({ where: { subdomain }, select: { id: true, name: true, businessType: true } });
  if (!shop) throw new Error(`No shop with subdomain "${subdomain}" in this database.`);
  console.log(`shop: ${shop.name} (${subdomain}) — ${shop.businessType}`);

  const setType = arg("set-type");
  if (setType) {
    const stored = setType.toUpperCase();
    if (!["ECOMMERCE", "RESTAURANT", "BLOG"].includes(stored)) {
      throw new Error(`--set-type must be ecommerce, restaurant or blog (got "${setType}")`);
    }
    await prisma.shop.update({ where: { id: shop.id }, data: { businessType: stored as "ECOMMERCE" } });
    console.log(`type:       ${shop.businessType} -> ${stored}`);
  }

  if (has("hide") || has("show")) {
    const maintenanceMode = has("hide");
    // upsert, because a shop that has never opened Settings has no row at all
    // and the storefront falls back to the defaults.
    await prisma.storeSettings.upsert({
      where: { shopId: shop.id },
      update: { maintenanceMode },
      create: { shopId: shop.id, maintenanceMode },
    });
    console.log(`storefront: ${maintenanceMode ? "hidden (maintenance on)" : "visible (maintenance off)"}`);
  }

  if (has("status")) {
    const n = await prisma.$transaction([
      prisma.product.count({ where: { shopId: shop.id } }),
      prisma.order.count({ where: { shopId: shop.id } }),
      prisma.customer.count({ where: { shopId: shop.id } }),
      prisma.enquiry.count({ where: { shopId: shop.id } }),
    ]);
    console.log(`counts:     ${n[0]} products · ${n[1]} orders · ${n[2]} customers · ${n[3]} enquiries`);
    await prisma.$disconnect();
    return;
  }

  /* ---------------------------------------------------------------- undo -- */
  if (has("undo")) {
    const variants = await prisma.productVariant.findMany({
      where: { shopId: shop.id, sku: { startsWith: MARK } },
      select: { productId: true },
    });
    const productIds = [...new Set(variants.map((v) => v.productId))];
    const customers = await prisma.customer.findMany({
      where: { shopId: shop.id, email: { endsWith: MAIL } },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    // Orders first: an OrderItem points at a product, and deleting the product
    // would only null the link, leaving the order behind as a ghost.
    const orders = await prisma.order.deleteMany({
      where: { shopId: shop.id, OR: [{ customerId: { in: customerIds } }, { customerEmail: { endsWith: MAIL } }] },
    });
    const enquiries = await prisma.enquiry.deleteMany({ where: { shopId: shop.id, email: { endsWith: MAIL } } });
    const products = await prisma.product.deleteMany({ where: { shopId: shop.id, id: { in: productIds } } });
    const people = await prisma.customer.deleteMany({ where: { shopId: shop.id, id: { in: customerIds } } });
    // Categories are only removed when the demo emptied them, so a category a
    // merchant added by hand is never taken away.
    const cats = await prisma.category.deleteMany({
      where: { shopId: shop.id, slug: { in: CATEGORIES.map(([, s]) => s) }, products: { none: {} } },
    });

    // Lines whose order belongs to another shop, or to no order at all. An
    // earlier version of this script could create them; nothing should.
    const orphans = await prisma.$executeRaw`
      DELETE FROM "OrderItem" oi
       USING "Order" o
       WHERE oi."orderId" = o."id"
         AND oi."shopId" = ${shop.id}
         AND o."shopId" <> oi."shopId"
    `;
    if (orphans > 0) console.log(`removed  ${orphans} line(s) attached to another shop's order`);

    console.log(`removed  ${products.count} products · ${orders.count} orders · ${people.count} customers · ${enquiries.count} enquiries · ${cats.count} empty categories`);
    await prisma.$disconnect();
    return;
  }

  /* ---------------------------------------------------------------- seed -- */
  const r = rng(20260906);

  await prisma.category.createMany({
    data: CATEGORIES.map(([name, slug]) => ({
      id: newId(), shopId: shop.id, name, slug,
      description: `Everything in ${name.toLowerCase()}.`,
    })),
    // A re-run must not double the catalogue, and a merchant's own category
    // with the same slug must not be overwritten.
    skipDuplicates: true,
  });
  const categories = await prisma.category.findMany({
    where: { shopId: shop.id, slug: { in: CATEGORIES.map(([, sl]) => sl) } },
    select: { id: true, slug: true },
  });

  type Line = { productId: string; variantId: string; title: string; size: string; color: string; price: number; costPrice: number; quantity: number };

  const products: { id: string; slug: string; title: string; basePrice: number; salePrice: number | null; costPrice: number; categoryId: string }[] = [];
  const variants: { id: string; productId: string; size: string; color: string; colorHex: string; option1: string; option2: string; sku: string; stock: number }[] = [];

  for (let i = 0; i < 40; i++) {
    // Adjective cycles every pass, noun advances once per pass — 10 x 10 gives
    // forty distinct names. Stepping both by i (or by any stride sharing a
    // factor with the length) repeats after ten and reads as a bug.
    const title = `${ADJECTIVES[i % ADJECTIVES.length]} ${NOUNS[Math.floor(i / ADJECTIVES.length) % NOUNS.length]}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i + 1}`;
    const base = between(r, 1200, 12000);
    const id = newId();
    products.push({
      id, slug, title, basePrice: base,
      salePrice: r() < 0.25 ? Math.round(base * 0.8) : null,
      costPrice: Math.round(base * 0.55),
      categoryId: categories[i % categories.length].id,
    });
    const colour = pick(r, COLOURS);
    for (const size of SIZES.slice(0, between(r, 2, 4))) {
      variants.push({
        id: newId(), productId: id, size, color: colour[0], colorHex: colour[1],
        option1: size, option2: colour[0],
        sku: `${MARK}${String(i + 1).padStart(3, "0")}-${size}`,
        stock: r() < 0.12 ? 0 : between(r, 1, 60),
      });
    }
  }

  const existing = new Set(
    (await prisma.product.findMany({ where: { shopId: shop.id, slug: { in: products.map((p) => p.slug) } }, select: { slug: true } }))
      .map((p) => p.slug)
  );
  const fresh = products.filter((p) => !existing.has(p.slug));

  await prisma.product.createMany({
    data: fresh.map((p, i) => ({
      id: p.id, shopId: shop.id, title: p.title, slug: p.slug,
      description: `A ${p.title.toLowerCase()} that does the job. Demo data — safe to delete.`,
      images: [`https://picsum.photos/seed/${p.slug}/800/800`],
      basePrice: p.basePrice, salePrice: p.salePrice, costPrice: p.costPrice,
      // A quarter left as drafts, so the status filter has something to filter
      // and the list is not uniformly green.
      status: i % 4 === 0 ? ("DRAFT" as const) : ("PUBLISHED" as const),
      isFeatured: i % 7 === 0,
      vendor: "Demo Supplier", tags: ["demo"],
      option1Name: "Size", option2Name: "Colour",
      createdAt: new Date(Date.now() - ((i * 7) % 300) * 86_400_000),
    })),
    skipDuplicates: true,
  });

  // The category link is an implicit many-to-many, which createMany cannot
  // reach — Prisma exposes no delegate for the join table.
  if (fresh.length > 0) {
    const values = fresh.map((p) => `('${p.categoryId}','${p.id}')`).join(",");
    await prisma.$executeRawUnsafe(
      `INSERT INTO "_CategoryToProduct" ("A","B") VALUES ${values} ON CONFLICT DO NOTHING`
    );
  }

  const freshIds = new Set(fresh.map((p) => p.id));
  await prisma.productVariant.createMany({
    data: variants.filter((v) => freshIds.has(v.productId)).map((v) => ({ ...v, shopId: shop.id })),
    skipDuplicates: true,
  });
  console.log(`categories: ${categories.length}`);
  console.log(`products:   ${fresh.length} new (${products.length} in the set)`);

  const people = Array.from({ length: 25 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
    return {
      id: newId(), shopId: shop.id, name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${MAIL}`,
      phone: `03${between(r, 10, 49)}${between(r, 1000000, 9999999)}`,
      createdAt: new Date(Date.now() - between(r, 5, 400) * 86_400_000),
    };
  });
  await prisma.customer.createMany({ data: people, skipDuplicates: true });
  const customers = await prisma.customer.findMany({
    where: { shopId: shop.id, email: { endsWith: MAIL } },
    select: { id: true, name: true, email: true, phone: true },
  });
  console.log(`customers:  ${customers.length}`);

  const sellable = await prisma.product.findMany({
    where: { shopId: shop.id, variants: { some: { sku: { startsWith: MARK } } } },
    select: { id: true, title: true, basePrice: true, salePrice: true, costPrice: true, variants: { select: { id: true, size: true, color: true } } },
  });

  // Global, not per shop: the id is a primary key, so a clash with any shop's
  // order is a clash.
  const taken = new Set(
    (await prisma.order.findMany({ where: { id: { startsWith: "D" } }, select: { id: true } })).map((o) => o.id)
  );
  const orders = [];
  const items: (Line & { id: string; orderId: string; shopId: string })[] = [];
  for (let i = 0; i < 60 && sellable.length > 0 && customers.length > 0; i++) {
    const id = orderId(shop.id, i + 1);
    if (taken.has(id)) continue;
    const who = pick(r, customers);
    const [city, province] = pick(r, CITIES);
    const lines: Line[] = Array.from({ length: between(r, 1, 3) }, () => {
      const p = pick(r, sellable);
      const v = pick(r, p.variants);
      return {
        productId: p.id, variantId: v.id, title: p.title, size: v.size, color: v.color,
        price: p.salePrice ?? p.basePrice, costPrice: p.costPrice, quantity: between(r, 1, 3),
      };
    });
    const subtotal = lines.reduce((s2, l) => s2 + l.price * l.quantity, 0);
    const shipping = subtotal > 5000 ? 0 : 250;
    const status = pick(r, ORDER_STATUS);
    orders.push({
      id, shopId: shop.id, customerId: who.id,
      customerName: who.name, customerEmail: who.email, customerPhone: who.phone ?? "03001234567",
      shippingLine1: `House ${between(r, 1, 400)}, Street ${between(r, 1, 40)}`,
      shippingCity: city, shippingProvince: province,
      subtotal, shippingFee: shipping, total: subtotal + shipping,
      paymentMethod: pick(r, PAY_METHOD),
      // A delivered order that was never paid for is not a thing, so the two
      // statuses are kept consistent rather than rolled independently.
      paymentStatus: status === "CANCELLED" ? ("FAILED" as const) : status === "PENDING" ? ("PENDING" as const) : ("CONFIRMED" as const),
      orderStatus: status,
      createdAt: new Date(Date.now() - between(r, 0, 120) * 86_400_000),
    });
    for (const l of lines) items.push({ ...l, id: newId(), orderId: id, shopId: shop.id });
  }
  await prisma.order.createMany({ data: orders, skipDuplicates: true });

  // Read back what actually landed, and write lines only for those. createMany
  // with skipDuplicates reports nothing about what it skipped, so without this
  // a silently-dropped order leaves its lines attached to whatever else holds
  // that id — which is how 129 of one shop's order lines ended up on another
  // shop's orders.
  const landed = new Set(
    (await prisma.order.findMany({
      where: { id: { in: orders.map((o) => o.id) }, shopId: shop.id },
      select: { id: true },
    })).map((o) => o.id)
  );
  const safeItems = items.filter((i) => landed.has(i.orderId));
  if (safeItems.length !== items.length) {
    console.log(`  note: ${items.length - safeItems.length} line(s) skipped — their order was not created`);
  }
  await prisma.orderItem.createMany({ data: safeItems, skipDuplicates: true });
  console.log(`orders:     ${landed.size} new`);

  const already = new Set(
    (await prisma.enquiry.findMany({ where: { shopId: shop.id, email: { endsWith: MAIL } }, select: { productTitle: true, email: true } }))
      .map((e) => `${e.email}|${e.productTitle}`)
  );
  const asks = [];
  for (let i = 0; i < 12 && sellable.length > 0 && customers.length > 0; i++) {
    const who = customers[(i * 2) % customers.length];
    const p = sellable[(i * 5) % sellable.length];
    if (already.has(`${who.email}|${p.title}`)) continue;
    asks.push({
      id: newId(), shopId: shop.id, productId: p.id, productTitle: p.title,
      name: who.name, email: who.email, phone: who.phone ?? "03001234567",
      company: i % 3 === 0 ? "Demo Traders" : null,
      quantity: between(r, 20, 500),
      message: `Do you offer bulk pricing on the ${p.title}? Demo enquiry — safe to delete.`,
      status: pick(r, ENQ_STATUS),
      createdAt: new Date(Date.now() - between(r, 0, 60) * 86_400_000),
    });
  }
  await prisma.enquiry.createMany({ data: asks, skipDuplicates: true });
  console.log(`enquiries:  ${asks.length} new`);

  await prisma.$disconnect();
  console.log(`\nRemove it all with:  npx tsx scripts/seed-demo.ts --shop ${subdomain} --undo`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
