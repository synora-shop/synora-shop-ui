# The panel, screen by screen

What the admin looks like, as designed, with the measurements it was drawn to.

`docs/DESIGN.md` says what a row, a field, a state and a colour *mean*. This
says what each screen *is*. Where they disagree, this one is newer and wins for
layout; DESIGN.md still owns meaning.

**Nothing here is built from a guess.** Every number comes off the design files,
and anything derived rather than drawn is marked as derived. Where the design
and the code disagree, the disagreement is written down rather than silently
resolved.

## Where this comes from

| File | What it is |
| --- | --- |
| `APP extra/APP.ai` | The panel. The authority on layout and on the greys. |
| `APP extra/APP themes.ai` | The Themes screen, drawn clean |
| `Downloads/APP themes-page-guide.jpg` | The same screen with every measurement marked |
| `Documents/App > Admin > Global design .pages` | **The global rules.** Titled `1920*1080:` |

**Which wins.** The Pages document holds the global rules; a design file holds
one screen. Where they disagree the Pages document is the stronger source —
but every disagreement is listed in §6 and confirmed rather than quietly
resolved, because a rule that contradicts a drawing usually means one of them
moved on and the other has not.

---

## 1. The frame

Drawn at **1920 × 1080**. Those are reference numbers, not a fixed layout: the
sidebar holds its width and everything right of it is fluid. A panel that only
composes at 1920 is a panel most merchants never see correctly.

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER CONTAINER  80px          #5050ea, full width         │
│    logo 30px            ┌ header bar 50px ─ search · bell · me ┐
├────────────┬─────────────────────────────────────────────────┤
│  SIDEBAR   │  NAV BAR   55px   white, sticky                 │
│  260px     ├─────────────────────────────────────────────────┤
│  white     │  ACTION BAR 40px  invisible — buttons only      │
│            ├─────────────────────────────────────────────────┤
│  group 1   │  MAIN CONTAINER            white, sticky        │
│  ─ 15px ─  │   ┌── section ── #f5f5f5 ───────────────────┐   │
│  group 2   │   └─────────────────────────────────────────┘   │
│  ─ 15px ─  │              30px                               │
│  group 3   │   ┌── section ── #f5f5f5 ───────────────────┐   │
│            │   └─────────────────────────────────────────┘   │
└────────────┴─────────────────────────────────────────────────┘
```

### Sizes

| | |
| --- | --- |
| Header container | **80px** high |
| Header bar *(inside it: profile, notifications, search)* | **50px** high |
| Search bar | **50px** high |
| Header logo | **30px** high |
| Sidebar | **260px** wide |
| Navigation bar | **55px** high |
| Action bar | **40px** high |
| Normal text | **20px** |
| Secondary text | **18px** |
| Icons | **20 × 20** — the *space*, not the drawing |

**Every icon is accommodated in a 20 × 20 box**, whatever its own proportions.
An icon wider than it is tall still occupies 20 × 20. The box is what keeps a
column of icons optically aligned; the drawing inside it may be any shape.

### Margins, and the overlap rule

Everything sits **30px from the edge of the screen** — the sidebar from the
left, the nav bar, action buttons and main container from the right.

**Two adjacent margins are one margin, not two.** Where a 30px margin meets a
30px margin, the gap is 30px. Counting each separately gives 60px and pulls the
whole layout apart. This is the rule to apply wherever two of these boxes meet.

| | |
| --- | --- |
| Screen edge → anything | 30px |
| Sidebar → main column | 30px *(one margin, not two)* |
| Between sidebar groups | **15px** |
| Nav bar | 30px on three sides; **none at the bottom**, because the action buttons below carry 15px |
| Action bar | 15px all round |
| Between sections in the main container | **30px** |

### The four bars

| Bar | What it holds | Where it appears |
| --- | --- | --- |
| **Header** | Logo left; a 50px bar holding search, notifications and the account | Every screen |
| **Sidebar** | The ten sections in groups, each group its own white container | Every screen |
| **Navigation bar** | The child sections of whichever sidebar section is selected | Only where a section has more than one screen |
| **Action bar** | Filters, sorting, and *New* — product, page, category, menu, customer | **Only where the screen needs them** |

**The action bar has no container.** It is invisible: a row of buttons side by
side, each button carrying its own container. There is no bar to see, only the
actions on it.

**A screen with nothing to filter, sort or create has no action bar at all.**
That is why the Themes screen has none — and it is a rule about the screen's
needs, not a style choice.

**The nav bar and the action bar are sticky, and so is the main container.**
Scrolling happens *inside* the main container and nowhere else, so the section
tabs and the actions are always where you left them. The sidebar gets its own
scroll only if it ever outgrows the screen, which at ten rows it does not.

Both bars **slide horizontally** rather than wrap, and only when there are more
items than fit.

### Colour

| | |
| --- | --- |
| Page background | `#f5f5f5` |
| Header | `#5050ea` |
| Sidebar containers, nav bar, main container | pure white |
| A section inside the main container | `#f5f5f5` |
| Section outline | `#2e2e2e` at **0.25px** |
| Normal text | pure black |
| Secondary text | `#86868b` |
| Text on a dark ground | pure white, secondary `#dddddd` |
| Placeholder on white | `#babac5` |
| Placeholder on `#0c0c4a` | `#555581` *(written `#555581c` — see §6)* |
| **Active text** | `#5050ea`, and DM Sans **Semibold** instead of Regular |
| **Active plate** | `#e9e9ff` |

