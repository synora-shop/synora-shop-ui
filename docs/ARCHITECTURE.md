# How this is put together

The parts that are not obvious from reading a file, and the reasons behind
them. `README.md` says what exists; this says how it holds together and which
decisions are load-bearing.

---

## 1. One request, five questions

Every request to this app answers the same five questions in the same order.
Where each is answered matters, because answering one in the wrong place is how
this codebase has produced its worst bugs.

| # | Question | Answered in | Costs |
| --- | --- | --- | --- |
| 1 | What kind of host is this? | `lib/shop-context.ts` · `classifyHost` | Pure string work |
| 2 | May this visitor see this area? | `proxy.ts` | Session token only, no database |
| 3 | Which shop is this, exactly? | `lib/data/shop.ts` · `resolveShopByHost` | One query, request-cached |
| 4 | Is the shop open to this visitor? | `lib/maintenance.ts` · `guardStorefront` | Cached settings |
| 5 | What data may this code see? | `lib/tenant.ts` via `db()` | Every query, automatically |

**`classifyHost` is pure and client-safe on purpose.** The form that takes a
custom domain needs the same rules the server enforces, and a hostname the form
accepts but the server calls "ours" is a domain a merchant can add, verify and
never be served on. That happened, with deployment URLs, because a second copy
of the rule did not know about them.

**`proxy.ts` makes no database call.** It runs on every request for every
asset. It decides from the host and the session token alone; the precise
lookup happens once, later, in the data layer.

---

## 2. Tenancy: the shop is never optional

`lib/tenant.ts` wraps Prisma so that a query cannot forget which shop it is
for. `db()` returns a client scoped to the request's shop, and it is what
data-layer code uses — never bare `prisma`.

Three model groups:

- **`TENANT_MODELS`** — every read is filtered by `shopId` and every create is
  stamped with it. A create that does not name a shop is refused rather than
  written loose.
- **`PROFILE_MODELS`** — `Page`, `ThemeSettings`, `Menu`, `MenuItem`. Also
  partitioned by *business type*, so a merchant who switches type and back
  finds their storefront exactly as they left it.
- Everything else — platform-level, and reached through bare `prisma`
  deliberately.

**A single-row write by unique id is checked with an extra read first**, because
Prisma will not accept `shopId` inside a unique `where`. One extra query per
single-row write is the price of not being able to update another shop's row by
guessing an id.

**What is *not* profile-scoped is a decision, not an oversight.** A shop's
logos were `ThemeSettings` tokens for most of this product's life, which meant
switching business type lost them. Identity is not style — see
`lib/brand-marks.ts` and §6.

---

## 3. Caching: per shop, per kind, dropped by whoever writes

`lib/data/cached.ts` and `lib/cache-tags.ts`. Six kinds — `settings`, `menus`,
`site-text`, `theme`, `fonts`, `buttons` — cached per shop for 300 seconds.

**Tags are scoped by shop.** A global tag would mean one merchant saving a menu
discarded every other merchant's cached pages, which at a few hundred stores is
most of the benefit gone.

**Every writer drops its own tag.** This is the rule that has broken twice, and
both times the symptom was a merchant editing a screen that would not change.
`scripts/check-cache.ts` now asserts the pairing: every kind's reader, its
invalidator, and every server action that writes a cached model.

**A script that writes straight to the database does not clear the cache.**
This trips up testing constantly: change a row by hand and the app goes on
serving the old value for five minutes. Either go through the action, or delete
`.next/cache` and restart. Noted here because it looks exactly like a bug.

---

## 4. Storefront routing and the canonical address

A shop can be reached at several hosts. Only one of them is real.

```
acme.shop.synoradigitals.com   the free address, always works
acme.com                       a custom domain, once VERIFIED or ACTIVE
www.acme.com                   another custom domain
```

- **`resolveShopByHost`** serves a custom domain only when its `Domain` row is
  `VERIFIED` or `ACTIVE`. A `PENDING` row is somebody having typed a name into
  a box; serving from it would let anyone claim any hostname whose DNS happened
  to point here.
- **A free subdomain that matches no shop falls back to the same table.**
  Renaming a shop moves its free address, and the merchant may choose to leave
  the old one resolving — see `docs/FLOWS.md` §3b. That row is what keeps every
  previously shared link alive, and `guardCanonicalHost` then redirects it.
- **`canonicalHost`** answers "which one is real" — the primary domain, falling
  back to the free subdomain, which is always present and always ours.
- **`guardCanonicalHost`** sends every other host to the canonical one with a
  **308**, permanently. A 307 tells a search engine to keep the old address
  indexed, which is the one thing this redirect exists to prevent.

Not done in `proxy.ts`, where a redirect would normally live, because mapping a
hostname to its shop's canonical domain needs the database and that file runs
on every request for every asset.

---

## 5. Domains: from typed-in to serving

`lib/domains.ts` (pure) · `lib/dns.ts` (lookups) · `lib/hosting/` (the vendor) ·
`lib/data/domains.ts` (the state machine).

```
PENDING ──DNS proves ownership + routing──▶ VERIFIED ──vendor serving──▶ ACTIVE
   │                                            │                          │
   └── 20 failed checks ──▶ FAILED              └──────── 3 failures ───────┘
                                                          demotes
```

- **Two DNS records.** A `TXT` at `_synora-verify` proves ownership; an `A` or
  `CNAME` proves it points here. Both, or it stays `PENDING`.
