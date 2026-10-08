# Kite — from "KITE - Trümung - Ecommerce Clothing Store.fig"

The file in `~/Business/Figmaa`, rebuilt exactly at `/kite` (local only until
approved), in Loom's format: sections with schemas the live customizer edits,
pages as templates (`components/kite/templates.ts`), interface words as
settings. Platform wiring — the kit registry, real data, the customizer's page
list — comes after the design is approved.

## The file

One page, **Designs**, ten artboards. Desktop is drawn at **1728** (a 16"
MacBook), the phone at **440 × 956**:

| Artboard | Built as |
| --- | --- |
| Home — eight 1728×1117 screens | header, Cities, Limited collection, Curated, Newsletter, About, Upcoming, Journey, footer |
| Product Page | the product section (with "Style with" beside its column) |
| Account · Contact Information / Saved Items / Order History | the account section, three tabs |
| Mobile · Home, Newsletter, About | those three home sections on phones |
| Mobile · Product Page, Account | the product and the account (saved tab) on phones |

Decided 8 October: **only what is drawn is built**. Limited, Curated, Upcoming
and Journey are desktop only; the phone shows Cities, Newsletter and About.
**The texts stay as the file has them** — placeholders included, and the
Newsletter's shorter phone first line is its own setting.

## Reading and checking it

```
node scripts/figma/read-fig.mjs "<the .fig>" /tmp/kite.json
node scripts/figma/inspect.mjs /tmp/kite.json "^Product Page$" 8      # now shows HIDDEN and text case
node scripts/figma/render-fig.mjs /tmp/kite.json <images> "<artboard>" ref.png
node scripts/figma/diff.mjs <url> <width> ref.png out [--y Y] [--refy Y]
node scripts/figma/sweep-loom.mjs <url>
```

**render-fig.mjs** draws an artboard straight from the decoded tree — text
line by line where Figma laid it out (`derivedTextData`), images with the
file's fill/fit/crop, vectors from their geometry — and Chrome photographs
it. That is the reference: the Figma API's renders are rationed, and this
needs none. **diff.mjs** compares a built page with it pixel by pixel and
writes the build, a difference map and the pair.

Against the file, share of pixels differing (the rest is glyph edges of the
two stand-in fonts; every box, photo, crop and rule is within a pixel):

| | desktop | phone |
| --- | --- | --- |
| Header + Cities | 1.7% | 2.5% |
| Limited collection | 1.3% | — |
| Curated | 0.3% | — |
| Newsletter | 3.0% | 9.1% (mostly text) |
| About | 1.1% | 2.9% |
| Upcoming | 1.0% | — |
| Journey | 0.2% | — |
| Footer | 1.3% | — |
| Product | 1.1% | 2.1% |
| Account (three tabs) | 1.6–1.7% | 8.1% |

The sweep is clear at all twenty widths, 320 to 2560.

## Things easy to read wrongly

- **"100%" line height is Auto.** The boxes are each font's natural height
  (SF Pro 1.19, Hiragino 1.5, Khand 1.53, Meddon 2.11). `type.ts` writes
  Figma's own figures, read from the laid-out lines, never the stand-ins'.
- **Fonts** (decided 8 October): Inter for SF Pro, Shippori Mincho for
  Hiragino — Apple's cannot be served. Khand, Meddon, Poppins, Acme are the
  file's. Shippori runs ~3% wider: the huge backdrop word is SVG held to the
  file's width (`textLength`), and lines single in the file never wrap.
- **Positions inside a parent are the parent's.** The account greeting is at
  686 *within the portrait*, the phone Newsletter's row at 446 *on the screen*
  (339 into the section) — both built wrong first.
- **Hidden layers.** Every "Add to cart" carries a hidden bag image; only the
  arrow shows.
- **One photograph across two screens.** The Journey crop is drawn in screens
  10 and 11; built as one, the section 1247 high, the footer after it.
- **Pure black over the ground.** The curated collage is cut by two #000
  bands (0–150, 870 on) over the #040404 ground.
- **Every other width.** Under 768 the phone design, from 768 the desktop's,
  scaled by `--u`; the reading floor (80%, never under 11px) lengthens text on
  a small laptop, so sections holding long text keep it in the flow with the
  file's own space around it and grow rather than cut — a pixel short at the
  bottom so the minimum height holds the design's size exactly.

## Not drawn, built in Kite's own terms (decided 8 October, to replace when drawn)

- The phone menu: the ground and the desktop menu's links, SF Pro Light 16.
- A phone footer: the double rule, the links, the small print.
- The phone account's details and orders tabs: the desktop's, one column.
- A chosen size underlined; an open fold-out losing its plus's upright; a
  chosen view becoming the main photograph.
- The bag's count is the cart's (the file's "2" is a drawn glyph), desktop only.

## Still open

- **The phone product page has no price or sizes** — the file draws none
  there, so none are shown. Worth a phone design before shops use it.
- The footer sign-up has nothing behind it (as Loom's).
- The 44 photographs are the file's PNGs (57 MB); the ported theme serves them
  through the platform's image pipeline.
- Wiring: register Kite's kit, map real data (vendor, saved groups, address
  parts), add its pages to the customizer.
