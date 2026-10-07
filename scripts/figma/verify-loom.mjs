// Measure every section of /loom against the numbers read out of the .fig.
//
//   node scripts/figma/verify-loom.mjs [url]            both screens
//   node scripts/figma/verify-loom.mjs [url] desktop    the 1440 one only
//   node scripts/figma/verify-loom.mjs [url] phone      the 375 one only
//
// The verify half of the loop, as a fixed list rather than a selector map:
// the expectations below are transcribed from the file, so a drift of a
// single pixel is a failure with a name rather than something to spot in a
// screenshot. Needs Chrome on 9222.
//
// Everything is measured relative to the page root, not the viewport, so the
// numbers are comparable to Figma's own y-offsets down the 4694px frame.
const url = process.argv[2] ?? "http://localhost:3000/loom";
const only = process.argv[3];

// label, CSS selector, expected { w,h } and optional { x,y } page-relative.
const DESKTOP = [
  ["page",              "main",                                  { w: 1440, h: 4694 }],
  ["navbar",            "main > div:nth-of-type(1)",             { w: 1440, h: 64,   y: 0 }],
  ["navigation",        "main > div:nth-of-type(2)",             { w: 1440, h: 80,   y: 64 }],
  ["hero",              "main > section:nth-of-type(1)",         { w: 1440, h: 1192, y: 144 }],
  ["hero band 1",       "[data-m='hero-band-1']",                { w: 1440, h: 770,  y: 144 }],
  ["hero big card",     "[data-m='hero-card']",                  { w: 958,  h: 770,  x: 60, y: 144 }],
  ["hero title block",  "[data-m='hero-title']",                 { w: 328,  h: 375,  x: 120, y: 204 }],
  ["hero headline",     "[data-m='hero-headline']",              { w: 328,  h: 225 }],
  ["hero cta",          "[data-m='hero-cta']",                   { w: 280,  h: 50 }],
  ["hero photo col",    "[data-m='hero-photos']",                { w: 352,  h: 770,  x: 1028, y: 144 }],
  ["hero band 2",       "[data-m='hero-band-2']",                { w: 1440, h: 380,  y: 924 }],
  ["hero copy col",     "[data-m='hero-copy']",                  { w: 411,  h: 380,  x: 0, y: 924 }],
  ["hero wide card 1",  "[data-m='hero-wide-1']",                { w: 479,  h: 380,  x: 411, y: 924 }],
  ["hero wide card 2",  "[data-m='hero-wide-2']",                { w: 480,  h: 380,  x: 900, y: 924 }],
  ["trending",          "main > section:nth-of-type(2)",         { w: 1440, h: 1058, y: 1336 }],
  ["trending inner",    "[data-m='trending-inner']",             { w: 1320, h: 1058, x: 60 }],
  ["trending header",   "[data-m='trending-header']",            { w: 1320, h: 50 }],
  ["trending grid",     "[data-m='trending-grid']",              { w: 1320, h: 920 }],
  ["product card 1",    "[data-m='trending-grid'] > *:nth-child(1)", { w: 322, h: 450 }],
  ["product card 3",    "[data-m='trending-grid'] > *:nth-child(3)", { w: 654, h: 450 }],
  ["product card 4",    "[data-m='trending-grid'] > *:nth-child(4)", { w: 654, h: 450, x: 60 }],
  ["explore",           "main > section:nth-of-type(3)",         { w: 1440, h: 210,  y: 2394 }],
  ["explore title",     "[data-m='explore-title']",              { w: 256,  h: 130 }],
  ["explore chips",     "[data-m='explore-chips']",              { w: 841,  h: 124 }],
  ["testimonial",       "main > section:nth-of-type(4)",         { w: 1440, h: 636,  y: 2604 }],
  ["testimonial card",  "[data-m='testimonial-card']",           { w: 1320, h: 556,  x: 60, y: 2644 }],
  ["service",           "main > section:nth-of-type(5)",         { w: 1440, h: 558,  y: 3240 }],
  ["service heading",   "[data-m='service-heading']",            { w: 558,  h: 130 }],
  ["service row",       "[data-m='service-row']",                { w: 1320, h: 292 }],
  ["service column",    "[data-m='service-row'] > *:nth-child(1)", { w: 410, h: 292 }],
  ["blog",              "main > section:nth-of-type(6)",         { w: 1440, h: 555,  y: 3798 }],
  ["blog image",        "[data-m='blog-image']",                 { w: 654,  h: 367 }],
  ["blog copy",         "[data-m='blog-copy']",                  { w: 606,  h: 367 }],
  ["blog headline",     "[data-m='blog-headline']",              { w: 606,  h: 195 }],
  ["footer",            "main > footer",                         { w: 1440, h: 341,  y: 4353 }],
];

