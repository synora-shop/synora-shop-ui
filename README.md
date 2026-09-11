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
Two levels of navigation and no more. Ten flat sidebar sections that never
change shape, and a navigation bar whose tabs are decided entirely by which
sidebar section is selected. Both come from `lib/admin-nav.ts`, which is the
single source of truth for every address in the panel.

The sidebar is drawn in three bands, separated by space and nothing else — no
headings, no rules, nothing that collapses. A band is a gap between runs of
pills that answer different questions; every destination is on screen at all
times.

| | Sidebar | Tabs |
| --- | --- | --- |
| **Running the shop** | Home | Home · Store defaults |
| | Products | Products · Drafts · Categories · Orders · Enquiries · Bin |
| | Data | *(one screen)* |
| | Discounts | *(one screen)* |
| | Customers | *(one screen)* |
| | Analytics | *(one screen)* |
| **How it looks** | Your App | Pages · Drafts · Themes · Maintenance · Menus · Site text |
| | Preferences | Visibility · Fonts · Sticky buttons · Links & redirects · Custom fields |
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

Twenty-seven scripts, **3,076 assertions** at the last count. Those are static: they read the
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