Active state is three things at once — the colour, the weight, and the plate
behind it. Not one of them alone.

Special sections may carry a different background; the design file for that
screen says so when they do.

### Light and depth

| | |
| --- | --- |
| Nav bar, sidebar, main container | Outer glow, pure black, **10% opacity, 10px blur** |
| A section | Outer glow, pure black, **10% opacity, 5px blur** |
| The page background itself | Outer glow, pure white, **50% opacity, 50px blur** |

That last one is the one doing the work. **The background overlaps the header**
— the same relationship the header and background have on
`synoradigitals.com` — so the white glow of the page casts up onto the `#5050ea`
header rather than stopping dead against it.

**This is why the header looks like a gradient and is not one.** The header is
one flat `#5050ea`. What lightens it is the page's own white glow spilling
upward across it. Painting a gradient instead would look close and behave
wrong: the light would not move when the content below it does, and it would
not match `synoradigitals.com`, which is where the effect comes from.

### The last thing on every screen

After the final section, centred: **Learn more about "<this screen>" here** —
for example *Learn more about "Themes" here*. It goes to the documentation,
which is also linked in the footer at `app.synoradigitals.com`.

---

## 2. The Themes screen

**Your App → Themes.** Nav bar: Themes · Pages · Menus. No action bar.

Three sections down the page, **30px apart**. Each is a rounded card on the
main container.

The heights below are **what the drawing measures with the content it shows**.
They are not constraints: a shop with eight themes must grow section 2 rather
than clip it. Treated as proportion and minimum, not as a fixed height.

### Section 1 — Active Theme *(750px as drawn)*

Label **Active Theme**, top left. Beneath it, centred, a picture of the live
storefront. Under the picture, on one line: the shop's address in bold on the
left (`blackbuc.com`), and on the right the theme, its version and when it was
added — `KITE – v1.1.1  (Added: Sep 5 at 10:35 pm)`.

### Section 2 — All Themes *(537px as drawn)*

Label **All Themes**. Then one row per theme the shop owns.

| | |
| --- | --- |
| Row height | **144px** |
| Inner content height | 95px |
| Padding | **20px** all round |
| Thumbnail | **171 × 108** |
| Gap between consecutive buttons | **10px** |

Each row: thumbnail, then the theme's name with its version in lighter weight
beside it — `LOOM (v1.1.1)` — and `Added: Sep 26 at 9:17 pm` beneath. Actions
right-aligned.

| State | What the row shows |
| --- | --- |
| Owned, not live | `Activate` · `✎ Edit Theme` · `⋯` |
| **Live** | Row fill **`#D2FFD6`**, `⊘ Active` in **`#037F1D`**, then `✎ Edit Theme` · `⋯` |
| Owned, out of date | `Update` on **`#E9E9FF`**, then `Activate` · `✎ Edit Theme` · `⋯` |

A live theme has no Activate button, because it is the thing Activate would do.

### Section 3 — Theme Store *(690px as drawn)*

Label **Theme Store**. Themes not yet owned, as large cards, two across.

| | |
| --- | --- |
| Card | **730 × 533** |
| Picture inside it | **710 × 448** |
| Buttons | **35px** high |

Each card is a coloured plate carrying a picture of the theme, with an
open-in-new mark at the picture's top right. Along the bottom of the plate: the
theme's name and version at the left, `+ Add` (solid dark) and `Preview`
(white) at the right.

Under the section, centred on the page: **Learn more about Themes**, the last
word a link.

### The words on the buttons

`Activate`, not Publish. `Edit Theme`, not Customise. `+ Add`, not Install.
`Update`, not Upgrade. The code and `docs/THEMES.md` currently say *publish*;
the screens say *activate*, and the screens are what a merchant reads.

---

## 3. What this screen needs that does not exist

| Needed | State today |
| --- | --- |
| A version on every theme | No theme has a version at all |
| A shop holding one theme at two versions | A theme is installed once |
| `Update` — move a theme to its newest version | Nothing to update to |
| A Theme Store separate from the owned list | One gallery does both jobs |
| A picture of the *live* storefront in section 1 | Stored screenshots only |

