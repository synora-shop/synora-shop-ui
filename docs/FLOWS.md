# The journeys

What a merchant actually walks through, end to end, and where each step is
enforced. Written because several of these cross three or four screens, and a
step that reads fine in isolation can be a dead end in sequence.

The test for every flow here is the same: **at no point may a screen state a
rule without saying where the cure is.**

---

## 1. Connecting a custom domain

**Screen:** Settings → Domains · **Code:** `app/admin/domain-actions.ts`,
`lib/data/domains.ts`

```
Add domain ──▶ PENDING, two records shown
                    │
              merchant adds them at their registrar
                    │
        ┌───────────┴───────────┐
   "Check now"            daily sweep
        └───────────┬───────────┘
                    ▼
          DNS proves ownership + routing
                    │
                    ▼
          vendor asked to serve it ──▶ VERIFIED
                    │
          vendor reports serving ──▶ ACTIVE
                    │
                    ▼
          "Make main address" ──▶ every other host 308s to it
```

**What the merchant sees at each state**

| State | Badge | What is offered |
| --- | --- | --- |
| `PENDING` | waiting for DNS | Check now · Show records · Remove |
| `VERIFIED` | issuing certificate | Check now · Show records · Remove |
| `ACTIVE` | live | Check now · Show records · Make main · Remove |
| `FAILED` | not working | Check now · Show records · Remove |

**Check now is offered on live domains too.** It used to disappear once a
domain was live, which meant nothing could notice a domain that later broke —
the screen went on saying "live" while the store was gone.

**Making a domain primary requires it to be `ACTIVE`.** Pointing the canonical
URL at a domain that does not serve takes the store off the internet as far as
a search engine is concerned. The database enforces one primary per shop with a
unique index, not just the code.

**Removing tells the vendor first, then deletes the row**, so a hostname is
never left attached at the vendor with nothing here that knows about it. If the
domain was primary, the free address takes over in the same transaction — a
shop is never left with no working address. The free address itself cannot be
removed.

**Claiming a hostname somebody else has.** A `PENDING` row belonging to another
shop is released — anyone can type any domain into a box, and letting an
unverified row block a real owner would make squatting trivial. A `VERIFIED` or
`ACTIVE` row is a proven claim and is never taken. The refusal deliberately
does not say which shop holds it; that would turn the form into a way to ask
"who runs this domain?"

---

## 2. Changing what the store sells

**Screens:** anywhere → Your App → Themes → Your App → Maintenance
**Code:** `lib/store-type-switch.ts`, `lib/spotlight.ts`

This is the flow that exists because "pause it first" is true and useless on
its own: the pause button is on another screen, under a heading the merchant
has never opened.

```
"Change APP type"
        │
        ▼
   typeSwitchGate(status)
        │
        ├─ PAUSED ──────────────▶ pick a type, done
        │
        ├─ CLOSED / SUSPENDED ──▶ refusal, no cure offered
        │                          (pausing fixes neither)
        │
        └─ open ────────────────▶ refusal + two ways out
                                        │
                    ┌───────────────────┴──────────────────┐
              "Pause my store"                     "Show me where"
              (does it here)                              │
                                                          ▼
                                          Your App → Themes?show=pause
                                                          │
                                    pause button scrolled into view,
                                    lit for five seconds, param removed
                                                          │
                                                          ▼
                                              press it ──▶ three answers
                                                          │
                                     ┌────────────────────┼──────────────┐
                                  Cancel            "Just pause it"  "Pause and
                                                                     edit the page"
                                                                          │
                                                                          ▼
                                                          Your App → Maintenance
```

**Two ways out, for two different people.** One who already knows what pausing
means wants it done where they are standing. One who does not wants to see the
control, in its own screen, with the words around it that say what it does and
how to undo it — and to come away knowing where it lives for next time. Telling
only the first kind is how a refusal becomes a dead end.

**The gate is enforced at the write**, not only in the dialog. A hidden control
is not a rule.

**Pausing offers the page it has just put in front of every customer.** Three
answers rather than two, because asking afterwards would be a second dialog
about the same decision — and not asking at all is how the old holding page
went years without being edited. The trip to the editor only happens if the
pause succeeded; a merchant sent there after a failure would be editing a page
nobody is seeing.

**Pausing from inside the type dialog skips that confirmation**, so that path
carries its own line pointing at the same screen. The quick route is exactly
how a page goes unedited.

**`.attention` has one user and that is the rule.** Five seconds of a control
growing and pulsing answers one question — "where?" — and works only while it
is rare. Targets are a closed list in `lib/spotlight.ts`; `check:spotlight`
asserts nothing else plays it.

---

## 3. Closing the shop, and what customers see

**Screen:** Your App → Maintenance · **Code:** `lib/holding-page.ts`

Two switches lead here and they are not the same thing:

- **Maintenance mode** — the toggle on this screen.
- **Paused** — the shop's own status, set on Themes, and what the type switch
  requires.

Both show the same page. The screen says so, and says it whichever way round
the merchant arrives:

> Your store is paused, so customers are seeing this page already — whatever
> this switch says.

**Switching maintenance off while paused does not claim the store is visible.**
That sentence would be a lie a merchant acts on — telling customers they are
back when they are not.

**"Tell me when you reopen"** is off by default. When on, the holding page
offers one field. Everything about it is gated:

