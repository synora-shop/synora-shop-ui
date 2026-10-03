// Does a page scroll sideways, and what makes it?
//
//   node scripts/sweep/measure-overflow.mjs <url> [width]
//
// Needs Chrome listening on 9222:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\
//     --headless --remote-debugging-port=9222 --user-data-dir=/tmp/p about:blank
//
// Exists because a screenshot is not a measurement. Headless Chrome's
// --window-size sets the *window*, not the layout viewport, so a narrow
// screenshot of a desktop layout looks exactly like a page that overflows —
// and "fixing" that imaginary bug is how real layout gets broken. This sets
// device metrics properly and reports the arithmetic: viewport width, scroll
// width, and every element whose right edge is past the fold, shallowest
// first, because the outermost one is usually the cause and the rest are its
// children.
//
// No dependencies: Node's global fetch and WebSocket are the whole client.
const [url, widthArg] = process.argv.slice(2);
const width = Number(widthArg || 390);

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

await send("Emulation.setDeviceMetricsOverride", { width, height: 1200, deviceScaleFactor: 1, mobile: true });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 4000));

const expr = `(() => {
  const d = document.documentElement;
  const out = { viewport: window.innerWidth, scrollWidth: d.scrollWidth, overflow: d.scrollWidth - window.innerWidth, culprits: [] };
  if (out.overflow <= 0) return JSON.stringify(out);
  for (const el of document.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > window.innerWidth + 1) {
      out.culprits.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute("class") || "").slice(0, 90),
        right: Math.round(r.right), width: Math.round(r.width),
        depth: (() => { let n = el, d2 = 0; while ((n = n.parentElement)) d2++; return d2; })(),
      });
    }
  }
  out.culprits.sort((a, b) => a.depth - b.depth);
  out.culprits = out.culprits.slice(0, 8);
  return JSON.stringify(out);
})()`;
const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(JSON.parse(r.result.result.value), null, 1));
ws.close();
