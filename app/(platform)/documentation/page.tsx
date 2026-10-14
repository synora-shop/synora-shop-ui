import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe, HelpCircle, Package, ReceiptText, Rocket, Tag, TriangleAlert, Users, Wallet, type LucideIcon } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { ROLE_DESCRIPTION } from "@/lib/roles";
import { Highlight, LightPage, LightPageHero } from "@/components/platform/light-page";

export const metadata: Metadata = {
  title: "Documentation",
  description: "How to open and run your shop on Synora App: products, orders, payments, domains and your team.",
  // Short versions only, for now. Kept out of search until the full guides
  // are written, so a thin page does not rank for the product's own name.
  robots: { index: false, follow: true },
};

/**
 * The help centre, in the front page's look (redrawn 14 October).
 *
 * The articles are short versions, written to be true today: every step and
 * feature named is one the panel has. The full step-by-step guides replace
 * them later; the shape (topic tiles, a side index, one section per topic,
 * known issues, answers) is meant to stay.
 */

type Tone = "iris" | "lavender" | "sky" | "mint";
const TONE: Record<Tone, { tile: string; icon: string }> = {
  iris: { tile: "bg-[#6666ff] text-white", icon: "bg-white/20 text-white" },
  lavender: { tile: "bg-[#b7b9ff] text-[#0d0d50]", icon: "bg-white/50 text-[#0d0d50]" },
  sky: { tile: "bg-[#c8e7ff] text-[#0d0d50]", icon: "bg-white/60 text-[#0d0d50]" },
  mint: { tile: "bg-[#b8efd6] text-[#0d0d50]", icon: "bg-white/60 text-[#0d0d50]" },
};

type Topic = {
  id: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  blurb: string;
  steps?: string[];
  points?: [string, string][];
};

const TOPICS: Topic[] = [
  {
    id: "getting-started",
    icon: Rocket,
    tone: "iris",
    title: "Getting started",
    blurb: "Open your shop in four steps. No card needed.",
    steps: [
      "Create your account with your name, email, a password and your shop's name. Your free address is made from the shop's name.",
      "Open the confirmation email and tap the link. Nothing arrived after a few minutes? Check spam, or ask for a new link.",
      "Add your first product: a title, a price in rupees, photos, and sizes or colours if it comes in them.",
      "Pick a theme, choose how you take payment, and share your address.",
    ],
  },
  {
    id: "products",
    icon: Package,
    tone: "lavender",
    title: "Products",
    blurb: "Sizes, colours, stock, and selling in bulk.",
    points: [
      ["Sizes and colours", "Add the options once and every combination gets its own price and stock."],
      ["Stock", "Keep a count for each size and colour, and choose whether a product keeps selling once it runs out."],
      ["Bulk products", "Sell by quantity with price breaks, a price range, or “ask for a price”, where customers send you an enquiry instead."],
      ["Coming from Shopify", "Bring your products over from a Shopify product export file, descriptions and SEO included."],
    ],
  },
  {
    id: "orders",
    icon: ReceiptText,
    tone: "sky",
    title: "Orders",
    blurb: "What happens when somebody buys.",
    points: [
      ["A new order", "It appears in your panel straight away, and an email about it goes to your shop's notification address."],
      ["Your customer", "They get a confirmation email with a private link to their order, so they can check it without an account."],
      ["Order notes", "Anything the customer wrote at checkout shows on the order."],
    ],
  },
  {
    id: "payments",
    icon: Wallet,
    tone: "mint",
    title: "Payments",
    blurb: "Cash on delivery, wallets and cards.",
    points: [
      ["Cash on delivery", "Customers pay when the order arrives. The way most of Pakistan still buys online."],
      ["JazzCash and Easypaisa", "Customers pay from their mobile wallet at checkout."],
      ["Cards through PayFast", "Connect your PayFast account and customers can pay by card."],
      ["When an order counts as paid", "Only once the payment provider confirms it, never just because the customer came back from the payment page."],
    ],
  },
  {
    id: "domains",
    icon: Globe,
    tone: "iris",
    title: "Domains",
    blurb: "Your free address, and your own.",
    points: [
      ["Your free address", "Every shop gets one the moment it is created, like yourshop.app.synoradigitals.com."],
      ["Your own domain", "Add it in the panel, put the records it shows you at your domain company, then press Check now."],
      ["Which address is main", "Your own domain becomes your main address once it is live. The free one keeps working and sends people to it."],
    ],
  },
  {
    id: "team",
    icon: Users,
    tone: "lavender",
    title: "Your team",
    blurb: "Invite people, and choose what they can do.",
    points: [
      ["Owner", ROLE_DESCRIPTION.OWNER],
      ["Admin", ROLE_DESCRIPTION.ADMIN],
      ["Staff", ROLE_DESCRIPTION.STAFF],
      ["Viewer", ROLE_DESCRIPTION.VIEWER],
      ["Invitations", "An invitation is good for seven days. Inviting the same person again sends a fresh link."],
    ],
  },
  {
    id: "discounts",
    icon: Tag,
    tone: "sky",
    title: "Discounts",
    blurb: "Codes for Eid, sales and regulars.",
    points: [
      ["Discount codes", "Make a code like EID25 for a percentage off, an amount off, or free shipping."],
      ["Dates", "Give it a start and an end, and it switches itself on and off."],
      ["Limits", "Cap how many times a code can be used, in total or per customer."],
    ],
  },
];

const KNOWN_ISSUES: [string, string][] = [
  [
    "No order notes box in the Loom and Kite checkouts",
    "Customers on these two themes can't leave a note at checkout yet. Ask for it on WhatsApp or your contact page until it is added.",
  ],
];

