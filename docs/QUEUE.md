# What's queued

Agreed, not built. Newest at the top of each section. Plain language on
purpose — this is the list Abdul works from, not a ticket tracker.

---

## Next up

### 1. Element design, section by section

**Where:** every section. Not a layout pass — an *element* pass.

**The source:** the screenshots in `SHOP extra/Assestz/` are a **vocabulary of
element design, not a layout to copy**. They are a different kind of system;
what transfers is how the pieces behave and how alive they feel, never the
arrangement. `APP.ai` remains the authority on layout and on the four greys.

**What "element design" means here.** For each section, decide deliberately:

- what a **row** looks like, and what a **tile** looks like, and which of the
  two that section should default to
- which parts are **interactive**, and how they say so before being touched
- what **state** each element can be in — empty, loading, error, over limit,
  disabled — and what it looks like in each
- what carries a **figure**, and whether that figure needs a change-against-last
  and a trend beside it to mean anything
- what makes it **feel alive**: a count that moves, a status that is current, a
  thumbnail instead of a grey square

**Section by section**

| Section | The elements that need deciding |
| --- | --- |
| Home | the identity card, the logo drop, the address block |
| Products | the product row vs the product tile, stock and status marks, the bulk-select bar |
| Your App | the theme card and its live preview, the page row, the menu builder, the media tile |
| Preferences | the toggle, the country picker, the grouped setting card |
| Analytics | the stat tile, the chart frame, the ranked list, the live count |
| Settings | the field, the fieldset, the destructive action |

**Done so far in this pass**

- The **field** is settled: one label style, one text box. `Field` wraps its
  control and needs no id; `FieldLabel` is for the two cases it cannot wrap — a
  control with an info popover beside its label, and a caption over a group of
  controls like a gallery. The three ad-hoc label styles that were in the panel
  (uppercase 11px, a 12px flex row, a hand-rolled copy of `Field` at 12px) are
  gone from every admin screen and `check:naming` fails if one comes back.
- The **fieldset** is settled: a name and its explanation on the left, controls
  capped at a readable width on the right. Preferences and all of Settings are
  built from it, so a lone switch is no longer marooned an inch of white from
  its own words — inside a fieldset the switch goes first and hugs its label.
- The **destructive action** already had its shape (confirm by typing the store
  name, then a password); it now uses the same field as everything else.
- Settings itself is divided rather than merely spaced: *Customers* and *Global
  edits* are named rules, not gaps.

- The **product row and tile** are settled, and they are now one vocabulary in
  `components/admin/product-elements.tsx` — thumbnail, stock mark, status mark
  — used by the catalogue, the tiles and the Bin alike. The row reads as a
  table: name and collection on the left, then stock, then price and profit
  right-aligned in tabular figures, then state. Out of stock and low stock
  carry a colour *and* a word, so the one row that needs doing something about
  is the one that stands out; before, "0 in stock" and "148 in stock" were the
  same grey sentence. A product with no picture shows a glyph rather than a
  blank tinted box, which used to be indistinguishable from a failed image.
- The **Bin** shows the same row, dimmed, instead of a different-looking one,
  and both bins have a real empty state rather than a grey sentence in a box.

- The **media tile** is settled. Fifteen buttons used to be on screen at once
  — three under every picture — competing with the pictures, which are the
  content. The picture is the button now: clicking it copies the address, and
  says "Copied" where it happened. Opening and deleting recede until the tile
  is hovered, and stay put below the desktop breakpoint, because a finger has
  no hover and an invisible delete is no delete. The list view matches.
- The **demo seeder now fills the media library**, which was the one screen
  that stayed empty after seeding: a demo shop has never uploaded anything.
  The rows carry the same addresses the products carry, which is what a real
  library holds. They are self-marking (every address begins
  `https://picsum.photos/seed/`) so `--undo` still removes exactly what was
  added.

- The **theme card** now shows the shop wearing that theme, because choosing
  between two paragraphs of prose is choosing blind. The store's own preview
  fills the width it is given instead of sitting in the left half of it — the
  scale is measured rather than fixed at 0.42.

- The **bulk-select bar** exists. There was no way to do one thing to several
  products: publishing twelve was twelve trips into a product and back. Rows
  and tiles now carry a tick, and a bar rises from the bottom saying how many
  are selected, what can be done to them, and how to clear the selection. The
  work is one query rather than a loop of updates — a loop is one round trip
  per row to a database in another continent, and it can half-succeed — and it
  reports what actually changed rather than what was asked for, so "2 products
  published" when two of the four were already published is the truth.

- The **order screen** is done. It printed the database's spelling at the
  merchant — BANK_TRANSFER, AWAITING_VERIFICATION — while the list beside it
  had had human labels for months; it showed everything about an order except
  when it happened; its lines had no pictures; the address was four unlabelled
  grey lines with no way to email or ring the person; and the profit sat in
  brand blue as though it were a link. All fixed, and the delete is the shared
  danger button reading "Move to Bin", which is where it actually goes.

