import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { seal, credentialContext } from "../../lib/payments/crypto";

/**
 * Probes 129-140: the four states of a gateway on the Payments screen.
 *
 * Connected, switched on, live and disconnected are different things with
 * different consequences, and merchants conflate them. This drives the real
 * screen through each and checks it says the right thing — in particular that
 * going live is refused until a test payment has actually been through, and
 * that the irreversible action is the one that warns.
 *
 * Needs Chrome signed in on the DevTools port. Writes and puts back.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";

let n = 0, bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

let ws: WebSocket, id = 0;
const pending = new Map<number, (m: { result?: { result?: { value?: unknown } } }) => void>();
const send = (method: string, params: unknown = {}) => {
  const my = ++id;
  ws.send(JSON.stringify({ id: my, method, params }));
  return new Promise<{ result?: { result?: { value?: unknown } } }>((r) => pending.set(my, r));
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ev = async (expr: string) =>
  String((await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value ?? "");

async function open() {
  const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
  ws = new WebSocket(list.find((t: { type: string }) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String((e as MessageEvent).data));
    if (m.id && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
  });
  await send("Page.enable");
  await send("Runtime.enable");
}

const load = async () => {
  await send("Page.navigate", { url: `${BASE}/admin/payments` });
  await wait(3800);
  return ev("document.body.innerText");
};

async function main() {
  console.log("THE FOUR STATES OF A GATEWAY");

  const shop = await prisma.shop.findFirstOrThrow({
    where: { subdomain: "my-store" },
    select: { id: true },
  });
  await prisma.paymentGateway.deleteMany({ where: { shopId: shop.id } });
  await open();

  // 129 not connected
  let text = await load();
  probe("129 an unconnected gateway offers a way to get an account", /Get an account/.test(text));
  probe("130 and asks for both halves of the key",
    (await ev("!!document.getElementById('gw-PAYFAST-merchantId') && !!document.getElementById('gw-PAYFAST-securedKey')")) === "true");

  const { blob, keyVersion } = seal(
    JSON.stringify({ merchantId: "SWEEP", securedKey: "SWEEP" }),
    credentialContext(shop.id, "PAYFAST")
  );
  const set = (data: Record<string, unknown>) =>
    prisma.paymentGateway.upsert({
      where: { shopId_provider: { shopId: shop.id, provider: "PAYFAST" } },
      create: { shopId: shop.id, provider: "PAYFAST", secret: blob, keyVersion, connectedAt: new Date(), ...data },
      update: data,
    });

  // 131-134 connected, in test mode, never tested
  await set({ mode: "SANDBOX", isActive: false, sandboxVerifiedAt: null });
  text = await load();
  probe("131 a connected gateway says its keys are safe", /keys are saved and encrypted/.test(text));
  probe("132 and never shows them", !/SWEEP/.test(text), "the stored key must not appear anywhere");
  probe("133 it is labelled test mode", /Test mode/.test(text));
  probe("134 going live is explained, not offered",
    /One test payment unlocks going live/.test(text) &&
      (await ev(`[...document.querySelectorAll('button,[role=switch]')].filter(e=>/Take real payments/.test(e.closest('div')?.innerText||'')).length`)) === "0");

  // 135-136 the test payment has been through
  await set({ isActive: true, sandboxVerifiedAt: new Date() });
  text = await load();
  probe("135 a tested gateway says so", /test payment has been through/.test(text));
  probe("136 and going live becomes available", /Take real payments/.test(text));

  // 137 the irreversible one warns
  await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Disconnect')?.click()`);
  await wait(700);
  const dialog = await ev("document.body.innerText");
  probe("137 disconnecting warns that it cannot be undone", /cannot be undone/.test(dialog));
  probe("138 and points at the reversible alternative", /switch it off instead/.test(dialog));
  await ev(`[...document.querySelectorAll('button')].find(b=>/Cancel|Close/.test(b.textContent))?.click()`);
  await wait(400);

  // 139 live
  //
  // Read off the badge, not the page. The first version of this probe searched
  // the whole text for "Test mode" and failed on the sentence explaining what
  // the toggle does — "Test mode charges nothing. Live charges your customers
  // for real." — which is copy worth keeping. The badge is the claim.
  await set({ mode: "LIVE" });
  await load();
  const badge = await ev(
    `[...document.querySelectorAll('span')].map(e=>e.textContent.trim()).find(t=>t==='Live'||t==='Test mode') ?? '(none)'`
  );
  probe("139 the badge on a live gateway reads Live", badge === "Live", badge);

  // 140 put back
  await prisma.paymentGateway.deleteMany({ where: { shopId: shop.id } });
  text = await load();
  probe("140 removing it returns the screen to unconnected",
    /Get an account/.test(text) && !/keys are saved/.test(text));

  console.log(`\n${n - bad} passed, ${bad} failed`);
  await prisma.$disconnect();
  process.exit(bad === 0 ? 0 : 1);
}

main();
