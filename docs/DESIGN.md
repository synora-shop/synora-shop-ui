# Design standards

What a row, a field, a state and a colour mean in this panel, and which check
holds each rule up.

Every rule here exists because breaking it caused a real problem: a merchant
who could not find something, a screen that lied, or a control nobody could
read. Where a check enforces a rule it is named, so you can see what would fail
if you changed your mind — and read that check's own comment, which says what
went wrong the first time.

---

## 1. Colour

Four, and nothing else. Defined once in `.admin-shell` in `app/globals.css`.

| | |
| --- | --- |
| `#d2d2d2` | the page |
| `#e0e0e0` | containers — nav bar, action bar, content, sidebar items |
| `#fafafa` | controls — anything you type into or press |
| `#6666ff` | the active state, **and only** the active state |

**Colour means "selected".** It never means "this one is the orange one". The
top bar used to be painted by business type — maroon for a shop, purple for a
restaurant — and a permanently coloured bar competes with the one thing that
needs to say *selected*. That is why it is gone.

**Status colours are reserved** — green, amber, rose — for state, and they
always carry a word or an icon as well. `StockMark` says "Out of stock" in rose
*and* in words; `StatusMark` says "Draft" beside an amber dot. Colour alone
fails for a colour-blind reader and on a bad screen, and both are common.

The store's own accent never leaks into the panel: `.admin-shell` pins the
brand ramp so a merchant who picks a lime-green storefront still gets a panel
that reads.

---

## 2. Type and labels

**One label style.** `Field` wraps its control and needs no id. `FieldLabel` is
for the two cases it cannot wrap: a control with an info popover beside its
label (a button inside a `<label>` steals the click meant for the input), and a
caption over a group of controls like a gallery.

There were three styles before — an uppercase 11px, a 12px flex row, and a
hand-rolled copy at 12px — and on the Settings screen all three were visible at
once. *Check: `check:naming`, "no screen invents its own field label".*

**A placeholder is not a label.** It is not always announced, and it vanishes
as soon as somebody types. Every control has a name: a wrapping `Field`, a
`FieldLabel` pointing at its id, or an `aria-label` where a visible label would
break a dense repeater row. *Check: `scripts/sweep/sweep-a11y.mjs`, probe 85 —
this one has to run in a browser, because an accessible name can come from
three places and only the browser computes the real one.*

**No serif inside a screen.** The serif face belongs to the storefront and to a
full-screen message — an error, a locked door. Inside a screen it read as a
different product bolted on. Sections are named by `SectionDivider`, cards by a
13px semibold line. *Check: `check:naming`, "no serif heading inside a screen".*

**Sentence case, always.** "Move to Bin", not "Move To Bin". "Add page", not
"Add Page".

---

## 3. The shape of a screen

**A fieldset is a name and its explanation on the left, controls on the right,
capped at a readable width.** A text field the width of a window is harder to
read, not easier. `Fieldset` in `components/ui/primitives.tsx`.

**A section is divided, not merely spaced.** `SectionDivider` draws a named
rule to the edge. A gap between two stacked cards reads as more list.

**A switch inside a fieldset goes first and hugs its label.** The default
pushes a switch to the right edge of its container, which is right in a list of
rows sharing an edge and wrong in a fieldset — it left a lone switch an inch of
empty white from the words it belonged to. `ToggleSwitch inline`. *Check:
`check:naming`, "no switch is marooned in a fieldset".*

**One first-level heading per screen.** The bar names the screen; the screen
does not name itself again. `PageHeader` renders no title for that reason.

---

## 4. Rows, tiles and figures

**A row is a table, not a sentence.** Name and its one-line context on the
left, then the facts in aligned columns, then state. The catalogue used to put
everything in two lines of the same grey joined by middots, so "0 in stock"
read exactly like "148 in stock" and the one row needing action was the hardest
to find.

**Figures are right-aligned and tabular.** A column of money must read down as
a column of money.

**A constant column is not a column.** On a screen called Drafts, every row
says "Draft" — so the status column is switched off there (`showStatus={false}`).
Width spent saying nothing is width taken from something that could speak.

**A picture is the object.** In the media library the tile *is* the button, and
the rarer actions come forward on hover — but stay put below the desktop
breakpoint, because a finger has no hover and an invisible delete is no delete.

**An empty state answers which emptiness it is.** "No products yet" is an
invitation and wants the button that makes one. "No products match this" is a
dead end and wants the way back. Answering both with one sentence answers
neither. `ListEmpty`.

**Good news reads as good news.** An empty Bin says "The product bin is empty",
not a grey line that looks like a list which failed to load.

---

## 5. Actions

**Use the shared button.** Twenty-five different buttons shipped while a
`Button` primitive sat unused — five paddings for the primary alone. *Check:
`check:naming`, "no screen builds a button out of utilities" — scoped to actual
`<button>` and `<a>` tags, because an earlier version flagged any pill-shaped
container and the fix for its false positives was to distort the markup.*

**Destructive actions say where the thing goes.** "Move to Bin", not "Delete",
when it is recoverable. Confirm by typing the name for anything that is not.

**Several at once beats one at a time.** Ticking rows and pressing one button
is the shape of the job — the bar floats at the bottom, because by the fifth
tick the top of the list is above the fold, and it carries its own Clear,
because a selection you cannot clear is a mode you are stuck in. *Check:
`check:naming`, the bulk-bar rules.*

