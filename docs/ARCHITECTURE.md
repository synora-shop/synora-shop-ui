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

## 8b. Taking money

Two directions, and they are not the same system.

**Payments** is how a merchant is paid by their customers. **Billing** is how
the platform is paid by merchants, and it is not built — see `docs/QUEUE.md`.

### The platform is not a party to a payment

A merchant holds the account with the provider. The provider settles into the
merchant's own bank. We hold the credentials needed to speak to the provider on
their behalf and nothing else — no cut, no float, no funds passing through a
platform account. That is the line between being software and being a payment
aggregator, and the schema is shaped to make crossing it deliberate rather than
accidental.

### The one rule

**The provider is asked, never told.**

A gateway's notification endpoint is public and unauthenticated. It has to be:
the provider's servers must reach it and cannot authenticate to us. So the body
of a callback is a claim by a stranger, and it is used for exactly one thing —
which reference to go and ask about.

`lib/payments/verify.ts` is the only code that can make an order paid. Three
independent paths call it and none of them decides anything itself:

| Path | When |
| --- | --- |
| The provider's callback | Whenever the provider says so |
| The customer's return to the site | Every load of the confirmation page |
| The daily sweep | Whatever the other two missed |

All three pass a reference and believe the answer. The answer comes from calling
the provider's own API with the merchant's credentials.

Five rules underneath, each of them a bug somebody has shipped:

- Only `lookup()` can produce PAID.
- The amount must match the frozen attempt, to the rupee — not the order, which
  can be edited afterwards.
- The currency must match.
- The confirmation is claimed with a conditional write, so two callbacks confirm
  once and everything downstream hangs off `count === 1`.
- Anything unclear — unreachable, unparseable, an unrecognised status — leaves
  the order unpaid. **Failing closed costs a support message. Failing open ships
  goods for free.**

For contrast: the most-used PayFast library marks an order paid on any POST that
merely contains a transaction id, and the field PayFast calls `SIGNATURE` is
filled with random hex by its own reference SDKs. There is nothing on a callback
to verify, which is why we do not try.

### Credentials

Sealed, not stored. AES-256-GCM, keyed from `PAYMENT_KEYS`, with the shop id and
provider bound in as additional authenticated data — so a row lifted into
another shop's id does not decrypt at all, rather than decrypting into somebody
else's money. `PAYMENT_KEYS` is `version:base64` pairs, comma separated; the
highest version seals new secrets and the older ones stay until every row is
re-sealed.

Nothing reads a credential back. There is no action, no API and no screen that
returns one. Replacing keys proves the new ones against the provider **before**
the old ones are touched, so a typo changes nothing — a "delete first" version
of the same feature breaks the checkout in the window between, and destroys a
working key when the new one is wrong.

### Four states a merchant keeps apart

| | Means | Reversible |
| --- | --- | --- |
| Connected | There are keys here | — |
| Switched on | Customers are offered it | Yes, keeps the keys |
| Live | Real money | Yes |
| Disconnected | The keys are erased | **No** |

Live is locked until a sandbox payment has confirmed through the same
verification path a customer's would. The test is done by the merchant buying
from their own storefront while signed in: a gateway in test mode is offered to
the shop's own staff and to nobody else. Nothing about the test is a special
case, which is the only kind of test worth having.

### Reservations

Stock is decremented when the order is written, before the customer has paid —
the alternative is two people buying the last item and one of them paying for
something that does not exist. So a gateway order carries a **thirty-minute**
deadline, and past it the order is cancelled and gives back all three things it
took: the stock, the discount use, and the redemption row that enforces a
per-customer limit.

Released on the paths that care — a checkout about to price the same stock, and
the merchant's own order list — because the plan allows one scheduled run a day,
and a thirty-minute hold swept daily is a day-long hold. The cron is the
backstop for shops nobody has visited.

### Adding a provider

