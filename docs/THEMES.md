# Themes and global settings

How a storefront gets its look: which parts are the theme's, which are the
merchant's, and what happens to each when they change the other.

The short version: **a theme brings its own look, and a merchant's changes are
kept as differences on top of it.** Neither ever overwrites the other. A shop
that changes nothing wears its theme exactly as designed; a shop that changes
six things keeps those six through everything except a deliberate reset.

---

## 1. A theme is data

A theme is not a folder of components. Adding one adds no React, no CSS file
and no download — every theme ships with the platform, and a theme is one entry
in `lib/themes/registry.ts` made of four things:

| Piece | What it decides |
| --- | --- |
| `tokens` | The look it starts at — colour, type, shape. Its **global settings**. |
| `layout` | How it arranges the storefront: header, product card, grid, footer. |
| `sections` | Which section types it offers, and in what order the picker shows them. |
| `businessTypes` | Who it is for. It only appears to shops of those kinds. |

This is what makes a catalogue of themes affordable. Two themes differ in
typography, colour, spacing and arrangement — not in their component trees.
Duplicating eight components per theme would mean fixing every bug eight times,
and each new theme would make the next bug worse.

~~If a theme ever genuinely needs a part nothing else has, that is a new
section in `lib/section-schema.ts` plus its renderer — and then **every** theme
can offer it. A theme never owns a component.~~

### Reversed 8 October 2026: a theme may own its sections

Decided by Abdul, choosing Shopify's model: **a theme may bring its own
sections.** The rule above could not make Loom look like the Figma kit, and it
cannot make any two themes truly different — a palette and three layout
variants over one shared set of sections is one storefront in several colours.

So a theme may now ship a **kit** (`lib/themes/kits.ts`):

| Piece | What it is |
| --- | --- |
| Sections | Its own section types, each a `SectionSchema` the customizer builds its panel from, and a renderer |
| Templates | What every page is made of by default — home, product, collection, search, cart, checkout, account, sign-in, order, wishlist — and the header and footer groups. Shopify's JSON templates |
| Text | Its own wording for the interface (Site text keys); the shop's own Site text edits win |
| Frame | What every page sits in — its fonts, its unit |

What the platform promises every kit is fixed in `lib/themes/kit.ts`: the
shop's data, already fetched, in set shapes (menus with their dropdowns,
products, the product, the collection, the cart, the customer, the order, the
shop's page addresses, its currency). A kit's sections draw only from that and
their settings — they never fetch — so the same render function serves the
storefront and the customizer's live preview, and a kit cannot reach anything
a theme should not. Kits are code Synora ships; there is still no upload.

**A kit starts at a version.** A shop's copy draws from the kit only at that
version or later; every copy made before records an older version and renders
exactly as it always has, until the merchant presses Update. That is for the
next theme that gains a kit after merchants already wear it.

**Loom's kit starts at 1.0.0 — every Loom is the kit.** Decided 8 October:
there are no merchants yet, so the new design is simply Loom, with no older
storefront to keep. The registry ships Loom 2.0.0, marking the change.

**A merchant's edits live on their copy** — `InstalledTheme.templates`, only
the templates they changed. A template they never touched is the kit's
default, so a better default reaches them; one they did touch is theirs.
Every save passes `checkTemplate` on the server: known section types only,
settings filled through each section's schema so nothing undeclared is
stored, a singleton once, a page's main section (the product on the product
page) never removed or hidden.

**Kite's kit also starts at 1.0.0 — every Kite is the new Kite.** Decided
9 October, for the same reason: the design rebuilt from its Figma file
(`docs/KITE.md`) replaces the September Kite outright, and the registry ships
Kite 2.0.0. Both themes are kits now.

**What a kit does not draw still wears the theme's tokens.** A kit draws its
header, footer and the twelve pages above. A shop's own pages — About, FAQ,
Contact, a page the merchant wrote — are the platform's sections, coloured by
the theme's `tokens` (§2): Kite's are its near-black ground and off-white ink,
so those pages sit in the same room. A theme with no kit (none today) works
exactly as below.

**What every kit gets from the platform, and must not redo:**

