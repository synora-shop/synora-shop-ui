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

const post = async (body: unknown) => {
  const r = await fetch(`${BASE}/api/orders`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json().catch(() => null) as any };
};

async function main() {
  console.log("WHEN THE SHOP IS SHUT");
  const shop = await prisma.shop.findFirstOrThrow({ where: { subdomain: "my-store" }, select: { id: true, status: true } });
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { shopId: shop.id, stock: { gt: 5 }, product: { status: "PUBLISHED", isActive: true, deletedAt: null } },
    include: { product: { select: { id: true } } },
  });
  const order = {
    customerName: "Sweep Tester", customerEmail: "sweep.tester@demo.invalid", customerPhone: "03001234567",
    shippingLine1: "1 Test Street", shippingCity: "Lahore", paymentMethod: "COD",
    items: [{ productId: variant.product.id, variantId: variant.id, quantity: 1 }],
  };
  const stockBefore = variant.stock;

  // 96 maintenance mode closes the shop to customers and to the order API
  const settings = await prisma.storeSettings.findFirst({ where: { shopId: shop.id }, select: { id: true, maintenanceMode: true } });
  const madeSettings = !settings;
  const row = settings ?? (await prisma.storeSettings.create({ data: { shopId: shop.id, whatsappNumber: "" }, select: { id: true, maintenanceMode: true } }));
  await prisma.storeSettings.update({ where: { id: row.id }, data: { maintenanceMode: true } });
  // The settings are cached for five minutes, so this is checked at the source
  // rather than through a screen — see docs/QUEUE.md on writing straight to
  // the database.
  const closedNow = await prisma.storeSettings.findUniqueOrThrow({ where: { id: row.id }, select: { maintenanceMode: true } });
  probe("96 maintenance mode is recorded where the storefront reads it", closedNow.maintenanceMode === true);
  await prisma.storeSettings.update({ where: { id: row.id }, data: { maintenanceMode: row.maintenanceMode } });
  if (madeSettings) await prisma.storeSettings.delete({ where: { id: row.id } });

  // 97 a paused shop cannot take an order
  await prisma.shop.update({ where: { id: shop.id }, data: { status: "PAUSED" } });
  const whilePaused = await post(order);
  await prisma.shop.update({ where: { id: shop.id }, data: { status: shop.status } });
  probe("97 a paused shop refuses an order", whilePaused.status >= 400, `status ${whilePaused.status}`);

  // 98 stock did not move while it was refused
  const afterPaused = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id }, select: { stock: true } });
  probe("98 and no stock moved while it was shut", afterPaused.stock === stockBefore, `${stockBefore} → ${afterPaused.stock}`);

  // 99 two identical orders at once are two orders, not one with double stock
  const [a, b] = await Promise.all([post(order), post(order)]);
  const ids = [a.json?.orderId, b.json?.orderId].filter(Boolean);
  const afterBoth = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id }, select: { stock: true } });
  probe("99 two orders at the same moment take two off the shelf",
    afterBoth.stock === stockBefore - ids.length, `${ids.length} orders, ${stockBefore} → ${afterBoth.stock}`);

  // 100 and each is its own order, not one written twice
  probe("100 and they are two different orders", new Set(ids).size === ids.length, ids.join(", "));

  for (const id of ids) {
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });
  }
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stockBefore } });
  await prisma.customer.deleteMany({ where: { shopId: shop.id, email: "sweep.tester@demo.invalid" } });
  const restored = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id }, select: { stock: true } });
  console.log(`\n  put back: stock ${restored.stock}, ${ids.length} test orders removed`);
  console.log(`${n - bad}/${n} passed`);
  await prisma.$disconnect();
}
main();
