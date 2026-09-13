import type { Metadata } from "next";
import { appUrl } from "@/lib/shop-context";
import { ArrowRight, Check, Copy } from "lucide-react";

// No title here on purpose: this is the site's front page, so the root
// layout's default is exactly right. Setting one would get "· APP"
// appended by the root template and say the name twice.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The front door, and the application host's root.
 *
 * Two audiences meet here and want opposite things. Somebody who has never
 * heard of this needs to know what it is before being asked for an email
 * address; somebody who already has a store wants their panel. The page is
 * written for the first, because the second has a bookmark.
 *
 * On the numbers: every figure on this page is one that can be checked against
 * the product. There is no uptime percentage, no customer count, no "3.8x
 * efficiency". A young product quoting an invented number is making the one
 * promise it cannot keep, and the true numbers here — thirty-four sections,
 * two records, five ways to be paid — are more specific than an invented one
 * would have been.
 */

/** The figures under the hero. All of them countable in the product. */
const PROOF = [
  { figure: "34", label: "kinds of section to build a page from" },
  { figure: "2", label: "DNS records to connect your own domain" },
  { figure: "5", label: "ways to take money, cash to card" },
  { figure: "0", label: "apps to install before it works" },
];

/** What you get, grouped the way the panel itself is grouped. */
const OFFERS: { kicker: string; title: string; body: string; points: string[] }[] = [
  {
    kicker: "Selling",
    title: "A catalogue that understands how you sell",
    body: "Not everything is bought by clicking add-to-cart, so a product can be one of three things.",
    points: [
      "Priced and stocked, straight into the cart",
      "Sold in bulk, with a minimum quantity and tiered prices",
      "Made to order, taking an enquiry instead of a checkout",
      "Sizes and colours with their own stock and prices",
      "Profit and margin worked out as you type the cost",
    ],
  },
  {
    kicker: "Running it",
    title: "Orders, customers and the numbers",
    body: "Everything that happens after somebody buys, in one place and in plain words.",
    points: [
      "Orders from pending through to delivered",
      "Enquiries tracked from new to won or lost",
      "Customers, their orders, addresses and totals",
      "Revenue, profit, best sellers, where visitors came from",
      "A notification on your phone the moment an order lands",
    ],
  },
  {
    kicker: "Looking right",
    title: "Build the shop while it is open",
    body: "Lay out any page from thirty-four kinds of section, with your real storefront beside you as you work.",
    points: [
      "Slideshows, galleries, comparisons, testimonials, countdowns",
      "Two themes, each with its own arrangement and features",
      "Try a theme for as long as you like without publishing it",
      "Menus, wording and fonts, all editable",
      "Your own uploaded fonts, checked before they are accepted",
    ],
  },
  {
    kicker: "Being found",
    title: "Your own address, working properly",
    body: "Paste your domain, copy two records at your registrar, and the panel checks them while you wait.",
    points: [
      "A free address that works the moment you sign up",
      "One address is the real one and the rest redirect to it",
      "The moment your domain goes live it becomes the main one",
      "Old links keep working when a page moves",
      "Search engines told which address is the real one",
    ],
  },
  {
    kicker: "Getting paid",
    title: "The money goes to your bank",
    body: "You connect your own gateway account. We are never a party to the payment — no cut, no float, nothing passing through us.",
    points: [
      "Card payments through PayFast",
      "Cash on delivery, bank transfer, JazzCash, Easypaisa",
      "An order is only marked paid after asking the provider",
      "Stock is held while a payment is in flight, released if it fails",
      "Your keys are sealed before they are stored",
    ],
  },
  {
    kicker: "Working together",
    title: "Your team, at the level they need",
    body: "Invite people by email; they keep their own sign-in and you choose what they can reach.",
    points: [
      "Four levels, from owner down to look-but-don't-touch",
      "Domains and payments need admin, not staff",
      "An invitation only works for the address you sent it to",
      "Sign out everywhere, for when you signed in somewhere you shouldn't",
      "A record of who changed what",
    ],
  },
];

/**
 * The domain records, shown rather than described.
 *
 * The reference this page is shaped after put a fake product simulator here,
 * with a play button and an invented stream of events. The honest version of
 * that section is showing a real artefact: these are the two records the panel
 * actually gives you, in the format it actually gives them, and the value is a
 * real one in shape — it is what the TXT record looks like.
 */
const RECORDS = [
  {
    type: "TXT",
    purpose: "Proves the domain is yours",
    name: "_synora-verify",
    value: "synora-verify=0mM5kp_t2Y2…",
  },
  {
    type: "A",
    purpose: "Sends visitors to your store",
    name: "@",
    value: "216.198.79.1",
  },
];

/**
 * Comparisons, kept honest.
 *
 * Every line is something this codebase actually does. A merchant who signs up
 * on the strength of a promise and finds it missing is worse than one who never
 * signed up at all.
 */
const COMPARISON = [
  { them: "Editing a live theme, hoping", us: "A live preview of the real page as you edit" },
  { them: "Deletes that quietly break other pages", us: "Warned before, recoverable after" },
  { them: "Per-app fees to complete the basics", us: "The basics are the product" },
  { them: "Staff roles behind a higher plan", us: "Roles and invitations from day one" },
  { them: "Domain setup that ends in support chat", us: "Two records, checked while you wait" },
];

