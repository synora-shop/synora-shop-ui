# The sweep

A hundred probes run against a live shop, looking for the faults a static
check cannot see: what a stranger can reach, whether one shop's data can touch
another's, whether the arithmetic on a screen agrees with the database, and
what happens when somebody lies to the checkout.

    npx tsx scripts/sweep/tenancy.ts      # 11-20  one shop cannot touch another
    npx tsx scripts/sweep/storefront.ts   # 21-30  what a customer can reach
    npx tsx scripts/sweep/imports.ts      # 31-40  a file that is not what it claims
    npx tsx scripts/sweep/inputs.ts       # 41-50  input that is trying it on
    npx tsx scripts/sweep/checkout.ts     # 51-60  placing an order dishonestly
    npx tsx scripts/sweep/arithmetic.ts   # 61-70  does the money add up
    npx tsx scripts/sweep/staleness.ts    # 71-80  guards, caches and integrity
    npx tsx scripts/sweep/closed.ts       # 96-100 a shut shop, and two orders at once
    npx tsx scripts/sweep/facts.ts        # what the database says, for the browser probes

The browser half needs Chrome listening on the DevTools port and a signed-in
session in it:

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
      --headless=new --remote-debugging-port=9222 \
      --user-data-dir=/tmp/sweep-chrome about:blank

    node scripts/sweep/sweep-http.mjs    # 1-10   what a stranger can reach
    node scripts/sweep/sweep-a11y.mjs    # 81-85  what a screen reader finds
    node scripts/sweep/sweep-truth.mjs   # 86-95  does each screen's own number hold

**These probes write to the database.** Each puts back what it changed, and
says so as it finishes. Run them against a development shop, never production.

## What the sweep is for

Every probe here exists because the failure it looks for would be invisible
until a merchant hit it. Two were found on the first run:

1. **A cell in an exported CSV could run as a formula.** Excel and Google
   Sheets execute a cell beginning `=`, and a customer types their own name
   and delivery note at checkout — so a stranger's text was reaching the
   merchant's spreadsheet. Fixed in `lib/csv/export.ts`.
2. **Twenty-two form controls had no name a screen reader could read** — only
   a placeholder, which vanishes as you type. Fixed, and the panel's own rule
   ("placeholders are not labels") now holds everywhere.

Three more "failures" were the probes being wrong, and are worth knowing about
because the same mistakes are easy to repeat:

- A plain `fetch()` of an admin screen gets the login page, so nine probes were
  reading login HTML and calling it a fault. They go through the signed-in
  browser now.
- The analytics screen opens on the last thirty days; holding it to an all-time
  total is comparing two different numbers.
- The checkout only delivers to ten Punjab cities, so a probe using "Karachi"
  was rejected for the city and passed for the wrong reason.
