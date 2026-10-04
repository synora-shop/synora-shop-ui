// Read one frame out of a decoded .fig, exactly.
//
//   node scripts/figma/inspect.mjs <tree.json> "<frame name>" [depth]
//
// The loop this is built for: inspect a section, implement it, screenshot,
// compare, inspect again. Reading the whole page once and building from
// memory is how padding drifts by two pixels in six places — so this is made
// cheap enough to run before every component rather than once at the start.
//
// Prints what actually decides a layout: box, auto-layout, padding, gap,
// radius per corner, fills, strokes, and for text the family, weight, size,
// line height and tracking.
import { readFileSync } from "fs";

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(name);
  if (i < 0) return null;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
}
const under = flag("--under");
const pick = flag("--pick");
const rest = argv;
const [treePath, wanted, depthArg] = rest;
const MAX = Number(depthArg ?? 3);
const doc = JSON.parse(readFileSync(treePath, "utf8"));
const nodes = doc.nodeChanges;

const key = (g) => g && `${g.sessionID}:${g.localID}`;
const kids = new Map();
for (const n of nodes) {
  const p = key(n.parentIndex?.guid);
  if (!p) continue;
  if (!kids.has(p)) kids.set(p, []);
  kids.get(p).push(n);
}
for (const [, l] of kids) {
  l.sort((a, b) => String(a.parentIndex?.position ?? "").localeCompare(String(b.parentIndex?.position ?? "")));
}

const hex = (c) =>
  "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("") +
  (c.a !== undefined && c.a < 1 ? ` @${Math.round(c.a * 100)}%` : "");

const round = (v) => (v === undefined || v === null ? null : Math.round(v * 100) / 100);

function paint(p) {
  if (!p || p.visible === false) return null;
  if (p.type === "SOLID") return hex(p.color) + (p.opacity !== undefined && p.opacity < 1 ? ` o:${p.opacity}` : "");
  if (p.type === "IMAGE") return `IMAGE ${p.image?.hash?.slice(0, 8) ?? ""} ${p.imageScaleMode ?? ""}`;
  if (String(p.type).includes("GRADIENT")) return `${p.type} ${(p.stops ?? []).map((s) => hex(s.color)).join(" -> ")}`;
  return p.type;
}

function corners(n) {
  const c = [n.rectangleTopLeftCornerRadius, n.rectangleTopRightCornerRadius,
             n.rectangleBottomRightCornerRadius, n.rectangleBottomLeftCornerRadius];
  if (c.every((v) => v === undefined)) return n.cornerRadius ? `r:${n.cornerRadius}` : "";
  const vals = c.map((v) => round(v ?? n.cornerRadius ?? 0));
  return vals.every((v) => v === vals[0]) ? (vals[0] ? `r:${vals[0]}` : "") : `r:${vals.join("/")}`;
}

function describe(n) {
  const bits = [];
  if (n.size) bits.push(`${round(n.size.x)}x${round(n.size.y)}`);
  // transform is the node's own matrix; m02/m12 are its offset in the parent.
  const t = n.transform;
  if (t && (t.m02 || t.m12)) bits.push(`@${round(t.m02)},${round(t.m12)}`);
  if (n.stackMode && n.stackMode !== "NONE") {
    bits.push(n.stackMode === "VERTICAL" ? "col" : "row");
    if (n.stackSpacing) bits.push(`gap:${round(n.stackSpacing)}`);
    const pad = [n.stackVerticalPadding, n.stackHorizontalPadding, n.stackPaddingBottom, n.stackPaddingRight]
      .map((v) => round(v ?? 0));
    if (pad.some(Boolean)) bits.push(`pad:${pad.join("/")}`);
    if (n.stackPrimaryAlignItems) bits.push(`main:${n.stackPrimaryAlignItems}`);
    if (n.stackCounterAlignItems) bits.push(`cross:${n.stackCounterAlignItems}`);
  }
  const c = corners(n);
  if (c) bits.push(c);
  const fills = (n.fillPaints ?? []).map(paint).filter(Boolean);
  if (fills.length) bits.push(`fill:${fills.join(",")}`);
  const strokes = (n.strokePaints ?? []).map(paint).filter(Boolean);
  if (strokes.length) bits.push(`stroke:${strokes.join(",")} ${round(n.strokeWeight)}px ${n.strokeAlign ?? ""}`);
  if (n.opacity !== undefined && n.opacity < 1) bits.push(`opacity:${n.opacity}`);
  if (n.type === "TEXT") {
    const f = n.fontName ?? {};
    bits.push(`"${(n.textData?.characters ?? "").replace(/\n/g, "⏎").slice(0, 46)}"`);
    bits.push(`${f.family ?? "?"} ${f.style ?? ""} ${n.fontSize}/${round(n.lineHeight?.value)} ls:${round(n.letterSpacing?.value ?? 0)}`);
    if (n.textAlignHorizontal) bits.push(n.textAlignHorizontal);
  }
  return bits.join("  ");
}

const byId = new Map(nodes.map((n) => [key(n.guid), n]));

/** Names from the node up to the document root, nearest first. */
function ancestry(n) {
  const out = [];
  let cur = byId.get(key(n.parentIndex?.guid));
  while (cur) {
    out.push(cur.name ?? "");
    cur = byId.get(key(cur.parentIndex?.guid));
  }
  return out;
}

// Names repeat across pages — the Cover carries a copy of the whole home page
// at 49.38%, so "Navbar" alone finds a 185px-wide node that looks like the
// real one and is not. `--under` is how the loop names which it means.
let matches = nodes.filter((n) => (n.name ?? "") === wanted);
if (matches.length === 0) matches = nodes.filter((n) => new RegExp(wanted, "i").test(n.name ?? ""));
if (under) matches = matches.filter((n) => ancestry(n).some((a) => new RegExp(under, "i").test(a)));

if (matches.length === 0) {
  console.error(`no node matching "${wanted}"${under ? ` under "${under}"` : ""}.`);
  process.exit(1);
}
if (matches.length > 1 && !pick) {
  console.error(`"${wanted}" is ambiguous — ${matches.length} matches. Narrow with --under, or --pick N:`);
  matches.forEach((m, i) => {
    console.error(`  ${i + 1}. ${Math.round(m.size?.x ?? 0)}x${Math.round(m.size?.y ?? 0)}  under ${ancestry(m).slice(0, 3).join(" < ")}`);
  });
  process.exit(1);
}
const target = matches.length > 1 ? matches[Number(pick) - 1] : matches[0];
if (!target) { console.error(`--pick ${pick} is out of range (${matches.length} matches)`); process.exit(1); }

(function walk(n, d) {
  console.log("  ".repeat(d) + `${n.name ?? "(unnamed)"} [${n.type}]  ${describe(n)}`);
  if (d >= MAX) return;
  for (const c of kids.get(key(n.guid)) ?? []) walk(c, d + 1);
})(target, 0);