The element pass is finished. What each section's row, tile, figure and state
look like is decided and written down in code that a check keeps honest.

**One mismatch with APP.ai to fix in this pass**

The layout wraps every page in one panel container, and each page then draws its
action bar inside it. Both are `#e0e0e0`, so they merge into a single block.
APP.ai draws them as *separate* rounded containers with the page colour showing
between them — navigation bar, action bar, content, each its own shape. Fixing
it means the layout stops wrapping and each screen supplies its own containers,
which touches all 22 screens, so it belongs here rather than in a passing edit.

**The rules that do not move**

- Four colours: `#d2d2d2` page, `#e0e0e0` container, `#fafafa` control,
  `#6666ff` active and nothing else.
- The references use five pastel tints because they have five accents. We have
  one — tint with `#6666ff` at low opacity on `#fafafa`, never a second hue.
- Colour means *selected*. It never means "this tile is the orange one".
- Status colours (green, amber, rose) are reserved for state and always carry a
  word or an icon, never colour alone.

### 2. ~~Switching APP type must go through pausing the store~~ — done 7 Sep

The rule is `lib/store-type-switch.ts`: a paused store may switch, an open one
may not, and a suspended one is ours to lift rather than theirs to pause out
of. It is enforced in the server action, where the write happens — the dialog
hiding the choice is a courtesy, not the rule. Proven by forcing the disabled
form to submit from the browser console: the server refused and the type did
not change.

The dialog says why the choice is not offered and carries the one button that
would change that. Pausing from inside it does not reload the panel, because
the merchant is mid-decision.

Both doors — the top bar and Settings — now go through one action. Two actions
that both write `businessType` is two rules waiting to disagree.

---

## Agreed, waiting

- **Analytics**: real graphs and live figures, and its own action bar.
- **Action bars tailored per section** — each section's own actions, not a
  generic row.
- **Restaurant panel**: its own design. Different sections, different screens,
  its own naming. Opening hours, Locations and the food menu come back with it.
- **Blog panel**: same — Posts redirects until it exists.
- **Service business type**: named in the documentation, no design and no code.
- **Billing**, as a Settings tab.
- **Security & privacy** as its own Settings tab: login locations, an
  authenticator app, a recovery phone number.
- **Theme versions** (1.4.2) and an update-to-latest button.
- **"Direct me to the cause"** on every error that blocks an action.
- **The Data library as the picker** wherever a picture can be changed,
  including inside the live customizer.

---

## Where the rules are written down

- `docs/DESIGN.md` — what a row, a field, a state and a colour mean here, and
  which check holds each rule up. `npm run check:design` asserts the document
  still describes the code: every check it names must exist and every file it
  points at must be there.
- `README.md` — how the thing is put together and how to run it.
- `scripts/sweep/README.md` — the hundred probes and what they caught.

## The sweep — 7 September

A hundred probes against a live shop, in ten batches: what a stranger can
reach, whether one shop can touch another, what a customer can see, files that
lie about what they are, input that is trying it on, a dishonest checkout, the
arithmetic, the guards and caches, what a screen reader finds, and whether
each screen's own numbers hold. `scripts/sweep/` runs them again.

**Two real faults, both fixed:**

1. **A cell in an exported CSV could run as a formula.** Excel and Sheets
   execute a cell starting `=`, and a customer types their own name and
   delivery note at checkout — so a stranger's text was reaching the
   merchant's own spreadsheet. Cells are defused on the way out and restored
   on the way in, so a round trip is still lossless.
2. **Twenty-two form controls had no name a screen reader could read** — a
   placeholder only, which vanishes as you type, in a panel whose own code
   says "placeholders are not labels". All 25 screens are clean now.

**Three of the failures were the probes, not the product** — worth recording
because they are easy to repeat: a plain `fetch()` of an admin screen gets the
login page (nine probes were grading login HTML); the analytics screen opens
on the last thirty days, so an all-time total is a different number; and the
checkout delivers to ten Punjab cities, so a probe using Karachi was refused
for the city and passed for the wrong reason.

## Done on 7 September

- **Import and export for customers and orders.** Products could do both;
  customers and orders could do neither. Both now use Shopify's own columns.
  The order half matters most: Shopify exports orders and cannot read them
  back, which is exactly how a merchant loses their history when they move.
  Importing an order sends nothing, moves no stock, keeps the date it
  happened, and skips anything already here rather than rewriting it.