/** Numbered because it is genuinely a sequence, not for decoration. */
const START = [
  { n: "1", title: "Pick a name", body: "Your store is live on its free address straight away, with nothing to configure." },
  { n: "2", title: "Add a few products", body: "Or bring a whole catalogue in from a Shopify CSV — it loads column for column." },
  { n: "3", title: "Connect your domain", body: "When you are ready, not before. Two records, and the panel watches for them." },
];

export default function PlatformHome() {
  return (
    <>
      {/* --------------------------------------------------------------- hero
          One accent, used once, on the thing you are meant to press. The page
          this is shaped after ran three different purple-to-pink gradients
          behind its hero; with no single strongest thing on the screen, the
          button had nothing to stand out against. */}
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pt-24">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Open a store today, connect your domain the same afternoon
          </p>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.06] tracking-tight text-balance text-ink sm:text-6xl">
            Commerce that catches
            <br className="hidden sm:block" /> your mistakes
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Everything you need to sell online — products, orders, pages, your own domain, your
            team. Built so the expensive errors are hard to make and easy to undo.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={appUrl("/merchant/signup")}
              className="inline-flex items-center gap-2 rounded-pill bg-brand-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Create your store
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={appUrl("/merchant/login")}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-subtle"
            >
              I already have one
            </a>
          </div>

          <p className="mt-4 text-xs text-ink-faint">
            No card to start. Your free address works immediately.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- proof
          Where the reference put uptime and a user count. Neither would be
          true here, and a number that cannot be checked is worth less than no
          number. These four can all be counted in the product. */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
          {PROOF.map(({ figure, label }) => (
            <div key={label} className="bg-surface px-5 py-6">
              <dt className="text-3xl font-semibold tracking-tight text-ink tabular-nums">
                {figure}
              </dt>
              <dd className="mt-1 text-xs leading-snug text-ink-soft">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------- offers */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-brand-500">
            What you get
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Everything a shop needs, and none of it sold separately
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            All of it, on the free address, from the first day. There is no marketplace to shop in
            before your store works.
          </p>

          <div className="mt-12 grid gap-x-8 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERS.map(({ kicker, title, body, points }) => (
              <div key={title} className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-faint">
                  {kicker}
                </p>
                <h3 className="mt-2 text-base font-semibold leading-snug text-balance text-ink">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                <ul className="mt-3.5 space-y-1.5">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm leading-snug text-ink-soft">
                      <Check className="mt-[3px] h-3.5 w-3.5 flex-shrink-0 text-brand-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- the thing
          The reference's showpiece was a fake simulator. This is the real
          artefact instead: the two records the panel hands you, in the shape it
          hands them over, next to the state it shows while it waits. */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-brand-500">
              Your own address
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              The part that usually ends in a support chat
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Paste the domain you already own. The panel gives you exactly two records, with the
              values ready to copy, and then watches for them — you do not have to come back and
              guess whether it worked.
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              The moment it starts serving, it becomes your main address and everything else
              redirects to it. Nothing anyone has already shared stops working.
            </p>
          </div>

          {/* A quiet reproduction of the real panel row, not a screenshot —
              it stays readable at any width and in any theme. */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-panel">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-medium text-ink">yourshop.com</span>
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                waiting for DNS
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Add these at whoever you bought the domain from.
            </p>

            <div className="mt-4 space-y-4">
              {RECORDS.map((record) => (
                <div key={record.type}>
                  <p className="text-xs font-medium text-ink">
                    {record.type} record
                    <span className="font-normal text-ink-faint"> — {record.purpose}</span>
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { label: "Name", value: record.name },
                      { label: "Value", value: record.value },
                    ].map((field) => (
                      <div key={field.label} className="flex items-center gap-2">
                        <span className="w-11 flex-shrink-0 text-xs text-ink-faint">
                          {field.label}
                        </span>
                        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-subtle px-2.5 py-1.5 font-mono text-xs text-ink">
                          {field.value}
                        </code>
                        <Copy aria-hidden className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- start */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            What the first hour looks like
          </h2>
          <div className="mt-9 grid gap-6 sm:grid-cols-3">
            {START.map(({ n, title, body }) => (
              <div key={n}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs font-semibold text-ink">
                  {n}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- comparison */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
          Coming from somewhere else
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
          The differences that show up in a working week, not on a feature grid.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">
              How the usual way of working compares with APP
            </caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="w-1/2 pb-3 pr-6 font-medium text-ink-faint">
                  The usual
                </th>
                <th scope="col" className="w-1/2 pb-3 font-medium text-ink">
                  Here
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.us} className="border-b border-border align-top">
                  <td className="py-3.5 pr-6 text-ink-soft">{row.them}</td>
                  <td className="py-3.5">
                    <span className="flex gap-2 text-ink">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
                      {row.us}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------- cta
          The one block that fills with the accent. A call to action is the
          page's active state, and #6666ff means active everywhere else in this
          product — so it is the same rule, not an exception to it. */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl bg-brand-500 px-6 py-14 text-center sm:px-10 sm:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            Start selling this week
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85">
            Pick a name, add a few products, connect your domain when you&rsquo;re ready. You can
            do the first two in the next ten minutes.
          </p>
          <a
            href={appUrl("/merchant/signup")}
            className="mt-8 inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-medium text-brand-600 transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
          >
            Create your store
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-4 text-xs text-white/70">No card to start.</p>
        </div>
      </section>
    </>
  );
}