- *Links move in place.* `KitLinks` (in each kit's frame) follows a plain
  `<a>` to one of the shop's pages — and a GET search form — as a client
  navigation. Without it every click reloaded the whole page (found on the
  live Loom demo, 8 October).
- *A link setting is `kitHref`.* `route:cart`, `route:collection?color=Pink`,
  a plain `/shop` (the demo prefix added), or a full URL. Empty gives the
  section's fallback or no link — never `#`, which only jumps to the top.
- *Redirects and orders keep the demo's prefix.* `storeRedirect` for every
  storefront redirect, and `kitPlaceOrder(payload, base)`; a demo then gets the
  order API's own answer ("This is a demo store…").
- *Actions are `lib/themes/kit-actions.ts`* — the cart, discount codes, placing
  an order, sign-in codes, addresses, order lookup — so a kit enforces every
  rule the platform's own pages do.
- *`check:loom` / `check:kite`* — every kit gets a check that each of its
  settings reaches the page (`docs/CHECKS.md`).

---

## 2. Three layers, weakest first

A storefront's look is resolved, not stored. Three layers, each overriding the
one before:

```
1. Platform defaults     THEME_TOKEN_DEFAULTS — every field has a value, always
2. The theme             ThemeDefinition.tokens — what this design looks like
3. The merchant's edits  InstalledTheme.tokens — only what they changed
```

**Layer 3 holds differences, never a resolved copy.** This is the load-bearing
part. If a merchant's row stored the finished answer, it would freeze today's
theme values into it — and switching theme later would change the colours while
silently keeping the old header, because the old header would have been written
into their settings by a screen they never touched. Storing only what they
actually changed means switching theme changes everything they did not choose,
and nothing they did.

The same rule applies to `layout`, for the same reason.

**Changing a theme's defaults never overwrites anyone's work.** Editing
`tokens` in the registry moves where a *new* shop begins and where an existing
shop's untouched fields sit. It cannot reach a field a merchant has set.

### The honest gap

`THEME_TOKEN_DEFAULTS` — layer 1 — is still the palette of a different
business: a maroon accent (`#4c100f`), a tan secondary, a cream page. Loom
declares `tokens: {}`, meaning "the platform defaults", so **Aurora is that old
palette wearing a new name**, and a brand-new shop opens in it.

That is backwards. Layer 1 should be a neutral floor that guarantees every
field has *some* readable value, and the palette a shop opens in should be the
theme's own declared choice. Fixing it is two edits — give Loom explicit
tokens, make the floor neutral — and it is deliberately not done yet, because
it should happen when the themes are designed rather than twice.

---

## 3. Global settings

Global settings are layer 2 and 3 of the table above: the settings that apply
to the whole storefront rather than to one section. Every theme carries its own
values for all of them, and the merchant edits them in the live customizer,
where the storefront redraws beside the control as it changes.

They are grouped in `lib/theme-schema.ts`, and the customizer's panel is
generated from that list — there is no per-setting UI code, so adding a setting
is one entry.

| Group | Settings |
| --- | --- |
| **Layout** | Header · Product card · Space between products · Footer |
| **Shopping** | Hover to swap image · Quick add · Sticky buy bar · Swatches on cards |
| **Colour** | Accent · Text on accent · Page background · Card background · Body text · Muted text · Borders · Secondary |
| **Header & footer** | Header background · Header text · Footer background · Footer text |
| **Logo** | Logo height · Logo colour (original / match accent / automatic) |
| **Typography** | Heading font · Body font · Base text size · Heading weight · Heading letter spacing |
| **Shape & layout** | Corner rounding · Button rounding · Content width |

### Two rules these settings follow

**Text colours may say `auto`.** Header and footer text default to "work out
the readable colour for whatever this sits on". Storing the intent rather than
a resolved hex is what keeps them in step: change the header background and the
text follows, with no stale value left behind that used to be readable.

**Contrast is checked while you edit.** The panel measures every pair that
matters — body on page, body on card, button text on accent, header, footer —
against AA and says which one is too faint, in that sentence. A merchant is
never allowed to find out from a customer.

### What is not a theme setting

- **The logo and the favicon.** Those are the shop's, not the theme's
  (`lib/brand-marks.ts`). Tokens are stored per business type, so a logo kept
  among them was lost every time a merchant switched from shop to restaurant
  and lost again switching back. What the theme decides is how a mark it is
  *given* is presented: how tall it is drawn, and whether it is re-tinted.
- **How many products fit across a row.** Already a merchant setting in
  Preferences. A theme that also set it would be a second switch for one thing.
  `grid` sets spacing only, on purpose.
- **Fonts from anywhere.** The choices are the families the app self-hosts plus
  system stacks. Loading an arbitrary web font at render time means a request
  to a third party on every storefront page, and a theme must not be able to
  cause that.

---

## 4. The library: adding, working, publishing

Three acts, and they are separate on purpose. There used to be one button that
changed the live storefront, so browsing six designs was one click away from
putting an untried one in front of customers, and there was nowhere to keep a
design being worked on but not ready.

**Add** — a **copy** of the theme joins this shop's library
(`InstalledTheme`). Nothing is downloaded; every theme ships with the platform.
What the row records is one design the merchant can work on.

**Add again and you get another copy.** A shop can hold KITE twice, at two
versions, with different colours on each, and activate either. That is the
point: a design being worked on, beside the one serving customers, with neither
standing in the other's way. It follows that nothing may be addressed by theme
key — two copies of KITE are both KITE — so every action, every preview and the
customizer name a copy by id.

**Work on it** — an added theme can be previewed and customised indefinitely
without a customer seeing any of it. `?theme=<key>` on the customizer names
which theme is being edited, checked against the shop's own library.

**Publish** — the separate act that changes the live store.
`ThemeSettings.themeKey` stays the single answer to "which is live", and the
theme that was live moves *into* the library rather than being lost.

**A theme's edits belong to the theme, not to the shop.** Kite can be worked
on for a week while Loom keeps serving customers, and switching between them
loses nothing either way.

The guards, each of which is a state with no honest screen to show for it:

- A theme that was never added cannot be published — otherwise the library is
  decoration and one click still changes the live store.
- The live theme cannot be removed — a shop cannot render a theme it does not
  have.
- A theme for another business type cannot be added at all.
- Re-adding does not reset `installedAt`: "Added 3 weeks ago" is how a merchant
  tells two half-tried designs apart.

The screen is three zones, in the order a merchant thinks about them: **what is
live**, **what this shop owns**, **what exists**.

---

## 5. What ships today

Two themes, and that is a deliberate floor rather than a starting point.

| Theme | What it is |
| --- | --- |
| **Loom** | Light, roomy, large imagery — rebuilt exactly from the "LOOM E-commerce Website UI Kit" Figma file as its own sections (`docs/LOOM.md`). Named Aurora until 22 September; a kit since 8 October. |
| **Kite** | Dark and editorial — near-black ground, serif voice, photography in a quiet grid — rebuilt exactly from "KITE - Trümung - Ecommerce Clothing Store" (`docs/KITE.md`). Named Atlas until 22 September; a palette-and-layout theme until it became a kit on 9 October. |

Five others — Meridian, Quill, Column, Hearth and Service — were removed on
10 September 2026. All five were palettes. Five recolours beside two real themes
made the picker look full while offering one genuine choice.

**There are no blog or restaurant themes.** Those business types see an honest
empty state. A restaurant deserves a design built for restaurants rather than a
shop's with the words changed.

**Every picture on the Themes screen is live** (since 8 October): the active
theme is a frame of the shop itself, each library copy the shop wearing that
copy (its edits included), each store card the theme's own demo. The shipped
screenshots in `public/themes` — taken once in September of a storefront that
no longer exists — and the registry's `preview` field are gone, so nothing can
show a stale picture again. The frames load with `?__theme=`, which, like the
customizer's `?__preview`, is not counted as a visit.

---

## 5b. The theme store demos

**What somebody sees before they own anything.**

`app.synoradigitals.com/theme-store/kite` is a complete, browsable storefront
wearing Kite — home page, shop, collections, product pages — filled with demo
products and demo photography that belong to *us*, not to any merchant. It is
the same page for everyone on the internet, and that is the whole point: a theme
should be judged on its design, and a theme judged through somebody else's
half-filled catalogue is not being judged at all.

This is the shape Shopify's theme store has, and it is that shape because the
alternative does not work. Rendering the merchant's *own* shop in an unowned
theme answers "what would my shop look like" — a real question, but a different
one, and it is the question the **All Themes** rows answer. A merchant with four
products and no photographs, shown their own shop in a photography-led theme,
sees four pictures and a lot of white, and concludes the theme is empty.

### Where each Preview goes

| Where | What it opens | Why |
| --- | --- | --- |
| **Active Theme** | the shop's own live address — `demo-user1.com`, or the free `acme.app.synoradigitals.com` | It *is* the live site. No `?__theme=` override: overriding the live theme with itself renders the same page while implying it is a preview. |
| **All Themes** — a copy the shop owns | the shop's own address with `?__theme=<copyId>` | The merchant's products wearing that copy, that copy's own edits included. |
| **Theme Store** — a card | `app.synoradigitals.com/theme-store/<theme>` | Ours, demo content, identical for every visitor. |

### Add never brings the demo content

Pressing **Add** creates one `InstalledTheme` row and nothing else. No products,
no photographs and no sections are copied from the demo: the merchant's own
catalogue renders in the new theme immediately, which is what adding a theme
means on every platform. The demo pictures exist to sell the theme, not to be
inherited — a merchant who inherited them would have to delete forty products
before opening.

This is not a new rule; it is what `installTheme` has always done. It is written
down because it is exactly the sort of invariant a later helpful-looking change
breaks, and `check:theme-store` now asserts it.

### How a demo is built

Each theme has one real `Shop` behind it, so every storefront feature works
without a second code path:

```
Kite   ->  kite-demo   ->  app.synoradigitals.com/theme-store/kite
Loom   ->  loom-demo   ->  app.synoradigitals.com/theme-store/loom
```

- The subdomain is the theme's name lowercased plus `-demo`, **reserved** so no
  merchant can claim it.
- It never serves the shop itself. A request to
  `kite-demo.app.synoradigitals.com` is permanently redirected to
  `/theme-store/kite`, so one page never has two addresses and the demos cannot
  compete with themselves in search.
- `proxy.ts` rewrites `/theme-store/kite/<anything>` to `/<anything>` and names
  the demo shop in a header. No database call: the subdomain is derived from the
  slug in pure string code, which is what keeps that file free of queries.
- Every storefront link is prefixed with `/theme-store/kite` while a demo is
  being rendered, so browsing stays inside the demo and inside the URL. **The
  prefix is empty for every real shop**, which is what makes this safe: a
  merchant's storefront takes the same code path it always did.
- **Checkout is refused on a demo shop.** A demo that took orders would write
  real rows and send real mail to whoever the notification address resolved to.
- **Visits are not recorded.** These pages are indexed on purpose, and a crawler
  should not write a row per request into analytics nobody reads.
- **A demo that has not been seeded is not a dead link.** The code deploys
  before the data exists — on a fresh local database, on a preview branch, and
  in production between a deploy and `scripts/seed-theme-store.ts`. The Themes
  screen asks which demos exist and falls back to the old preview (this shop
  wearing the theme) for any that do not. A worse answer to the question, and a
  far better one than a 404.

### The catalogues

Each theme demos the kind of shop it was built for. That is why they are two
catalogues rather than one shared one — it is what the design file draws, and a
photography-led theme and a roomy, text-led one are not selling the same goods.

| Theme | Demo shop | What it sells |
| --- | --- | --- |
| **Kite** | Trümung | The fashion label its Figma file draws (decided 9 October, as Loom's): the file's eleven "Piece Title" pieces at its $875 and the product page's Leather Shoes by Angel Vaccaro at $1,200 — in rupees at about 280 to the dollar — with the file's own photographs, its categories (Limited collection, Coats, Bags, Shoes) and its menus. The file gives the pieces no sizes or colours, so each is one size. |
| **Loom** | Ecommerce | The shoe shop its Figma file draws — six pairs, the file's own photographs, its dollar prices in rupees, and its menus with their dropdowns (decided 8 October: a demo shows goods the theme was designed around, never scenery). |

Seeded by `scripts/seed-theme-store.ts`, which is reversible (`--undo`) and
marks everything it writes exactly the way `scripts/seed-demo.ts` does — `DEMO-`
SKUs, `@demo.invalid` addresses, `picsum.photos/seed/` pictures.

**Both demos carry their design file's photographs** (a catalogue may give
each product `images`, `colours` — an empty list meaning one colourless
variant per size — `sizes` and a `vendor`, and the shop a `currency` and
`menus`). `picsum.photos` remains only the fallback for a catalogue without
its own.

**Seeding writes to whichever database `DATABASE_URL` names** — the live one
included. The live demos are reseeded on purpose, by the owner's say-so, after
a deploy that changes a catalogue.

A user's own shop — on its subdomain or its domain — always shows its own
products: the demo's goods appear only at `/theme-store/<theme>`, and on the
Themes screen's store cards, which show that demo live.


---

## 6. Designed, not yet built

> **The Themes screen is now drawn.** `docs/PANEL.md` §2 has it measurement by
> measurement — three sections (Active Theme, All Themes, Theme Store), every
> row height, every colour, every button. What follows is what the design needs
> that the model does not have yet.
>
> **The words change with it.** The screen says `Activate`, `Edit Theme`,
> `+ Add` and `Update`. This document says *publish*, *add* and *customise*.
> The screen is what a merchant reads, so the screen wins; this document is
> rewritten to match when the code is.

Recorded here so the shape is agreed before the work starts. None of this is
implemented; `docs/QUEUE.md` tracks it.

**A designed set of themes.** The registry is finished and the catalogue is
not. What is wanted is a number of genuinely different designs a merchant picks
from on the Themes page — not recolours. Each one arrives with its own complete
global settings: its palette, its fonts, its shape, its arrangement.

Reference material sits in `SHOP extra/themez` — a dozen Shopify themes kept to
look at. **They are reference, never input.** There is no Shopify
compatibility, no theme upload and no import path, by decision: a theme here is
an entry in the registry, written by us. What transfers from those files is how
a design behaves, never a file from one of them.

**A theme declares its own palette.** Layer 1 stops being a brand and becomes a
neutral floor; every theme states its colours outright. Then "the storefront
opens in the theme's colours unless the merchant changed them" is true by
construction rather than by a default that happens to be a leftover — see §2.

**Versions, and updating to a new one — agreed 22 September.** A theme gets a
version. A shop can hold the same theme at two versions, and `Update` moves it
to the newest. The button is the easy half; the real question is what happens
to a merchant's edits when the theme underneath them changes, and §2 already
answers it: their row holds only their *differences*, never a resolved copy, so
an update changes everything they did not choose and nothing they did. Updating
is therefore choosing which version's defaults their differences sit on. That
property is what makes this safe and must not be traded away to ship the
button.

**Primary, secondary, tertiary.** The colour settings are currently `accent` +
`secondary`, which does not describe how a designed palette is actually used. A
third role is wanted, and the names should say what each one is for rather than
where it came from. This is a rename plus one new token, and a migration that
maps existing values, so it is worth doing once, with the themes.

**Per-theme font pairings.** `headingFont` and `bodyFont` already exist per
theme; what is missing is the designed pairing shipping *with* each theme, so
picking a theme picks its typography and a merchant changing it is a deliberate
departure rather than a necessary first step.

### Known faults, unfixed

- ~~**The two named font stacks do not load.**~~ Fixed 2 October. Both
  families are loaded through `next/font` in `app/layout.tsx` and their
  variables are carried on `<html>` — which is the load-bearing half: the
  theme's CSS is emitted at `:root`, and a custom property is substituted
  where it is declared, so the same two fonts declared on the storefront
  layout would still have resolved to the fallback. `check:themes` now parses
  every stack in `FONT_STACKS` and fails if a `var()` it names is undefined or
  is not on `<html>`.
- **The platform floor is another brand's palette.** §2.

---

## Reading further

- `docs/ARCHITECTURE.md` §8c — themes in the context of the whole system
- `lib/themes/registry.ts` — the themes themselves
- `lib/theme-tokens.ts` — every token, what it means, how it is validated
- `lib/theme-schema.ts` — the grouped settings the customizer panel is built from
- `scripts/check-themes.ts` — what is asserted about all of the above