- **The Currency setting is read.** Every price on every screen was printed by
  `formatPKR`, which hard-coded rupees, in a product whose Settings offered
  nine currencies. Now: one `formatMoney(amount, currency)`, a context both
  layouts provide so client components need no prop threading, and
  `getCurrency()` for the server ones — including the order emails and the push
  notification, which is the half a customer would have seen.


- **The admin search showed nothing.** It was rendered inside a 288px dropdown
  with `overflow: hidden`, so twelve results were found, rendered, and clipped
  out of sight. It is its own overlay now, opened by the button, by "/" or ⌘K.
- **The top bar was not sticky and the mark was.** `overflow-x: hidden` on the
  page made it a scroll container, which silently disables `position: sticky`
  for everything inside it. Both rules are `overflow-x: clip` now, and the
  product mark lives in the bar rather than floating over the page.
- **Import.** The panel could write a Shopify product CSV and not read one.
  There is a reader now, exactly inverse to the writer and proven by a
  round-trip test; two steps, so nothing is written before a merchant has seen
  what would change.
- **Policy pages.** Returns, privacy and terms, offered rather than created,
  each a draft in plain words with every decision left in square brackets, and
  unpublished until somebody has read it. Deliberately not written to look
  finished: a policy that reads as though a lawyer wrote it, when none did, is
  the dangerous kind of placeholder.
- **The store type gate.** An open store cannot change what it sells; it
  pauses first. Enforced in the action, not the dialog.
- **Editable page addresses**, with forwarding, menus following the move, and
  the address suggested live from the page's name. Needed a migration: a
  system page was identified by its slug, so its address could not be changed
  without hiding it from the route that renders it. It has a `systemKey` now.

## Known problems

- ~~**Activating a theme did nothing at all.**~~ Fixed 6 September. The Themes
  screen wrote `themeKey` and no code anywhere read it, so switching to
  Meridian changed a database row and not one pixel — while the screen said
  "switching keeps your colours, fonts and content, only the layout changes".
  The storefront now resolves three layers: the platform's defaults, then the
  chosen theme's tokens, then the merchant's own customizer edits, which still
  win. `?__theme=` is read too, so a theme can be previewed without activating
  it; it lives in one request and is never stored. **A shop on Aurora sees no
  change** — Aurora's tokens are empty by design, so it is the platform
  default under another name. Only a shop that had chosen Meridian changes
  appearance, and it changes to the thing it asked for.

- ~~**A shop that changed business type wore the wrong theme.**~~ Fixed 6
  September. The theme row is keyed by shop *and* business type, but the
  storefront read it with `findFirst({})` — whichever row came back first — so
  a shop that had been a restaurant and became a shop was served the
  restaurant theme's colours. It now reads its own type's row, and changing
  type drops that shop's whole presentation cache instead of leaving the old
  kind of shop on screen for five minutes.
- ~~**`scripts/check-cache.ts` did not exist.**~~ Written 6 September.
  `lib/cache-tags.ts` had claimed since it was written that a script asserted
  the pairing between what is cached and what drops it — calling a forgotten
  tag "the worst bug this admin has had". Nothing checked it. It does now: 25
  assertions covering every kind's reader, its invalidator, and every server
  action that writes a cached model.

- **The domain checker runs daily, and wants to run hourly.** Vercel's Hobby
  plan allows one cron run per day and refuses a deploy carrying anything
  finer — the first attempt failed with exactly that. So `/api/cron/domains` is
  `43 4 * * *` in `vercel.json`. The backoff in `lib/domains.ts` starts at a
  minute and doubles, which only means something on an hourly schedule; on a
  daily one the schedule decides, not the backoff. **The day this moves to Pro,
  change that one line to `43 * * * *`.** Nothing else assumes either, and the
  comment at the top of the route says the same. What daily costs: a merchant
  who fixes their DNS at midnight goes live the next morning rather than within
  the hour, unless they press Check now.
- **Prices are whole units of the currency.** `basePrice: 5500` means 5,500
  rupees, not 55.00. That fits PKR, which has no minor unit in practice, and
  does not fit dollars: a merchant cannot price something at 19.99 today. The
  fix is to store minor units everywhere and migrate every existing row, which
  is a decision of its own rather than something to slip into a formatter.
  Until then the currency is right and the precision is not.
- **The store type can be changed with one click, ungated.** Settings → What you
  sell switches a live store instantly. Queue item 2 says it must require the
  store to be paused first; that gate is not built yet, so the loophole is open
  in production today.
- **`synora-shop-api`'s schema is ~99 lines behind this repo's.** Harmless
  while nothing deploys from it; a real failure the day something does.
- **Image upload does not work locally** — no `BLOB_READ_WRITE_TOKEN` in
  `.env`. Pasting a URL still works.
