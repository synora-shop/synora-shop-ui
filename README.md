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
Two levels of navigation and no more. Six flat sidebar sections that never
change shape, and a navigation bar whose tabs are decided entirely by which
sidebar section is selected. Both come from `lib/admin-nav.ts`, which is the
single source of truth for every address in the panel.

| Sidebar | Tabs |
| --- | --- |
| Home | *(one screen)* |
| Products | Products · Categories · Orders · Customers · Enquiries · Bin |
| Your App | Pages · Themes · Data · Menus · Discounts · Site text |
| Preferences | Visibility · Fonts · Sticky buttons · Links & redirects · Custom fields |
| Analytics | *(one screen)* |
| Settings | General · Domains · Account |

**Live customizer** — `app/(fullscreen)/admin/customize`
Split-screen visual editor with a postMessage protocol
(`lib/customizer-protocol.ts`) and schema-driven controls.

**Platform site** — `app/(platform)`, `app/merchant/*`
The marketing page and merchant sign-up.

---

## Business types

Three exist: `ECOMMERCE`, `RESTAURANT`, `BLOG`. A fourth, Service, is designed
and not built.

The type changes the words and the number of screens, never the look — a
restaurant's products are dishes and its categories are courses, resolved once
in `lib/themes/vocabulary.ts`. `data-business-type` is still set on the admin
root for that reason, but it no longer paints anything.

---

## Themes

Six, in `lib/themes/registry.ts`: aurora, meridian, quill, column, hearth,
service. They are **data, not files** — a theme is a set of options the app
already understands. Nothing is installed, imported, or made compatible with
any other platform, and there is no upload path for one.

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
```

---

## Deploying

`main` deploys to production on push and runs `prisma migrate deploy` as part of
the build. Vercel uses **one `DATABASE_URL` for both Preview and Production**, so
a migration on a preview branch reaches the live database. Write migrations
additively.

---

## Related

Backend API and data layer: [`synora-shop-api`](https://github.com/synora-shop/synora-shop-api)
