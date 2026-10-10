# Synora architectural concerns — plain language

After reviewing latest `synora-shop-api` and `synora-shop-ui`. This explains the review findings in simple terms.

---

## 1) API and UI disagree about the database shape

Think of the database as one shared filing cabinet.

- **UI** (the real storefront app) knows the new system: shops can “install” themes (`InstalledTheme`), pick which one is live (`ThemeSettings` with Loom/Kite), and store only merchant edits.
- **API** still looks like the old system: only old-style `ThemeSettings`, default theme name `"aurora"`, and **no** `InstalledTheme` table in its schema.

**Why that’s dangerous:** both projects can run “update the database” (`migrate deploy`). If the outdated API does that against the same DB the UI uses, it can try to reshape tables the UI already changed — like someone rearranging the filing cabinet with an outdated map. Today it’s mostly safe **only because the API isn’t really deploying that way**. The day it does, you can get broken shops or failed deploys.

---

## 2) Preview deploys can change the live database

When someone pushes a branch, Vercel (or similar) often builds a **preview**. In Synora’s setup, that preview often uses the **same production database**.

So a test branch can run migrations on the **real** shop data before the matching code is live. That already hurt them when theme names changed: DB was updated, but production code still expected old names.

**Fixes in plain terms:**

- Give preview its own throwaway database, or
- Don’t let preview run migrations, or
- Only run migrations on production with a human saying “yes.”

---

## 3) Fake “which shop am I?” headers (fixed, but don’t break it)

The storefront decides which shop to show from the request (domain / host).

Earlier, a client could send special headers (`x-shp-*`) and potentially make the server think “I’m shop B” while visiting shop A’s site — so you could see another merchant’s public storefront.

That’s fixed with `trustedHeaders()` in `proxy.ts`: only trusted/internal values count, not random client headers.

**If that fix regresses:** any visitor might view another shop’s storefront. Cross-tenant leak of public pages (still bad for privacy/branding/trust).

---

## 4) Docs lie / are outdated

Code moved on (Liquid themes gone, Loom/Kite now), but some docs still talk about:

- uploading Liquid themes / theme asset URLs (API docs),
- old theme names like aurora (UI README).

So a new engineer or a security reviewer can plan for a system that **doesn’t exist**. Wastes time and can cause wrong “fixes.”

---

## 5) Two different ways to draw a shop

- **Loom** = “kit” theme: its own React sections and page templates.
- **Kite** = older shared storefront + CMS page builder + styling tokens.

Same product, two engines. Every feature (preview, SEO, caching, customizer) often needs **two** implementations or special cases → more bugs, slower work.

---

## 6) Pages rebuild on every request (`force-dynamic`)

Instead of caching a finished HTML page for many visitors, most storefront pages say “generate fresh every time.”

Theme data is cached in the DB layer a bit, but the **HTML itself** is still rebuilt per request. Under lots of traffic, that’s more CPU/cost and slower than a cacheable storefront.

---

## 7) Anyone can open `?__theme=...`

There’s a URL query that lets you preview another theme copy for that shop.

Useful for merchants/admins. Problem: it’s **public**. Google (or anyone) can open those URLs. If crawlers index them, you get weird duplicate/preview pages in search, or people poking at unpublished looks. Not usually a cross-shop data leak (scoped to that shop), but messy for SEO and product polish.

---

## 8) Two apps that both think they own login / cron

Historically both `synora-shop-ui` and `synora-shop-api` had auth / API / cron-style routes.

If both are deployed, you can get **split-brain**:

- UI thinks you’re logged in one way,
- API thinks another,
- cron secrets / who can run jobs becomes unclear.

Like two reception desks giving different visitor badges for the same building.

---

## 9) “Shopify clone” is more idea than file-compatible

They copied Shopify *concepts* (themes, sections, templates), but:

- no real third-party Liquid theme upload,
- money often stored as whole units (e.g. cents vs dollars quirks — “no 19.99” style issues),
- templates are React/JSON-ish Synora things, not drop-in Shopify theme zips.

So marketing/docs saying “Shopify-compatible” can overpromise. It’s a similar *model*, not Shopify theme marketplace compatibility.

---

## 10) Almost no theme catalogue

Only **Loom** and **Kite**. Blog/restaurant themes were removed, but business types like blog/restaurant may still exist in the product — so those merchants can see an **empty** theme picker. Looks unfinished.

---

## 11) Default colors are still an old brand leftover

Under the hood, look is layered:

1. platform defaults
2. theme
3. merchant edits

Layer 1 still has an old leftover palette. If something doesn’t get overridden, shops can inherit “wrong brand” colors. Docs admit this as design debt.

---

## 12) API still lists old theme names in code

UI world = Loom / Kite (+ kits).  
API still has a registry talking about aurora / meridian.

Same theme system, two outdated maps. Confusing if anyone uses API code assuming it’s current.

---

## 13) Theme-store demos need a seed script

There’s a “theme store” / demo shops idea that depends on running `seed-theme-store.ts`.

Until that’s run, demos don’t look like proper theme demos — UI falls back to showing a normal merchant preview. So the marketing/demo experience is incomplete until ops remembers to seed.

---

## One-line mental model

