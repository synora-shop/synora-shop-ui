# APP — web (`synora-shop-ui`)

The front half of **APP by Synora Digitals**: a hosted platform where a small
business signs up, picks the kind of business it runs, and gets a working store
with a public address, a catalogue, orders, and an admin panel to run it from.

The repository is named `synora-shop-ui` for historical reasons. The product is
APP, it lives at `app.synoradigitals.com` — the page explaining it, sign-up,
sign-in and the admin are all on that one address — and a merchant's free store
address is `<subdomain>.app.synoradigitals.com`. No other brand name is in use —
see the naming guard in `scripts/check-naming.ts`.

`shop.synoradigitals.com` is retired. Every address under it redirects
permanently to the same path on `app.synoradigitals.com`; see
`legacyStoreHost` in `lib/shop-context.ts` and the redirect at the top of
`proxy.ts`.

---

## What's inside

**Storefront** — `app/(storefront)`
Home, shop and search (`/shop`), collections, product pages (`/product/[slug]`),
the bag (`/cart`), checkout, saved items (`/wishlist`), customer sign-in by
emailed code and the account, each order's own page
(`/order-confirmation/[id]?key=…`), and the merchant's own pages (About, FAQ,
Contact, `/p/[slug]`). On a shop whose theme is a kit — both themes today —
the theme draws all of it from its own sections (*Themes*, below).

**Theme store** — `app.synoradigitals.com/theme-store/<theme>`
Each theme's demo storefront, on our servers, selling the goods its design was
drawn around. See `docs/THEMES.md` §5b.

**Admin panel** — `app/admin`
Two levels of navigation and no more, both in the same column. Ten sidebar
sections that never change order, and beneath whichever one you are standing in,
the list of its screens. It all comes from `lib/admin-nav.ts`, the single source
of truth for every address in the panel.

There is no navigation bar. The second level used to be a row of tabs across the
top of the page, so reading "where am I" meant looking left for the section and
up for the screen. The screens are listed under their own section now, and a
line leaves the section's glyph and turns into the one you are on.

The sidebar is drawn in three containers — running the shop, how it looks, and
the account underneath. Nothing collapses and nothing is hidden: every section
is visible at all times, and only the section you are in shows its screens.

A section with one screen lists nothing, and a screen named after its own
section is not listed twice — Products' first tab was called "Products", and
the section already goes there.

| | Section | Screens listed under it |
| --- | --- | --- |
| **Running the shop** | Home | Store defaults |
| | Products | Drafts · Categories · Orders · Enquiries · Bin |
| | Data | *(one screen)* |
| | Discounts | *(one screen)* |
| | Customers | *(one screen)* |
| | Analytics | *(one screen)* |
| **How it looks** | Your App | Themes · Pages · Menus · Drafts · Site text |
| | Preferences | Visibility · Maintenance · Fonts · Sticky buttons · Links & redirects · Custom fields |
| **The account** | Settings | General · Payments · Domains |
| | Account | *(one screen)* |

Data, Discounts and Account were tabs until the bands were drawn. Data and
Discounts sat under Your App, filed with the storefront's appearance, which
neither is — a CSV import is not a look and a discount code is not either, and
both were already drawn as sidebar glyphs in the design file. Account was the
fourth tab under Settings, where everything else is about the *shop* and this
one is about the person signed in, so "delete my account" read as a setting of
the store.

**Live customizer** — `app/(fullscreen)/admin/customize`
Split-screen visual editor with a postMessage protocol
(`lib/customizer-protocol.ts`) and schema-driven controls. For a kit theme it
edits the theme's own pages section by section, redrawing as the merchant
types; sections drag to reorder.

**Platform site** — `app/(platform)`, `app/merchant/*`
The marketing page and merchant sign-up.

---

## Business types

Three exist: `ECOMMERCE`, `RESTAURANT`, `BLOG`. A fourth, Service, is designed
and not built.

**The panel is designed for e-commerce and nothing else.** There is no
renaming layer: `lib/themes/vocabulary.ts` was deleted, and so were
`onlyFor`/`hideFor`/`labels` in `lib/admin-nav.ts`. Calling a product a "dish"
put restaurant words above a screen still built on SKUs, variants, stock and
shipping — worse than either doing it properly or not at all.

Restaurant and Blog get their own designs when they are built: different
sections, different screens, their own words. A screen that seems to need
per-type behaviour is a screen that needs its own design, not a branch.

Switching type requires the store to be paused first — see
`lib/store-type-switch.ts`. `data-business-type` is still set on the admin
root, but it paints nothing.

---

## Themes

Two, in `lib/themes/registry.ts`, each rebuilt exactly from a Figma file:

| Theme | Look | Notes |
| --- | --- | --- |
| **Loom** | Light and roomy, large imagery | `docs/LOOM.md` · demo: the file's shoe shop |
| **Kite** | Dark and editorial, serif voice | `docs/KITE.md` · demo: the file's fashion label, Trümung |

