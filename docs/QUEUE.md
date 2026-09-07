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
