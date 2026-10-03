# Loom — the design, measured

Everything needed to build the Loom theme, recovered from the Paperpillar
"LOOM E-commerce Website UI Kit" on Figma Community
(`csV3m62TcCVG4e96uLho9i`) and written down here so it survives.

It is written down because the extraction is the expensive half and it is not
repeatable on demand: Figma's Starter plan allows **20 MCP tool calls a
month**, and reading these values used most of one month's allowance. Nothing
below needs Figma again.

---

## 1. What the kit actually contains

The cover states it: **"2 screens · Component set · Design style guide."**

| | |
| --- | --- |
| **Full size, real components** | Footer (1440×341 web, 375×838 mobile) · Button (12 colour variants) · Icons (Love/Call/Refund × web/mobile × fill/outline) · Search bar (3 states) · Title & CTA cards |
| **The two screens** | Home, desktop and mobile — but **only inside the cover artwork, at 49.38% scale** |
| **Design tokens** | None. `get_variable_defs` returns `{}`; the "style guide" is not machine-readable |
| **Absent entirely** | Product page · collection page · cart · checkout · account. The header exists only as cover art |

So the kit is a **visual language plus one screen**, not a theme. Collection,
product, cart, checkout and account have to be designed in this language
rather than copied from it.

### The scale factor is exact

The two screens sit inside the cover frame at **49.38%** (desktop 711px for
1440, mobile 185px for 375). Multiply any measured value by **2.0251** to
recover the real one. Verified against the full-size components, which land on
round numbers:

| Measured | × 2.0251 | Confirmed by |
| --- | --- | --- |
| `24.69px` | **50px** | the Button component is exactly 50px tall |
| `29.628px` | **60px** | the Footer's padding is exactly 60px |
| `0.494px` | **1px** | — |
| `6.91px` / `-0.4938` | **14px / −1px** | Button text is 14px with 1px tracking |

---

## 2. Colour

| Token | Value | Where |
| --- | --- | --- |
| `ink` | `#121212` | Text, footer ground, filled buttons. Never pure black |
| `surface` | `#FFFFFF` | Page, cards |
| `border` | `#DDDDDD` | Button outlines, filter chips |
| `border-soft` | `#E3E3E3` | The search field only |
| `text-muted` | `#737B8B` | Search placeholder |
| `shade-700` | `#2E3A59` | The kit's one named style, on the header icons |
| `love-active` | `#F15353` | **Only** a favourited heart |

Two greys for borders is the kit's own inconsistency, recorded as found rather
than reconciled — deciding they are the same colour is a design decision, not
a transcription.

**Muting is opacity, not a second colour.** 52% on dark (footer links), 80% on
light (nav links, prices, hero body). There is no grey text token.

**The hero's green is a photograph.** There is no sage-coloured fill anywhere
in the kit — the hero is an image with white text over it.

---

## 3. Type

Inter throughout. Two tracking directions, and this is the detail most likely
to be lost: **negative on display text, positive on uppercase UI text.** That
single contrast carries most of the design.

| Style | Face | Size / line | Tracking |
| --- | --- | --- | --- |
| Display | Regular | 90 / 75 | **−5** |
| Wordmark | Extra Bold | 24 / 30 | 0 |
| Section title | Regular | 30 / 38 | −1 |
| Product name | Medium | 24 / 32 | −1 |
| Price | Regular | 20 / 28 | −1, 80% opacity |
| Body | Regular | 18 / 26 | −0.3 |
| Body small | Regular | 14 / 22 | 0 |
| Nav link | Semi Bold | 14 / 16 | 0, 80% opacity |
| Button | Medium | 14 / 24 | **+1**, uppercase |
| Footer link | Medium | 13 / 16 | 0, 52% opacity |
| Column label | Semi Bold | 11 / 16 | **+1**, uppercase |

A 90px display face at Regular weight with −5px tracking is the signature.
Setting it at Medium or at normal tracking is the difference between this
design and a generic one.

---

## 4. Shape and measure

- **Everything interactive is a pill.** `border-radius: 200px` on buttons,
  inputs and filter chips alike. The favourite button is a 40px circle.
- Page **1440**, content **1320**, side padding **60**.
- Spacing steps on a 10: 10 · 20 · 24 · 28 · 32 · 40 · 60.
- Button 280×50. Search field 312×34. Icons 24 (cart 21).
- Product card image **374** tall. Hero card 958×770.

---

## 5. The home page, section by section

| Order | Section | Maps to `SectionType` |
| --- | --- | --- |
| 1 | Utility bar — language, currency · tracking, FAQ, about, contact | header variant |
| 2 | Navigation — wordmark, search, category links, wishlist/account/cart | header variant |
| 3 | Hero — one large photo card + two stacked cards | `COLLAGE` |
| 4 | Casual Inspirations — text block + two image cards | `IMAGE_TEXT` |
| 5 | Trending — menu-driven chips + asymmetric product grid | `FEATURED_PRODUCTS` |
| 6 | Testimonial | `TESTIMONIALS` |
| 7 | Service — three icon/title/body columns | `MULTICOLUMN` |
| 8 | Footer — wordmark, blurb, newsletter, three link columns | footer variant |

**No new section plumbing is needed.** Every one maps to a section type that
already exists. The work is new *variants* of renderers we have, plus a header
and footer variant.

Two things in it are behaviour rather than styling:

- **The Trending chips are a menu**, not a filter widget — a merchant builds a
  menu in the admin and the section points at it, exactly as Shopify's
  `link_list` setting works. `Menu` and `MenuItem` are already modelled;
  what is missing is a `menu` field kind and a renderer that reads it.
- **The grid is asymmetric** — cards are 322px or 654px wide, mixed within a
  row. The `grid` slot only controls density today, so this needs a variant
  that understands spans.

---

## 6. Details worth not re-deriving

- The hero CTA is the Button component unchanged — 280×50, `#121212`,
  "VIEW COLLECTIONS" in Medium 14 with 1px tracking.
- Section headers sit on a `rgba(0,0,0,0.1)` 1px top rule with 32px of
  vertical padding and a 24px gap below.
- Product cards carry the favourite button top-right, inset 20px, 40px across.
- The footer's newsletter field is a 250×45 pill outlined white at 52%, beside
  a 105×45 solid white button with `#121212` label.
- Footer column labels are 11px uppercase at full strength; the links under
  them are 13px at 52%.

---

## 7. What this does not answer

The licence. The kit is a Figma Community file, and shipping it as a theme
inside a paid platform is commercial redistribution — a different permission
from using it in a project of your own. Most Paperpillar kits allow it with
attribution, but the licence is per file and has not been checked.
