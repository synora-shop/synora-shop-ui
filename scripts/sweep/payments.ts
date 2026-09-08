import { config } from "dotenv"; config({ path: ".env" });
import { randomBytes } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { seal, credentialContext } from "../../lib/payments/crypto";

/**
 * Probes 101-115: lying to a payment gateway's callback.
 *
 * The endpoint under test is public and unauthenticated — it has to be, since
 * the provider's servers must reach it and cannot authenticate to us. So this
 * asks the only question that matters about it: **can a stranger who knows a
 * reference get an order marked paid?**
 *
 * It is not a hypothetical. The most-used PayFast library marks an order paid
 * on any POST carrying a transaction id, and the field PayFast calls SIGNATURE
 * is filled with random hex by its own reference SDKs. The forged callbacks
 * below are exactly what that library would have accepted.
 *
 * What this does **not** prove, and no probe run from here can: that a payment
 * the provider genuinely reports as paid, for the wrong amount, is refused.
 * That comparison is exercised directly instead — `amountsMatch` and
 * `currenciesMatch` in lib/payments/amounts.ts are pure and called by
 * `npm run check:gateways`, which is why they live in a file of their own. A
 * security decision that can only be grepped is one nobody has tested.
 *
 * Writes to the database and puts everything back, including the stock.
 * Run against a development shop, never production.
 *
 *     npm run dev                       # in another terminal
 *     npx tsx scripts/sweep/payments.ts
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";

let n = 0,
  bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else {
    bad++;
    console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
};

const callback = async (body: Record<string, string>) => {
  const r = await fetch(`${BASE}/api/payments/payfast/callback`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  return { status: r.status, text: await r.text() };
};

async function main() {
  console.log("LYING TO A PAYMENT CALLBACK");

  const shop = await prisma.shop.findFirstOrThrow({
    where: { subdomain: "my-store" },
    select: { id: true },
  });
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { shopId: shop.id, stock: { gt: 1 } },
    include: { product: true },
  });
  const stockBefore = variant.stock;

  const { blob, keyVersion } = seal(
    JSON.stringify({ merchantId: "SWEEP", securedKey: "SWEEP" }),
    credentialContext(shop.id, "PAYFAST")
  );
  const gateway = await prisma.paymentGateway.create({
    data: {
      shopId: shop.id,
      provider: "PAYFAST",
      mode: "SANDBOX",
      isActive: true,
      secret: blob,
      keyVersion,
      connectedAt: new Date(),
    },
  });

  const orderId = `S${randomBytes(2).toString("hex")}`;
  const reference = randomBytes(24).toString("base64url");
  const order = await prisma.order.create({
    data: {
      id: orderId,
      shopId: shop.id,
      customerName: "Sweep",
      customerEmail: `sweep-${orderId}@example.invalid`,
      customerPhone: "03001234567",
      shippingLine1: "1 Sweep St",
      shippingCity: "Lahore",
      shippingProvince: "Punjab",
      subtotal: 1000,
      shippingFee: 0,
      total: 1000,
      paymentMethod: "PAYFAST",
      reservedUntil: new Date(Date.now() + 30 * 60 * 1000),
      items: {
        create: [
          {
            shopId: shop.id,
            productId: variant.productId,
            variantId: variant.id,
            title: variant.product.title,
            size: variant.size,
            color: variant.color,
            price: 1000,
            costPrice: 0,
            quantity: 1,
          },
        ],
      },
    },
  });
  await prisma.productVariant.update({
    where: { id: variant.id },
    data: { stock: { decrement: 1 } },
  });
  const payment = await prisma.payment.create({
    data: {
      shopId: shop.id,
      orderId: order.id,
      gatewayId: gateway.id,
      provider: "PAYFAST",
      mode: "SANDBOX",
      reference,
      amount: 1000,
      currency: "PKR",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const stillUnpaid = async (label: string) => {
    const o = await prisma.order.findUnique({ where: { id: order.id } });
    const p = await prisma.payment.findUnique({ where: { id: payment.id } });
    probe(label, o?.paymentStatus !== "CONFIRMED" && p?.status !== "CONFIRMED", `${o?.paymentStatus}/${p?.status}`);
  };

  // 101 — the exact shape the popular library accepts.
  let r = await callback({
    basket_id: reference,
    transaction_id: "9999999",
    err_code: "00",
    status: "SUCCESS",
    amount: "1000.00",
    currency: "PKR",
  });
  probe("101  a forged success is answered 200", r.status === 200, String(r.status));
  await stillUnpaid("102  and the order is not paid");

  // 103 — every spelling of the same lie.
  r = await callback({ BASKET_ID: reference, TRANSACTION_ID: "1", STATUS: "PAID", TXNAMT: "1000.00" });
  probe("103  uppercase field names are no different", r.status === 200);
  await stillUnpaid("104  still not paid");

  // 105 — the field PayFast calls SIGNATURE, which is not one.
  r = await callback({ basket_id: reference, SIGNATURE: reference, err_code: "00" });
  probe("105  a matching SIGNATURE proves nothing", r.status === 200);
  await stillUnpaid("106  still not paid");

  // 107 — a reference nobody issued.
  r = await callback({ basket_id: randomBytes(24).toString("base64url"), err_code: "00" });
  probe("107  an unknown reference answers exactly the same", r.status === 200, String(r.status));

  const orphan = await prisma.paymentEvent.findFirst({
    where: { outcome: "unknown-reference" },
    orderBy: { createdAt: "desc" },
  });
  probe("108  and is recorded against no shop", !!orphan && orphan.shopId === null);

  // 109 — landing on the success URL.
  const page = await fetch(`${BASE}/order-confirmation/${order.id}?ref=${encodeURIComponent(reference)}`, {
    headers: { host: "my-store.localhost:3000" },
  });
  probe("109  the success URL loads", page.status === 200, String(page.status));
  await stillUnpaid("110  and typing it does not pay the order");

  const events = await prisma.paymentEvent.count({ where: { paymentId: payment.id } });
  probe("111  every attempt was written down", events >= 3, `${events} events`);

  // 112 — the reservation running out, released by an ordinary page load.
  await prisma.order.update({
    where: { id: order.id },
    data: { reservedUntil: new Date(Date.now() - 1000) },
  });
  await fetch(`${BASE}/checkout`, { headers: { host: "my-store.localhost:3000" } });

  const released = await prisma.order.findUnique({ where: { id: order.id } });
  probe("112  a checkout releases an expired hold", released?.orderStatus === "CANCELLED", String(released?.orderStatus));
  probe("113  and it stops holding anything", released?.reservedUntil === null);

  const restocked = await prisma.productVariant.findUnique({ where: { id: variant.id } });
  probe("114  the stock came back", restocked?.stock === stockBefore, `${restocked?.stock} of ${stockBefore}`);

  // 115 — a cancelled order cannot be paid for afterwards.
  r = await callback({ basket_id: reference, err_code: "00", amount: "1000.00" });
  const final = await prisma.order.findUnique({ where: { id: order.id } });
  probe("115  a late callback cannot revive a cancelled order", final?.paymentStatus !== "CONFIRMED", String(final?.paymentStatus));

  // 116 two releases arriving at once.
  //
  // The guard is a conditional update inside a transaction, so the loser
  // updates nothing. Worth firing for real rather than reasoning about: a
  // reservation released twice restocks twice, and a shop that oversells
  // because of its own cleanup is worse than one that never held the stock.
  const raceOrderId = `R${randomBytes(2).toString("hex")}`;
  await prisma.order.create({
    data: {
      id: raceOrderId, shopId: shop.id,
      customerName: "Race", customerEmail: `race-${raceOrderId}@example.invalid`,
      customerPhone: "03001234567", shippingLine1: "1 Race St",
      shippingCity: "Lahore", shippingProvince: "Punjab",
      subtotal: 1000, shippingFee: 0, total: 1000,
      paymentMethod: "PAYFAST", reservedUntil: new Date(Date.now() - 1000),
      items: { create: [{
        shopId: shop.id, productId: variant.productId, variantId: variant.id,
        title: variant.product.title, size: variant.size, color: variant.color,
        price: 1000, costPrice: 0, quantity: 1,
      }] },
    },
  });
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: { decrement: 1 } } });

  await Promise.all([
    fetch(`${BASE}/checkout`, { headers: { host: "my-store.localhost:3000" } }),
    fetch(`${BASE}/checkout`, { headers: { host: "my-store.localhost:3000" } }),
    fetch(`${BASE}/checkout`, { headers: { host: "my-store.localhost:3000" } }),
  ]);

  const raced = await prisma.productVariant.findUnique({ where: { id: variant.id } });
  probe("116 three releases at once restock exactly once",
    raced?.stock === stockBefore, `${raced?.stock} of ${stockBefore}`);
  const racedOrder = await prisma.order.findUnique({ where: { id: raceOrderId } });
  probe("117 and the order is cancelled once",
    racedOrder?.orderStatus === "CANCELLED", String(racedOrder?.orderStatus));

  await prisma.orderItem.deleteMany({ where: { orderId: raceOrderId } });
  await prisma.order.delete({ where: { id: raceOrderId } });

  console.log("\nPUTTING IT BACK");
  await prisma.paymentEvent.deleteMany({
    where: { OR: [{ paymentId: payment.id }, ...(orphan ? [{ id: orphan.id }] : [])] },
  });
  await prisma.payment.deleteMany({ where: { orderId: order.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.paymentGateway.delete({ where: { id: gateway.id } });
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stockBefore } });

  const leftGateways = await prisma.paymentGateway.count();
  const leftPayments = await prisma.payment.count();
  const stockNow = await prisma.productVariant.findUnique({ where: { id: variant.id } });
  console.log(
    `  gateways ${leftGateways}, payments ${leftPayments}, stock ${stockNow?.stock} (found ${stockBefore})`
  );

  console.log(`\n${n - bad} passed, ${bad} failed`);
  await prisma.$disconnect();
  process.exit(bad === 0 ? 0 : 1);
}

main();
