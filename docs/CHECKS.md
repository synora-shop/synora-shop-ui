# The guards

Twenty-six scripts, **2,555 assertions as of 10 September 2026**, all of them
dependency-free, all exiting non-zero on failure. `npm run check` runs the lot.

The per-script counts below are a snapshot and will drift as assertions are
added; the *list* does not drift, because `check:design` asserts that every
script in `package.json` appears here and every script named here exists.

They are not a test suite in the usual sense. Every one of them exists because
of a specific bug that reached a merchant or nearly did, and the comment at the
top of each says which. **Read that comment before deleting a check** — several
of them look arbitrary until you know what they caught.

There is a second half that these cannot do: `scripts/sweep/` drives a running
shop with a hundred and forty probes, for the faults that reading source cannot
find — including 101-117, which lie to a payment callback in every shape the
popular integrations accept, and 116-140, which check who is offered a gateway
and that going live is refused until a test payment has really been through.

---

## What each one holds up

| Script | Asserts | Exists because |
| --- | --- | --- |
| `check:design` **524** | Colour, type, shape, one way to name a section, one gap between them | Four styles were naming the same thing, two of them a few hundred pixels apart on one screen |
| `check:motion` **303** | Every animation is off under reduced motion and nothing is hidden by that; errors go through `FieldError`; the toast's two durations agree | Nineteen screens hand-wrote their error line and most carried no `role`, so a screen reader announced nothing |
| `check:csv` **201** | Column names, formula defusal, the round trip | An exported product title could run a command on whoever opened the file |
| `check:brand` **182** | Logo fallback order, favicon formats, one place that writes a mark | Logos were per business type, so switching type lost them — twice |
| `check:naming` **151** | One brand name; no serif inside a screen; `.input` owns what a text box needs; sticky means sticky | Half-renaming shipped "Dishes" over a screen built around SKUs |
| `check:accounts` **118** | Customer accounts, sessions, password rules | — |
| `check:nav` **91** | Every address in the panel is reachable and named once | A tab could exist in the bar and nowhere else |
| `check:domains` **78** | Hostname rules, DNS record shapes, the state machine | A hostname the form accepted and the server called "ours" |
| `check:holding` **68** | Whose words are whose on a shut store; the gates on the public signup | Pausing and maintenance showed two different notices and neither screen said the other existed |
| `check:discounts` **67** | Code rules, stacking, expiry | — |
| `check:platform` **57** | Reserved subdomains, platform hosts, tenant isolation | A merchant could have claimed `admin` |
| `check:search` **50** | The settings index finds the thing you typed | "upload logo" led to the one screen that no longer has it |
| `check:analytics` **39** | Figures agree with the range they claim | The screen opened on 30 days and compared against all time |
| `check:actions` **38** | Every server action checks a role | A hidden control is not a rule |
| `check:sorting` **41** | Sort orders are stable and mean what they say | — |
| `check:paging` **37** | Page counts, bounds, the last page | — |
| `check:spotlight` **31** | The refusal points at the cure; `.attention` has exactly one user | "Pause it first" named a cure without saying where it was kept |
| `check:address` **48** | Renaming a shop moves its address without touching a custom domain, breaking shared links, or taking a name somebody holds | A store's public URL is derived from its name, so a rename is three dangerous things at once |
| `check:themes` **98** | A theme arranges the storefront, not only paints it; every variant a theme names is drawn; an untouched shop is untouched | `ThemeDefinition` had tokens and nothing else, so Aurora and Meridian rendered byte-identical HTML and differed only in CSS variables |
| `check:gateways` **118** | Sealed credentials really seal; only the verification path pays for an order, and only by asking the provider; test mode never reaches a customer; an unpaid order gives back everything it took | The most-used PayFast library marks an order paid on any POST carrying a transaction id, and the field PayFast calls SIGNATURE is random hex |
| `check:payments` **32** | A merchant chooses how they get paid; a method with no details is not offered; the server refuses one the shop does not take | Which methods existed was a constant in source, while Settings offered account details for methods no customer could pick |
| `check:editor` **29** | Discard and Save exist wherever there is unsaved work | — |
| `check:responsive` **29** | No screen scrolls sideways | — |
| `check:cache` **25** | Every cached kind is dropped by whoever writes it | A merchant edited a screen that would not change. Twice. `lib/cache-tags.ts` claimed this script existed for months before it did |
| `check:geo` **23** | Country blocking rides the one gate every page calls | A per-page check would eventually be forgotten on a new page |
| `check:loops` **4** | A redirect chain cannot eat itself | — |

---

## The rules that are easy to get wrong twice

A few checks encode something subtle enough that it has been broken, fixed, and
broken again in the fixing.

**Reduced motion must not hide anything.** Turning an animation off does not
calm an interface down — it deletes the error, the dialog and the toast
outright, for exactly the people least able to work out what happened. Anything
starting at `opacity: 0` or zero height must be restored to visible in the
`prefers-reduced-motion` block. `check:motion` reads the keyframes' *opening*
state to decide, because an animation that *ends* hidden is a thing leaving,
not a thing that needs restoring.

**A live domain must survive a bad lookup.** Refusing to serve a domain that
works is a far worse mistake than serving one whose records have just been
removed. Three consecutive failures, not one.

**Presence beats preference in a backfill.** The migration that moved logos out
of theme tokens preferred the shop's live business type before it preferred a
row that actually had a logo — which silently lost the artwork of every
merchant who had uploaded it under a type they later switched away from. It
looked reasonable and it was wrong.

**An `accept` attribute is a filter, not a rule.** Dragging a file in bypasses
it entirely, so the same rule is enforced on drop and again in the action.

---

## Writing a new one

Match the house shape:

```ts
/**
 * Checks <the thing> — `npm run check:<name>`.
 *
 * <Why this exists. Name the bug.>
 *
 * What is checked:
 *   1. ...
 *
 * Dependency-free; exits non-zero on failure.
 */
let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => { ... };

// ...

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
```

Then add it to `package.json` — both its own `check:<name>` script and the
`check` chain — and to the table above.

**Two things learned writing the recent ones:**

*Strip comments before matching source.* `check:motion` reported every grouped
reduced-motion rule as missing, because a comment between two rules is read as
part of the next rule's selector. `check:spotlight` reported a comment on the
analytics screen about "a number competing for attention" as a use of
`.attention`.

*A check that fires on correct code is worse than no check.* A static
accessibility check written during the sweep flagged seven files the browser
had already proved clean. It was deleted rather than allowed to distort markup,
and the comment where it stood says why.

---

## The other half: `scripts/sweep/`

A hundred probes against a running shop — tenancy, storefront, imports, inputs,
checkout, arithmetic, staleness, closed states, truthfulness. It found the CSV
formula injection and twenty-two controls a screen reader could not name.

Three of its own probes were wrong before they were right, which is worth
knowing before trusting a green run:

- a plain `fetch()` of an admin screen returns the login page, so nine probes
  were grading login HTML;
- analytics opens on the last thirty days and was being compared against all
  time;
- checkout only delivers to ten cities, so a probe using another was rejected
  for the city, making seven later probes false passes.

See `scripts/sweep/README.md`.
