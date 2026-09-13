import type { Metadata } from "next";
import { appUrl } from "@/lib/shop-context";
import { ArrowRight, Check } from "lucide-react";

// No title here on purpose: this is the site's front page, so the root
// layout's default is exactly right. Setting one would get "· APP"
// appended by the root template and say the name twice.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The front door, and now the application host's root as well.
 *
 * Two audiences meet here and they want opposite things. Somebody who has never
 * heard of this needs to know what it is before they are asked for an email
 * address. Somebody who already has a store wants their panel and nothing else.
 * The page is written for the first, because the second has a bookmark.
 *
 * The pitch is deliberately narrow. Everyone in this market claims "easy" and
 * "powerful", so those words say nothing. What is different here is that the
 * software argues with you when you are about to do something you will regret,
 * and that everything is in the box — so that is what it leads with, and every
 * claim below is something that has actually been built.
 */

/** What you get, grouped the way the panel itself is. */
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
      "Revenue, profit, best sellers and where visitors came from",
      "A push notification on your phone the moment an order lands",
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
 * Comparisons, kept honest.
 *
 * Every line is something this codebase actually does. It is tempting to claim
 * more, and a merchant who signs up on the strength of a promise and finds it
 * missing is worse than one who never signed up.
 */
const COMPARISON = [
  { them: "Editing a live theme, hoping", us: "A live preview of the real page as you edit" },
  { them: "Deletes that quietly break other pages", us: "Warned before, recoverable after" },
  { them: "Per-app fees to complete the basics", us: "The basics are the product" },
  { them: "Staff roles behind a higher plan", us: "Roles and invitations from day one" },
  { them: "Domain setup that ends in support chat", us: "Two records, checked while you wait" },
];

/** The three things that are true before you have done anything. */
const START = [
  { n: "1", title: "Pick a name", body: "Your store is live on its free address straight away, with nothing to configure." },
  { n: "2", title: "Add a few products", body: "Or bring a whole catalogue in from a Shopify CSV — it loads column for column." },
  { n: "3", title: "Connect your domain", body: "When you are ready, not before. Two records, and the panel watches for them." },
];

export default function PlatformHome() {
  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            Open a store today, connect your domain the same afternoon
          </p>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-ink sm:text-6xl">
            Commerce that catches your&nbsp;mistakes
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Everything you need to sell online — products, orders, pages, your own domain, your
            team. Built so the expensive errors are hard to make and easy to undo.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={appUrl("/merchant/signup")}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Create your store
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={appUrl("/merchant/login")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-subtle"
            >
              I already have one
            </a>
          </div>

          <p className="mt-4 text-xs text-ink-faint">
            No card to start. Your free address works immediately.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- offers
          Six blocks, grouped the way the panel groups itself, so the shape of
          the page is the shape of the thing being sold. Every bullet is a
          feature that exists — this list is checked against the panel rather
          than written to fill a grid. */}
      <section className="border-t border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink">
            What you get
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            All of it, on the free address, from the first day. There is no marketplace to shop in
            before your store works.
          </p>

          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERS.map(({ kicker, title, body, points }) => (
              <div key={title} className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-brand-600">
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

      {/* ------------------------------------------------------------ start
          Numbered because it genuinely is a sequence — you cannot connect a
          domain to a store that does not exist yet. */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink">
          What the first hour looks like
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {START.map(({ n, title, body }) => (
            <div key={n} className="rounded-xl border border-border bg-surface p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                {n}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- comparison */}
      <section className="border-t border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink">
            Coming from somewhere else
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
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
                  <tr key={row.us} className="border-b border-border/60 align-top">
                    <td className="py-3.5 pr-6 text-ink-soft">{row.them}</td>
                    <td className="py-3.5">
                      <span className="flex gap-2 text-ink">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green" />
                        {row.us}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- cta */}
      <section className="mx-auto max-w-6xl px-5 py-16 text-center sm:py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink">
          Start selling this week
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          Pick a name, add a few products, connect your domain when you&rsquo;re ready. You can do
          the first two in the next ten minutes.
        </p>
        <a
          href={appUrl("/merchant/signup")}
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Create your store
          <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </>
  );
}
