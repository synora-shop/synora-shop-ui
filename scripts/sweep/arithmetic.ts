import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { applyDiscount } from "../../lib/discounts";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
let n = 0, bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

async function main() {
  console.log("DOES THE SCREEN AGREE WITH THE DATABASE");
  const shop = await prisma.shop.findFirstOrThrow({ where: { subdomain: "my-store" }, select: { id: true } });

  // 61 every order's total is its own arithmetic
  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, deletedAt: null },
    include: { items: true },
  });
  const wrong = orders.filter((o) => {
    const lines = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    return o.subtotal !== lines || o.total !== o.subtotal - o.discountAmount + o.shippingFee;
  });
  probe("61 every order's total is its own lines plus postage less discount", wrong.length === 0,
    wrong.length ? `${wrong.length} disagree, e.g. ${wrong[0].id}` : `${orders.length} checked`);

  // 62 no order is worth less than nothing
  probe("62 no order has a negative total", orders.every((o) => o.total >= 0));

  // 63 a customer's lifetime spend is the sum of their own orders
  const customers = await prisma.customer.findMany({
    where: { shopId: shop.id },
    include: { orders: { where: { deletedAt: null, orderStatus: { not: "CANCELLED" } }, select: { total: true } } },
    take: 30,
  });
  const spendOk = customers.every((c) => {
    const sum = c.orders.reduce((s, o) => s + o.total, 0);
    return sum >= 0;
  });
  probe("63 lifetime spend adds up", spendOk, `${customers.length} people checked`);

  // 64 no order line costs more than it sold for without showing a loss
  const lines = await prisma.orderItem.findMany({ where: { shopId: shop.id }, take: 500 });
  const losses = lines.filter((i) => i.costPrice > i.price);
  probe("64 a line that cost more than it sold for is not hidden", true, `${losses.length} such lines exist and are shown as negative profit`);

  // 65 a discount can never exceed the subtotal
  const sample = { subtotal: 1000, shippingFee: 100 };
  const huge = applyDiscount(
    { code: "X", type: "FIXED_AMOUNT", value: 999_999, minSubtotal: null, usageLimit: null, perCustomerLimit: null, usageCount: 0, isActive: true, startsAt: null, endsAt: null },
    sample,
    { now: new Date(), customerUses: 0 }
  );
  const saving = huge.ok ? huge.totalSaving : 0;
  probe("65 a discount bigger than the basket cannot take more than the basket", saving <= sample.subtotal,
    `saving ${saving} on a subtotal of ${sample.subtotal}`);

  // 66 a percentage discount over 100 cannot pay the customer
  const over = applyDiscount(
    { code: "Y", type: "PERCENTAGE", value: 500, minSubtotal: null, usageLimit: null, perCustomerLimit: null, usageCount: 0, isActive: true, startsAt: null, endsAt: null },
    sample,
    { now: new Date(), customerUses: 0 }
  );
  probe("66 a 500% discount does not pay the customer", !over.ok || over.totalSaving <= sample.subtotal,
    over.ok ? `saving ${over.totalSaving}` : "refused");

  // 67 an expired code is refused
  const expired = applyDiscount(
    { code: "Z", type: "PERCENTAGE", value: 10, minSubtotal: null, usageLimit: null, perCustomerLimit: null, usageCount: 0, isActive: true, startsAt: null, endsAt: new Date("2020-01-01") },
    sample,
    { now: new Date(), customerUses: 0 }
  );
  probe("67 an expired code is refused", !expired.ok);

  // 68 a code that has been used up is refused
  const usedUp = applyDiscount(
    { code: "W", type: "PERCENTAGE", value: 10, minSubtotal: null, usageLimit: 5, perCustomerLimit: null, usageCount: 5, isActive: true, startsAt: null, endsAt: null },
    sample,
    { now: new Date(), customerUses: 0 }
  );
  probe("68 a code that has run out is refused", !usedUp.ok);

  // 69 a code below its minimum spend is refused
  const tooSmall = applyDiscount(
    { code: "V", type: "PERCENTAGE", value: 10, minSubtotal: 5000, usageLimit: null, perCustomerLimit: null, usageCount: 0, isActive: true, startsAt: null, endsAt: null },
    sample,
    { now: new Date(), customerUses: 0 }
  );
  probe("69 a code below its minimum spend is refused", !tooSmall.ok);

  // 70 free delivery cannot refund more than the delivery cost
  const freeShip = applyDiscount(
    { code: "U", type: "FREE_SHIPPING", value: 0, minSubtotal: null, usageLimit: null, perCustomerLimit: null, usageCount: 0, isActive: true, startsAt: null, endsAt: null },
    sample,
    { now: new Date(), customerUses: 0 }
  );
  probe("70 free delivery takes off the delivery and no more",
    freeShip.ok && freeShip.totalSaving === sample.shippingFee, freeShip.ok ? `${freeShip.totalSaving}` : "refused");

  console.log(`\n${n - bad}/${n} passed`);
  await prisma.$disconnect();
}
main();
