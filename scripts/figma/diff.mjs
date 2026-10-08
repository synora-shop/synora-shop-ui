// Compare a built page with the design's own render, pixel by pixel.
//
//   node scripts/figma/diff.mjs <url> <width> <reference.png> <out-prefix> [--y 0] [--h <height>] [--wait 3000]
//
// The loop: render the artboard (render-fig.mjs), build, run this, read the
// three pictures it writes — <out>-build.png, <out>-diff.png (the reference
// faded, every differing pixel in red) and <out>-pair.png (the two side by
// side) — fix, repeat. It prints the share of pixels that differ by more than
// a small tolerance (so anti-aliasing and the stand-in fonts' glyph shapes do
// not drown out real layout errors) and the mean difference.
//
// Needs Chrome on 9222. Compares at one CSS pixel per design pixel: the page
// is opened `width` wide, which is where `--u` is exactly 1px.
import { readFileSync, writeFileSync } from "fs";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const y = Number(opt("y", 0));
const hArg = opt("h", null);
const wait = Number(opt("wait", 3000));
const [url, widthArg, refPath, out] = argv;
if (!url || !widthArg || !refPath || !out) {
  console.error("usage: node scripts/figma/diff.mjs <url> <width> <reference.png> <out-prefix> [--y 0] [--h H] [--wait ms]");
  process.exit(1);
}
const W = Number(widthArg);
const ref = readFileSync(refPath);
const refH = ref.readUInt32BE(20);
const H = hArg ? Number(hArg) : refH;

const tab = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r));
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

try {
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: Math.min(H + y, 4000), deviceScaleFactor: 1, mobile: W < 768 });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, wait));
  await evaluate("document.fonts.ready.then(() => true)");
  // Hide the platform's floating chrome, which the design does not have.
  await evaluate(`document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()); true`);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y, width: W, height: H, scale: 1 }, captureBeyondViewport: true });
  const build = Buffer.from(shot.result.data, "base64");
  writeFileSync(`${out}-build.png`, build);

  // Compare in the browser: two canvases, one pass over the pixels.
  await send("Page.navigate", { url: "about:blank" });
  await new Promise((r) => setTimeout(r, 300));
  const result = await evaluate(`(async () => {
    const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
    const [a, b] = await Promise.all([load("data:image/png;base64,${ref.toString("base64")}"), load("data:image/png;base64,${build.toString("base64")}")]);
    const w = ${W}, h = ${H};
    const c = (img) => { const k = document.createElement("canvas"); k.width = w; k.height = h; const x = k.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0,0,w,h); x.drawImage(img, 0, ${-y < 0 ? 0 : 0}); return x.getImageData(0, 0, w, h); };
    const A = c(a), B = c(b);
    const diff = document.createElement("canvas"); diff.width = w; diff.height = h; const dx = diff.getContext("2d"); const D = dx.createImageData(w, h);
    let bad = 0, sum = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.max(Math.abs(A.data[i]-B.data[i]), Math.abs(A.data[i+1]-B.data[i+1]), Math.abs(A.data[i+2]-B.data[i+2]));
      sum += d;
      const g = (A.data[i] + A.data[i+1] + A.data[i+2]) / 3 * 0.35 + 165;
      if (d > 48) { bad++; D.data[i] = 230; D.data[i+1] = 30; D.data[i+2] = 30; } else { D.data[i] = D.data[i+1] = D.data[i+2] = g; }
      D.data[i+3] = 255;
    }
    dx.putImageData(D, 0, 0);
    const pair = document.createElement("canvas"); pair.width = w * 2 + 16; pair.height = h; const px = pair.getContext("2d");
    px.fillStyle = "#e11"; px.fillRect(0,0,pair.width,h); px.drawImage(a, 0, 0); px.drawImage(b, w + 16, 0);
    return { bad: bad / (w * h), mean: sum / (w * h), diff: diff.toDataURL("image/png").split(",")[1], pair: pair.toDataURL("image/png").split(",")[1] };
  })()`);
  writeFileSync(`${out}-diff.png`, Buffer.from(result.diff, "base64"));
  writeFileSync(`${out}-pair.png`, Buffer.from(result.pair, "base64"));
  console.log(`${(result.bad * 100).toFixed(2)}% of pixels differ · mean difference ${result.mean.toFixed(1)}/255 · ${W}x${H} from y ${y}`);
} finally {
  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${tab.id}`);
}