Versions and updating are **agreed and to be built properly** — schema,
migration and behaviour, not a label. The hard part is not the button: it is
what happens to a merchant's edits when the theme underneath them updates.
`docs/THEMES.md` §2 already answers the shape of it — a merchant's row holds
only their *differences*, never a resolved copy, so an update changes
everything they did not choose and nothing they did. Updating a theme is
therefore changing which version's defaults their differences sit on top of.
That property is what makes this safe, and it must not be broken to ship the
button.

---

## 4. Decisions taken 22 September

Recorded because each one reverses something, and a reversal with no reason on
the record gets re-reversed six weeks later by whoever finds the old reason.

**The navigation bar comes back; the sidebar loses its children.** On 21
September the nav bar was dissolved into the sidebar as dropdown children with
connector elbows, and all 22 former tab addresses were walked to prove each one
still resolved. The design puts the tabs back at the top of the screen and
leaves the sidebar ten parent rows. The design is the decision. What the
dissolve was protecting against — the same links appearing twice — is handled
by the sidebar not repeating them.

**Site text stops being a screen.** All storefront wording is to be edited in
the live customizer instead.

> **This one carries a dependency and must not be done out of order.** Site
> text is **66 strings** — `Add to Cart`, `Place Order`, `Proceed to Checkout`,
> the checkout error messages, the empty cart, the filter labels, the account
> links — and **the customizer reaches none of them.** It edits sections and
> theme tokens; checkout, cart, account and the filters are not section-built
> pages. Removing the screen before the customizer can reach those strings does
> not move the ability, it ends it. So: the customizer gains them first, the
> tab goes second. Until then the screen stays and simply leaves the nav bar.

**Maintenance moves to Preferences.** Everything on it — the switch that closes
the shop, the page customers see while it is closed, and the reopen sign-ups.
This reverses the reasoning written on the screen itself, which argued it
belonged beside Pages and Themes *because it is a page on the storefront*. The
counter-argument is the stronger one: whether the shop is open is how it
*behaves*, and Preferences → Visibility already holds that question.

**Drafts stops being a section of its own.** A draft belongs to the thing it is
a draft of: page drafts inside Pages, product drafts inside Products. Products
already has its own Drafts screen and keeps it. `/admin/pages/drafts` stops
being a tab and becomes part of the Pages screen.

**Your App is therefore three screens**: Themes, Pages, Menus.

---

## 5. Reading further

- `docs/THEMES.md` — what a theme decides, the global settings, the library
- `docs/DESIGN.md` — what a row, a field, a state and a colour mean
- `docs/ARCHITECTURE.md` — how the whole thing is put together

---

## 6. Where the two sources disagreed

All settled 22 September. Listed rather than silently applied: a rule that
contradicts a drawing usually means one of them moved on, and knowing which
saves re-litigating it.

| | Pages document | Design file | Settled |
| --- | --- | --- | --- |
| Header | `#5050ea`, one flat colour | Appears to be a gradient | **Neither — it is flat, and the page's white glow falls across it.** Not a gradient at all; see §1 |
| Gap between sidebar groups | **15px** | Marked `30px GAP`, twice | **15px** |
| Section width | 30px padding → **1510px** | Marked `1517px` | **1510px.** One margin rule governs every edge; the drawing was measured, not specified |
| Sidebar text | **20px** normal, semibold when active | — | **20px.** Reverses the 18px agreed on 21 Sep, deliberately |
| Closing line | `Learn more about "Themes" here` | `Learn more about Themes` | Pages document — with *here* |
| Active plate | `#e9e9ff` with `#5050ea` text | — | Pages document. Replaces the `#f5f5f5` plate with `#6666ff` text agreed on 21 Sep |
| Outlines | Sections outlined `#2e2e2e` at 0.25px | — | Pages document. `#86868b` is the **secondary text** colour now, not an outline; `#6666ff` is not in the palette at all — active is `#5050ea` |

**Three things that were built on 21 September are reversed by this.** The
sidebar's 18px text, its `#f5f5f5`/`#6666ff` active plate, and its
`#86868b`/`#6666ff` outlines. None of it was wrong when it was built; the
global document is simply the authority now, and `#6666ff` leaves the palette
entirely.

### Small things

**`#555581c` has seven hex digits.** Read as `#555581` — the placeholder
colour on a `#0c0c4a` ground. Worth a look, since it is unreadable either way
if the intended value was different.

**Section heights are measurements, not constraints.** 750 / 537 / 690 are what
the drawing measures with the content it happens to show. A shop with eight
themes grows section 2 rather than clipping it.

**Only one screen is designed.** This document grows a section per screen as
each arrives.
