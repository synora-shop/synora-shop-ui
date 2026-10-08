# Kite — from "KITE - Trümung - Ecommerce Clothing Store.fig"

The file in `~/Business/Figmaa`, rebuilt exactly, in Loom's format: sections
with schemas the live customizer edits, pages as templates
(`components/kite/templates.ts`), interface words as Site text.

**Approved and connected 9 October: Kite is this design.** It is a kit
(`lib/themes/kits.ts`) from 1.0.0 — every Kite copy draws it — and the
registry ships Kite 2.0.0 with the file's palette as its tokens. `/kite` and
its pages remain the reference build: the file's own data, nothing behind it,
what the diffs below are measured on. A shop wearing Kite draws the same
sections from its own data; the theme store's demo, `kite-demo`, sells the
file's pieces (`scripts/theme-store-catalogue.ts`, `docs/THEMES.md` §5b).

What a real shop gives Kite that the reference build fakes: the product's
maker (`Product.vendor`, "by Angel Vaccaro"), real sizes with sold-out ones
dimmed, the shop's prices and currency, the bag, the checkout's terms, the
signed-in customer's orders and addresses (their street, city and postcode),
and saved items from the shopper's own ADD TO FAVORITES.

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

## A shop's own photographs (decided 9 October)

The file shows a slice of many photographs (the Paris strip, 525x200, shows
the middle 30% of an upright portrait) — that is Figma's framing, and the
file's own photographs keep it exactly. A photograph a shop puts in their
place is shown **whole**, scaled to fit the same box on the ground colour
(`isFilePhoto` and `WHOLE` in components/kite/assets.ts: the file's live
under `/kite/`). The box — and so the page — stays where the design puts it.
The same holds for product photographs everywhere (cards, the product page,
the bag): the product page's crop belongs to the file's shoe, not to every
product's first photograph.

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

## Pages the file does not draw (asked for 8 October)

Collection `/kite/shop`, search `/kite/search`, bag `/kite/cart`, checkout
`/kite/checkout`, sign-in `/kite/sign-in`, order `/kite/order`, saved items
`/kite/wishlist` — every page a kit needs (lib/themes/kits.ts), built only
from parts the file draws (`components/kite/ui.tsx`): the account's serif
title, Khand capitals for headings, the account's field (label at 80%, a rule
under the value), the product page's bar button, half-ink rules, the home
page's piece card and "Nº001" numbering. They do what Loom's do, through the
same platform actions (lib/themes/kit-actions.ts) and the same Site text keys
(`components/kite/text.ts`, Loom's words except "bag").

Until 8 October every route of the reference build was `/kite`, so the bag,
account, search and every piece went back to the top of the home page. Each
now has its page; Lookbook and About (named by the file, never drawn) go to
the home page's Journey and About; a home link the file leaves empty goes to
the shop.

## Not drawn, built in Kite's own terms (decided 8 October, to replace when drawn)

- The phone menu: the ground and the desktop menu's links, SF Pro Light 16.
- A phone footer: the double rule, the links, the small print.
- The phone account's details and orders tabs: the desktop's, one column.
- A chosen size underlined; an open fold-out losing its plus's upright; a
  chosen view becoming the main photograph.
- The bag's count is the cart's (the file's "2" is a drawn glyph), desktop only.
- ADD TO BAG says "Choose a size." / "Added to your bag. View bag"; ADD TO
  FAVORITES keeps the piece in Saved items (pressed again, lets go).
- The account's EDIT says details are changed by asking the shop (the
  platform's rule); CHANGE opens the address as a form and saves it; REMOVE
  deletes it. RATE goes to the order — the platform has no reviews.

## Still open

- **The phone product page has no price or sizes** — the file draws none
  there, so none are shown. Worth a phone design before shops use it.
- The footer's EMAIL / GET EXCLUSIVE DEALS is not shown (decided 9 October):
  the platform keeps no subscriber list. It returns with the list.
- **The 44 photographs are the file's PNGs, 57 MB, served as they are** —
  not through an image pipeline. The home page alone is tens of megabytes on a
  first visit. Loom's are the same (55 MB). Worth converting before either carries traffic
  (`docs/QUEUE.md`).
- **The wordmark is the file's ("Trümung")** until a merchant types their own
  in the header's settings — Loom does the same with "ECOMMERCE".
- `check:kite` holds every setting to reaching the page (`docs/CHECKS.md`).
