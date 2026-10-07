// Load /loom at every width that matters and look for the ways a fluid page
// breaks. verify-loom.mjs proves the two drawn sizes are the file; this proves
// the widths the file never drew are not broken.
//
//   node scripts/figma/sweep-loom.mjs [url] [--shots <dir>]
//
// At each width:
//   - the page must not scroll sideways (the swipe rows scroll inside
//     themselves, which is allowed);
//   - no text may leave the box that clips it — a card, a button — or the
//     right edge of the page;
//   - no text may be drawn under 11px, the floor the components promise.
//
// Needs Chrome on 9222. With --shots, saves a full-page JPEG per width.
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const args = process.argv.slice(2);
const shotsAt = args.indexOf("--shots");
const shots = shotsAt >= 0 ? args.splice(shotsAt, 2)[1] : null;
const url = args[0] ?? "http://localhost:3000/loom";
const WIDTHS = [320, 360, 375, 390, 414, 430, 500, 600, 700, 767, 768, 820, 900, 1024, 1100, 1280, 1366, 1440, 1920, 2560];

const t = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r));
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) =>
  (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;

const PROBE = `(() => {
  const out = { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, clipped: [], tiny: [] };
  const page = document.querySelector("main").getBoundingClientRect();
  const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (seen.has(el) || el.closest("[hidden]") || el.offsetParent === null && getComputedStyle(el).position !== "fixed") continue;
    seen.add(el);
    const r = document.createRange(); r.selectNodeContents(n);
    const t = r.getBoundingClientRect();
    if (!t.width) continue;
    const label = n.textContent.trim().slice(0, 28);
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 11 - 0.01) out.tiny.push(label + " " + size.toFixed(1) + "px");
    // Text inside a horizontally scrolling row is meant to run off-screen.
    const swipe = el.closest(".overflow-x-auto");
    if (!swipe && t.right > page.right + 1) out.clipped.push(label + " past the page edge");
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      const clipsX = s.overflowX !== "visible", clipsY = s.overflowY !== "visible";
      const boxed = a.tagName === "BUTTON";
      if (!clipsX && !clipsY && !boxed) continue;
      if (a === swipe) break;
      const b = a.getBoundingClientRect();
      if (t.left < b.left - 1 || t.right > b.right + 1 || t.top < b.top - 1 || t.bottom > b.bottom + 1) {
        out.clipped.push(label + " outside its " + (boxed ? "button" : a.dataset.m || a.className.split(" ")[0]));
      }
      break;
    }
  }
  return JSON.stringify(out);
})()`;

let fails = 0;
if (shots) mkdirSync(shots, { recursive: true });
for (const width of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 3500));
  await ev("document.fonts.ready.then(() => 1)");
  const r = JSON.parse(await ev(PROBE));
  const bad = [];
  if (r.overflow > 0) bad.push(`scrolls sideways by ${r.overflow}px`);
  for (const c of r.clipped) bad.push(`clipped: ${c}`);
  for (const c of r.tiny) bad.push(`too small: ${c}`);
  console.log(`${bad.length ? "FAIL" : "ok  "}  ${String(width).padStart(4)}${bad.length ? "\n        " + bad.join("\n        ") : ""}`);
  if (bad.length) fails++;
  if (shots) {
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 60, captureBeyondViewport: true });
    writeFileSync(join(shots, `loom-${width}.jpg`), Buffer.from(shot.result.data, "base64"));
  }
}
ws.close();
console.log(`\n${fails === 0 ? "all clear" : `${fails} width(s) failing`}`);
process.exit(fails === 0 ? 0 : 1);
