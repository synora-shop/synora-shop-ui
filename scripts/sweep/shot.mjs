// A screenshot at a real device viewport.
//
//   node scripts/sweep/shot.mjs <url> <width> <out.png> [mobile]
//
// Same Chrome prerequisite as measure-overflow.mjs, and the same reason for
// existing: --window-size alone produces a picture that lies about what a
// phone sees. This sets deviceScaleFactor and the mobile flag, so what comes
// out is what a visitor gets.
const [url, w, out, mobile] = process.argv.slice(2);
const width = Number(w);
const t = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r));
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Emulation.setDeviceMetricsOverride", {
  width, height: 900, deviceScaleFactor: 2, mobile: mobile === "mobile",
});
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 4500));
const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const { writeFileSync } = await import("fs");
writeFileSync(out, Buffer.from(r.result.data, "base64"));
console.log("wrote", out);
ws.close();
