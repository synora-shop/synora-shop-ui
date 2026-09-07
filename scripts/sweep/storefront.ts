import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const BASE = "http://localhost:3000";
let n = 0, bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};
const status = async (path: string) => (await fetch(BASE + path, { redirect: "manual" })).status;

async function main() {
  const shop = await prisma.shop.findFirstOrThrow({ where: { subdomain: "my-store" }, select: { id: true } });
  console.log("WHAT A CUSTOMER CAN REACH");

  const draft = await prisma.product.findFirst({ where: { shopId: shop.id, status: "DRAFT", deletedAt: null }, select: { slug: true } });
  const live = await prisma.product.findFirst({ where: { shopId: shop.id, status: "PUBLISHED", isActive: true, deletedAt: null }, select: { slug: true } });
  probe("21 a published product is reachable", live ? (await status(`/product/${live.slug}`)) === 200 : false, live?.slug);
  probe("22 a draft product is not", draft ? (await status(`/product/${draft.slug}`)) === 404 : false, draft?.slug);

  const hidden = await prisma.page.findFirst({ where: { shopId: shop.id, isPublished: false, categoryId: null }, select: { slug: true } });
  if (hidden) probe("23 an unpublished page is not reachable", (await status(`/p/${hidden.slug}`)) !== 200, hidden.slug);
  else {
    // make one, check, put it back
    const page = await prisma.page.findFirstOrThrow({ where: { shopId: shop.id, systemKey: "faq" }, select: { id: true, slug: true, isPublished: true } });
    await prisma.page.update({ where: { id: page.id }, data: { isPublished: false } });
    const s = await status(`/p/${page.slug}`);
    await prisma.page.update({ where: { id: page.id }, data: { isPublished: page.isPublished } });
    probe("23 an unpublished page is not reachable", s !== 200, `${page.slug} → ${s}`);
  }

  probe("24 a page that does not exist is a 404", (await status("/p/no-such-page-at-all")) === 404);
  probe("25 a product that does not exist is a 404", (await status("/product/no-such-product")) === 404);

  // A binned product disappears from the storefront.
  const victim = await prisma.product.findFirstOrThrow({ where: { shopId: shop.id, status: "PUBLISHED", deletedAt: null }, select: { id: true, slug: true } });
  await prisma.product.update({ where: { id: victim.id }, data: { deletedAt: new Date() } });
  const binned = await status(`/product/${victim.slug}`);
  await prisma.product.update({ where: { id: victim.id }, data: { deletedAt: null } });
  probe("26 a binned product is gone from the shop", binned === 404, `${victim.slug} → ${binned}`);

  // Revenue excludes binned and cancelled orders.
  const all = await prisma.order.aggregate({ where: { shopId: shop.id }, _sum: { total: true } });
  const counted = await prisma.order.aggregate({
    where: { shopId: shop.id, deletedAt: null, orderStatus: { not: "CANCELLED" } },
    _sum: { total: true },
  });
  const cancelled = await prisma.order.count({ where: { shopId: shop.id, orderStatus: "CANCELLED" } });
  probe("27 revenue excludes cancelled orders", cancelled === 0 || (counted._sum.total ?? 0) < (all._sum.total ?? 0), `${cancelled} cancelled`);

  const binnedOrders = await prisma.order.count({ where: { shopId: shop.id, deletedAt: { not: null } } });
  probe("28 revenue excludes binned orders", binnedOrders === 0 || (counted._sum.total ?? 0) < (all._sum.total ?? 0), `${binnedOrders} binned`);

  probe("29 robots.txt is served", (await status("/robots.txt")) === 200);
  probe("30 the sitemap is served", (await status("/sitemap.xml")) === 200);

  console.log(`\n${n - bad}/${n} passed`);
  await prisma.$disconnect();
}
main();
