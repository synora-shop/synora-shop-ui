import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  EyeOff,
  FileSpreadsheet,
  Globe,
  KeyRound,
  LayoutTemplate,
  LogOut,
  Mail,
  MessageCircle,
  Package,
  Paintbrush,
  Phone,
  RotateCcw,
  ShieldCheck,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The front page's middle: the marquee of everything in it, the four slabs
 * that stack as you scroll (what makes it different — the old page's four
 * promises, each on one of Synora's colours with a picture of it working),
 * the grid of everything else and the comparison.
 */

/* --------------------------------------------------------------- marquee -- */

const WORDS = ["Products", "Orders", "Payments", "Discounts", "Themes", "Your domain", "Team", "Analytics", "Chat buttons", "Pages", "Menus", "CSV import"];
const FILLS = [
  "bg-[#6666ff] text-white",
  "bg-[#b8efd6] text-[#0d0d50]",
  "bg-[#0d0d50] text-white",
  "bg-[#c8e7ff] text-[#0d0d50]",
  "bg-[#b7b9ff] text-[#0d0d50]",
  "border-2 border-[#0d0d50]/15 text-[#0d0d50]",
];

function Row({ words, reverse, offset }: { words: string[]; reverse?: boolean; offset: number }) {
  const pill = (w: string, i: number, hidden: boolean) => (
    <span key={`${w}-${i}-${hidden}`} aria-hidden={hidden || undefined} className={cn("shrink-0 rounded-full px-7 py-3 text-[1.7rem] font-semibold tracking-[-0.03em] sm:px-9 sm:py-4 sm:text-[2.6rem]", FILLS[(i + offset) % FILLS.length])}>
      {w}
    </span>
  );
  return (
    <div className="flex overflow-hidden">
      <div className={cn("flex w-max gap-3 pr-3 sm:gap-4 sm:pr-4", reverse ? "lp-marquee-rev" : "lp-marquee")}>
        {words.map((w, i) => pill(w, i, false))}
        {words.map((w, i) => pill(w, i, true))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    // The ends fade rather than cut: a pill sliding off a hard edge read as
    // chopped mid-word. Two still white overlays do it — a mask on the moving
    // strip had to be re-composited every frame.
    <section data-anim-scope aria-label="What is in it" className="relative flex flex-col gap-3 overflow-hidden bg-white py-10 sm:gap-4 sm:py-14">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[14%] bg-gradient-to-r from-white to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[14%] bg-gradient-to-l from-white to-transparent" />
      <Row words={WORDS} offset={0} />
      <Row words={[...WORDS].reverse()} reverse offset={3} />
    </section>
  );
}

/* ----------------------------------------------------------------- slabs -- */

function Points({ items, light }: { items: string[]; light?: boolean }) {
  return (
    <ul className="mt-7 flex flex-col gap-3">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3 text-[1.02rem] leading-snug">
          <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", light ? "bg-white/20" : "bg-white/70")}>
            <Check className="h-3.5 w-3.5" />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Slab({ n, kicker, title, points, bg, light, picture, top }: { n: string; kicker: string; title: string; points: string[]; bg: string; light?: boolean; picture: React.ReactNode; top: number }) {
  return (
    // Stacking only where a slab fits the screen; on a phone each one is
    // taller than the window, and stacking would hide its picture.
    <div className="lg:sticky" style={{ top }}>
      <article className={cn("lp-slab grid min-h-[540px] items-center gap-10 overflow-hidden rounded-[2.5rem] p-8 sm:p-12 lg:grid-cols-2 lg:p-16", light ? "text-white" : "text-[#0d0d50]")} style={{ background: bg }}>
        <div>
          <p className={cn("flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.12em]", light ? "text-white/70" : "text-[#0d0d50]/55")}>
            <span className={cn("font-mono text-[15px]", light ? "text-white" : "text-[#0d0d50]")}>{n}</span> {kicker}
          </p>
          <h3 className="mt-4 text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[3.2rem]">{title}</h3>
          <Points items={points} light={light} />
        </div>
        <div className="flex justify-center">{picture}</div>
      </article>
    </div>
  );
}

const card = "rounded-[20px] bg-white p-4 text-[#0d0d50] shadow-[0_24px_60px_-24px_rgba(13,13,80,0.4)]";

function BeforePicture() {
  return (
    <div className="relative h-[330px] w-full max-w-[420px]">
      <div className={cn(card, "absolute left-0 top-0 w-[72%] rotate-[-4deg]")}>
        <p className="flex items-center justify-between text-[13px] font-semibold">
          <span className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-[#6666ff]" /> Eid collection
          </span>
          <span className="rounded-full bg-[#c8e7ff] px-2 py-0.5 text-[10.5px]">Draft</span>
        </p>
        <p className="mt-2 text-[12px] text-[#707070]">Customers cannot see this until you publish it.</p>
      </div>
      <div className={cn(card, "absolute bottom-0 right-0 w-[68%] rotate-[4deg]")}>
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <Trash2 className="h-4 w-4 text-[#6666ff]" /> Bin
        </p>
        <p className="mt-2 flex items-center justify-between rounded-xl bg-[#f5f5f9] px-3 py-2 text-[12px]">
          Linen kurta, White
          <span className="inline-flex items-center gap-1 font-semibold text-[#5050e0]">
            <RotateCcw className="h-3 w-3" /> Restore
          </span>
        </p>
      </div>
      <div className={cn(card, "absolute left-1/2 top-1/2 w-[84%] -translate-x-1/2 -translate-y-1/2 p-5")}>
        <p className="text-[16px] font-semibold">Delete “Shirts”?</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#454545]">8 products are in this category. They stay, they just lose it.</p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-[#0d0d50] px-4 py-2 text-[12px] font-semibold text-white">Keep it</span>
          <span className="rounded-full border border-[#0d0d50]/10 px-4 py-2 text-[12px] text-[#707070]">Delete anyway</span>
        </div>
      </div>
    </div>
  );
}

function TeamPicture() {
  const people = [
    { n: "A", who: "Ayesha", role: "Owner", can: ["Orders", "Takings", "Settings"], tone: "#6666ff" },
    { n: "U", who: "Usman", role: "Staff", can: ["Orders", "Products"], tone: "#0d0d50" },
    { n: "Z", who: "Zara", role: "Viewer", can: ["Look only"], tone: "#3aa57a" },
  ];
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      {people.map((p, i) => (
        <div key={p.who} className={cn(card, "flex items-center gap-3")} style={{ rotate: `${[-2, 1.5, -1][i]}deg` }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-semibold text-white" style={{ background: p.tone }}>
            {p.n}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">
              {p.who} <span className="font-normal text-[#707070]">· {p.role}</span>
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {p.can.map((c) => (
                <span key={c} className="rounded-md bg-[#f2f2ff] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5050e0]">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <KeyRound className="h-4 w-4 text-[#9a9aa8]" />
        </div>
      ))}
      <div className="flex items-center justify-between rounded-[20px] bg-[#0d0d50] px-4 py-3 text-[12.5px] font-medium text-white">
        <span className="flex items-center gap-2">
          <LogOut className="h-4 w-4" /> Lost phone? Sign everyone out
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#0d0d50]">Done</span>
      </div>
    </div>
  );
}

function ChatPicture() {
  return (
    <div className="relative h-[330px] w-full max-w-[400px]">
      <div className={cn(card, "absolute inset-x-6 top-0 h-[250px] p-5")}>
        <div className="space-y-2.5" aria-hidden>
          <span className="block h-3 w-32 rounded-full bg-[#ececf3]" />
          <span className="block h-3 w-48 rounded-full bg-[#f3f3f7]" />
          <span className="block h-3 w-40 rounded-full bg-[#f3f3f7]" />
        </div>
        <p className="absolute bottom-5 left-5 max-w-[60%] rounded-2xl rounded-bl-sm bg-[#e8fff4] px-3.5 py-2.5 text-[12.5px] leading-snug text-[#0f5c3e]">Assalam o alaikum! Is this in a size 9?</p>
        <div className="absolute bottom-5 right-5 flex flex-col gap-2.5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#25d366] text-white shadow-lg">
            <MessageCircle className="h-6 w-6" />
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#0d0d50] text-white shadow-lg">
            <Phone className="h-5 w-5" />
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#6666ff] text-white shadow-lg">
            <Mail className="h-5 w-5" />
          </span>
        </div>
      </div>
      <div className={cn(card, "absolute bottom-0 left-0 w-[64%] rotate-[-3deg] py-3")}>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#707070]">Show on</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Home", "Products", "Checkout"].map((p, i) => (
            <span key={p} className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", i < 2 ? "bg-[#0d0d50] text-white" : "border border-[#0d0d50]/15 text-[#707070]")}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeavePicture() {
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      {[
        { dir: "Export", file: "products.csv", note: "Shopify's own columns" },
        { dir: "Import", file: "shopify-export.csv", note: "Column for column, back in" },
      ].map((r, i) => (
        <div key={r.dir} className={cn(card, "flex items-center gap-3")} style={{ rotate: `${i ? 2 : -2}deg` }}>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#b8efd6] text-[#0f5c3e]">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#707070]">{r.dir}</p>
            <p className="truncate font-mono text-[13.5px] font-medium">{r.file}</p>
            <p className="text-[11px] text-[#707070]">{r.note}</p>
          </div>
          <ArrowRight className={cn("h-5 w-5 text-[#6666ff]", i && "rotate-180")} />
        </div>
      ))}
      <p className="text-center text-[13px] font-medium text-white/80">Customers and orders come with it.</p>
    </div>
  );
}

export function Slabs() {
  return (
    <section id="different" className="scroll-mt-24 bg-white px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-[78rem]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#6666ff]">What makes it different</p>
          <h2 className="mt-4 text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[#0d0d50] sm:text-[4.2rem]">
            The parts that usually cost extra, <span className="text-[#6666ff]">or go missing.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-relaxed text-[#0d0d50]/60">
            Every platform lists products and takes payments, so saying so would tell you nothing. These are the parts that are normally an upgrade, an add-on, or simply absent.
          </p>
        </div>
        <div className="mt-14 flex flex-col gap-8 sm:mt-20">
          <Slab
            top={96}
            n="01"
            kicker="Before, not after"
            title="It argues with you while there is still time"
            points={["Tells you what a delete will break, before it breaks", "Deleted things wait in a bin, not a void", "Nothing reaches your customers until you publish it"]}
            bg="linear-gradient(140deg, #b7b9ff 0%, #d4d5ff 100%)"
            picture={<BeforePicture />}
          />
          <Slab
            top={120}
            n="02"
            kicker="Your team"
            title="Bring in help without handing over the keys"
            points={["Give each person only what they need", "Your packer sees orders, not your takings", "Sign everyone out of a lost phone at once"]}
            bg="linear-gradient(140deg, #c8e7ff 0%, #e2f2ff 100%)"
            picture={<TeamPicture />}
          />
          <Slab
            top={144}
            n="03"
            kicker="Talking to customers"
            title="Chat buttons that cost nothing"
            points={["WhatsApp, a call, an email, any link at all", "Your own icon, colour and opening message", "Choose the pages each one shows on"]}
            bg="linear-gradient(140deg, #b8efd6 0%, #d8f7e9 100%)"
            picture={<ChatPicture />}
          />
          <Slab
            top={168}
            n="04"
            kicker="No lock-in"
            title="Leave whenever you like"
            points={["Your catalogue leaves as a Shopify CSV", "And loads back in the same way, column for column", "Customers and orders come with it"]}
            bg="linear-gradient(140deg, #6666ff 0%, #4b4bd8 100%)"
            light
            picture={<LeavePicture />}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- included -- */

const INCLUDED = [
  { Icon: Package, title: "Products and stock", line: "Sizes, colours and photos, with stock that counts itself down.", tint: "#b7b9ff" },
  { Icon: Truck, title: "Orders, tracked", line: "Packed, sent and delivered, with a page your customer can follow.", tint: "#c8e7ff" },
  { Icon: CreditCard, title: "Paid the way Pakistan pays", line: "Cash on delivery, JazzCash, Easypaisa, and cards through PayFast.", tint: "#b8efd6" },
  { Icon: Tag, title: "Discount codes", line: "Set the saving, the dates and how many times it can be used.", tint: "#b7b9ff" },
  { Icon: Globe, title: "Your own domain", line: "Start on a free address; connect yours whenever you are ready.", tint: "#c8e7ff" },
  { Icon: Paintbrush, title: "A live customizer", line: "Edit your storefront section by section, and watch it redraw.", tint: "#b8efd6" },
  { Icon: BarChart3, title: "Analytics", line: "Sales, visitors and what they bought, the week on one screen.", tint: "#b7b9ff" },
  { Icon: LayoutTemplate, title: "Pages, menus, words", line: "About, FAQ and your own pages. Every word on the shop is yours to change.", tint: "#c8e7ff" },
  { Icon: ShieldCheck, title: "Customer accounts", line: "Customers sign in with a code by email. No password to forget.", tint: "#b8efd6" },
];

/**
 * Everything else, as a keyboard: nine keycaps in Synora's colours and a
 * small screen above them. Press — or point at, or tab to — a key and it
 * sinks, and the screen says what that part does. Two rows where nine cards
 * took three, and no script: the screen reads the keys through :has()
 * (app/globals.css, ".lp-kb").
 */
const KEY_FACE: Record<string, string> = {
  "#b7b9ff": "bg-[#b7b9ff] shadow-[0_6px_0_#8f92e8,0_14px_24px_-10px_rgba(13,13,80,0.35)]",
  "#c8e7ff": "bg-[#c8e7ff] shadow-[0_6px_0_#9ccbef,0_14px_24px_-10px_rgba(13,13,80,0.35)]",
  "#b8efd6": "bg-[#b8efd6] shadow-[0_6px_0_#86d6b2,0_14px_24px_-10px_rgba(13,13,80,0.35)]",
};

export function Included() {
  return (
    <section id="included" data-anim-scope className="lp-later scroll-mt-24 bg-white px-4 pb-24 sm:px-6 sm:pb-32">
      <div className="mx-auto max-w-[62rem]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[#0d0d50] sm:text-[3.8rem]">
            And everything else, <span className="bg-[#b8efd6] px-2 [box-decoration-break:clone]">within reach.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[1.02rem] leading-relaxed text-[#0d0d50]/60">On the one price, from the first day. Press a key.</p>
        </div>

        <div className="lp-kb mt-12 rounded-[2.25rem] border border-[#0d0d50]/[0.06] bg-[#f3f3f9] p-4 shadow-panel sm:p-6">
          {/* The screen. */}
          <div className="relative flex min-h-[112px] items-center overflow-hidden rounded-[1.4rem] bg-[#0d0d50] px-6 py-5 sm:min-h-[96px] sm:px-8">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(rgba(183,185,255,0.18)_1px,transparent_1px)] bg-[size:6px_6px]" />
            <span aria-hidden className="absolute right-5 top-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#b8efd6]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b8efd6]" /> included
            </span>
            <div className="relative" aria-live="polite">
              {INCLUDED.map(({ title, line }, i) => (
                <p key={title} data-desc={i} className="font-mono text-[13.5px] leading-relaxed text-white/85 sm:text-[15px]">
                  <span className="font-semibold text-[#b7b9ff]">{title}:</span> {line}
                  <span className="lp-cursor ml-1 inline-block h-[1em] w-[0.55em] translate-y-[2px] bg-[#b8efd6]" />
                </p>
              ))}
            </div>
          </div>

          {/* The keys. */}
          <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
            {INCLUDED.map(({ Icon, title, tint }, i) => (
              <button
                key={title}
                type="button"
                data-key={i}
                aria-label={title}
                className={cn(
                  "group flex min-h-[76px] flex-col items-start justify-between gap-2 rounded-[16px] px-3 pb-2.5 pt-3 sm:min-h-[104px] sm:rounded-[18px] sm:px-5 sm:pb-3 sm:pt-3.5 text-left text-[#0d0d50] transition-[transform,box-shadow] duration-150 focus:outline-none",
                  KEY_FACE[tint]
                )}
              >
                <Icon className="h-5 w-5 opacity-80" />
                <span className="text-[12px] font-semibold leading-tight sm:text-[15px]">{title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ comparison -- */

/**
 * "Coming from somewhere else?" — as two receipts.
 *
 * At the left, everywhere else's: a little crumpled, every line another
 * charge, the total that keeps adding up. At the right, ours: crisp, every
 * line Included, one price, and a stamp across it. Pointing at a line lights
 * its match on the other receipt (:has(), no script). No competitor's prices
 * are named — the point is that the lines are charges at all.
 */
const LINES = [
  { them: "Paying per app to finish the basics", cost: "+ per app", us: "The basics are the product" },
  { them: "A theme that costs more than the platform", cost: "+ licence", us: "Every theme, all of them" },
  { them: "A paid add-on just for a WhatsApp button", cost: "+ add-on", us: "Chat buttons for any app" },
  { them: "Choosing a plan before you know what you need", cost: "+ upgrade", us: "One price. Get on with selling" },
  { them: "A wholesale app to sell in bulk", cost: "+ another app", us: "Bulk products with quantity price breaks" },
  { them: "An app just for special instructions and gift messages", cost: "+ another app", us: "Order notes, right in checkout" },
];

/**
 * A receipt's torn edge: a strip of teeth in the paper's colour, drawn as a
 * repeating SVG pattern. (A CSS mask did this first and seamed where its
 * pieces met, leaving a pale line and a doubled edge.)
 */
function Torn({ colour, side, id }: { colour: string; side: "top" | "bottom"; id: string }) {
  return (
    <svg aria-hidden width="100%" height="9" className="block">
      <defs>
        <pattern id={id} width="14" height="9" patternUnits="userSpaceOnUse">
          <path d={side === "bottom" ? "M0 0H14L7 9Z" : "M0 9H14L7 0Z"} fill={colour} />
        </pattern>
      </defs>
      <rect width="100%" height="9" fill={`url(#${id})`} />
    </svg>
  );
}

// Written out whole: Tailwind only builds classes it can read in the source.
const hoverRows =
  '[&:has([data-row="0"]:hover)_[data-row="0"]]:bg-[#6666ff]/[0.08] [&:has([data-row="1"]:hover)_[data-row="1"]]:bg-[#6666ff]/[0.08] [&:has([data-row="2"]:hover)_[data-row="2"]]:bg-[#6666ff]/[0.08] [&:has([data-row="3"]:hover)_[data-row="3"]]:bg-[#6666ff]/[0.08] [&:has([data-row="4"]:hover)_[data-row="4"]]:bg-[#6666ff]/[0.08] [&:has([data-row="5"]:hover)_[data-row="5"]]:bg-[#6666ff]/[0.08]';

export function Comparison() {
  return (
    <section className="lp-later relative isolate overflow-hidden bg-white px-4 pb-28 pt-6 sm:px-6 sm:pb-36">
      <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[880px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,#e2e2ff,transparent)] opacity-90" />
      <div className="mx-auto max-w-[78rem]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#6666ff]">Coming from somewhere else?</p>
          <h2 className="mt-4 text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[#0d0d50] sm:text-[3.8rem]">
            Compare the <span className="relative whitespace-nowrap">receipts.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[1.02rem] leading-relaxed text-[#0d0d50]/60">The differences you notice in a working week, not the ones on a feature grid.</p>
        </div>

        <div className={cn("mt-16 grid items-start gap-10 lg:grid-cols-2 lg:gap-6", hoverRows)}>
          {/* Everywhere else. */}
          {/* The shadow sits on a wrapper: the torn-edge mask would cut it off the paper itself. */}
          <div className="mx-auto w-[92%] max-w-[460px] rotate-[-2.5deg] sm:w-full [filter:drop-shadow(0_24px_30px_rgba(13,13,80,0.16))] lg:mt-10">
          <Torn colour="#f1f1f5" side="top" id="torn-them-top" />
          <div className="bg-[#f1f1f5] px-7 py-8 font-mono text-[#0d0d50]/55">
            <p className="text-center text-[11px] uppercase tracking-[0.3em]">Everywhere else</p>
            <p className="mt-1 text-center text-[10.5px] tracking-[0.15em] text-[#0d0d50]/40">receipt #00001 · again</p>
            <div className="my-5 border-t border-dashed border-[#0d0d50]/25" />
            <ul className="flex flex-col">
              {LINES.map((l, i) => (
                <li key={l.them} data-row={i} className="flex items-baseline justify-between gap-4 rounded-md px-2 py-2.5 text-[12.5px] transition-colors">
                  <span className="leading-snug">{l.them}</span>
                  <span className="shrink-0 font-semibold text-[#c2410c]/80">{l.cost}</span>
                </li>
              ))}
            </ul>
            <div className="my-5 border-t border-dashed border-[#0d0d50]/25" />
            <p className="mb-2 flex items-baseline justify-between px-2 text-[12px] text-[#0d0d50]/60">
              <span>APPS TO INSTALL</span>
              <span className="font-semibold text-[#c2410c]">4+</span>
            </p>
            <p className="flex items-baseline justify-between px-2 text-[13px] font-semibold text-[#0d0d50]/70">
              <span>TOTAL</span>
              <span className="text-[#c2410c]">keeps adding up</span>
            </p>
            <p className="mt-6 text-center text-[10.5px] tracking-[0.2em] text-[#0d0d50]/35">* prices may change at renewal</p>
          </div>
          <Torn colour="#f1f1f5" side="bottom" id="torn-them-bottom" />
          </div>

          {/* Here. */}
          <div className="relative mx-auto w-[92%] max-w-[460px] rotate-[1.5deg] sm:w-full [filter:drop-shadow(0_28px_40px_rgba(102,102,255,0.32))]">
          <Torn colour="#ffffff" side="top" id="torn-us-top" />
          <div className="bg-white px-7 py-8 font-mono text-[#0d0d50]">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#6666ff]">synora app</p>
            <p className="mt-1 text-center text-[10.5px] tracking-[0.15em] text-[#0d0d50]/45">receipt #00001 · the only one</p>
            <div className="my-5 border-t border-dashed border-[#0d0d50]/20" />
            <ul className="flex flex-col">
              {LINES.map((l, i) => (
                <li key={l.us} data-row={i} className="flex items-baseline justify-between gap-4 rounded-md px-2 py-2.5 text-[12.5px] transition-colors">
                  <span className="font-medium leading-snug">{l.us}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#b8efd6] px-2 py-0.5 text-[10.5px] font-semibold text-[#0f5c3e]">
                    <Check className="h-3 w-3" /> included
                  </span>
                </li>
              ))}
            </ul>
            <div className="my-5 border-t border-dashed border-[#0d0d50]/20" />
            <p className="mb-2 flex items-baseline justify-between px-2 text-[12px] text-[#0d0d50]/60">
              <span>APPS TO INSTALL</span>
              <span className="font-semibold text-[#3aa57a]">0</span>
            </p>
            <p className="flex items-baseline justify-between px-2 text-[13px] font-semibold">
              <span>TOTAL</span>
              <span className="text-[#6666ff]">one price</span>
            </p>
            <p className="mt-6 text-center text-[10.5px] tracking-[0.2em] text-[#0d0d50]/40">thank you for not paying twice</p>
            </div>
          <Torn colour="#ffffff" side="bottom" id="torn-us-bottom" />
            <span aria-hidden className="pointer-events-none absolute -bottom-7 -right-2 rotate-[-14deg] rounded-xl border-[3px] border-double border-[#6666ff] bg-white/85 px-4 py-2 text-center font-sans text-[15px] font-extrabold uppercase leading-tight tracking-[0.12em] text-[#6666ff] sm:-bottom-8 sm:-right-9">
              All
              <br />
              included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
