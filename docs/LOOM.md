# Loom — the design, measured

Everything needed to build the Loom theme, recovered from the Paperpillar
"LOOM E-commerce Website UI Kit" on Figma Community
(`csV3m62TcCVG4e96uLho9i`) and written down here so it survives.

It was first written down because the extraction was the expensive half:
Figma's Starter plan allows **20 MCP tool calls a month**, and reading these
values used most of one month's allowance.

**That constraint is gone.** The `.fig` itself lives at
`~/Business/Figmaa/LOOM E-commerce Website UI Kit.fig` and is read with no
Figma account at all — see §7. It carries the full-size artboards the
Community view hides, so §1's "only inside the cover artwork" describes what
the MCP server could see, not what the file holds.

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

## 7. The reference build — `/loom`

A standalone page that reproduces the kit's home screen exactly, at both of its
sizes, with nothing of the platform in it: no shop, no theme tokens, no data.
It is the measuring stick the real theme renderers get checked against.
`app/loom/`, `components/loom/`, the photographs in `public/loom/` (the file's
own bytes, named by their Figma hash), the icons in `public/loom/icons/`.

### Reading the file

```
node scripts/figma/read-fig.mjs "<the .fig>" /tmp/loom.json      # decode once
node scripts/figma/inspect.mjs /tmp/loom.json "^Trending$" 6 \
     --under "⚡" --under "^Responsive$"                         # one frame, exactly
node scripts/figma/icons.mjs /tmp/loom.json <out> "<icon name>"  # real vector paths
node scripts/figma/verify-loom.mjs [url] [desktop|phone]        # measure the page
node scripts/figma/sweep-loom.mjs [url] [--shots <dir>]         # every other width
```

The 375 screen is the frame named **Responsive** under the page `⚡ E-commerce
website`; the cover carries a second "Responsive" at 49%, which is why
`--under` can be given twice. `verify-loom.mjs` needs Chrome with
`--remote-debugging-port=9222` and the dev server; it checks every section's
box and every text style at both sizes, and that nothing scrolls sideways.
`sweep-loom.mjs` loads twenty widths from 320 to 2560 and fails on sideways
scrolling, text outside the box that clips it, or text under 11px.
**Both pass, 7 October 2026.**

### The two screens

375 is the base and 1440 is `lg:`, in one tree — never a phone copy and a
desktop copy. Heights, as the file has them:

| | Desktop 1440 | Phone 375 |
| --- | --- | --- |
| Header | Navbar 64 + Navigation 80 | 94 — wordmark and a menu button only |
| Hero | 1192 | 1253 — the two wide cards are not on the phone |
| Trending | 1058 | 1255 — two columns, a wide card after every pair |
| Explore by Colors | 210 | 416 |
| Testimoni | 636 | 704 — gains a 64px portrait |
| Service | 558 | 1020 — columns stack |
| Blog | 555 | 742 |
| Footer | 341 | 838 |
| **Total** | **4694** | **6322** |

Rows that run off the phone's right edge in the file — the hero's two category
cards and the Trending chips — are rows you swipe.

### Every other width

The kit draws two widths; the page has to work at all of them. Every length is
written as the file's number times `--u`, one design pixel at the current
screen, set on `<main>`:

| Screen | Design shown | `--u` |
| --- | --- | --- |
| under 768 | the phone's | width ÷ 375, at most 1.2px — past 450 the phone design is a centred column, swipe rows still reaching the screen edge |
| 768 and up | the desktop's | width ÷ 1440, at most 1px — past 1440 it is centred, the footer's ground running edge to edge |

So at 375 and at 1440 `--u` is exactly 1px and the page is the file, and in
between everything — a photograph's hand-placed crop included — scales
together. Three guards keep a scaled page usable rather than merely smaller:

- **Type up to 24px never drops below 80% of its design size**, nor under
  11px, and its line height floors with it.
