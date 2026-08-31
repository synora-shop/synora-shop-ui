import type { Metadata } from "next";
import { appUrl } from "@/lib/shop-context";
import {
  ArrowRight,
  Check,
  Eye,
  Globe,
  KeyRound,
  Layers,
  ShieldCheck,
  Undo2,
} from "lucide-react";

// No title here on purpose: this is the site's front page, so the root
// layout's default is exactly right. Setting one would get "· Shop"
// appended by the root template and say the name twice.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The front door.
 *
 * The pitch is deliberately narrow. Everyone in this market claims "easy" and
 * "powerful", so those words say nothing. What is actually different here is
 * that the software argues with you when you are about to do something you will
 * regret — and that is what the page leads with.
 */

/** What we do differently, stated as things that have actually been built. */
const DIFFERENCES = [
  {
    icon: Undo2,
    title: "It catches your mistakes",
    body: "Delete a category that eight products rely on and it tells you, before it happens, not after. Deleted things go to a bin you can empty when you're sure, not into the void.",
  },
  {
    icon: Eye,
    title: "Change the shop while it's open",
    body: "Lay out every page section by section, with your real storefront in the panel beside you, updating as you type.",
  },
  {
    icon: Globe,
    title: "Your domain, working properly",
    body: "Paste your domain, copy two records, done. One address is the real one and the rest redirect to it, so you're never competing with yourself in search results.",
  },
  {
    icon: KeyRound,
    title: "Bring your team in safely",
    body: "Invite people at the level they need. An invitation only works for the address you sent it to, and your store always has exactly one owner.",
  },
  {
    icon: ShieldCheck,
    title: "Separate by construction",
    body: "Every query for your shop carries your shop. Not by convention or a careful review, the data layer refuses to run without it.",
  },
  {
    icon: Layers,
    title: "Nothing is hidden behind an app",
    body: "Pages, menus, wording, theme, redirects and staff are all in the box. No marketplace to shop in before your store works.",
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

          <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-ink sm:text-6xl">
            Commerce that catches your&nbsp;mistakes
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Everything you need to sell online, products, orders, pages, your own domain, your
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

      {/* ------------------------------------------------------ differences */}
      <section className="border-t border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance text-ink">
            What&rsquo;s actually different
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            Every platform says it&rsquo;s easy and powerful. Here is the specific list.
          </p>

          <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENCES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- comparison */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance text-ink">
          Coming from somewhere else
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
          The differences that show up in a working week, not on a feature grid.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">
              How the usual way of working compares with Shop
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
      </section>

      {/* -------------------------------------------------------------- cta */}
      <section className="border-t border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:py-20">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance text-ink">
            Start selling this week
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            Pick a name, add a few products, connect your domain when you&rsquo;re ready. You can
            do the first two in the next ten minutes.
          </p>
          <a
            href={appUrl("/merchant/signup")}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Create your store
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </>
  );
}
