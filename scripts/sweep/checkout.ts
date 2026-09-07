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
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let json: any = null;
  try { json = await r.json(); } catch {}
  return { status: r.status, json };
};

async function main() {
  console.log("PLACING AN ORDER, DISHONESTLY");

  const shop = await prisma.shop.findFirstOrThrow({ where: { subdomain: "my-store" }, select: { id: true } });
  const other = await prisma.shop.findFirst({ where: { subdomain: { not: "my-store" } }, select: { id: true, subdomain: true } });

  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { shopId: shop.id, stock: { gt: 3 }, product: { status: "PUBLISHED", isActive: true, deletedAt: null } },
    include: { product: { select: { id: true, title: true, basePrice: true, salePrice: true } } },
  });
  const realPrice = variant.priceOverride ?? variant.product.salePrice ?? variant.product.basePrice;

  const base = {
    customerName: "Sweep Tester",
    customerEmail: "sweep.tester@demo.invalid",
    customerPhone: "03001234567",
    shippingLine1: "1 Test Street",
    shippingCity: "Lahore",
    paymentMethod: "COD",
  };
  const line = { productId: variant.product.id, variantId: variant.id, quantity: 1 };
  const before = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id }, select: { stock: true } });

  // 51 a price sent by the browser is ignored
  const priced = await post({ ...base, items: [{ ...line, price: 1, total: 1 }] });
  const made = priced.json?.orderId
    ? await prisma.order.findUnique({ where: { id: priced.json.orderId }, include: { items: true } })
    : null;
  probe("51 a price sent by the browser is ignored", made?.items[0]?.price === realPrice,
    `sent 1, charged ${made?.items[0]?.price} (real ${realPrice})`);
  probe("52 and the total is the shop's, not the browser's", (made?.total ?? 0) >= realPrice);

  // 53 stock came off
  const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id }, select: { stock: true } });
  probe("53 stock came off the shelf", after.stock === before.stock - 1, `${before.stock} → ${after.stock}`);

  // clean up that order before the rest
  if (made) {
    await prisma.orderItem.deleteMany({ where: { orderId: made.id } });
    await prisma.order.delete({ where: { id: made.id } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: before.stock } });
  }

  // 54 a negative quantity
  probe("54 a negative quantity is refused", (await post({ ...base, items: [{ ...line, quantity: -3 }] })).status >= 400);
  // 55 a fractional quantity
  probe("55 a fractional quantity is refused", (await post({ ...base, items: [{ ...line, quantity: 1.5 }] })).status >= 400);
  // 56 more than exists
  const tooMany = await post({ ...base, items: [{ ...line, quantity: before.stock + 1000 }] });
  probe("56 more than is in stock is refused", tooMany.status >= 400, tooMany.json?.error?.slice(0, 50));
  // 57 an empty basket
  probe("57 an empty basket is refused", (await post({ ...base, items: [] })).status >= 400);
  // 58 somebody else's variant id
  if (other) {
    const theirs = await prisma.productVariant.findFirst({ where: { shopId: other.id }, select: { id: true, productId: true } });
    if (theirs) {
      const cross = await post({ ...base, items: [{ productId: theirs.productId, variantId: theirs.id, quantity: 1 }] });
      probe("58 another shop's product cannot be bought here", cross.status >= 400, `${other.subdomain} → ${cross.status}`);
    } else probe("58 another shop's product cannot be bought here", true, "no variant to try");
  } else probe("58 another shop's product cannot be bought here", true, "only one shop");
  // 59 a made-up discount code
  const fake = await post({ ...base, discountCode: "FREEFOREVER", items: [line] });
  probe("59 a made-up discount code does not create a free order", fake.status >= 400 || (fake.json?.total ?? 0) > 0, `status ${fake.status}`);
  if (fake.json?.orderId) {
    await prisma.orderItem.deleteMany({ where: { orderId: fake.json.orderId } });
    await prisma.order.delete({ where: { id: fake.json.orderId } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: before.stock } });
  }
  // 60 an email that is not an email
  probe("60 an address that is not an address is refused",
    (await post({ ...base, customerEmail: "not-an-email", items: [line] })).status >= 400);

  const stockNow = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id }, select: { stock: true } });
  console.log(`\n  stock restored: ${stockNow.stock} (was ${before.stock})`);
  console.log(`${n - bad}/${n} passed`);
  await prisma.$disconnect();
}
main();