- **Buttons and chips take the file's width as a minimum** and never stand
  under 40px tall, so a floored label grows its button rather than spilling.
- **Boxes holding text have minimum heights, not fixed ones** — the
  testimonial and the hero's copy grow on a small laptop instead of clipping.

From 768 to 1023 the three category links in the header do not fit beside the
search field, so they give way to the phone's menu button and return at 1024.

### Things the file says that are easy to read wrongly

Each of these was built wrong first and found by measuring.

- **Inter needs its optical-size axis.** Figma draws large text from Inter's
  display cut. Without `opsz`, "Explore by" measured 269px against the 256px
  box the file wraps it in, and the section broke onto three lines. `/loom`
  loads Inter with `axes: ["opsz"]` for itself only. **The storefront's own
  Inter does not have it** — turning it on changes every live shop's
  headings, so it is a decision to take when Loom is ported, not a side effect.
- **Strokes are drawn inside and take no room.** The section rules are inset
  shadows, not borders; as borders each section came out 1px too tall.
- **Two photo modes.** *Fill* covers its rectangle from the centre
  (`object-cover`). *Crop* (`STRETCH` in the file) is a window onto part of the
  photo, stored as a transform; the drawn size is the rectangle divided by the
  transform's scale. The desktop's "Say it with Shirt" and "Funky never get
  old" are crops and were squashed 12% and 33% until this was read.
- **A component's text style lives on the master.** The colour chips' labels
  are 16/24 Semi Bold with +1 tracking on desktop (14/24, +1 on the phone);
  the instances override only the words, so reading them alone suggests 14
  and no tracking.
- **The kit's own typos are not design.** The phone names the last shoe
  "Spotwear" and prices the fourth $225; the desktop's name and price are used
  at both sizes. "Browse Inpirations" is spelt as the file spells it.

### The kit's named styles

The file's "Internal Only Canvas" page holds every text style by name. The
pages the kit does not draw use these and nothing else —
`components/loom/type.ts` has them as `T.display1` … `T.single2`.

| Style | Weight | Size / line | Tracking |
| --- | --- | --- | --- |
| Display 1 · 2 · 3 · 4 | Regular | 90/75 · 56/56 · 40/40 · 32/32 | −5 · −5 · −3 · −3 |
| Heading 1 · 2 · 3 | Regular | 65/65 · 60/65 · 40/48 | −4 · −3 · −3 |
| Heading 4 (Reguler) · (Medium) | Regular · Medium | 30/38 · 30/40 | −1 |
| Heading 5 | Medium | 24/40 | −1 |
| Body 1 · 2 · 3 | Medium · Regular · Medium | 24/32 · 20/28 · 18/32 | −1 |
| Body 4 · 5 · 6 | Regular | 18/26 · 16/28 · 16/26 | −0.3 · −1 · −0.3 |
| Body 6 (Bold) | Semi Bold | 16/32 | −0.5 |
| Single text 1 · 2 | Semi Bold · Medium | 24/32 · 14/24 | −0.5 · +1 |

Colours on its "Color" page: Black 1 `#000000`, Black 2 `#121212`, Grey
(`#121212` at 80%), Blue `#233c6b`, White, Soft red (`#f15353` at 80%), plus
Shade 700 `#2e3a59` and Gray 600 `#4f5b67` on the internal canvas.

### Pages the kit does not draw

Designed here in the kit's language — its parts, its numbers, its named
styles — and checked by `sweep-loom.mjs` like the home page. Every page is
`<LoomShell>` (components/loom/shell.tsx) around its own sections, so header,
footer and the screen unit are shared.