const ANSWERS: [string, string][] = [
  ["Do I need a card to start?", "No. You can open your shop and add products without one."],
  ["I didn't get the confirmation email.", "Check your spam folder first. Then use “Send a new link” on the confirm page; a new link replaces the old one."],
  ["Can I change my free address later?", "Yes, and you can connect your own domain whenever you are ready."],
  ["Can I move my shop from Shopify?", "Yes. Export your products from Shopify and import the file into your panel."],
];

export default function DocumentationPage() {
  const nav = [...TOPICS.map((t) => [t.id, t.title, t.icon] as const), ["known-issues", "Known issues", TriangleAlert] as const, ["answers", "Answers", HelpCircle] as const];
  return (
    <LightPage>
      <LightPageHero
        pill="Help centre · short versions while the full guides are written"
        title={
          <>
            Everything you need
            <br />
            to <Highlight>run your shop.</Highlight>
          </>
        }
        lead="How to open your shop, add products, take payment the way Pakistan pays, and bring your team in. Pick a topic."
      >
        {/* The topics, as the front page's colour tiles. */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TOPICS.map(({ id, icon: Icon, tone, title, blurb }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`group relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-[1.6rem] p-5 transition-transform hover:-translate-y-1 ${TONE[tone].tile}`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${TONE[tone].icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.01em]">
                  {title}
                  <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-[13px] leading-snug opacity-75">{blurb}</span>
              </span>
            </a>
          ))}
          <a href="#known-issues" className="group flex min-h-[9.5rem] flex-col justify-between rounded-[1.6rem] border border-[#0d0d50]/10 bg-white p-5 transition-transform hover:-translate-y-1">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff4ee] text-[#c2410c]">
              <TriangleAlert className="h-5 w-5" />
            </span>
            <span>
              <span className="text-[15px] font-semibold">Known issues</span>
              <span className="mt-1 block text-[13px] leading-snug text-[#0d0d50]/60">What is broken today, and what to do instead.</span>
            </span>
          </a>
        </div>
      </LightPageHero>

      <div className="mx-auto grid max-w-[78rem] gap-10 px-5 pb-24 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        {/* The index. */}
        <nav aria-label="Topics" className="hidden lg:block">
          <ul className="sticky top-28 flex flex-col gap-0.5 border-l border-[#0d0d50]/10">
            {nav.map(([id, title, Icon]) => (
              <li key={id}>
                <a href={`#${id}`} className="-ml-px flex items-center gap-2.5 border-l-2 border-transparent py-2 pl-4 text-sm font-medium text-[#0d0d50]/60 transition-colors hover:border-[#6666ff] hover:text-[#0d0d50]">
                  <Icon className="h-4 w-4" />
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          {TOPICS.map(({ id, icon: Icon, tone, title, blurb, steps, points }) => (
            <section key={id} id={id} className="scroll-mt-28 rounded-[2rem] border border-[#0d0d50]/[0.08] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(13,13,80,0.25)] sm:p-9">
              <div className="flex items-center gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TONE[tone].tile}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.03em]">{title}</h2>
                  <p className="text-[15px] text-[#0d0d50]/60">{blurb}</p>
                </div>
              </div>

              {steps && (
                <ol className="mt-7 grid gap-3 sm:grid-cols-2">
                  {steps.map((s, i) => (
                    <li key={s} className="flex gap-4 rounded-[1.25rem] bg-[#f6f6ff] p-5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#6666ff] text-sm font-bold text-white">{i + 1}</span>
                      <p className="text-[15px] leading-relaxed text-[#0d0d50]/80">{s}</p>
                    </li>
                  ))}
                </ol>
              )}

              {points && (
                <dl className="mt-7 divide-y divide-[#0d0d50]/[0.07]">
                  {points.map(([term, def]) => (
                    <div key={term} className="grid gap-1 py-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
                      <dt className="text-[15px] font-semibold">{term}</dt>
                      <dd className="text-[15px] leading-relaxed text-[#0d0d50]/70">{def}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}

          <section id="known-issues" className="scroll-mt-28 rounded-[2rem] border border-[#c2410c]/15 bg-[#fffaf6] p-6 sm:p-9">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff0e6] text-[#c2410c]">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.03em]">Known issues</h2>
                <p className="text-[15px] text-[#0d0d50]/60">Published, not hidden. Finding out the hard way costs you a sale.</p>
              </div>
            </div>
            <ul className="mt-7 flex flex-col gap-3">
              {KNOWN_ISSUES.map(([t, d]) => (
                <li key={t} className="rounded-[1.25rem] bg-white p-5 ring-1 ring-[#c2410c]/10">
                  <p className="text-[15px] font-semibold">{t}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-[#0d0d50]/70">{d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="answers" className="scroll-mt-28 rounded-[2rem] border border-[#0d0d50]/[0.08] bg-white p-6 sm:p-9">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0d0d50] text-white">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.03em]">Answers</h2>
                <p className="text-[15px] text-[#0d0d50]/60">The questions that come up most.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {ANSWERS.map(([q, a]) => (
                <details key={q} className="group rounded-[1.25rem] bg-[#f6f6ff] px-5 py-4 open:bg-[#eeeeff]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-lg leading-none text-[#6666ff] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#0d0d50]/70">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-[#0d0d50] p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xl font-semibold tracking-[-0.02em]">Ready when you are.</p>
              <p className="mt-1 text-[15px] text-white/60">The panel explains each screen as you use it.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/release-notes" className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold transition-colors hover:bg-white/10">
                What&rsquo;s new
              </Link>
              <a href={appUrl("/merchant/signup")} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-5 text-sm font-semibold transition-colors hover:bg-[#5a5af5]">
                Create your shop <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </LightPage>
  );
}
