# APP — web (`synora-shop-ui`)

The front half of **APP by Synora Digitals**: a hosted platform where a small
business signs up, picks the kind of business it runs, and gets a working store
with a public address, a catalogue, orders, and an admin panel to run it from.

The repository is named `synora-shop-ui` for historical reasons. The product is
APP, the admin lives at `app.synoradigitals.com`, and a merchant's free store
address is `<subdomain>.shop.synoradigitals.com`. No other brand name is in use —
see the naming guard in `scripts/check-naming.ts`.

---

## What's inside

**Storefront** — `app/(storefront)`
Catalogue, collections, product pages (`/p/[slug]`), cart, checkout, customer
accounts and order confirmation.

**Admin panel** — `app/admin`
Two levels of navigation and no more. Seven flat sidebar sections that never
change shape, and a navigation bar whose tabs are decided entirely by which
sidebar section is selected. Both come from `lib/admin-nav.ts`, which is the
single source of truth for every address in the panel.

| Sidebar | Tabs |
| --- | --- |
| Home | Home · Store defaults |
| Products | Products · Drafts · Categories · Orders · Enquiries · Bin |
| Your App | Pages · Drafts · Themes · Maintenance · Data · Menus · Discounts · Site text |
| Preferences | Visibility · Fonts · Sticky buttons · Links & redirects · Custom fields |
| Customers | *(one screen)* |
| Analytics | *(one screen)* |
| Settings | General · Payments · Domains · Account |

**Live customizer** — `app/(fullscreen)/admin/customize`
Split-screen visual editor with a postMessage protocol
(`lib/customizer-protocol.ts`) and schema-driven controls.

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

Six, in `lib/themes/registry.ts`: aurora, meridian, quill, column, hearth,
service. They are **data, not files** — a theme is a set of options the app
already understands. Nothing is installed, imported, or made compatible with
any other platform, and there is no upload path for one.

The storefront resolves three layers, weakest first: the platform's defaults,
then the chosen theme's tokens, then the merchant's own customizer edits, which
win. `?__theme=<key>` renders one request in another theme without activating
it, which is how the Themes screen previews one.

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

Four colours, defined once in `.admin-shell` in `app/globals.css` and used for
everything:

| | |
| --- | --- |
| `#d2d2d2` | the page |
| `#e0e0e0` | containers — nav bar, action bar, content, sidebar items |
| `#fafafa` | controls — anything you type into or press |
| `#6666ff` | the active state, and only the active state |

The sidebar glyphs are the drawn ones from the design source, in
`components/admin/nav-icons.tsx` — not a general-purpose icon set.

---

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
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
check:brand  check:address  check:payments
```

Twenty-four scripts, **2,280 assertions** at the last count. Those are static: they read the
source. `scripts/sweep/` is the other half — a hundred probes against a running
shop, for the faults reading the source cannot find. It found a CSV that could
run a formula on the merchant's computer and twenty-two controls a screen
reader could not name.

`docs/CHECKS.md` lists what each guard holds up and the bug it exists because
of. `scripts/sweep/README.md` covers the probes.

---

## Deploying

**A push to GitHub does not deploy this project.** No build fires and there are
no GitHub Actions; every production deployment is made with `vercel --prod`
from a machine. **Deploying is what runs migrations** — `npm run build` begins
with `node scripts/migrate-deploy.mjs` — so the thing to check before doing is
the deploy, not the push.

To ship a specific commit without carrying unfinished local work: clone to a
scratch directory, check out that commit, copy `.vercel/` across, and deploy
from there.

The hosting plan allows **one cron run per day**; a `vercel.json` carrying
anything finer is refused outright at deploy time.

See `docs/ARCHITECTURE.md` §10.

**One database for both Preview and Production.** Vercel is configured with a
single `DATABASE_URL`, so a migration on a preview branch reaches the live
database. **Write migrations additively** — add columns with defaults, add
tables, backfill; do not drop or rewrite. A deployment that rolls back to the
previous build must still find its data where it left it.

*(This section used to say `main` deploys on push. It does not, and has not for
as long as anyone checked — corrected 7 September 2026.)*

---

## Reading further

This README says what exists. These say how it holds together and why.

- `docs/ARCHITECTURE.md` — the five questions every request answers, tenancy,
  caching, canonical hosts, the domain state machine, and the line between
  identity and presentation.
- `docs/FLOWS.md` — the journeys a merchant actually walks: connecting a
  domain, changing what the store sells, closing the shop, setting its marks,
  importing a catalogue.
- `docs/DESIGN.md` — what a row, a field, a state and a colour mean here, and
  which checks hold each rule up.
- `docs/CHECKS.md` — all twenty-two guards, and the bug each one exists
  because of.
- `docs/QUEUE.md` — what is agreed and unbuilt, and the problems known about.
- `scripts/sweep/README.md` — the hundred probes and what they caught.

**Day records** — kept because the reasons are the expensive part, not the
diff:

- `docs/SESSION-2026-09-07.md` — domains, motion, the holding page, the guided
  type switch, the shop's marks, and an alignment audit of all 29 screens.

---

## Related

Backend API and data layer: [`synora-shop-api`](https://github.com/synora-shop/synora-shop-api)