**Product — `/loom/product`.** The blog row's split: 654 of photograph, 60,
606 of words. Under the photograph four 156 thumbnails at radius 24, 10 apart;
on the phone the photographs are a row to swipe, 311 wide so the next shows.
The right column: eyebrow in Single text 2, the name in Heading 2 (Heading 3
on the phone), price in Heading 4, copy as the blog's. Colour is the kit's
own colour chip and size is the Trending chip, the chosen one filled with ink
as the active Trending chip is. Quantity is a pill outlined `#dddddd`; Add to
cart is the kit's button. The Service section's three glyphs become three
one-line promises, and Details / Shipping & Returns open on the section rule
with the kit's chevron. "You may also like" is the Trending header and the
kit's product card, four across at 322. The kit has one photograph per
product, so the gallery's views are crops of it.

**Collection — `/loom/collection`.** On the kit's 322 module: filters take
one card's width, then the 10px gutter, then three cards of 322.67 — the
sidebar reads as one of the cards. A Heading 1 title with Body 4 beside it
(the hero's second band), the Trending chips as the category menu, and
everything under them on the section rule. Colour is the colour chip's swatch
alone (nine full chips would stand one per line in 322), size is the Trending
chip, price a one-choice list, sort a chip-outlined pill with the kit's
chevron. On the phone: two columns of the small card, the filters in a
full-screen sheet whose button says how many products the choice leaves.
The filters really filter. "Show more" appears only when there is more.

The pages link to each other: the wordmark goes home, "All Category" and the
footer's "Shoes" open the collection, and the red high-top opens the product.

**Cart — `/loom/cart`.** The collection turned round: lines on the left at
three cards' width, the summary at one card's width, 322, on the right. Each
line sits on the section rule with the gallery's 156 thumbnail, the name and
its colour and size, the stepper, and the line price. The summary says free
delivery when the order earns it and, when it does not, how far off it is —
never "worked out at checkout" beside "free". An empty cart says so and offers
the way back.

**Checkout — `/loom/checkout`.** `<LoomShell checkout>` drops the menus,
search and footer — links away from paying — and keeps the wordmark and
"Back to cart". The blog split again: 654 of form, 606 of order. Four
numbered steps on the section rule (contact, where it goes, how fast, how to
pay). Fields are the header's search pill grown to 50 with a visible label;
a pick-one is a card at radius 24 with the price filter's round marker. Card
payment goes to the provider's page — no card number is typed here, which is
the platform's payment rule. On the phone the order folds to one line at the
top. Errors are said in words under each field and focus moves to the first.

**Account — `/loom/account`, `/loom/account/sign-in`.** Sign in and create
an account are one page that turns between them, in the hero copy column's
411. Signed in: the collection's frame — a 322 column of stacked Trending
chips for Orders, Addresses and Details, content beside it. An order's state
is a word with a dot ("On its way" in the kit's Blue, "Delivered" in ink).

Two decisions the kit could not make:

- **Error text is `#cc3a3a`, not the kit's `#f15353`.** The kit's red is 3.4:1
  on white — fine for the field's outline, too faint for words (4.5 is the
  floor; this is 4.96).
- **Several controls are drawn but go nowhere yet** — an order's View, Edit and
  Add an address, Forgot your password, Show more. They are the design; the
  behaviour is the platform's when Loom is ported.

### Built for the live customizer — the format

Loom must be editable the way a Shopify theme is: sections added, hidden and
reordered, every word changed, any menu built under Admin → Menus (nested or
flat) chosen for the header, footer or a section. That is a format, and the
format cannot change later — so it is fixed now, in
`components/loom/contract.ts`, on the platform's own types:

| Piece | What it is | Where |
| --- | --- | --- |
| **Section** | A `SectionSchema` (the platform's format, the one the customizer already builds its panel from) plus a renderer that draws only from its settings and the shop's data | `components/loom/sections/` — `*.schema.ts` beside each drawing |
| **Template** | A page as an ordered list of sections with their stored settings — Shopify's JSON template | `components/loom/templates.ts` |
| **Group** | The header and footer, shared by every page | `HEADER_GROUP`, `FOOTER_GROUP` |
| **Menu** | A merchant's menu, two levels deep (the platform's MenuItem refuses a third) | `LoomMenu`; demo menus in `demo-menus.ts` |
| **Context** | The shop's data handed to every section — menus, products, the query, the order. A section fetches nothing, so the customizer can redraw it on every keystroke | `LoomContext` |

Settings fill their defaults through `resolveSchemaData` in
lib/section-schema.ts — the platform's own function, so a Loom section and a
platform section can never resolve differently.

`npm run check:loom` holds it up: every text setting is set to a marker and
must appear on the drawn page, every switch must change the page, every menu
default must exist, every template must name registered sections.
Negative-tested by typing a sentence into the search section.

**Every Loom page is on it** — home, product, collection, cart, checkout,
account and sign-in, wishlist, order, search, and the header and footer every
page shares. Each page file is three lines: the shell, a breadcrumb, its
template.

**Words come from three places, as on Shopify:**

| Where | What | Example |
| --- | --- | --- |
| The data | What a product, collection, order or customer says about itself | the product's name, price and description |
| Section settings | What a merchant designs per section: headings, what shows, which menu | the hero's headline, "Show filters", the header's menu |
| Site text | The interface words used on many pages, changed once | "Add to cart", "Subtotal", "Remove" |

Site text is the platform's own (`lib/site-text.ts`, the Site text screen):
Loom uses its keys where they exist, so a shop's edits carry over, and adds
the rest in `components/loom/text.ts` with Loom's wording as the default.

**Photographs.** While an image setting holds the kit's own photo, the section
keeps the file's hand-made crop; any other photo fills its card from the
centre, so a merchant's upload never inherits a crop made for another picture.
The home page with every default is still the file to the pixel.

`check:loom` (333) now also sets every Site text key to a marker and requires
it on the page: 83 of 126 are reached by drawing each section in five states;
the 44 that exist only after an interaction (a checkout error, the thank-you
page, the create-account half) are listed in the check and were driven in a
browser instead.

**What the platform still needs, which is not Loom's to decide:** the home page
and custom pages are already section-built and edited in the customizer; the
product, collection, cart, search, account and order pages are fixed code, and
the header and footer read fixed menu slots. Shopify makes every page type a
template of sections and the header a section with a menu setting. Doing the
same here is a schema change (templates per page type, menu items passed with
their children), and it decides how every theme works, not only Loom.

### Header, phone menu, wishlist, order, search

**Header.** One section: the wordmark, the main menu, the strip's menu, the
language and currency, the search hint, and a switch for the strip, the search
and each icon. A top-level link with children opens a dropdown on hover, focus
or tap — the chevron the kit draws beside every category is the promise of
one: white, outlined `#e3e3e3`, radius 24, links in Body 6.

**Phone menu** (not in the kit). A full-screen sheet whose top row is the phone
header exactly, with the close glyph where the menu glyph was. Then the search
pill at 50, the main menu in Heading 4 on the section rule — each parent
opening its children in Body 4 — then wishlist, account and cart as words, then
the strip's links and the language in the strip's small type. Escape closes it
and focus starts on the close button.

**Wishlist.** Every heart on every card saves (in the browser for the demo, in
the customer's account when ported). The page is the kit's card four across
with Add to cart in the quiet outline under each, and an empty state that
offers the way back.

**Order.** The state is the heading — "On its way" — with the order number as
the eyebrow, four stages on the section rule (done in ink, now in the kit's
Blue, later outlined; always a word and a date), Track and Buy again, then the
blog split: what was ordered, the totals and two cards for address and
payment, and the Service section's phone glyph offering help.

**Search.** The header's pill grown to 654, holding the query; suggestions are
a menu the merchant picks, drawn as Trending chips; results four across. Found
nothing says so, says what to try, and shows the suggestions; "Trending now"
follows so the page always has products.

### On the real storefront

Loom is the first theme with a kit (THEMES.md §1), and every Loom copy draws
it — decided 8 October, with no merchants yet. A shop on Loom draws it on its
real storefront, from its own data:

| Page | Address | Status |
| --- | --- | --- |
| Header, footer | every page | Loom, the shop's own menus |
| Home | `/` | Loom — featured products, or the newest |
| Collection | `/shop`, `/collections/<slug>` | Loom — first page of products |
| Search | `/shop?q=` | Loom |
| Product | `/product/<slug>` | Loom — its real colours, sizes, stock and photographs; Add to cart into the platform's cart. Enquiry-only products keep the platform's page |
| Wishlist | `/wishlist` | Loom (only kit shops have this page) |
| Cart | `/cart` | Loom — the platform's cart; the shop's shipping fee and free-delivery threshold |
| Checkout | `/checkout` | Loom — the platform's order API: the shop's delivery cities, payment methods (with their instructions), one delivery charge, discount codes priced by the server, the platform's phone rule, a signed-in customer's details filled in. A card method leaves for the provider's page |
| Sign in, register | `/account/login`, `/account/register` | Loom — the platform's **customer** sign-in, run on the server so the shop is the one in the address |
| Account | `/account`, `/account/orders`, `/account/addresses` | Loom — the latest 20 orders in all six states; addresses added and removed; details shown, not edited |
| Order | `/order-confirmation/<id>?key=` | Loom — "Thank you, {name}" straight after checkout. Opened from its link: read-only, the address cut to city and postcode; by the customer signed in: everything; without either: "Find your order" (number + email or phone). A card payment still waiting on the bank keeps the platform's page |

Prices are in the shop's currency through the platform's formatter; links go
through the shop's own addresses (a link setting may say `route:cart`); inside
a theme demo every link carries the demo's prefix.

**The live customizer edits it.** For a Loom copy the page switcher lists
Loom's pages (header, home, collection, product, search, wishlist, cart,
checkout, sign in, account, order, footer),
the panel is each section's own settings, sections can be added, hidden,
reordered and removed — except a page's main section — and the preview redraws
as you type, the header and footer included. Saving writes the copy's
template and clears the storefront's cache; the storefront shows it at once.

**Samples in the customizer.** The merchant is not a shopper — no account,
no orders, no cart — so the kit carries a sample customer, order and cart
lines (`ThemeKit.sample`), shown in the preview where the merchant has none.
Only for this shop's own staff: the preview parameter alone is something
anyone can type (`showsSamples`, lib/data/kit-context.ts). The sample checkout
still shows the shop's real terms; placing it only pretends.

**A real order knows less than the kit draws.** It records its state and when
it was placed — no date per stage, no delivery speed, no tracking number — so
the order format takes those as optional and Loom draws what it is given.

Verified on the local database only: a headline edited and saved in the
customizer, the storefront showing it; an account created, an address added
and removed, a cash-on-delivery order placed signed in (form filled from the
account) and as a guest, the order's page with and without the address,
sign out, a wrong password, sign in; the five new pages swept at 20 widths.

### Still open

- **One deliberate departure from the file:** on the phone hero the second
  copy of the photograph is laid over a five-times enlargement of the first,
  and where they meet the file draws a hard line across the green. Its top
  edge fades over 40px. Every number is still the file's.
- **The kit's photographs are 1–10MB PNGs.** Fine for a reference page; the
  ported theme serves them through the platform's image pipeline.
- **On a real shop, not yet:** "Forgot password" (the platform has no reset),
  changing an address or making one the main one, changing one's name or
  phone, "Buy again" — each hidden rather than offered and doing nothing.

---

## 8. What this does not answer

The licence. The kit is a Figma Community file, and shipping it as a theme
inside a paid platform is commercial redistribution — a different permission
from using it in a project of your own. Most Paperpillar kits allow it with
attribution, but the licence is per file and has not been checked.