// label, selector, expected type: size/lineHeight/weight/letterSpacing.
const DESKTOP_TYPE = [
  ["navbar link",      "[data-m='navbar-links'] a",     { size: 13, line: 16, weight: 500, ls: 0 }],
  ["nav wordmark",     "[data-m='nav-wordmark']",       { size: 24, line: 30, weight: 800, ls: 0 }],
  ["nav category",     "[data-m='nav-categories'] a",   { size: 14, line: 16, weight: 600, ls: 0 }],
  ["hero headline",    "[data-m='hero-headline']",      { size: 90, line: 75, weight: 400, ls: -5 }],
  ["hero body",        "[data-m='hero-body']",          { size: 18, line: 26, weight: 400, ls: -0.3 }],
  ["hero cta",         "[data-m='hero-cta']",           { size: 14, line: 24, weight: 500, ls: 1 }],
  ["hero caption",     "[data-m='hero-caption']",       { size: 40, line: 40, weight: 400, ls: -3 }],
  ["band 2 headline",  "[data-m='hero-sub-headline']",  { size: 65, line: 65, weight: 400, ls: -4 }],
  ["section title",    "[data-m='trending-title']",     { size: 30, line: 38, weight: 400, ls: -1 }],
  ["product name",     "[data-m='product-name']",       { size: 24, line: 32, weight: 500, ls: -1 }],
  ["product price",    "[data-m='product-price']",      { size: 20, line: 28, weight: 400, ls: -1 }],
  ["explore title",    "[data-m='explore-title']",      { size: 60, line: 65, weight: 400, ls: -3 }],
  // 16 and +1, from the chip component itself — the instances override only
  // their text. This read 14 and 0 until the master was checked.
  ["swatch label",     "[data-m='explore-chips'] span + span", { size: 16, line: 24, weight: 600, ls: 1 }],
  ["quote",            "[data-m='quote']",              { size: 65, line: 65, weight: 400, ls: -4 }],
  ["quote name",       "[data-m='quote-name']",         { size: 24, line: 32, weight: 600, ls: -0.5 }],
  ["service heading",  "[data-m='service-heading']",    { size: 60, line: 65, weight: 400, ls: -3 }],
  ["service title",    "[data-m='service-title']",      { size: 30, line: 40, weight: 500, ls: -1 }],
  ["blog headline",    "[data-m='blog-headline']",      { size: 60, line: 65, weight: 400, ls: -3 }],
  ["footer label",     "[data-m='footer-label']",       { size: 11, line: 16, weight: 600, ls: 1 }],
  ["footer link",      "[data-m='footer-link']",        { size: 13, line: 16, weight: 500, ls: 0 }],
];

