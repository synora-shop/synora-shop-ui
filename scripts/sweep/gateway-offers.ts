import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { seal, credentialContext } from "../../lib/payments/crypto";

/**
 * Probes 116-128: who is offered a gateway, and who is not.
 *
 * The one asymmetry in the payment engine is that a gateway still in test mode
 * is offered to the shop's own staff and to nobody else — it is how the
 * go-live test is done without a shopper ever meeting a payment that takes
 * pretend money. An asymmetry is exactly the kind of rule that looks right in
 * source and is wrong in practice, so this drives the real checkout.
 *
 * The staff half needs Chrome signed in on the DevTools port, the same session
 * the other browser probes use. Without it those probes are skipped rather
 * than silently passing.
 *
 * Writes to the database and puts everything back.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
const HOST = "my-store.localhost:3000";

let n = 0, bad = 0, skipped = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};
const skip = (name: string, why: string) => { skipped++; console.log(`  skip  ${name} — ${why}`); };

/** The checkout as a stranger sees it. */
async function anonymousCheckout(): Promise<string> {
  const r = await fetch(`${BASE}/checkout`, { headers: { host: HOST } });
  return r.text();
}

/** The checkout as the signed-in merchant sees it, through their own browser. */
async function staffCheckout(): Promise<string | null> {
  let list;
  try {
    list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
  } catch {
    return null;
  }
  const page = list.find((t: { type: string }) => t.type === "page");
  if (!page) return null;

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map<number, (m: { result?: { result?: { value?: unknown } } }) => void>();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String((e as MessageEvent).data));
    if (m.id && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
  });
  const send = (method: string, params: unknown = {}) => {
    const my = ++id;
    ws.send(JSON.stringify({ id: my, method, params }));
    return new Promise<{ result?: { result?: { value?: unknown } } }>((r) => pending.set(my, r));
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: `${BASE}/checkout` });
  await new Promise((r) => setTimeout(r, 4000));
  const out = await send("Runtime.evaluate", {
    expression: "document.body.innerText",
    returnByValue: true,
  });
  ws.close();
  return String(out.result?.result?.value ?? "");
}

async function main() {
  console.log("WHO IS OFFERED A GATEWAY");

  const shop = await prisma.shop.findFirstOrThrow({
    where: { subdomain: "my-store" },
    select: { id: true },
  });
  await prisma.paymentGateway.deleteMany({ where: { shopId: shop.id } });

  const { blob, keyVersion } = seal(
    JSON.stringify({ merchantId: "SWEEP", securedKey: "SWEEP" }),
    credentialContext(shop.id, "PAYFAST")
  );

  const set = (data: Record<string, unknown>) =>
    prisma.paymentGateway.upsert({
      where: { shopId_provider: { shopId: shop.id, provider: "PAYFAST" } },
      create: { shopId: shop.id, provider: "PAYFAST", secret: blob, keyVersion, ...data },
      update: data,
    });

  // 116-117 connected but switched off
  await set({ mode: "LIVE", isActive: false });
  let page = await anonymousCheckout();
  probe("116 a gateway that is switched off is not offered", !/PayFast/.test(page));

  // 118-119 live and switched on
  await set({ mode: "LIVE", isActive: true });
  page = await anonymousCheckout();
  probe("118 a live gateway is offered to a customer", /PayFast/.test(page));
  probe("119 and cash on delivery survives beside it", /Cash on Delivery/.test(page));

  // 120-121 test mode
  await set({ mode: "SANDBOX", isActive: true });
  page = await anonymousCheckout();
  probe("120 a gateway in test mode is hidden from a customer", !/PayFast/.test(page),
    "a shopper must never meet a payment that takes pretend money");
  probe("121 the checkout still works without it", /Cash on Delivery/.test(page));

  const staff = await staffCheckout();
  if (staff === null) skip("122 the same gateway is offered to the shop's own staff", "no Chrome on 9222");
  else {
    probe("122 the same gateway is offered to the shop's own staff", /PayFast/.test(staff));
    probe("123 and is labelled as a test", /[Tt]est mode/.test(staff));
  }

  // 124 the server refuses it too, not just the page
  const order = async () => {
    const r = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", host: HOST },
      body: JSON.stringify({
        customerName: "Sweep", customerEmail: "sweep@example.invalid",
        customerPhone: "03001234567", shippingLine1: "1 St", shippingCity: "Lahore",
        paymentMethod: "PAYFAST",
        items: [{ productId: "x", variantId: "y", quantity: 1 }],
      }),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  let res = await order();
  probe("124 a direct POST naming a test-mode gateway is refused", res.status === 400,
    `${res.status} ${res.body?.error ?? ""}`);
  probe("125 and says which rule it broke", /payment method isn't accepted/i.test(res.body?.error ?? ""));

  // 126 no credentials at all
  await prisma.paymentGateway.update({
    where: { shopId_provider: { shopId: shop.id, provider: "PAYFAST" } },
    data: { secret: null, mode: "LIVE", isActive: true },
  });
  page = await anonymousCheckout();
  probe("126 a gateway with no keys is offered to nobody", !/PayFast/.test(page));
  res = await order();
  probe("127 and the server refuses it", res.status === 400, String(res.status));

  // 128 nothing was left behind
  await prisma.paymentGateway.deleteMany({ where: { shopId: shop.id } });
  const left = await prisma.paymentGateway.count();
  const orders = await prisma.order.count({ where: { customerEmail: "sweep@example.invalid" } });
  probe("128 nothing was left behind", left === 0 && orders === 0, `${left} gateways, ${orders} orders`);

  console.log(`\n${n - bad} passed, ${bad} failed${skipped ? `, ${skipped} skipped` : ""}`);
  await prisma.$disconnect();
  process.exit(bad === 0 ? 0 : 1);
}

main();