- **A script that writes straight to the database does not clear the cache.**
  Shop settings are wrapped in Next's data cache with a 300-second life, kept on
  disk in `.next/cache`. So `seed-demo.ts --hide` / `--show` appears to do
  nothing for up to five minutes, and a server restart does not help. Either
  wait, or delete `.next/cache`. Anything writing settings from outside the app
  needs to invalidate the tag the way the server actions do.

## Domains — what a real test found, 7 September

Tested end to end against real DNS and the real screens: added
`shop.norishba.com` on the dev branch, read the records it asked for, pressed
Check now, promoted it, made it the main address, served the storefront on it,
and removed it again. Routing, the primary switch, the redirect and the
clean-up all do what they claim. Production has `HOSTING_PROVIDER`,
`VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` and `VERCEL_TEAM_ID` set, so the call to
the hosting vendor in `lib/hosting/vercel.ts` is wired to something real.

Three faults, all three fixed the same day:

- ~~**Nothing checks a domain unless a person presses the button.**~~
  `lib/data/domains.ts` says in three places that "the checker runs on a
  schedule". There is no schedule: `vercel.json` runs only the nightly prune,
  and `verifyDomain` has exactly one caller — the Check now button in
  `components/admin/domain-manager.tsx`. So a merchant who fixes their DNS
  overnight is not brought live until they come back and press it, and once a
  domain is live the button disappears entirely, which means a domain that
  later breaks keeps saying "live" forever. `backoffMs` and
  `MAX_AUTOMATIC_CHECKS` were written for a caller that does not exist.
  `sweepDomains` and `/api/cron/domains` are that caller, hourly. Domains still
  being set up run on the backoff; live ones are re-checked every six hours so
  one that breaks is noticed. A live domain now survives three consecutive
  failures before it stops being served — demoting on the first would take a
  working store off its own domain because one DNS query was unlucky. Check now
  is offered on live domains too.
- ~~**The apex A record we hand out is Vercel's old address.**~~ `DNS_TARGET.a` is
  `76.76.21.21`; Vercel now issues `216.198.79.1`. Both still route — both were
  tested with a Host-header request — but `checkRouting` in `lib/dns.ts`
  accepts only the one exact string, so a merchant whose apex is already on
  Vercel's current address is told their records are wrong and can never get
  past it. `norishba.com` was exactly that case. `DNS_TARGET.accepts` is now a
  list — the instructions print the first, the checker takes any of them, and
  the printed one is always in the list. `norishba.com` now reports correctly
  that only the TXT record is missing.
- ~~**The redirect from the free address to the main one is temporary.**~~
  `guardCanonicalHost` in `lib/canonical.ts` says it redirects "permanently"
  and emits 307 (measured). A search engine reads 307 as "keep the old address
  indexed", which is the one thing the redirect exists to prevent. Now
  `permanentRedirect`, measured at 308.

Untested, because it needs a domain whose DNS can be changed: whether Vercel
accepts a CNAME to `cname.shop.synoradigitals.com`, issues the certificate, and
flips the domain from VERIFIED to ACTIVE.

## Motion, 7 September — step 1 of three

Asked for: animation across the whole panel — buttons, every interactive item,
errors, redirections — restrained rather than expressive. Steps two and three
are the maintenance page and the guided store-type switch.

What was already right: every button, link and `[role="button"]` has scaled on
`:active` from one base rule for a long time, with `.no-tap-scale` as the
opt-out for full-bleed rows, and the top-of-page progress bar has acknowledged
every link click since it was written. The gaps were the things that appeared
and vanished with no motion at all, and one of them was an accessibility fault
rather than a cosmetic one.

- **Errors were silent as well as sudden.** Nineteen screens across the admin,
  the customizer and the storefront had each written their own rose paragraph,
  and most carried no `role` — so a screen reader announced nothing, and a
  merchant who could not see the message watched the save do nothing, twice,
  forever. They all go through `FieldError` now: `role="alert"`, and
  `.notice-in`, which opens its own height so the form below slides rather than
  being shoved.
- **Dialogs and toasts appeared and vanished.** `.scrim-in` / `.dialog-in` for
  a dialog opening; `.toast-in` / `.toast-out` for a message, which is now
  marked leaving, plays its exit and is removed when it finishes — the removal
  timer and the CSS duration are asserted equal, because a short timer blinks
  it out and a long one holds its neighbours down.
- **A navigation this app started itself showed nothing.** The progress bar
  listened for anchor clicks only, so every `router.push` — signing in, saving
  a product, jumping from search, switching page in the customizer — left the
  screen looking dead. `startNavProgress()` covers those. The one deliberate
  omission is the list filter, which replaces the URL on every keystroke.
- **`.attention`** is new and unused until step three: the five-second grow,
  shrink and ring played on the single control a merchant has been sent to
  find. Nothing else in the product may use it — an attention animation that
  appears twice has stopped answering "where?" and started decorating.