// The 375 screen — the frame called "Responsive" on the page, 6322 tall.
const PHONE = [
  ["page",              "main",                                  { w: 375, h: 6322 }],
  ["navigation",        "main > div:nth-of-type(2)",             { w: 375, h: 94,   y: 0 }],
  ["hero",              "main > section:nth-of-type(1)",         { w: 375, h: 1253, y: 94 }],
  ["hero band 1",       "[data-m='hero-band-1']",                { w: 375, h: 893,  y: 94 }],
  ["hero big card",     "[data-m='hero-card']",                  { w: 343, h: 656,  x: 16, y: 94 }],
  ["hero title block",  "[data-m='hero-title']",                 { w: 279, h: 322,  x: 40, y: 118 }],
  ["hero headline",     "[data-m='hero-headline']",              { w: 252, h: 168 }],
  ["hero cta",          "[data-m='hero-cta']",                   { w: 279, h: 50 }],
  ["hero category",     "[data-m='hero-photos'] > *:nth-child(1)", { w: 211, h: 189, x: 16, y: 758 }],
  ["hero category 2",   "[data-m='hero-photos'] > *:nth-child(2)", { w: 211, h: 189, x: 235, y: 758 }],
  ["hero band 2",       "[data-m='hero-band-2']",                { w: 375, h: 360,  y: 987 }],
  ["hero copy col",     "[data-m='hero-copy']",                  { w: 343, h: 360,  x: 16, y: 987 }],
  ["trending",          "main > section:nth-of-type(2)",         { w: 375, h: 1255, y: 1347 }],
  ["trending header",   "[data-m='trending-header']",            { w: 343, h: 136,  x: 16, y: 1387 }],
  ["trending chip 1",   "[data-m='trending-chips'] > *:nth-child(1)", { w: 104, h: 50, x: 16 }],
  ["trending grid",     "[data-m='trending-grid']",              { w: 343, h: 1039, x: 16, y: 1523 }],
  ["product card 1",    "[data-m='trending-grid'] > *:nth-child(1)", { w: 167.5, h: 231.5 }],
  ["product card 3",    "[data-m='trending-grid'] > *:nth-child(3)", { w: 343, h: 264 }],
  ["product card 6",    "[data-m='trending-grid'] > *:nth-child(6)", { w: 343, h: 264, y: 2298 }],
  ["explore",           "main > section:nth-of-type(3)",         { w: 375, h: 416,  y: 2602 }],
  ["explore title",     "[data-m='explore-title']",              { w: 343, h: 48,   y: 2642 }],
  ["explore chips",     "[data-m='explore-chips']",              { w: 343, h: 264,  y: 2714 }],
  ["testimonial",       "main > section:nth-of-type(4)",         { w: 375, h: 704,  y: 3018 }],
  ["testimonial card",  "[data-m='testimonial-card']",           { w: 343, h: 624,  x: 16, y: 3058 }],
  ["quote",             "[data-m='quote']",                      { w: 263, h: 144,  x: 48, y: 3126 }],
  ["quote name",        "[data-m='quote-name']",                 { w: 262, h: 32,   y: 3580 }], // 3058 card + 252 + 206 + the 64 portrait
  ["service",           "main > section:nth-of-type(5)",         { w: 375, h: 1020, y: 3722 }],
  ["service heading",   "[data-m='service-heading']",            { w: 343, h: 96 }],
  ["service row",       "[data-m='service-row']",                { w: 343, h: 820,  y: 3882 }],
  ["service column",    "[data-m='service-row'] > *:nth-child(1)", { w: 343, h: 252 }],
  ["blog",              "main > section:nth-of-type(6)",         { w: 375, h: 742,  y: 4742 }],
  ["blog image",        "[data-m='blog-image']",                 { w: 343, h: 232,  x: 16, y: 4850 }],
  ["blog copy",         "[data-m='blog-copy']",                  { w: 343, h: 342,  y: 5102 }],
  ["blog headline",     "[data-m='blog-headline']",              { w: 343, h: 144 }],
  ["footer",            "main > footer",                         { w: 375, h: 838,  y: 5484 }],
];

const PHONE_TYPE = [
  ["nav wordmark",     "[data-m='nav-wordmark']",       { size: 24, line: 30, weight: 800, ls: 0 }],
  ["hero headline",    "[data-m='hero-headline']",      { size: 56, line: 56, weight: 400, ls: -5 }],
  ["hero body",        "[data-m='hero-body']",          { size: 16, line: 26, weight: 400, ls: -0.3 }],
  ["hero cta",         "[data-m='hero-cta']",           { size: 14, line: 24, weight: 500, ls: 1 }],
  ["hero category",    "[data-m='hero-category']",      { size: 32, line: 32, weight: 400, ls: -3 }],
  ["band 2 headline",  "[data-m='hero-sub-headline']",  { size: 65, line: 65, weight: 400, ls: -4 }],
  ["section title",    "[data-m='trending-title']",     { size: 30, line: 38, weight: 400, ls: -1 }],
  ["product name",     "[data-m='product-name']",       { size: 18, line: 32, weight: 500, ls: -1 }],
  ["product price",    "[data-m='product-price']",      { size: 16, line: 28, weight: 400, ls: -1 }],
  ["explore title",    "[data-m='explore-title']",      { size: 40, line: 48, weight: 400, ls: -3 }],
  ["swatch label",     "[data-m='explore-chips'] span + span", { size: 14, line: 24, weight: 600, ls: 1 }],
  ["quote",            "[data-m='quote']",              { size: 40, line: 48, weight: 400, ls: -3 }],
  ["quote name",       "[data-m='quote-name']",         { size: 16, line: 32, weight: 600, ls: -0.5 }],
  ["service heading",  "[data-m='service-heading']",    { size: 40, line: 48, weight: 400, ls: -3 }],
  ["service title",    "[data-m='service-title']",      { size: 24, line: 40, weight: 500, ls: -1 }],
  ["blog headline",    "[data-m='blog-headline']",      { size: 40, line: 48, weight: 400, ls: -3 }],
  ["footer label",     "[data-m='footer-label']",       { size: 11, line: 16, weight: 600, ls: 1 }],
  ["footer link",      "[data-m='footer-link']",        { size: 13, line: 16, weight: 500, ls: 0 }],
];

