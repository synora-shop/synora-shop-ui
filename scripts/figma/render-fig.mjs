// Draw one artboard of a decoded .fig as a picture — the reference a build is
// compared against, straight from the file, with nothing re-exported.
//
//   node scripts/figma/render-fig.mjs <tree.json> <images-dir> "<frame name>" <out.png> [--html out.html]
//
// Why: the Figma API's renders are rationed, and a design checked only by
// numbers can still be wrong in ways numbers do not show. This turns the node
// tree into absolutely placed HTML — frames, rectangles, ellipses, lines,
// text, images with the file's own fill/fit/crop — and photographs it in
// Chrome (on port 9222) at the artboard's size, one CSS pixel per design
// pixel.
//
// Faithful where it matters and honest where it is not:
//   - positions are each node's transform, composed down the tree; frames clip
//     their children unless the file says they do not;
//   - text uses the file's family, weight, size, line height (% of size, as
//     Figma means it), tracking, alignment and case, with each style run kept;
//     the families are the file's own — on this Mac, SF Pro and Hiragino are
//     installed, so the reference shows what Figma showed;
//   - an image fills (cover), fits (contain), tiles, or crops — STRETCH is a
//     crop window whose paint transform maps the node's unit square into the
//     image; the drawn image is the node divided by that transform's scale;
//   - vectors are drawn from their geometry blobs (see icons.mjs);
//   - blurs, blend modes and inner shadows are not drawn. Nothing in this file
//     needs them; if a later file does, it will show up as a difference.
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const argv = process.argv.slice(2);
const htmlAt = argv.indexOf("--html");
const htmlOut = htmlAt >= 0 ? argv.splice(htmlAt, 2)[1] : null;
const [treePath, imagesDir, wanted, outPng] = argv;
if (!treePath || !imagesDir || !wanted || !outPng) {
  console.error('usage: node scripts/figma/render-fig.mjs <tree.json> <images-dir> "<frame name>" <out.png> [--html out.html]');
  process.exit(1);
}
const doc = JSON.parse(readFileSync(treePath, "utf8"));
const nodes = doc.nodeChanges;
const key = (g) => g && `${g.sessionID}:${g.localID}`;
const cmpPos = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const kids = new Map();
for (const n of nodes) {
  const p = key(n.parentIndex?.guid);
  if (!p) continue;
  if (!kids.has(p)) kids.set(p, []);
  kids.get(p).push(n);
}
for (const [, l] of kids) l.sort((a, b) => cmpPos(a.parentIndex?.position ?? "", b.parentIndex?.position ?? ""));

const target = nodes.find((n) => n.name === wanted && n.type === "FRAME") ?? nodes.find((n) => new RegExp(wanted, "i").test(n.name ?? ""));
if (!target) {
  console.error(`no frame named "${wanted}"`);
  process.exit(1);
}

