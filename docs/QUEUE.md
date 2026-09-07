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

### 2. Switching APP type must go through pausing the store

**Where:** the top header, where *Change APP type* already sits.

**The rule:** a store that is open cannot change type. To switch, the merchant
pauses their store first; only then is the type switch offered.

**Why:** switching type changes what a merchant is expected to upload — a shop
fills in products, variants, stock and shipping. Letting someone switch while
the store is live invites them to fill in a catalogue for a business they are
about to stop being. Pausing first makes the switch a deliberate act.

**The flow:**

1. Merchant opens *Change APP type* in the top header.
2. If the store is `ACTIVE`, `TRIAL` or `PAST_DUE`, the dialog does not offer
   the switch. It explains why, and offers **Pause my store** — the same action
   as Preferences › Visibility, not a second one.
3. Once the store is `PAUSED`, the dialog offers the types.
4. After switching, the merchant reopens the store themselves. It does not
   reopen on its own: they should see the new panel before customers do.

**Notes for whoever builds it**

- `PAUSED` is the existing status and `pauseStore()` in
  `app/admin/settings/lifecycle-actions.ts` is the existing action. Do not add
  a second idea of "inactive".
- `SUSPENDED` and `CLOSED` are ours and the merchant's endings respectively —
  neither should offer a type switch at all.
- The switch itself destroys nothing: storefront rows are partitioned by type,
  so switching back brings the old one straight back.
- The control is currently `xl:` only. It needs to be reachable on a laptop.

### 3. ~~AHAD1V is still a RESTAURANT row in the live database~~ — done 6 Sep

Switched. The shop is called **bashinda** in production, not AHAD1V — the name
changed after an earlier database copy was taken, so older notes say AHAD1V.

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
- **Default policy pages** — returns, privacy, terms.
- **"Direct me to the cause"** on every error that blocks an action.
- **The Data library as the picker** wherever a picture can be changed,
  including inside the live customizer.

---

## Done on 7 September

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

- **The panel offers a Currency setting it then ignores.** Settings has a
  currency picker and it saves, but every price anywhere — the product list,
  orders, the storefront, the cart, checkout — is printed by `formatPKR()` in
  `lib/utils.ts`, which hard-codes "Rs." Twenty files call it. A store set to
  dollars would type dollars into Settings and see rupees everywhere else. The
  fix is one currency-aware formatter fed by the store's own setting, and it
  touches all twenty. Until then the labels beside a price box are honest (they
  read the setting) and the printed amounts are not.
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