const SCREENS = [
  // 1600 wide so the 1440 page is never the constraint.
  { name: "desktop", width: 1600, mobile: false, geometry: DESKTOP, type: DESKTOP_TYPE },
  { name: "phone", width: 375, mobile: true, geometry: PHONE, type: PHONE_TYPE },
].filter((s) => !only || s.name === only);

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

let fails = 0;
const TOL = 0.75; // sub-pixel: a page at a browser's own rounding
function check(rows, expectations, keys) {
  for (const row of rows) {
    const want = expectations.find(([l]) => l === row.label)?.[2] ?? {};
    if (row.missing) { console.log(`MISSING  ${row.label}`); fails++; continue; }
    const bad = keys.filter((k) => want[k] !== undefined && Math.abs(row[k] - want[k]) > TOL);
    const shown = keys.filter((k) => want[k] !== undefined).map((k) => `${k} ${row[k]}${bad.includes(k) ? ` (want ${want[k]})` : ""}`);
    console.log(`${bad.length ? "FAIL    " : "ok      "} ${row.label.padEnd(20)} ${shown.join("  ")}`);
    if (bad.length) fails++;
  }
}

for (const screen of SCREENS) {
  // Tall enough that nothing lazy-loads out of measurement.
  await send("Emulation.setDeviceMetricsOverride", { width: screen.width, height: 1200, deviceScaleFactor: 1, mobile: screen.mobile });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 4500));
  await ev("document.fonts.ready.then(() => 1)");

  const measured = JSON.parse(
    await ev(`JSON.stringify(${JSON.stringify(screen.geometry)}.map(([label, sel]) => {
      const el = document.querySelector(sel);
      if (!el) return { label, missing: true };
      const r = el.getBoundingClientRect();
      const root = document.querySelector("main").getBoundingClientRect();
      return { label, w: +r.width.toFixed(2), h: +r.height.toFixed(2),
               x: +(r.left - root.left).toFixed(2), y: +(r.top - root.top).toFixed(2) };
    }))`)
  );

  const typed = JSON.parse(
    await ev(`JSON.stringify(${JSON.stringify(screen.type)}.map(([label, sel]) => {
      const el = document.querySelector(sel);
      if (!el) return { label, missing: true };
      const s = getComputedStyle(el);
      return { label, size: parseFloat(s.fontSize), line: parseFloat(s.lineHeight),
               weight: +s.fontWeight, ls: s.letterSpacing === "normal" ? 0 : parseFloat(s.letterSpacing),
               family: s.fontFamily.split(",")[0].replace(/['"]/g, "") };
    }))`)
  );

  // Nothing may push the page sideways at its own width — the swipe rows
  // scroll inside themselves, which is the only overflow the phone allows.
  const overflow = await ev("document.documentElement.scrollWidth - document.documentElement.clientWidth");

  console.log(`\n══ ${screen.name} (${screen.width}) ══`);
  console.log("— geometry ——————————————————————————————");
  check(measured, screen.geometry, ["w", "h", "x", "y"]);
  console.log("— type ——————————————————————————————————");
  check(typed, screen.type, ["size", "line", "weight", "ls"]);
  const wrongFace = typed.filter((r) => !r.missing && !/inter/i.test(r.family));
  if (wrongFace.length) { console.log("\nnot Inter:", wrongFace.map((r) => `${r.label}=${r.family}`).join(", ")); fails++; }
  if (overflow > 0) { console.log(`FAIL     page scrolls sideways by ${overflow}px`); fails++; }
}
ws.close();
console.log(`\n${fails === 0 ? "all clear" : `${fails} failing`}`);
process.exit(fails === 0 ? 0 : 1);