`lib/payments/providers.ts` gains an entry and `lib/payments/` gains an adapter
with three verbs: `probe`, `start`, `lookup`. Nothing else changes. The engine
is provider-agnostic on purpose — the security is written once and every gateway
inherits it, rather than each new one arriving with its own version of the same
three mistakes. An adapter reports what a provider said and is never asked
whether to believe it.

---

## 8c. Themes

A theme is data, not a folder of components. It has always been three things —
which sections it offers, the colours it starts at, and who it is for — and it
is now four.

**The fourth was missing, and it was the important one.** Until 9 September a
theme was `tokens` and nothing else, and *no storefront component read the theme
at all*. Aurora and Meridian rendered byte-identical HTML: same header, same
card, same grid, same footer, differing only in CSS custom properties. A
merchant choosing between them was choosing a colour scheme with two names,
while the Themes screen offered it as a change of storefront.

So a theme also picks a **variant per structural slot** and switches on the
**behaviour** it wants:

| Slot | Variants |
| --- | --- |
| `header` | classic · centred · minimal |
| `productCard` | quiet · editorial · compact |
| `grid` | roomy · tight *(spacing only)* |
| `footer` | columns · band |

| Feature | What it does |
| --- | --- |
| `hoverSwapImage` | The card shows the next photo on hover. Pure CSS. |
| `quickAdd` | Add to basket from the grid — single-variant products only. |
| `stickyBuyBar` | Price and Add follow a long product page. Narrow screens only. |
| `swatchesOnCard` | The colours a product comes in, before it is opened. |

Every variant is written **once**, in the component that owns that slot. Adding
a theme still adds no components — the property the registry was built to
protect — but a theme can now genuinely be a different shop.

**Three layers, weakest first**, exactly as tokens resolve: the platform's
defaults, then the theme's, then the merchant's. The defaults are precisely
what the storefront did before this existed, so an untouched shop is untouched;
`check:themes` asserts that directly, including that Aurora arranges nothing.

`grid` sets spacing and not column count, on purpose. How many products fit
across a row is already a merchant setting in Preferences, and a theme that also
set it would be a second switch for one thing — the shape of bug
`lib/payment-methods.ts` exists because of.

Only the merchant's **differences** are stored, in `ThemeSettings.layout`.
Writing a resolved layout would freeze today's theme defaults into their row, so
switching theme later would change the colours and silently keep the old header.

### Adding a theme, and publishing it

Two acts, not one. The picker used to have a single button that changed the live
storefront, so browsing six designs was one click away from putting an untried
one in front of customers — and there was nowhere to keep a design being worked
on but not ready to show.

**Adding** puts a theme in the shop's library (`InstalledTheme`). Nothing is
copied and nothing is downloaded — every theme ships with the platform — so the
row records a merchant saying *this one is mine now*. It can then be previewed
and customised indefinitely without a customer seeing any of it.

**Publishing** is the separate act that changes the live store, and
`ThemeSettings.themeKey` remains the single answer to "which is live".

The guards, each of which is a state with no honest screen to show for it:

- A theme that was never added **cannot be published**, or the library is
  decoration and one click still changes the live store.
- The **live theme cannot be removed** — a shop rendering a theme it does not
  have.
- A theme for another business type cannot be added at all.
- Re-adding does not reset `installedAt`, because "Added 3 weeks ago" is how a
  merchant tells two half-tried designs apart.

The screen is three zones in the order a merchant thinks about them: what is
live, what this shop owns, and what exists. Publishing a theme moves the
previously live one **into** the library rather than losing it.

**A theme's edits belong to the theme, not to the shop.** They lived on
`ThemeSettings`, which is one row per shop per business type — so a merchant's
colours applied to whichever theme was live, and there was no way to work on a
second design without changing the first or the storefront. They now live on
`InstalledTheme`, which is what makes an unpublished theme editable: Atlas can
be worked on for a week while Aurora keeps serving customers, and switching
between them loses nothing either way. `?theme=<key>` on the customizer names
which one, checked against the shop's own library — a key nobody added falls
back to the live theme rather than quietly editing it.