Both are **kits** (decided 8 October, Shopify's model): a theme brings its own
sections, its twelve page templates, its interface words and its frame
(`lib/themes/kits.ts`), and draws from data the platform hands it — it never
fetches. Kits are code Synora ships; nothing is uploaded or imported, and
there is no compatibility with any other platform.

A merchant's shop holds **copies** of themes: Add makes one, the customizer
edits one, Activate makes one live, Update moves one to the theme's newest
version. A copy stores only the pages the merchant changed. `?__theme=<copy>`
renders one request in another copy without activating it, which is how the
Themes screen previews — every picture on it is a live frame.

What a kit does not draw (the merchant's own About, FAQ, Contact and custom
pages) resolves three layers of tokens, weakest first: the platform's defaults,
the theme's, the merchant's. `docs/THEMES.md` has the whole account.

---

## Money

Prices are **whole units of the shop's own currency**: `basePrice: 5500` is
5,500 rupees, not 55.00. `formatMoney(amount, currency)` in `lib/money.ts` is
the only formatter; client components read the currency from a context both
layouts provide, server components call `getCurrency()`. Nothing hard-codes a
symbol, and a check fails the build if anything starts to.

The whole-units decision does not fit a currency with a minor unit — a
merchant cannot price something at 19.99 today. Changing it means storing minor
units everywhere and migrating every row; see `docs/QUEUE.md`.

### Taking it

A shop can connect its **own** account with a payment gateway, and the money
settles into the merchant's bank. The platform is never a party to the payment:
no cut, no float, nothing passing through a platform account.

The rule the whole engine is shaped around is **the provider is asked, never
told**. A callback's body is a claim by a stranger — its endpoint is public
because it has to be — so it is used only to decide which reference to ask the
provider about. `lib/payments/verify.ts` is the only code that can mark an order
paid, and it fails closed on anything unclear.

**`PAYMENT_KEYS` must be set or no gateway can be connected at all.** It seals
merchant credentials, and the screen says plainly when it is missing rather than
accepting a secured key it cannot encrypt:

```bash
node -e "console.log('1:' + require('crypto').randomBytes(32).toString('base64'))"
```

One or more `version:base64` pairs, comma separated. The highest version seals
new secrets; keep the older ones until every row has been re-sealed. **Losing
the key means every merchant re-enters their credentials** — it cannot be
recovered from the database, which is the point of it.

Optional, and only if a provider's onboarding pack names different hosts than
the defaults: `PAYFAST_SANDBOX_BASE`, `PAYFAST_LIVE_BASE`,
`PAYFAST_SANDBOX_VERIFY_BASE`, `PAYFAST_LIVE_VERIFY_BASE`. Overrides are checked
against a host allowlist, so this cannot be pointed at somebody else's server.

`docs/ARCHITECTURE.md` §8b has the rest.

---

## Leaving and arriving

Products, customers and orders all export and import as Shopify's own CSVs,
column for column, so a file written here loads into Shopify and one exported
from Shopify loads here. `lib/csv/` holds the readers and writers, and the
round trip is a test: what goes out comes back identical, including the columns
this platform has no meaning for.

Importing is always two steps — the first says what would change and writes
nothing. Orders are the exception Shopify does not offer at all: an order
already here is skipped rather than rewritten, nothing is emailed, no stock
moves, and each keeps the date it happened.

---

## The panel's palette

Five colours, defined once in `.admin-shell` in `app/globals.css` and used for
everything:

| | |
| --- | --- |
| `#f5f5f5` | the page — and anything recessed into a container |
| `#ffffff` | containers — nav bar, action bar, content, sidebar items |
| `#f5f5f5` | controls — anything you type into or press |
| `#86868b` | the outline of anything at rest |
| `#6666ff` | the active state, and only the active state |

**Depth is carried by light, not by tone.** It used to be the other way: the
page was `#d2d2d2`, containers `#e0e0e0`, controls `#fafafa` — each step
lighter than the one behind it. With containers at white there is no lighter
left, so the order inverted. A container is now the lightest thing on screen
and a field inside it is *cut back* to the page's own tone, which is why the
page and the control share a value.

Two greys that close cannot separate themselves, so a container is lifted by
`--shadow-panel` — two very soft layers, one tight for contact and one wide for
height. A single hard shadow at this lightness reads as a badly drawn border.

The last two colours are a pair: at rest an element is outlined `#86868b`,
focused or active it is outlined `#6666ff`, and nothing else outlines anything.
That is what lets the edge of a control tell you its state. The outline is a
hairline rather than a drawn border — depth is the shadow's job, and an
element carrying both reads as neither.

All of it is scoped to `.admin-shell`. **A merchant's storefront does not wear
the panel's colours**; a store opened on Shopify does not look like Shopify's
admin, and one opened here does not look like APP's.

The sidebar glyphs are the drawn ones from the design source, in
`components/admin/nav-icons.tsx` — not a general-purpose icon set.

---

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · DM Sans ·
Prisma 7 on Neon Postgres · NextAuth 5 · Zustand · Vercel Blob · Resend

---

## Running it

```bash
npm install
npm run dev
```

`DATABASE_URL` must point at a **Neon branch**, never at production. With the
Neon CLI authenticated:

```bash
npx neon@latest branches create --project-id <project> --name dev
npx neon@latest connection-string dev --project-id <project> --pooled
```

Put the pooled string in `DATABASE_URL` and the direct one in
`DATABASE_URL_UNPOOLED`.

Two reference builds run without any shop: `/loom` and `/kite` draw each theme
from its design file's own data, at the widths the file draws — they are what
the pixel comparisons in `scripts/figma/` measure. A real shop in a theme is
the storefront itself, or `/theme-store/<theme>` once the demos are seeded
(`scripts/seed-theme-store.ts`).

---

## Checks

`npm run check` runs every guard — dependency-free scripts that print
`PASS`/`FAIL` and exit non-zero. They exist for the mistakes that have actually
happened here, so read the comment at the top of one before deleting it.

```
check:csv  check:actions  check:geo   check:loops   check:nav
check:paging  check:responsive  check:search  check:accounts
check:domains  check:platform  check:discounts  check:naming
check:sorting  check:editor  check:analytics  check:cache
check:design  check:motion  check:holding  check:spotlight
check:brand  check:address  check:payments  check:gateways
check:themes  check:sections  check:lint  check:theme-store
check:scale  check:loom  check:kite
```

Thirty-two scripts, **4,522 assertions** at the last count (9 October 2026). Those are static: they read the
source. `scripts/sweep/` is the other half — a hundred probes against a running
shop, for the faults reading the source cannot find. It found a CSV that could
run a formula on the merchant's computer and twenty-two controls a screen
reader could not name.

`docs/CHECKS.md` lists what each guard holds up and the bug it exists because
of. `scripts/sweep/README.md` covers the probes. `scripts/figma/` checks that a
theme looks like its design file: it renders an artboard from the `.fig`,
compares a built page with it pixel by pixel, and sweeps twenty screen widths.

---

## Deploying

**Every push deploys, and every deploy migrates the live database.** The
Vercel Git integration builds a *preview* for a pushed branch and *production*
for `main`, within about a minute, with no `vercel` command. Preview and
production share one `DATABASE_URL`, and `npm run build` begins with
`node scripts/migrate-deploy.mjs` — so **a branch push applies its migrations
to the live database**, whatever the live site is running. So:

- **Ask before any push.** It is a deploy, not a backup.
- **Write migrations additively** — add columns with defaults, add tables,
  backfill; never drop or rewrite. A rollback must still find its data.
- To ship part of the work, put it on a branch cut from `origin/main`, check
  it there (`npx tsc --noEmit`, `npm run check`, `npx next build`), and push
  that to `main`. `vercel ls synora-shop` and `vercel inspect <url> --logs`
  show what ran.
- **The theme-store demos are data.** A deploy that changes a demo's
  catalogue is followed by `npx tsx scripts/seed-theme-store.ts --theme <slug>`
  against the live database — on the owner's say-so.

The hosting plan allows **one cron run per day**; a `vercel.json` carrying
anything finer is refused outright at deploy time.

See `docs/ARCHITECTURE.md` §10. *(Until 8 October 2026 this section said a push
does not deploy; that stopped being true when the Git integration was
connected.)*

---

## Reading further

This README says what exists. These say how it holds together and why.

- `docs/ARCHITECTURE.md` — the five questions every request answers, tenancy,
  caching, canonical hosts, the domain state machine, the line between
  identity and presentation, customers and their orders, payments, theme kits
  and deploying.
- `docs/FLOWS.md` — the journeys people actually walk: connecting a domain,
  changing what the store sells, closing the shop, setting its marks,
  importing a catalogue, being paid, choosing and editing a theme, and a
  customer buying and coming back.
- `docs/PANEL.md` — the admin panel screen by screen, as designed, with the
  measurements each screen was drawn to and the decisions behind them.
- `docs/THEMES.md` — what a theme decides, what the merchant decides, and what
  happens to each when the other changes; kits, copies, the theme store demos.
- `docs/LOOM.md`, `docs/KITE.md` — each theme, rebuilt from its Figma file:
  how it was read, measured and checked, every adaptation, what is open.
- `docs/DESIGN.md` — what a row, a field, a state and a colour mean here, and
  which checks hold each rule up.
- `docs/CHECKS.md` — all thirty-two guards, the bug each one exists because
  of, and the design-fidelity tools.
- `docs/QUEUE.md` — what is agreed and unbuilt, and the problems known about.
- `scripts/sweep/README.md` — the hundred probes and what they caught.

**Day records** — kept because the reasons are the expensive part, not the
diff:

- `docs/SESSION-2026-09-07.md` — domains, motion, the holding page, the guided
  type switch, the shop's marks, and an alignment audit of all 29 screens.

---

## Related

[`synora-shop-api`](https://github.com/synora-shop/synora-shop-api) is the
snapshot of the backend taken at the 2 September split. **It is not deployed and
nothing calls it**: this repository carries the whole running system — schema,
migrations, API routes, sign-in. Its schema is 28 migrations behind the live
database (9 October). The two are kept as separate repositories by decision.