`check:motion` holds all of it: every animation class is switched off under
`prefers-reduced-motion`, everything that starts hidden is restored to visible
there, no screen hand-writes an error line, and the toast's two durations
agree. 297 assertions, and it found eight files the first sweep missed.

## The holding page, 7 September — step 2 of three

Asked for: a maintenance section of its own under Your App, with a way to
change what the page says, and the toggle out of Preferences.

The thing that was actually wrong was not the toggle's location. **Pausing a
store and turning maintenance mode on showed customers two different notices**,
both hard-coded in the storefront's source, and nothing on either screen said
the other existed. A merchant who paused for the afternoon could not see what
their customers were being shown, let alone change it.

One page for both now, and the wording is theirs:

- **`/admin/maintenance`**, a tab in Your App between Themes and Data. The
  switch, the words, the logo, a live preview, and the waiting list, on one
  screen — because they are one decision.
- **Per-field fallback.** Empty means "use ours", stored empty rather than
  seeded with today's copy, so improving the default still reaches every shop
  that never wrote its own. A merchant who writes a heading and no message
  keeps their heading.
- **Closed, suspended and blocked keep our wording and are not editable.** A
  store that has shut for good must not tell someone waiting on an order to
  check back later, a suspension is not the merchant's to explain away, and a
  blocked visitor is not waiting for anything — the store is open, it just will
  not serve them.
- **"Tell me when you reopen"**, off by default. Its own table, not Customer:
  a Customer has a required name, an address book and an order history, and a
  visitor who typed one field into a holding page has none of that. Writing
  them into Customer would have meant inventing a name and putting people who
  never bought anything into every count and export. Gated on the store
  actually being shut, on the merchant having turned it on, on the honeypot and
  on a rate limit; never says whether an address was already there; signing up
  twice does not move the consent timestamp.
- **The toggle did not stay behind.** maintenanceMode was removed from the
  Visibility type, its form and its save action outright. A copy left there
  would have been worse than a duplicate control — that form writes every field
  it holds, so a merchant who turned the holding page on and later saved a
  blocked country would have silently reopened their store.
- **A paused shop is told the truth.** The screen says "your store is paused,
  so customers are seeing this page already — whatever this switch says", and
  switching maintenance off while paused no longer claims the store is visible.
- **ToggleSwitch gained a `disabled` state.** A switch whose change is a server
  round trip could be clicked twice, and the two writes raced. On a switch that
  takes a storefront off the internet that is not cosmetic.

`check:holding` — 68 assertions covering whose words are whose, the per-field
fallback, the schema defaults agreeing with the app's, every gate on the public
endpoint, and the switch existing in exactly one place.

Still to come, step three: the guided store-type switch — the refusal that
takes you to the pause button and lights it up.

## The guided type switch, 7 September — step 3 of three

The last of the three. `typeSwitchGate` already refused an open store and was
already enforced at the write, so nothing here is about the rule. It is about
the twenty seconds after the rule is stated.

"Pause it first" is true and useless on its own: the pause button is on another
screen, under a heading the merchant has never opened. So:

- **The refusal carries two ways out.** "Pause my store" for someone who
  already knows what that means, and "Show me where" for someone who does not —
  and who should come away knowing where the control lives for next time.
  Telling only the first kind is how a refusal becomes a dead end.
- **`lib/spotlight.ts`** carries the hint across the navigation as
  `?show=pause`. The screen that receives it scrolls the control into view,
  centres it, plays `.attention` for five seconds, and then removes the
  parameter — left in the URL it would replay on every reload and travel with
  any copied link.
- **Pausing offers the page it just put up.** Three answers, not two: Cancel,
  "Just pause it", and "Pause and edit the page", which pauses and then goes to
  the holding-page editor from step two. Only on success — a merchant sent
  there after a pause that failed would be editing a page nobody is seeing.
  Pausing from inside the type dialog skips that confirmation, so that path got
  its own line pointing at the same screen.
- **Closed and suspended get the refusal without the link.** Pausing does not
  fix either, and pointing at the button would send someone to press a control
  that changes nothing.

Three faults in my own work, all found by driving it rather than reading it.
The class was left on the control for the life of the screen; fixing that
naively then stripped it a frame after it went on, because clearing the
parameter re-ran the effect and its cleanup; and `.attention` was matched by a
comment on the analytics screen about a number competing for attention. The
hook now reads the parameter once on arrival and never again, which is also the
honest description of what a hint is.

`check:spotlight` — 31 assertions, including that `.attention` still has
exactly one user. It is the loudest thing in the product and only works while
it is rare.

## The shop's marks, 7 September

Asked for: a favicon on Home in the formats that actually work, logos for dark
and light and for phone and desktop, themes that read this screen and choose
between them, and logos changeable nowhere else.