- **`DNS_TARGET.accepts` is a list, not a value.** Hosts move: the vendor
  issued one apex address for years and now issues another, and both route. A
  merchant whose apex was already correct was told their records were wrong,
  with nothing they could do about it. The instructions print the first; the
  checker takes any; the printed one is always in the list.
- **`lib/hosting/` is a seam.** Verifying DNS proves a merchant owns a domain;
  it does not make the domain work. Something must hold a certificate and route
  it. Three operations — add, remove, status — all idempotent, so moving vendor
  is a new file and an environment variable. `manual` is the default and does
  nothing, which is right for development and loudly wrong in production
  (`canIssueCertificates()` drives a banner on the screen).
- **A live domain survives three consecutive failures before it stops being
  served.** Demoting on the first would take a working store off its own domain
  because one DNS query was unlucky. Refusing to serve a domain that works is a
  far worse mistake than serving one whose records have just been removed.
- **`sweepDomains` runs on a schedule** (`/api/cron/domains`). Domains still
  being set up run on the backoff; live ones are re-checked so one that breaks
  is noticed rather than claiming to serve a store that has vanished.

---

## 6. Identity vs presentation

The line this product kept getting wrong.

**Identity belongs to the shop.** Its name, its logos, its favicon, its
address. `StoreSettings`, one row per shop, set on **Home** and nowhere else.
`lib/brand-marks.ts` holds four logo slots on two axes:

|  | light background | dark background |
| --- | --- | --- |
| **wide** | `logoUrl` | `logoDarkUrl` |
| **compact** | `logoCompactUrl` | `logoCompactDarkUrl` |

Only the first is ever needed. `pickLogo` walks a defined fallback order, so a
theme may ask for any combination and is never handed nothing. Where the order
is ambiguous — compact *and* dark, with neither uploaded — **shape beats
colour**: a wordmark that does not fit is illegible, one in the wrong tone is
merely wrong.

**Presentation belongs to the theme.** How tall a mark is drawn, whether it is
re-tinted, colours, type, shape. `ThemeSettings.tokens`, per business type.

The header renders **both** the wide and compact marks and lets CSS choose.
Measuring the window in JavaScript would ship one, hydrate, and swap — a
visible flicker on the first thing anyone sees of the shop.

---

## 7. Two switches, one page

A storefront can be shut for five reasons, and only two of them are the
merchant's to explain. `lib/maintenance.ts` decides which; `lib/holding-page.ts`
decides what it says.

| Reason | Whose words | Offers "tell me when you reopen" |
| --- | --- | --- |
| `maintenance` — the merchant flicked the switch | merchant's | yes |
| `paused` — the merchant shut the doors | merchant's | yes |
| `closed` — the store is finished | **ours** | no |
| `suspended` — we shut it | **ours** | no |
| `blocked` — this visitor's country is not served | **ours** | no |

Pausing and maintenance share one page deliberately. They are two switches but
one moment from a customer's side, and a merchant asked to write the same
notice twice writes one and lets the other go stale — which is exactly what
happened. `closed` is ours because someone waiting on an order needs to be told
to get in touch, not to check back later, and that is not a message to leave to
whoever wrote a holding page eighteen months earlier.

**Empty means "use ours", and is stored empty.** Seeding the current wording
into every row would freeze it there, so improving it later would reach nobody.
Fallback is per field: a merchant who writes a heading and no message keeps
their heading.

---

## 8. Server actions

Every mutation is a server action. The shape they all share:

1. `requireRole(...)` — never trust the screen. A hidden control is not a rule;
   the rule is where the write happens.
2. `rateLimit(...)` for anything public or expensive.
3. Validate with the **same pure function the form uses**, so a value the form
   accepts and the server refuses cannot happen.
4. Write through `db()`.
5. `invalidateShop(...)` for every cache kind touched.
6. `revalidatePath(...)` for the screens that show it.
7. `audit(...)` for anything someone might later say they did not do.

`scripts/check-server-actions.ts` holds step 1 up.

---

## 9. What runs on a schedule

`vercel.json`. **The plan allows one cron run per day**, and a deploy carrying a
finer expression is refused outright — which is how this was discovered.

| Path | When | Does |
| --- | --- | --- |
| `/api/cron/prune` | 03:17 daily | Deletes expired rows |
| `/api/cron/domains` | 04:43 daily | Checks every domain that is due |

Both gated on `CRON_SECRET`, and both **404** an unauthenticated caller rather
than 401 — a caller learns nothing about whether the path exists. With no
secret configured they refuse to run at all: a sweep that does not happen costs
storage, one that anyone can trigger is a denial-of-service lever.

The domain checker wants to be hourly. See `docs/QUEUE.md`.

---

## 10. Deploying

**A push to GitHub does not deploy.** Verified 7 September 2026: no build
fires, `synora-shop-git-main` stays where it was, and there are no GitHub
Actions. Every production deployment has been made from a machine with
`vercel --prod`.

**Deploying is what runs migrations** — `npm run build` begins with
`node scripts/migrate-deploy.mjs`. So the thing to ask about before doing is
the deploy, not the push. Pushing a commit that carries a migration is still
worth flagging, because it makes that migration run on whoever's deploy comes
next.

To deploy without shipping unfinished local work: clone to a scratch directory,
check out the approved commit, copy `.vercel/` across, and deploy from there.

---

## Reading further

- `docs/FLOWS.md` — the journeys a merchant actually walks.
- `docs/DESIGN.md` — what a row, a field, a state and a colour mean here.
- `docs/CHECKS.md` — every guard, and the bug each one exists because of.
- `docs/QUEUE.md` — what is agreed and unbuilt.
