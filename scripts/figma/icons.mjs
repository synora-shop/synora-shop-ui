// Pull real icon geometry out of a decoded .fig and write SVG files.
//
//   node scripts/figma/icons.mjs <tree.json> <out-dir> "<name regex>" [more names...]
//
// Why this exists: the kit's icons are vectors, and a hand-drawn stand-in is
// always wrong — the chevron is 12.02 wide with a 1.414 stroke cap, and no
// amount of eyeballing lucide reproduces that. The paths are in the file; they
// are just behind one more layer of encoding than the rest of the tree.
//
// The encoding, recovered by parsing all 334 geometry blobs until nothing
// failed: a byte-oriented command stream, opcode then little-endian float32
// pairs.
//
//   0x01 x y                      moveTo        0x02 x y          lineTo
//   0x04 c1x c1y c2x c2y x y      cubicTo       0x00              end of subpath
//
// Coordinates are already in the node's own size space — checked against every
// icon in the file, where the raw path bounds come out equal to `size` even
// when `vectorData.normalizedSize` says otherwise (the arrow is 33.33x25 with
// a normalizedSize of 16x12, and its path really does reach 33.33). So no
// scaling: `normalizedSize` is the size the icon was drawn at, not the space
// the stored coordinates are in.
//
// Two things to filter, or the output is a solid square. Every FRAME and
// INSTANCE carries its own bounding-box geometry, which is only ever drawn if
// the node has a fill — so geometry from an unpainted node is dropped. And a
// glyph lives in the SYMBOL, not in its instances: the 48px Service icons are
// instances whose only geometry is that square, so the search takes the
// first *matching node that actually yields a painted path* rather than the
// widest one.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const [treePath, outDir, ...names] = process.argv.slice(2);
const doc = JSON.parse(readFileSync(treePath, "utf8"));
const nodes = doc.nodeChanges;
const key = (g) => g && `${g.sessionID}:${g.localID}`;
// Figma orders siblings by a fractional-index string, compared byte by byte.
// localeCompare is not that: it folds case and ignores some punctuation, so it
// shuffles children — the 375 Trending grid listed its rows out of order.
const cmpPos = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const kids = new Map();
for (const n of nodes) {
  const p = key(n.parentIndex?.guid);
  if (!p) continue;
  if (!kids.has(p)) kids.set(p, []);
  kids.get(p).push(n);
}
for (const [, l] of kids) {
  l.sort((a, b) => cmpPos(a.parentIndex?.position ?? "", b.parentIndex?.position ?? ""));
}

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
    for (let k = 0; k < n; k++) {
      const v = b.readFloatLE(i);
      i += 4;
      nums.push(+v.toFixed(3));
    }
    out.push(LETTER[op] + nums.join(" "));
  }
  return out.join("").replace(/Z$/, "Z");
}

const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");

/** Compose a node's transform with its parent's accumulated one. */
function mul(a, b) {
  return {
    m00: a.m00 * b.m00 + a.m01 * b.m10, m01: a.m00 * b.m01 + a.m01 * b.m11, m02: a.m00 * b.m02 + a.m01 * b.m12 + a.m02,
    m10: a.m10 * b.m00 + a.m11 * b.m10, m11: a.m10 * b.m01 + a.m11 * b.m11, m12: a.m10 * b.m02 + a.m11 * b.m12 + a.m12,
  };
}
const IDENT = { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 };
const xf = (n) => ({ m00: n.transform?.m00 ?? 1, m01: n.transform?.m01 ?? 0, m02: n.transform?.m02 ?? 0,
                     m10: n.transform?.m10 ?? 0, m11: n.transform?.m11 ?? 1, m12: n.transform?.m12 ?? 0 });

function collect(node, acc, into) {
  const m = mul(acc, xf(node));
  const geo = (node.fillGeometry ?? []).length ? node.fillGeometry : (node.strokeGeometry ?? []);
  const paint = (node.fillPaints ?? []).find((p) => p.visible !== false && p.type === "SOLID")
    ?? (node.strokePaints ?? []).find((p) => p.visible !== false && p.type === "SOLID");
  if (geo.length && node.visible !== false && paint) {
    for (const g of geo) {
      if (g.commandsBlob === undefined) continue;
      into.push({
        d: decodePath(g.commandsBlob),
        m,
        fill: hex(paint.color),
        rule: g.windingRule === "EVENODD" ? "evenodd" : "nonzero",
      });
    }
  }
  for (const c of kids.get(key(node.guid)) ?? []) collect(c, m, into);
}

mkdirSync(outDir, { recursive: true });
for (const name of names) {
  const re = new RegExp(name, "i");
  // Widest first — the same icon exists at 24px in the live page and at
  // 11.85px inside the 49.38% cover copy — but only nodes that actually
  // produce a path count, which skips the instances that hold no geometry.
  const candidates = nodes.filter((n) => re.test(n.name ?? "")).sort((a, b) => (b.size?.x ?? 0) - (a.size?.x ?? 0));
  let found = null;
  let paths = [];
  for (const c of candidates) {
    const got = [];
    collect(c, IDENT, got);
    if (got.some((p) => p.d)) { found = c; paths = got; break; }
  }
  if (!found) { console.error(`no painted geometry for ${name}`); continue; }
  // The matched node's own transform places it in its parent — drop it, so
  // the icon sits at the origin of its own viewBox.
  const inv = xf(found);
  const w = +(found.size?.x ?? 24).toFixed(3);
  const h = +(found.size?.y ?? 24).toFixed(3);
  const body = paths
    .filter((p) => p.d)
    .map((p) => {
      const m = [p.m.m00, p.m.m10, p.m.m01, p.m.m11, p.m.m02 - inv.m02, p.m.m12 - inv.m12].map((v) => +v.toFixed(4));
      const t = m.slice(0, 4).join() === "1,0,0,1" ? `translate(${m[4]} ${m[5]})` : `matrix(${m.join(" ")})`;
      // currentColor, not the stored hex: these are single-colour glyphs and
      // the kit uses the same one at #2e3a59 in the header and #ffffff on a
      // dark card. The call site owns the colour.
      return `  <path transform="${t}" d="${p.d}" fill="currentColor" fill-rule="${p.rule}"/>`;
    })
    .join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${body}\n</svg>\n`;
  const file = join(outDir, found.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() + ".svg");
  writeFileSync(file, svg);
  console.log(`${found.name}  ${w}x${h}  ${paths.length} path(s) -> ${file}`);
}