The reason it had to move, which was not the reason asked for: **logos were
theme tokens, and theme tokens are stored per business type.** A merchant who
switched from a shop to a restaurant lost their logo, and lost it again
switching back. The same company, the same artwork, two storefronts each
holding half of it. A logo is identity, not style.

- **`lib/brand-marks.ts`** — four slots on two axes (wide or compact, light or
  dark background) plus the favicon, on `StoreSettings`. `pickLogo` walks a
  chosen fallback order so a theme may ask for any combination and is never
  handed nothing. Shape beats colour at the one ambiguous step: a wordmark that
  does not fit is illegible, one in the wrong tone is merely wrong.
- **The migration carries every existing logo across**, and its first draft did
  not. It preferred the live business type before it preferred a row that
  actually had a logo, which silently lost the artwork of every merchant who
  uploaded it under a type they had since switched away from. Logo and favicon
  are picked independently now, presence before type. Five cases, tested
  against the database.
- **A shop with no logo showed *this platform's* artwork in its header** —
  `/logo.svg`, on every storefront that had never uploaded one — while Home
  told the merchant their store name would be used instead. It is the store
  name now, set in the storefront's own heading face.
- **The favicon is restricted to SVG, PNG and ICO.** WebP is the trap: it
  previews perfectly in the panel and draws a blank square on a tab. The rule
  is on the picker, on drop (an `accept` attribute is a filter, not a rule),
  and in the action.
- **The theme panel's logo and favicon uploads are gone**, and the settings
  search no longer sends someone typing "upload logo" to the one screen that no
  longer has it. What the theme keeps is how tall a mark is drawn and whether
  it is re-tinted — presentation, which is its job.

`check:brand` — 182 assertions, including that no screen other than Home writes
a mark.

**Home was also the last screen on the layout Fieldset replaced.** Two cards in
a two-column grid, each stretched across a 1500px panel around a form a third
that wide, ending at different heights because nothing made them agree. It is
Fieldset now, like the other eight.

## The alignment audit, 7 September

Every screen measured in a browser and cross-checked against the source. What
was already right, and worth recording because it was measured rather than
assumed: **every screen's sections start and end at exactly the same place**
(262px and 1458px in a 1512px window), and **no screen has ragged card
bottoms** — the fault Home had.

Two of my own first measurements were artefacts and were thrown away: an
apparent 16px width difference on Analytics was a probe stopping at different
depths on different screens, and a section-finder anchored on `.bg-panel`,
which also matches sidebar buttons, found nothing on 25 of 26 screens.

Fixed:

- **Four styles were naming the same thing.** 14px medium, 14px semibold, 12px
  semibold uppercase, 12px medium uppercase — and on Your App → Themes, two of
  them a few hundred pixels apart. Five more headings were written as `<p>`, so
  nothing in the page outline knew they named anything. `CardTitle` and
  `GroupLabel` are primitives now, and `check:design` stops the four returning.