**Report what happened, not what was asked.** "2 products published" when four
were ticked and two were already out. Postgres counts a no-op update as a row
written, so the query excludes the rows it would not change.

**Two steps for anything with no undo.** An import says what it would do and
writes nothing; only the second press writes.

---

## 6. Words

**Say it in the merchant's language, not the database's.** `BANK_TRANSFER` and
`AWAITING_VERIFICATION` are the database's spelling. `statusLabel()` and
`paymentLabel()` exist for that, and the order screen printed raw enums for
months while the list beside it used them.

**Name a thing after what it does for the reader.** "Where it is going", not
"Customer & Shipping". "What was ordered", not "Items".

**Never say "dishes" about an e-commerce store.** The panel is e-commerce only;
see the README.

---

## 7. Motion and state

**Motion reports; it does not decorate.** Something that appears out of nowhere
has to be found. Something that arrives has already said where to look. That is
the whole budget, and it is why nothing in the panel animates for its own sake.

**Nothing routine lasts longer than 220ms.** A merchant editing their fortieth
product this morning meets each of these forty times, and the difference
between "responsive" and "slow" is about a tenth of a second. The exceptions
are deliberate and rare: the welcome flow, where there is nothing to do but
look, and `.attention`, which is answering the question "where?".

**One vocabulary, in `app/globals.css`.** `.scrim-in` and `.dialog-in` for a
dialog opening, `.toast-in` / `.toast-out` for a message arriving and leaving,
`.notice-in` for an error that has just appeared, `.shake` for a refusal,
`.lift` for a card being chosen between, `.attention` for the single control a
merchant has been sent to find. Nothing invents its own. *Check:
`check:motion`.*

**`.attention` has exactly one user, and that is the rule.** It is the loudest
thing in the product — five seconds of a control growing and pulsing — and it
works only because it is rare. It answers one question, "where?", asked by a
merchant who followed a link out of a refusal. A second user turns an answer
into decoration. It is applied only through `useSpotlight`, and the controls it
may point at are a closed list in `lib/spotlight.ts`. *Check:
`check:spotlight`, "does not use .attention directly".*

**A refusal says where the cure is.** Telling someone they must pause their
store first is true and useless on its own when the pause button is on another
screen under a heading they have never opened. The refusal carries a link, the
link lights the control up on arrival, and the control's own confirmation
offers whatever it has just changed. *Check: `check:spotlight`.*

**Press feedback is a transition, not an animation, and it stays.** Every
button, link and `[role="button"]` scales to 0.96 on `:active` from one rule in
`@layer base`, so a press is acknowledged before anything else has happened.
Full-bleed rows opt out with `.no-tap-scale` — scaling a row from its centre
inside a list reads as a glitch, not a press — and answer with their own
background instead. This is the one movement that survives
`prefers-reduced-motion`: it is 4% over 120ms in direct response to the user's
own finger, which is feedback, and removing it makes every control in the panel
feel dead.

**An error is a `FieldError`, never a rose paragraph.** Seventeen screens had
written their own, most with no `role`, so a screen reader announced nothing at
all — the save appeared to do nothing, twice, forever. The primitive carries
`role="alert"` and `.notice-in`, which opens its own height so the form below
slides rather than being shoved. *Check: `check:motion`, "uses FieldError
rather than its own error line".*

**Something that leaves has to actually go.** A toast is marked leaving, plays
its exit, and is removed when it finishes — the removal timer and the CSS
duration are the same number, asserted, because a short timer blinks it out and
a long one holds its neighbours down. *Check: `check:motion`, "the toast's
removal timer matches its exit animation".*

**Reduced motion is honoured, and never hides anything.** Every animation is
off under `prefers-reduced-motion`, and anything that animates *in* from
invisible or from zero height must end up visible and open when it is off.
Turning the animation off without restoring the resting state does not calm the
interface down — it deletes the error, the dialog and the toast outright, for
exactly the people least able to work out what happened. *Check: `check:motion`,
"is still visible with motion off".*

**A loading state is the shape of what is coming.** A list skeleton over a page
of tiles is the wrong shape and the page jumps when the real thing lands.

**Sticky means sticky.** `overflow-x: clip`, never `hidden`, on `html` and
`body`: `hidden` makes them a scroll container, which silently disables
`position: sticky` for everything inside. The top bar was declared sticky,
computed sticky, and scrolled away for months. *Check: `check:naming`, "the
page clips sideways without becoming a scrollport".*

---

## 8. Responsiveness

**Nothing scrolls sideways.** Checked at 390px, 768px and 1512px across every
screen. Wide content scrolls inside its own container.

**The tab row scrolls rather than wraps.** A wrapped tab row changes height
between sections and everything below it jumps. *Check: `check:responsive`.*

**Touch is not a small mouse.** Hover-only affordances are `lg:`-gated, and a
list row that swipes on a phone shows its actions as buttons on a desktop.

---

## 9. Telling the truth

The rule underneath all the others: **a screen may not claim more than it can
do.**

Three faults of this kind have been found and fixed here, and they are the
reason this section exists. The Themes screen said "switching keeps your
colours, only the layout changes" while `themeKey` was read by nothing. Settings
offered nine currencies and every price printed rupees. "View full" promised a
preview of a theme and showed the one already in use.

If a control cannot do what its label says, either make it do it or take the
label away.