const hexByte = (b) => b.toString(16).padStart(2, "0");
const rgba = (c, o = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${+((c.a ?? 1) * o).toFixed(4)})`;
const imageUrl = (hash) => "file://" + join(imagesDir, hash.map(hexByte).join(""));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ARGS = { 1: 2, 2: 2, 4: 6 };
const LETTER = { 1: "M", 2: "L", 4: "C" };
function decodePath(blobIndex) {
  const b = Buffer.from(doc.blobs[blobIndex].bytes);
  const out = [];
  let i = 0;
  while (i < b.length) {
    const op = b[i];
    if (op === 0) { i++; out.push("Z"); continue; }
    const n = ARGS[op];
    if (n === undefined) break;
    i++;
    const nums = [];
    for (let k = 0; k < n; k++) { nums.push(+b.readFloatLE(i).toFixed(3)); i += 4; }
    out.push(LETTER[op] + nums.join(" "));
  }
  return out.join("");
}

const WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500, Semibold: 600, SemiBold: 600, Bold: 700, W3: 300, W6: 600 };
const FAMILY = {
  // Single quotes throughout: these land inside a double-quoted style attribute.
  "SF Pro Text": `'SF Pro Text', -apple-system, system-ui`,
  "SF Pro Display": `'SF Pro Display', -apple-system, system-ui`,
  "Hiragino Mincho Pro": `'Hiragino Mincho ProN', 'Hiragino Mincho Pro', serif`,
};
const family = (f) => FAMILY[f] ?? `'${f}'`;

/** CSS for one paint layer, or null. Layers are listed bottom-first in the file. */
function background(p, w, h) {
  if (!p || p.visible === false) return null;
  const o = p.opacity ?? 1;
  if (p.type === "SOLID") return { css: `linear-gradient(${rgba(p.color, o)},${rgba(p.color, o)})` };
  if (p.type === "GRADIENT_LINEAR" && p.stops) {
    const t = p.transform ?? { m00: 1, m01: 0, m10: 0, m11: 1 };
    // The paint transform maps the node to gradient space, where the gradient
    // runs along x. Its inverse's x axis is the gradient's direction in the node.
    const det = t.m00 * t.m11 - t.m01 * t.m10 || 1;
    const dx = t.m11 / det, dy = -t.m10 / det;
    const angle = (Math.atan2(dy * h, dx * w) * 180) / Math.PI + 90;
    return { css: `linear-gradient(${angle.toFixed(2)}deg,${p.stops.map((s) => `${rgba(s.color, o)} ${(s.position * 100).toFixed(2)}%`).join(",")})` };
  }
  if (p.type === "IMAGE" && p.image?.hash) {
    const url = `url('${imageUrl(p.image.hash)}')`;
    const mode = p.imageScaleMode ?? "FILL";
    if (mode === "FIT") return { css: url, size: "contain", pos: "center", rep: "no-repeat", o };
    if (mode === "TILE") return { css: url, size: `${(p.scale ?? 1) * 100}%`, pos: "0 0", rep: "repeat", o };
    if (mode === "STRETCH" && p.transform) {
      const t = p.transform;
      const iw = w / t.m00, ih = h / t.m11;
      return { css: url, size: `${iw}px ${ih}px`, pos: `${(-t.m02 * iw).toFixed(2)}px ${(-t.m12 * ih).toFixed(2)}px`, rep: "no-repeat", o };
    }
    return { css: url, size: "cover", pos: "center", rep: "no-repeat", o };
  }
  return null;
}

function radius(n) {
  const c = [n.rectangleTopLeftCornerRadius, n.rectangleTopRightCornerRadius, n.rectangleBottomRightCornerRadius, n.rectangleBottomLeftCornerRadius];
  if (n.type === "ELLIPSE") return "50%";
  if (c.some((v) => v !== undefined)) return c.map((v) => `${v ?? n.cornerRadius ?? 0}px`).join(" ");
  return n.cornerRadius ? `${n.cornerRadius}px` : "";
}

function strokeCss(n) {
  const p = (n.strokePaints ?? []).find((s) => s.visible !== false && s.type === "SOLID");
  if (!p || !n.strokeWeight) return "";
  const col = rgba(p.color, p.opacity ?? 1);
  if (n.borderStrokeWeightsIndependent) {
    const s = [n.borderTopWeight, n.borderRightWeight, n.borderBottomWeight, n.borderLeftWeight];
    const shadows = [];
    if (s[0]) shadows.push(`inset 0 ${s[0]}px 0 ${col}`);
    if (s[1]) shadows.push(`inset -${s[1]}px 0 0 ${col}`);
    if (s[2]) shadows.push(`inset 0 -${s[2]}px 0 ${col}`);
    if (s[3]) shadows.push(`inset ${s[3]}px 0 0 ${col}`);
    return shadows.length ? `box-shadow:${shadows.join(",")};` : "";
  }
  const w = n.strokeWeight;
  if (n.strokeAlign === "OUTSIDE") return `box-shadow:0 0 0 ${w}px ${col};`;
  if (n.strokeAlign === "CENTER") return `box-shadow:inset 0 0 0 ${w / 2}px ${col},0 0 0 ${w / 2}px ${col};`;
  return `box-shadow:inset 0 0 0 ${w}px ${col};`;
}

function textRuns(n, from = 0, to = Infinity) {
  const chars = (n.textData?.characters ?? "").slice(0, to);
  const ids = n.textData?.characterStyleIDs ?? [];
  const table = new Map((n.textData?.styleOverrideTable ?? []).map((o) => [o.styleID, o]));
  const runs = [];
  for (let i = from; i < chars.length; i++) {
    const id = ids[i] ?? 0;
    const last = runs[runs.length - 1];
    if (last && last.id === id) last.text += chars[i];
    else runs.push({ id, text: chars[i] });
  }
  return runs.map((r) => {
    const o = table.get(r.id) ?? {};
    const f = o.fontName ?? n.fontName ?? {};
    const size = o.fontSize ?? n.fontSize;
    // A run's override lists only what it changes; an empty fill list there
    // means "the text's own colour", not "no colour".
    const fills = o.fillPaints?.length ? o.fillPaints : n.fillPaints ?? [];
    const fill = fills.find((p) => p.visible !== false && p.type === "SOLID");
    const ls = o.letterSpacing ?? n.letterSpacing;
    const deco = (o.textDecoration ?? n.textDecoration) === "UNDERLINE" ? "text-decoration:underline;" : (o.textDecoration ?? n.textDecoration) === "STRIKETHROUGH" ? "text-decoration:line-through;" : "";
    const css = [
      `font-family:${family(f.family)}`,
      `font-weight:${WEIGHT[(f.style ?? "Regular").replace(" Italic", "").replace("Italic", "Regular")] ?? 400}`,
      /Italic/.test(f.style ?? "") ? "font-style:italic" : "",
      `font-size:${size}px`,
      fill ? `color:${rgba(fill.color, fill.opacity ?? 1)}` : "",
      ls ? `letter-spacing:${ls.units === "PERCENT" ? `${ls.value / 100}em` : `${ls.value}px`}` : "",
    ].filter(Boolean).join(";");
    return `<span style="${css};${deco}">${esc(r.text).replace(/\n/g, "<br>")}</span>`;
  }).join("");
}

function draw(n) {
  if (n.visible === false) return "";
  const t = n.transform ?? { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 };
  const w = n.size?.x ?? 0, h = n.size?.y ?? 0;
  const rotated = Math.abs(t.m01) > 1e-6 || Math.abs(t.m10) > 1e-6 || t.m00 < 0 || t.m11 < 0;
  const place = rotated
    ? `left:0;top:0;transform-origin:0 0;transform:matrix(${t.m00},${t.m10},${t.m01},${t.m11},${t.m02},${t.m12});`
    : `left:${t.m02}px;top:${t.m12}px;`;
  const base = `position:absolute;${place}width:${w}px;height:${h}px;${n.opacity !== undefined && n.opacity < 1 ? `opacity:${n.opacity};` : ""}`;

  if (n.type === "VECTOR") {
    const geo = (n.strokeGeometry ?? []).length ? n.strokeGeometry : n.fillGeometry ?? [];
    const sp = (n.strokePaints ?? []).find((p) => p.visible !== false && p.type === "SOLID");
    const fp = (n.fillPaints ?? []).find((p) => p.visible !== false && p.type === "SOLID");
    const paint = (n.strokeGeometry ?? []).length ? sp : fp;
    if (!paint) return "";
    const paths = geo.filter((g) => g.commandsBlob !== undefined).map((g) => `<path d="${decodePath(g.commandsBlob)}" fill="${rgba(paint.color, paint.opacity ?? 1)}" fill-rule="${g.windingRule === "EVENODD" ? "evenodd" : "nonzero"}"/>`).join("");
    // A zero-high (or zero-wide) SVG is not drawn at all, overflow or not —
    // and a straight line is exactly that. One pixel, overflow visible.
    return `<svg style="${base.replace(/width:[^;]*;height:[^;]*;/, `width:${Math.max(w, 1)}px;height:${Math.max(h, 1)}px;`)}overflow:visible" width="${Math.max(w, 1)}" height="${Math.max(h, 1)}">${paths}</svg>`;
  }

  if (n.type === "TEXT") {
    const lines = n.derivedTextData?.baselines;
    // Figma's own layout, line by line: where each line sits, how tall it is,
    // which characters are on it. "100%" in this file means Auto — the font's
    // natural line height — which only this tells us exactly.
    if (lines?.length) {
      const align = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" }[n.textAlignHorizontal ?? "LEFT"];
      const tcase = { UPPER: "uppercase", LOWER: "lowercase", TITLE: "capitalize" }[n.textCase] ?? "none";
      const total = lines[lines.length - 1].lineY + lines[lines.length - 1].lineHeight;
      const offset = { TOP: 0, CENTER: (h - total) / 2, BOTTOM: h - total }[n.textAlignVertical ?? "TOP"] ?? 0;
      const rows = lines.map((l) =>
        `<div style="position:absolute;left:0;right:0;top:${l.lineY + offset}px;height:${l.lineHeight}px;line-height:${l.lineHeight}px;text-align:${align};text-transform:${tcase};white-space:pre;">${textRuns(n, l.firstCharacter, l.endCharacter)}</div>`
      ).join("");
      return `<div style="${base}">${rows}</div>`;
    }
    const lh = n.lineHeight;
    const lineHeight = !lh || lh.units === "RAW" ? (lh?.value ? lh.value : "normal") : lh.units === "PERCENT" ? `${(n.fontSize * lh.value) / 100}px` : `${lh.value}px`;
    const align = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" }[n.textAlignHorizontal ?? "LEFT"];
    const valign = { TOP: "flex-start", CENTER: "center", BOTTOM: "flex-end" }[n.textAlignVertical ?? "TOP"];
    const tcase = { UPPER: "uppercase", LOWER: "lowercase", TITLE: "capitalize" }[n.textCase] ?? "none";
    const wrap = n.textAutoResize === "WIDTH_AND_HEIGHT" ? "white-space:pre;" : "white-space:pre-wrap;";
    return `<div style="${base}display:flex;flex-direction:column;justify-content:${valign};"><div style="text-align:${align};line-height:${lineHeight};text-transform:${tcase};${wrap}">${textRuns(n)}</div></div>`;
  }

  const layers = (n.fillPaints ?? []).map((p) => background(p, w, h)).filter(Boolean).reverse();
  const bg = layers.length
    ? `background-image:${layers.map((l) => l.css).join(",")};background-size:${layers.map((l) => l.size ?? "auto").join(",")};background-position:${layers.map((l) => l.pos ?? "0 0").join(",")};background-repeat:${layers.map((l) => l.rep ?? "no-repeat").join(",")};`
    : "";
  const r = radius(n);
  const clip = (n.type === "FRAME" && n.frameMaskDisabled !== true) ? "overflow:hidden;" : "";
  const inner = (kids.get(key(n.guid)) ?? []).map(draw).join("");
  return `<div style="${base}${bg}${r ? `border-radius:${r};` : ""}${clip}${strokeCss(n)}">${inner}</div>`;
}

const W = Math.round(target.size.x), H = Math.round(target.size.y);
const body = draw({ ...target, transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 } });
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Khand:wght@300;400;500;600&family=Meddon&family=Poppins:wght@300;400;500;600&family=Acme&display=block" rel="stylesheet">
<style>html,body{margin:0;padding:0;background:#fff}body{width:${W}px;height:${H}px;position:relative;-webkit-font-smoothing:antialiased}</style>
</head><body>${body}</body></html>`;
if (htmlOut) writeFileSync(htmlOut, html);

// Photograph it.
const tmp = outPng.replace(/\.png$/, "") + ".render.html";
writeFileSync(tmp, html);
const t0 = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t0.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r));
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
try {
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send("Page.enable");
  await send("Page.navigate", { url: "file://" + tmp });
  await new Promise((r) => setTimeout(r, 2500));
  await send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 }, captureBeyondViewport: true });
  writeFileSync(outPng, Buffer.from(shot.result.data, "base64"));
  console.log(`${target.name}  ${W}x${H}  -> ${outPng}`);
} finally {
  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${t0.id}`);
}
