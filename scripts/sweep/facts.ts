// The database's own answer to everything the sweep checks a screen against.
import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const shop = await prisma.shop.findFirstOrThrow({ where: { subdomain: "my-store" }, select: { id: true } });
  const where = { shopId: shop.id, deletedAt: null };
  // The analytics screen opens on the last 30 days, so an all-time total is
  // the wrong number to hold it to — the first version of this probe compared
  // a windowed figure against an unwindowed one and called it a fault.
  const since = new Date(Date.now() - 30 * 86_400_000);
  const revenue = await prisma.order.aggregate({
    where: { ...where, orderStatus: { not: "CANCELLED" as const }, createdAt: { gte: since } },
    _sum: { total: true },
  });
  const allTime = await prisma.order.aggregate({
    where: { ...where, orderStatus: { not: "CANCELLED" as const } },
    _sum: { total: true },
  });
  console.log(JSON.stringify({
    products: await prisma.product.count({ where }),
    drafts: await prisma.product.count({ where: { ...where, status: "DRAFT" } }),
    live: await prisma.product.count({ where: { ...where, status: "PUBLISHED", isActive: true } }),
    customers: await prisma.customer.count({ where: { shopId: shop.id } }),
    orders: await prisma.order.count({ where }),
    binned: await prisma.product.count({ where: { shopId: shop.id, deletedAt: { not: null } } }),
    pages: await prisma.page.count({ where: { shopId: shop.id, categoryId: null } }),
    pageDrafts: await prisma.page.count({ where: { shopId: shop.id, categoryId: null, isPublished: false } }),
    media: await prisma.mediaAsset.count({ where: { shopId: shop.id } }),
    revenuePrinted: (revenue._sum.total ?? 0).toLocaleString("en-PK"),
    allTimePrinted: (allTime._sum.total ?? 0).toLocaleString("en-PK"),
    firstProductTitle: (await prisma.product.findFirst({ where, orderBy: { createdAt: "desc" }, select: { title: true } }))?.title ?? "",
  }));
  await prisma.$disconnect();
}
main();