**Only two themes ship.** Aurora, which every shop already runs, and Atlas, the
one that actually arranges the storefront differently. Meridian, Quill, Column,
Hearth and Service were removed on 10 September: all five were palettes, and
five recolours beside two real themes made the picker look full while offering
one genuine choice. The consequence, stated because it is not obvious — **there
are no blog or restaurant themes**, and those business types now see an honest
empty state. A restaurant deserves a design built for restaurants rather than a
shop's with the words changed.

**One cached read.** `cachedForShop` keys on the shop and the *kind* and nothing
else, so two calls under `"theme"` with different callbacks are the same cache
entry — whichever runs first wins and the second is handed the wrong shape. That
was harmless while the tokens and the layout used identical callbacks, and threw
`rows.find is not a function` on every request the moment one of them asked a
different question. There is one callback now, it returns both halves, and a
check counts the call sites.

Theme pictures live in `public/themes` and are shot from the **shop** page, not
the home page: the header, the card shape, the grid density and the colour are
the four things that differ between themes and are all on it, while a home page
in a shop without photography is mostly grey rectangles. A theme without a
picture falls back to a live frame of the merchant's own storefront.

---

### Sections

A page is an ordered list of sections, and there are **thirty-four kinds**, up
from twelve. Each declares its settings as data; nothing in the customizer is
written per section type.

A section type has to exist in **three** places, and each absence fails
differently:

| Missing | What happens |
| --- | --- |
| The `SectionType` enum | The picker offers it, the panel opens, **saving fails** |
| The schema registry | Nobody can configure it |
| The renderer's switch | It saves, and the page shows nothing where it sits |

The first is not hypothetical: twenty-two sections were written, type-checked
and rendered before anyone noticed none of them could be added to a page,
because the database column is an enum and nothing had told it. `check:sections`
asserts the three lists agree.

**An unconfigured section takes up no room.** Every renderer returns nothing
when it has nothing to show, but the frame around it still drew its own
padding — so a section added and not yet filled in left a 96px gap on the live
storefront, with no element to inspect because the gap *was* the element. The
stylesheet now collapses a section whose body came out empty, and the customizer
keeps showing it, named, so a merchant can still find the one they just added.

**Column classes are never built from a setting.** Tailwind ships only the
classes it can see in the source, so `` `sm:grid-cols-${n}` `` yields a class
that exists in the HTML and in no stylesheet — the section renders as one column
and the build says nothing. `sections/grid-classes.ts` is the shared answer, and
a check holds every section to it.

---

### The preview is a preview

The customizer shows the storefront in an iframe, and an iframe pointed at a
real site is a working browser window. Two things followed from that and both
were wrong:

- A merchant could **scroll it away** from the section they were editing.
- A merchant could **click a link and leave**. Clicking the shop's logo went to
  `/`, and the preview is served from the application host, where `/` redirects
  to `/admin` — so the admin panel loaded inside the preview pane, on the Home
  screen, which is where logos are changed. It read as "the customizer sends you
  to settings when you click the logo". It was an anchor doing what anchors do.

`components/storefront/preview-guard.tsx` closes both, and only inside the
preview: `overflow: hidden` on the document, links neutered, forms inert.

Two things it deliberately leaves alone. **Programmatic scrolling still works**,
because `overflow: hidden` does not stop it — so the customizer still brings the
section being edited into view, which is the only movement that is *about*
something. And **everything inside a section keeps working** — slideshow arrows,
accordions, tabs — because a merchant judging a section has to be able to
operate it. Only leaving is prevented, not using.

It does not `stopPropagation`, which is load-bearing: `PreviewSections` listens
on the same capture phase to tell the panel which section was clicked.

---

## 9. What runs on a schedule

`vercel.json`. **The plan allows one cron run per day**, and a deploy carrying a
finer expression is refused outright — which is how this was discovered.

| Path | When | Does |
| --- | --- | --- |
| `/api/cron/prune` | 03:17 daily | Deletes expired rows, releases expired payment reservations |
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
