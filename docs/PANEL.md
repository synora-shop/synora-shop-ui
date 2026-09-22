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
| The notes file (`1920*1080:`) | **Global rules. Not yet in hand — see §6.** |

---

## 1. The frame

Drawn at **1920 × 1080**. Those are reference numbers, not a fixed layout: the
sidebar holds its width and everything right of it is fluid. A panel that only
composes at 1920 is a panel most merchants never see correctly.

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR — full width, indigo                                │  logo · search · bell · account
├────────────┬─────────────────────────────────────────────────┤
│  SIDEBAR   │  NAV BAR            55px                        │  the tabs of this section
│  260px     ├─────────────────────────────────────────────────┤
│            │  MAIN CONTAINER                                 │
│  group 1   │   ┌───────────────────────────────────────────┐ │
│            │   │  SECTION 1                                │ │
│  ─ 30px ─  │   └───────────────────────────────────────────┘ │
│  group 2   │              30px                               │
│  ─ 30px ─  │   ┌───────────────────────────────────────────┐ │
│  group 3   │   │  SECTION 2                                │ │
│            │   └───────────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────────┘
```

### Widths, across the 1920 reference

| | |
| --- | --- |
| Page margin, each side | 30px |
| Sidebar | **260px** |
| Sidebar → main container | **30px** |
| Main container | 1570px *(derived: 1920 − 30 − 260 − 30 − 30)* |
| Section width | **1517px** |
| Main container side padding | 26.5px *(derived: (1570 − 1517) ÷ 2)* |

### The four bars, and which screens get which

This is the distinction the notes file makes, and it is the reason the Themes
screen has no action bar:

| Bar | What it holds | Where it appears |
| --- | --- | --- |
| **Top bar** | The product mark, search, notifications, the account | Every screen |
| **Sidebar** | The ten sections, in three groups | Every screen |
| **Nav bar** | The tabs *of the section you are in* | Only where a section has more than one screen |
| **Action bar** | What you can *do* on this screen — add, filter, bulk-select | **Only where a screen has actions.** Themes has none. |

A section with one screen draws no nav bar — Data, Discounts, Customers and
Analytics are already like this. Themes draws a nav bar (it is one of Your App's
three screens) and no action bar.

### The sidebar

Three rounded white containers on the page ground, **30px apart**. Rows are
**40.5px** high. Ten rows, parents only — no dropdown children (see §4).

| Group | Rows |
| --- | --- |
| 1 | Home · Products · Data · Discounts · Customers · Analytics |
| 2 | Your App · Preferences |
| 3 | Settings · Account |

The active row is a filled plate with its icon and label in the brand indigo.

### The top bar

Full width, above everything including the sidebar. A left-to-right indigo
gradient. On it: the **synora app** mark at the left; a dark translucent search
pill reading *Search Products, Customers, Pages*; a bell carrying an unread
dot; a circular avatar.

**This overrules a rule that was in the code.** The bar was deliberately
colourless, on the reasoning that colour in this panel means *selected* and a
permanently coloured bar competes with the one thing that needs to say it. The
design decides otherwise. The reasoning does not evaporate, it becomes a
constraint: the sidebar's active-row indigo has to stay legible as *selected*
against a bar of nearly the same hue, which is a contrast problem to solve
rather than a reason to refuse the design.

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

## 6. Open

**The notes file is not in hand.** It is named `1920*1080:` and holds the
global rules — including the one that says which screens get an action bar,
which is why the Themes screen has none. It is not on disk; if it lives in the
Notes app it cannot be read from here. Everything in §1 above about the four
bars is reconstructed from the guide's markings and one sentence of
instruction, so it is the part most likely to be wrong.

**Two numbers are derived, not drawn:** the main container's width (1570px) and
its side padding (26.5px). Both fall out of the drawn numbers and the 1920
canvas, and 26.5px is a suspicious value — it is more likely the intent was
26px or 27px, or that the section is 1510px inside 30px padding.

**Only one screen is designed.** This document grows a section per screen as
each arrives.
