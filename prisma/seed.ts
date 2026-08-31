import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PLACEHOLDER_IMG = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/1000`;

async function main() {
  // --- The shop everything else belongs to ---
  //
  // A fixed id so re-seeding updates the same store rather than accumulating
  // new ones, and so the ids below can name it without a lookup.
  const shop = await prisma.shop.upsert({
    where: { id: "shop_default" },
    update: {},
    create: {
      id: "shop_default",
      name: "Demo Store",
      subdomain: "demo",
      status: "ACTIVE",
    },
  });

  // --- Store settings (one row per shop) ---
  await prisma.storeSettings.upsert({
    where: { shopId: shop.id },
    update: {},
    create: {
      shopId: shop.id,
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923218408190",
      bankAccountDetails: "Meezan Bank\nAccount Title: Shop\nAccount #: 0000-0000-0000\nIBAN: PK00MEZN0000000000000000",
      jazzcashAccountDetails: "JazzCash: 0300-0000000 (Shop)",
      easypaisaAccountDetails: "EasyPaisa: 0300-0000000 (Shop)",
      shippingFee: 250,
      freeShippingThreshold: 5000,
    },
  });

  // --- Admin + demo customer ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@synoradigitals.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  // The merchant: a platform User, with a membership that makes them owner of
  // this shop. Being an owner is a fact about a person *and* a shop, so it
  // lives on the membership rather than the user.
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Shop Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  await prisma.membership.upsert({
    where: { userId_shopId: { userId: admin.id, shopId: shop.id } },
    update: {},
    create: { userId: admin.id, shopId: shop.id, role: "OWNER", acceptedAt: new Date() },
  });

  // The shopper: a Customer of this shop, not a platform user. The same email
  // could be a customer of a hundred other shops and none of them would know.
  await prisma.customer.upsert({
    where: { shopId_email: { shopId: shop.id, email: "customer@example.com" } },
    update: {},
    create: {
      shopId: shop.id,
      name: "Demo Customer",
      email: "customer@example.com",
      passwordHash: await bcrypt.hash("Customer123!", 10),
      phone: "03001234567",
    },
  });

  // --- Categories ---
  const categoryDefs = [
    { name: "Lawn", slug: "lawn" },
    { name: "Formal", slug: "formal" },
    { name: "Unstitched", slug: "unstitched" },
    { name: "Sale", slug: "sale" },
  ];
  const categories = new Map<string, string>();
  for (const c of categoryDefs) {
    const cat = await prisma.category.upsert({
      where: { shopId_slug: { shopId: shop.id, slug: c.slug } },
      update: {},
      create: { shopId: shop.id, name: c.name, slug: c.slug, image: PLACEHOLDER_IMG(c.slug) },
    });
    categories.set(c.slug, cat.id);
  }

  // --- Products ---
  const sizes = ["S", "M", "L", "XL"];
  const productDefs = [
    { title: "Rania Embroidered Lawn 3-Piece", slug: "rania-embroidered-lawn-3pc", category: "lawn", price: 6900, sale: 5500, colors: [["Blush", "#e8c7c0"], ["Sage", "#a9b79c"]] },
    { title: "Meherbano Printed Lawn Suit", slug: "meherbano-printed-lawn-suit", category: "lawn", price: 4500, colors: [["Ivory", "#f2ead9"], ["Coral", "#e0836b"]] },
    { title: "Zoya Chiffon Formal 2-Piece", slug: "zoya-chiffon-formal-2pc", category: "formal", price: 12500, colors: [["Emerald", "#2f5d50"], ["Maroon", "#6e2a35"]] },
    { title: "Alina Organza Formal Gown", slug: "alina-organza-formal-gown", category: "formal", price: 18500, colors: [["Midnight", "#232134"]] },
    { title: "Sana Unstitched Khaddar", slug: "sana-unstitched-khaddar", category: "unstitched", price: 3200, colors: [["Mustard", "#c99a2e"], ["Charcoal", "#3a3a3a"]] },
    { title: "Noor Unstitched Cambric", slug: "noor-unstitched-cambric", category: "unstitched", price: 2800, colors: [["White", "#f7f4ef"]] },
  ];

  for (const p of productDefs) {
    const categoryIds = [categories.get(p.category)!];
    // Mirror saveProduct()'s auto-sync: a discounted seed product also lands in Sale.
    if (p.sale != null) categoryIds.push(categories.get("sale")!);

    const product = await prisma.product.upsert({
      where: { shopId_slug: { shopId: shop.id, slug: p.slug } },
      update: {},
      create: {
        shopId: shop.id,
        title: p.title,
        slug: p.slug,
        description:
          "A contemporary Shop piece crafted from premium fabric, designed for effortless everyday elegance.",
        details: "Fabric: Premium blend\nCare: Dry clean recommended\nMade in Pakistan",
        images: [PLACEHOLDER_IMG(p.slug), PLACEHOLDER_IMG(p.slug + "-2")],
        basePrice: p.price,
        salePrice: p.sale,
        categories: { connect: categoryIds.map((id) => ({ id })) },
        isFeatured: p.sale != null,
      },
    });

    for (const [color, hex] of p.colors) {
      for (const size of sizes) {
        const sku = `${p.slug}-${size}-${color}`.toUpperCase().replace(/\s+/g, "-");
        await prisma.productVariant.upsert({
          where: { productId_size_color: { productId: product.id, size, color } },
          update: {},
          create: {
            shopId: shop.id,
            productId: product.id,
            size,
            color,
            colorHex: hex,
            sku,
            stock: 15,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