| # | In one sentence |
| --- | --- |
| 1 | Two codebases describe different DB layouts for the same database. |
| 2 | Test deploys can alter production data. |
| 3 | Don’t let clients forge “which shop” headers. |
| 4 | Docs don’t match reality. |
| 5 | Two storefront engines = double maintenance. |
| 6 | Pages aren’t cached HTML; every hit rebuilds. |
| 7 | Theme preview URLs are publicly guessable/crawlable. |
| 8 | Two apps may fight over auth and jobs. |
| 9 | Shopify-like ideas ≠ Shopify theme files. |
| 10 | Almost no themes to pick from for some shop types. |
| 11 | Global default colors are stale. |
| 12 | API theme list is outdated. |
| 13 | Demo theme store isn’t seeded automatically. |

---

## Themes reminder (short)

| Question | Answer |
| --- | --- |
| Where stored? | Code in UI deploy + per-shop rows in Postgres |
| Which server? | `synora-shop-ui` (Next.js), not the API |
| Pre-downloaded? | No — shipped with the platform build |
| Shopify Liquid themes? | Deleted; React kits + registry data only |
| Biggest migrate risks? | Mitigated: UI production-only migrate gate + API no longer migrates on build |

---

## Severity: which ones are actually critical?

| # | Severity now | Why |
| --- | --- | --- |
| **1** Schema drift API vs UI | **Mitigated** | Schema still lags, but API `npm run build` no longer runs migrate; `migrate-deploy.mjs` refuses unless `ALLOW_API_MIGRATE=1` |
| **2** Preview migrates prod DB | **Mitigated** | UI `migrate-deploy.mjs` only migrates when `VERCEL_ENV=production` or `ALLOW_MIGRATE_ON_BUILD=1` |
| **3** Host-header forgery | **Not open Critical** | Already mitigated via `trustedHeaders()` in `proxy.ts`. Treat as **High if it regresses** |
| 4–13 | High / Medium | Debt, ops, product gaps — painful, not “can corrupt live DB / break all shops tomorrow” |

**#1 / #2 mitigation (shipped in code):** UI is sole production migrator; preview builds skip migrate; API build cannot migrate. Do not re-add migrate to the API build or remove the UI gate.

---

## Deeper dive: Critical #1 — two schemas, one database

### What’s different today

| | `synora-shop-ui` | `synora-shop-api` |
| --- | --- | --- |
| Schema size | ~2010 lines | ~1368 lines (~640 behind; QUEUE said ~99 earlier — gap has grown) |
| Migration folders | **68** | **40** |
| Latest migrations | through `20261106…` (theme templates, OTP, visits, …) | through `20261011…` (variant named options) |
| `InstalledTheme` | Yes (copies, tokens/layout/templates diffs) | **Missing** — never in API migrations |
| `ThemeSettings.themeKey` default | `"loom"` | `"aurora"` |
| Extra on `ThemeSettings` (UI) | `installedThemeId`, legacy `tokens`/`layout`, richer shape | Old simpler row |

Evidence: UI `prisma/schema.prisma` (`InstalledTheme`, `ThemeSettings`); API `prisma/schema.prisma` (`ThemeSettings` only, default aurora); UI `docs/QUEUE.md` (“schema is … behind… Harmless while nothing deploys from it”).

### How a deploy could blow up (before mitigation)

Both repos used to start `build` with migrate. The live DB history follows the
**UI**. If the lagging API ran `prisma migrate deploy` against that DB:
checksum/history mismatch (deploy fail) or a botched “fix” that drops UI
columns (`InstalledTheme`, etc.).

### Mitigation shipped

```text
# synora-shop-ui — gate inside migrate-deploy.mjs
"build": "node scripts/migrate-deploy.mjs && next build"
# migrates only when VERCEL_ENV=production or ALLOW_MIGRATE_ON_BUILD=1

# synora-shop-api — migrate removed from build
"build": "npm run seed:demo && next build"
# scripts/migrate-deploy.mjs refuses unless ALLOW_API_MIGRATE=1
```

Schema files may still diverge; that debt remains Medium until API is synced
or retired. The **migrate path** that made divergence Critical is closed.

---

## Deeper dive: Critical #2 — preview builds migrate the live DB

### The exact mechanism (before mitigation)

1. Pushing a **branch** → Vercel **preview** build  
2. Pushing **main** → **production** build  
3. Preview and production shared one `DATABASE_URL`  
4. Every build ran `prisma migrate deploy`  
5. Branch migrations hit live DB before production code shipped (seen 3 Oct 2026)

### Mitigation shipped

UI `scripts/migrate-on-build.mjs` / `migrate-deploy.mjs`:

| Condition | Behavior |
| --- | --- |
| `VERCEL_ENV=production` | Migrate |
| `ALLOW_MIGRATE_ON_BUILD=1` | Migrate (intentional escape hatch) |
| `VERCEL_ENV=preview` / unset / other | Skip (exit 0, no Prisma) |

| Action | Migrates live DB now? |
| --- | --- |
| Push feature branch with new migrations | **No** (preview skips) |
| Push `main` (production) | **Yes** (intended) |
| Local `npm run db:migrate:deploy` | Yes, only if you opt in |

Optional later hardening: separate Neon/Vercel Preview `DATABASE_URL`. Not required for this gate.
