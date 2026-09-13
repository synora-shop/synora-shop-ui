import type { Metadata } from "next";
import Link from "next/link";
import { appUrl } from "@/lib/shop-context";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides, release notes, fixes and known issues for APP by Synora Digitals. Being written now.",
  // Nothing here to index yet, and a thin page ranking for the product's own
  // name is worse than no page at all until it has something in it.
  robots: { index: false, follow: true },
};

/**
 * Documentation, before there is any.
 *
 * A "coming soon" page earns its place only if it says what is coming and
 * roughly when somebody should look again — otherwise it is a dead end wearing
 * a promise. This one lists the six things that will live here, so a merchant
 * who arrives can tell whether what they need is going to appear, and where to
 * go in the meantime if it is not.
 */

const SECTIONS = [
  {
    title: "Guides",
    body: "How to do each thing in the panel, in order, with the screen in front of you — opening a shop, adding a product that has sizes, connecting a domain, taking your first payment.",
  },
  {
    title: "How it works",
    body: "The reasoning behind the parts that surprise people. Why a domain becomes your main address the moment it goes live. Why an order is not marked paid until the provider confirms it.",
  },
  {
    title: "Release notes",
    body: "What changed, when, and what it means for a shop that is already open. Written for the person running the shop, not for the person who wrote the code.",
  },
  {
    title: "Fixes",
    body: "What was broken and is not any more, so you can tell whether the thing that caught you out last week has been dealt with.",
  },
  {
    title: "Known issues",
    body: "What is broken now, what it affects, and what to do instead until it is fixed. Published rather than hidden, because finding out the hard way costs you a sale.",
  },
  {
    title: "Answers",
    body: "The questions that come up often enough to be worth writing down once.",
  },
];

export default function DocumentationPage() {
  return (
    <section className="relative isolate overflow-hidden bg-night">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 15% 0%, rgba(80,80,234,0.42) 0%, rgba(12,12,74,0.55) 38%, rgba(12,12,74,0) 72%)",
        }}
      />

      <div className="relative mx-auto max-w-[78rem] px-5 pb-24 pt-32 sm:pb-32 sm:pt-40">
        <p className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
          Being written now
        </p>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-6xl">
          Documentation is
          <br />
          <span className="text-brand-300">on its way.</span>
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
          Everything you need to run your shop will live here — how to do each thing, what changed
          in the last update, and what is broken today. Here is what is being written.
        </p>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="bg-night px-6 py-7">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            Need something before it is here? The panel explains each screen as you use it.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 rounded-pill border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <a
              href={appUrl("/merchant/login")}
              className="inline-flex items-center gap-2 rounded-pill bg-white px-5 py-2.5 text-sm font-medium text-night transition-transform hover:-translate-y-0.5"
            >
              Open your panel
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