- **The gap between sections was six different values.** Standardised on
  `space-y-2.5` across thirty-three screens and five screen-level components.
  Analytics was the only one where it showed (12px against everyone else's 10);
  the rest was latent, waiting for a second section to be added.
- **Site text rows read as cut off.** The value box stopped 290px short of the
  rule beneath it. The cap is right — a field the width of a window is harder
  to read — but it is 4xl now rather than 2xl, so the remaining gap is
  ordinary padding and is where the save button appears.

Investigated and cleared, not faults: **Custom fields** (262/538) is a
deliberate master–detail layout, and **Menus** (262/279) is an inner row
container inside a card, which the probe's nesting filter did not catch.

Still open, and small: **Enquiries** uses an 8px gap between list rows, and
**Account** has one 35px gap inside a nested block. Both are inside a card
rather than between sections, so neither is covered by the rule above.

## Billing, 8 September — on hold, deliberately

Asked for as one of two new Settings tabs. **Not built, and no tab shipped**,
because the merchant wants full billing with a real payment provider and has
research to do first. A tab explaining why it is empty is still an empty tab.

What exists to build on: `ShopStatus` already carries `TRIAL`, `ACTIVE`,
`PAST_DUE` and `SUSPENDED`, added in advance for exactly this, and the schema
says so at line 29. There is no plan model, no prices, no provider.

What it needs before it can start: which provider, what the plans are called,
what they cost, what a trial ends into, and what happens on a failed payment —
`PAST_DUE` exists but nothing moves a shop into or out of it.

Worth saying now that card payments are built: **none of that engine is reusable
here**. It is built to hold a merchant's credentials and never touch the money,
which is the opposite of what billing needs. Billing needs an account in the
platform's name, and that needs the registration.

Not to be confused with **Payments**, which shipped: that is how a merchant
takes money from their customers, and it is the other direction.

### The research so far — two money flows, 8 September

A payment-architecture note came back from the merchant's own research
(`Synora_Digitals_Payment_Integration_Transcript.docx`). Its central point is
right and is already the shape of this codebase: there are **two** flows, they
point in opposite directions, and only one of them needs a registered company.

- **Merchant payments** — a shopper pays a merchant. A gateway such as Payfast
  passes the money straight to the *merchant's* bank account under the
  *merchant's* own gateway account. The platform is software, never a party to
  the payment, so the platform needs no registration to build or ship it.
- **SaaS billing** — a merchant pays Synora. Money lands in a Synora account,
  which needs a registered entity, an NTN and a business bank account before a
  provider will open a merchant account at all.

Three things the note leaves out that decide how the code is written:

1. **Pass-through is a rule to enforce, not a description.** The moment a cut is
   taken or funds touch a platform account, this stops being software and starts
   being an aggregator. Merchant credentials in, money never through.
2. **A gateway key is not an account detail.** The four methods that shipped are
   text a customer reads. A gateway carries a secret: encrypted at rest, never
   sent to a browser, never logged, never echoed back into a form.
3. **A return URL is not a payment.** An order may only be marked paid by a
   signed server-to-server notification, verified and idempotent on the
   provider's transaction id. Trusting the shopper's redirect is the standard
   way these are robbed.

Also implied: `ALL_PAYMENT_METHODS` currently models *offline* methods only —
`detailsField` is a line of text to show. An online gateway needs a payment
record of its own (attempt, provider reference, amount, status, raw payload)
kept apart from order status, because an attempt can fail without the order
changing.

Sequencing that follows from it: the sandbox needs no registration, so merchant
payments can be built now; billing can start on manual invoices driving the
`ShopStatus` values that already exist, and only needs a provider when it should
charge a card by itself.

## Card payments, 8 September — built

Merchant payments, the half that needs no company registration. Built as an
engine plus one adapter, so a second provider is a small file rather than
another chance to make the same mistakes.

**What is done and holding:** sealed credentials (AES-256-GCM, bound to the shop
and provider), a single verification path that asks the provider rather than
believing a callback, amount and currency compared against a frozen attempt,
conditional claim so concurrent callbacks confirm once, thirty-minute stock
reservations that give back the discount and the redemption row as well as the
stock, a go-live gate that only a real sandbox payment can open, and 84
assertions in `npm run check:gateways` holding all of it up.

**Deployed 8 September**, commit `48e12a7`, aliased to app/shop/*.shop
.synoradigitals.com. Both migrations applied — the checkout renders its payment
list on every request and reads the `PaymentGateway` table to do it, so a
missing table would be a 500 rather than a 200.

**`PAYMENT_KEYS` is not set in production yet**, deliberately: setting a
production secret needs the merchant's own hand. Until it is, the Payments
screen says card payments are not configured and refuses to accept a key, and
`offerableGateways` returns nothing — so no storefront is affected in any way.

    printf '1:%s' "$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")" \
      | npx vercel env add PAYMENT_KEYS production

### The real API reference, 9 September

The merchant opened a PayFast account, and their documentation — which returns
403 to anyone without one — settled three things this integration had guessed
wrong from the public SDKs.

| | Guessed from SDKs | PayFast's own docs |
| --- | --- | --- |
| Token | `GetAccessToken`, uppercase params, reads `ACCESS_TOKEN` | `POST /token`, lowercase, **`customer_ip` required**, reads `token` |
| Status | Basic auth, `?basket_id=` | `GET /transaction/basket_id/<id>`, **Bearer**, needs `order_date` + `customer_ip` |
| Success | `00` / `SUCCESS` / `PAID` | `00` Processed OK **and `79` Alternate Success**; `001` Pending, `002` Time Out |

**Code 79 is the one that mattered.** A guess that misses it reads a genuinely
paid order as unrecognised and leaves it unpaid — the failure mode that costs a
merchant a real sale rather than a support message.

Two consequences beyond a find-and-replace. `order_date` and `customer_ip` have
to be **recorded when the customer is sent to pay**, because neither can be
recovered afterwards — hence the `20261022000000_payment_lookup_context`
migration. And PayFast's status response carries **no amount at all**, so the
rupee-exact comparison cannot run on it; what stands in its place is that the
amount is bound when the token is minted, server-side, for one basket and one
figure. An amount that *is* reported is still held to exactly, and a
confirmation that went through without one is recorded as
`amount-not-reported` so it stays answerable.

### The whole reference is the wrong integration, 9 September

Thirty-three screenshots of PayFast's API reference, read end to end. The
sidebar is complete and there is **no hosted checkout in it at all**: token,
refresh, banks, instruments, customer validation, initiate transaction, temp
token, tokenized transaction, permanent instruments, OTP, recurring, refund,
status. That is the whole of it.

Every path that takes money in that list requires the merchant's own server to
send `card_number`, `expiry_month`, `expiry_year` and `cvv` — or an account
number and a CNIC. **Hashed Parameters** confirms it from the other direction:
every hash it defines is built out of card or account numbers, HMAC-SHA256 with
a key PayFast issues separately, sent as `secured_hash`.

**This platform must not build that.** A shop whose checkout page touches a card
number is inside PCI-DSS scope, and putting a merchant there without them
understanding it is not a technical trade-off to weigh — it is a liability they
did not agree to. The point of the redirect model is that the card is only ever
typed on the provider's own page.

So the account needs PayFast's **hosted checkout** product, which exists — their
WooCommerce plugin uses it, and `PostTransaction` answers a GET with 405 on the
same UAT host, which is the reply of an endpoint that is there. It is simply
not in this reference, because this reference is for the other product.

**What survives from this reference, and is now in the code:** the error codes
(`00` and `79` success, `001` pending, `002` timeout) and the Get Transaction
Status call. Those belong to the account, not to the integration style, so
verification works either way.

**Still needed:** the `<BASE_URL>` — every example in the reference says exactly
that, and the real value lives in Preface / Integration Prerequisites, which was
not captured.

Also seen in their sidebar: **Refund Transaction Request**. Refunds are
possible, and are the first thing worth building after this works.

**What is not proven yet, and cannot be from here:**

- **A real PayFast account.** Everything is testable alone except the wire
  itself. The sandbox endpoints are confirmed by two independent public SDKs;
  the live ones are the conventional counterpart and must be checked against the
  merchant's own onboarding pack. Going live re-probes the credentials against
  the live host first, so a wrong host fails on the settings screen rather than
  at a customer's checkout — but it fails, and that is what the four
  `PAYFAST_*_BASE` variables exist to correct without a deploy.
- **`PAYMENT_KEYS` in production.** Until it is set, the screen says the
  platform cannot store keys and refuses to take any. Nothing else breaks.
- **The exact field names on a live callback.** The reference is read from seven
  spellings of "basket id" and nothing else is read at all, so a naming surprise
  costs a delayed confirmation, never a wrong one — the return page and the
  sweep both re-verify.

**Deliberately not built:** Safepay, refunds through the gateway, partial
payments, and saved cards. Refunds are the first one worth doing next; today a
refund is a bank transfer and a note.

## Payments and Store defaults moved, 8 September

Two moves asked for, and a fault under one of them.

- **Store defaults left Settings for a tab under Home.** Currency, country,
  units, weight and time zone answer "what is this business", which is Home's
  subject, not "how does it behave", which is Settings'. The business type went
  with them for the same reason.
- **The store name was on both screens, editing one column.** Home owns it now.
  `saveStoreDefaults` had been writing it too, so saving a currency would have
  undone a rename with whatever the page was rendered with — the same trap as
  the maintenance toggle.
- **Payments is a new tab, and the methods are a setting now.** They were a
  constant in `lib/payment-methods.ts` — `["COD"]`, "temporarily, per request" —
  while every merchant's Settings screen offered three boxes for bank, JazzCash
  and EasyPaisa details under the words "leave one blank and it is not offered".
  Filling one in offered nothing, and no merchant could turn a method on at any
  price. A switch per method now, its details beneath it, a live preview of the
  checkout, and a warning when a method is on but has nothing behind it.
- **The general settings save would have wiped the payment details.** It wrote
  every field it knew about, and the form had just stopped rendering three of
  them, so the first save of a shipping fee would have set all three to null.

## The way back from a rename, 8 September

"Address change reflect is working but there is no revert back or anything. It
doesn't give full control."

Correct, and the documentation already described the right model — for pages:
*"Moving a page never breaks anything. The old address forwards to the new one
automatically and the forward is listed under Links & redirects."* Store
addresses had the forward and nothing else.

Built the revert only, per the decision: a previous address now carries a
**Use this again** button, which is the same move in the other direction and
keeps the address it leaves behind.

Two things that fixed on the way:

- **A former address was being treated as a custom domain.** It was offered
  "Check now", "Show records" and "Make main" — DNS records for a hostname on
  our own zone, a check against our own nameservers, and a canonical address
  contradicting the shop's own subdomain. It is told apart by shape now
  (`isFormerAddress`) and offered only the way back and removal.
- **Reverting violated the unique index.** `moveFreeAddress` always *created*
  the row it was moving to, and going back to a name the shop already held a row
  for is exactly the case where one exists. It reuses the row now, and a move
  that keeps nothing deletes the stale one first. This only showed when the
  button was pressed — the direct tests written for the original rename all
  passed.

Still not built, and deliberately: the **history list** and the **release
control** from the fuller model. The doc update will say whether they are
wanted.
