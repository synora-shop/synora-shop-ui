// Measure the built page and print it next to the design's own numbers.
//
//   node scripts/figma/compare.mjs <url> '<json selector->label map>'
//
// The other half of the loop. Screenshots show whether something looks
// roughly right; this says whether a box is 64px or 63. Needs Chrome on 9222.
const [url, specJson] = process.argv.slice(2);
const spec = JSON.parse(specJson);
const t = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r));
const send = (m, p = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 4000));

const expr = `JSON.stringify(${JSON.stringify(spec)}.map ? null : Object.entries(${JSON.stringify(spec)}).map(([sel, label]) => {
  const el = document.querySelector(sel);
  if (!el) return { label, missing: true };
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  return { label,
    w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
    x: Math.round(r.left * 100) / 100, y: Math.round(r.top * 100) / 100,
    pad: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(v=>parseFloat(v)).join("/"),
    gap: parseFloat(s.columnGap) || 0,
    radius: s.borderRadius,
    font: s.fontSize + "/" + s.lineHeight + " w" + s.fontWeight + " ls" + s.letterSpacing,
    color: s.color, border: s.borderBottomWidth + " " + s.borderBottomColor,
  };
}))`;
console.log(JSON.parse(await ev(expr)).map((r) => JSON.stringify(r)).join("\n"));
ws.close();