- the store must actually be shut, and shut for a reason the merchant may write
  for;
- the merchant must have turned it on;
- the honeypot, and a rate limit keyed on the address as well as the caller;
- it never says whether an address was already there — "thanks" either way,
  because the alternative turns a holding page into a way to ask whether a
  particular person is waiting for this shop;
- signing up twice does not move the consent timestamp.

**These people are not Customers.** A `Customer` has a required name, an
address book and an order history. Someone who typed one field into a holding
page has none of that, and writing them in would mean inventing a name for them
and dropping strangers into every count, export and mailing the merchant runs.
Their own table, their own screen, their own export, deletable on request.

---

## 3b. Renaming the shop, and moving its address

**Screen:** Home · **Code:** `lib/data/domains.ts` · `moveFreeAddress`

The free address is derived from the store's name, so renaming the shop moves
the storefront's public URL. Three dangerous things at once.

```
Rename "My Store" ──▶ "Bashinda"
        │
        ▼
  address field follows: bashinda
  (until you edit it yourself, after which it is yours)
        │
    press Save
        │
        ▼
  is the new address free?  ── no ──▶ said here, nothing written
        │ yes
        ▼
  ┌───────────────────────────────────────────┐
  │  This dialog cannot be dismissed.         │
  │  No scrim close. No Escape. No Cancel.    │
  │                                           │
  │  "Only the new address"  │  "Keep the     │
  │                          │   old working" │
  └───────────────────────────────────────────┘
        │                            │
   old 404s,                  old 308s to new,
   name released              path preserved
```

**A merchant's own domain is never touched.** If `acme.com` is connected and
serving, it stays `ACTIVE` and stays primary; the free address moves underneath
it. The dialog says so by name, because from the merchant's side the question
means something different when their real address is unaffected.

**Why the dialog cannot be waved away.** There is no sensible default. Keeping
the old address forever holds names on behalf of shops that did not want them;
dropping it breaks every link, bookmark and search result silently. So there
are two answers, both are answers, and clicking outside is not one of them.

**A kept address is a real row**, not a special case: `isPlatform` goes false,
so `ensurePlatformDomain` cannot mistake it for the current one, the merchant
can see it in Domains, and they can remove it later to release the name.
`resolveShopByHost` finds it, `guardCanonicalHost` redirects it, and the path
survives — `/shop` on the old address lands on `/shop` on the new one.

---

## 4. Setting the shop's marks

**Screen:** Home · **Code:** `lib/brand-marks.ts`

Home is the only screen in the panel that writes a logo. The theme panel's
uploads are gone; the settings search points here; `check:brand` asserts no
other action writes a mark.

```
Home
 ├─ Store name        also the fallback when there is no logo at all
 ├─ Main logo         used everywhere unless something below fits better
 ├─ On dark           for a dark header or footer
 ├─ Compact           a monogram, for phones
 ├─ Compact on dark   the monogram, on a dark header
 └─ Favicon           SVG, PNG or ICO only
```

A theme asks `pickLogo(marks, { dark, compact })` and gets the nearest thing
the merchant actually uploaded. It never has to know which slots were filled.

**With no logo at all the store's name is drawn**, in the storefront's heading
face. Never this platform's artwork — which is what happened for most of this
product's life, on every storefront that had never uploaded one, while Home
told the merchant their store name would be used instead.

**The favicon is restricted to SVG, PNG and ICO.** WebP is the trap: it
previews perfectly in the panel and draws a blank square on a browser tab,
which is not diagnosable from inside the product. Enforced on the picker, on
drop — an `accept` attribute is a filter, not a rule — and in the action.

---

## 5. Importing a catalogue

**Screens:** Products · Customers · Orders → Import
**Code:** `lib/csv/`

```
Choose a file ──▶ parsed and matched ──▶ a plan is shown
                                              │
                                   create N · update N · skip N
                                              │
                                        confirm ──▶ written
```

**The plan is shown before anything is written.** An import that silently
updates is an import nobody trusts twice.

**Shopify's column names are accepted** so a merchant moving in does not have
to re-shape their export first.

**Every exported cell is defused.** A value starting `=`, `+`, `-`, `@`, tab or
carriage return is prefixed with an apostrophe, because a spreadsheet treats it
as a formula — a product titled `=cmd|...` is a command that runs on whoever
opens the file. Reading a file back strips the apostrophe, so a round trip is
lossless. Found by the sweep; see `scripts/sweep/README.md`.

**A price column of words does not import as free.** `cellNumber` returns
`"bad"` rather than `0` for something it cannot read. Stripping non-digits used
to turn `"lots"` into `""` into `0`.

---

## 6. Everything that saves

One bar, one pattern, every screen. `components/admin/use-editor.ts`.

- Discard and Save live in the action bar at the top, not in the form.
- Registering guards the work against the tab closing, a link, and the back
  button.
- Trying to leave with unsaved work plays `.shake` on the tab you are on and on
  the save button — a dialog asks a question; this answers one you did not need
  to be asked, by pointing at the thing standing in the way.
- Errors arrive rather than appear, announce themselves to a screen reader, and
  open their own height so the form below slides rather than being shoved.

---

## Reading further

- `docs/ARCHITECTURE.md` — how the pieces hold together.
- `docs/DESIGN.md` — what things look like and why.
- `docs/CHECKS.md` — the guard behind each rule above.
