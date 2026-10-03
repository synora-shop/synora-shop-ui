// Sign in as a merchant and screenshot an admin page, through CDP.
//
//   node scripts/sweep/signin.mjs <path> <width> <out.png>
//
// The admin is behind a session, so a bare screenshot of /admin/customize is
// a picture of the login form. This drives the real form — same route, same
// server action, same cookie — rather than minting a session by hand, so what
// it captures is what a merchant sees.
const [path, w, out] = process.argv.slice(2);
const width = Number(w || 1440);
const BASE = "http://localhost:3000";
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@synoradigitals.com";
const PASS = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

const t = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r));
const send = (m, p = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 2, mobile: false });
await send("Page.enable");

await send("Page.navigate", { url: `${BASE}/merchant/login` });
await wait(3500);

const filled = await evaluate(`(() => {
  const email = document.querySelector('input[type=email], input[name=email]');
  const pass = document.querySelector('input[type=password]');
  if (!email || !pass) return "no form: " + document.title;
  const set = (el, v) => {
    const proto = Object.getPrototypeOf(el);
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  set(email, ${JSON.stringify(EMAIL)});
  set(pass, ${JSON.stringify(PASS)});
  (email.form || document.querySelector("form")).requestSubmit();
  return "submitted";
})()`);
console.log("login:", filled);
await wait(5000);
console.log("landed on:", await evaluate("location.pathname"));

await send("Page.navigate", { url: `${BASE}${path}` });
await wait(6000);
console.log("now on:", await evaluate("location.pathname"));

const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const { writeFileSync } = await import("fs");
writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("wrote", out);
ws.close();
