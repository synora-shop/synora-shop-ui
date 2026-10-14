import { ArrowRight, Check, CreditCard, Lock, MessageCircle, ShoppingBag, Tag, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

/**
 * The front page's top: its own light header, and the hero — "Your online
 * store, made for Pakistan. Without the app bills.", the last two struck through as you
 * arrive and a stamp landing beside them — over the picture the page is built
 * round: a phone holding a storefront, and the pieces of a shop floating
 * round it in Synora's five colours. As the page scrolls they gather in and
 * straighten — a shop assembling itself.
 *
 * Every piece is something the product does; the figures are a made-up
 * Pakistani shop's, in rupees.
 */
const pkr = (n: number) => formatMoney(n, "PKR");

export const C = { iris: "#6666ff", lavender: "#b7b9ff", sky: "#c8e7ff", mint: "#b8efd6", navy: "#0d0d50" } as const;

/* ---------------------------------------------------------------- pieces -- */

type PieceProps = { className?: string; style?: React.CSSProperties; children: React.ReactNode };

/** One floating piece: placed on wide screens, in the grid on small ones. */
function Piece({ className, style, children }: PieceProps) {
  return (
    <div className="lp-gather lg:absolute" style={style}>
      <div className={cn("lp-piece rounded-[22px] p-4 shadow-[0_24px_60px_-22px_rgba(13,13,80,0.35)]", className)}>{children}</div>
    </div>
  );
}

const at = (pos: React.CSSProperties, r: number, d: number, delay: number, gx: number, gy: number): React.CSSProperties =>
  ({ ...pos, ["--r" as string]: `${r}deg`, ["--d" as string]: `${d}s`, ["--delay" as string]: `${delay}s`, ["--gx" as string]: `${gx}px`, ["--gy" as string]: `${gy}px` }) as React.CSSProperties;

function Pieces() {
  return (
    <>
      {/* An order, arriving. */}
      <Piece style={at({ left: "2%", top: "4%" }, -6, 7, 0, -90, -40)} className="w-[230px] bg-[#6666ff] text-white">
        <div className="flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/20">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#b8efd6]" />
            <span className="lp-ping absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#b8efd6]" />
          </span>
          <div>
            <p className="text-[13px] font-semibold">New order #1043</p>
            <p className="text-[12px] text-white/75">{pkr(8900)} · Lahore</p>
          </div>
        </div>
      </Piece>

      {/* Paid. */}
      <Piece style={at({ left: "0%", top: "36%" }, 4, 8, 0.6, -110, 0)} className="w-[210px] bg-[#b8efd6] text-[#0d0d50]">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/60">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold">Paid with JazzCash</p>
            <p className="text-[12px] text-[#0d0d50]/65">{pkr(8900)} received</p>
          </div>
        </div>
      </Piece>

      {/* The warning — the thing nobody else does. */}
      <Piece style={at({ left: "6%", top: "64%" }, -3, 9, 1.2, -80, 60)} className="w-[270px] border border-[#0d0d50]/[0.08] bg-white text-[#0d0d50]">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff1ea] text-[#c2410c]">
            <TriangleAlert className="h-4 w-4" />
          </span>
          <p className="text-[14px] font-semibold">Delete “Shirts”?</p>
        </div>
        <p className="mt-2 text-[12px] leading-snug text-[#454545]">8 products are in this category. They stay, they just lose it.</p>
        <div className="mt-3 flex gap-1.5">
          <span className="rounded-full bg-[#0d0d50] px-3 py-1.5 text-[11px] font-semibold text-white">Keep it</span>
          <span className="rounded-full border border-[#0d0d50]/10 px-3 py-1.5 text-[11px] text-[#707070]">Delete anyway</span>
        </div>
      </Piece>

      {/* The week. */}
      <Piece style={at({ right: "2%", top: "2%" }, 5, 8.5, 0.3, 100, -50)} className="w-[230px] bg-[#0d0d50] text-white">
        <div className="flex items-baseline justify-between">
          <p className="text-[12px] text-white/60">This week</p>
          <p className="rounded-full bg-[#b8efd6] px-2 py-0.5 text-[10.5px] font-bold text-[#0d0d50]">↑ 24%</p>
        </div>
        <p className="mt-1 text-[20px] font-semibold tracking-tight">{pkr(231400)}</p>
        <div className="mt-3 flex h-[52px] items-end gap-1.5">
          {[34, 48, 40, 60, 52, 74, 92].map((h, i) => (
            <span key={i} className="lp-bar flex-1 rounded-t-[4px]" style={{ height: `${h}%`, background: i === 6 ? C.mint : C.lavender, animationDelay: `${0.9 + i * 0.08}s` }} />
          ))}
        </div>
      </Piece>

      {/* The domain. */}
      <Piece style={at({ right: "0%", top: "36%" }, -4, 7.5, 0.9, 120, 0)} className="w-[240px] bg-[#c8e7ff] text-[#0d0d50]">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#0d0d50]/55">Your domain</p>
        <p className="mt-2 flex items-center gap-2 rounded-full bg-white px-3 py-2 font-mono text-[12.5px]">
          <Lock className="h-3.5 w-3.5 text-[#3aa57a]" /> www.yourbrand.pk
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0f5c3e]">
          <Check className="h-3.5 w-3.5" /> Connected
        </p>
      </Piece>

      {/* A discount. */}
      <Piece style={at({ right: "6%", top: "64%" }, 6, 9.5, 0.4, 90, 60)} className="flex w-[220px] items-stretch overflow-hidden bg-[#b7b9ff] p-0 text-[#0d0d50]">
        <div className="flex-1 p-4">
          <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-[#0d0d50]/60">
            <Tag className="h-3 w-3" /> Code
          </p>
          <p className="mt-1 font-mono text-[20px] font-bold tracking-wider">EID25</p>
          <p className="text-[10.5px] text-[#0d0d50]/60">Ends Sunday</p>
        </div>
        <div className="grid w-[72px] place-items-center border-l-2 border-dashed border-[#0d0d50]/20 bg-[#6666ff] text-[19px] font-bold text-white">−25%</div>
      </Piece>

      {/* A customer, one tap away. */}
      <Piece style={at({ left: "25%", top: "86%" }, 3, 8, 1.5, -40, 80)} className="hidden w-[230px] bg-[#c8e7ff] text-[#0d0d50] lg:block">
        <div className="flex items-end gap-2">
          <p className="flex-1 rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[12px] leading-snug">Is the size 9 in stock? 😊</p>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#25d366] text-white">
            <MessageCircle className="h-5 w-5" />
          </span>
        </div>
      </Piece>

      {/* The team. */}
      <Piece style={at({ right: "24%", top: "88%" }, -5, 7, 0.8, 40, 80)} className="hidden w-[220px] bg-[#b8efd6] text-[#0d0d50] lg:block">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[
              ["A", C.iris, "#fff"],
              ["U", C.navy, "#fff"],
              ["Z", "#fff", C.navy],
            ].map(([n, bg, fg]) => (
              <span key={n} className="grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold ring-2 ring-[#b8efd6]" style={{ background: bg, color: fg }}>
                {n}
              </span>
            ))}
          </div>
          <p className="text-[12px] font-semibold leading-tight">
            Owner, staff, viewer
            <span className="block font-normal text-[#0d0d50]/60">each sees only theirs</span>
          </p>
        </div>
      </Piece>
    </>
  );
}

/** The storefront, on a phone. */
function Phone() {
  const items: [string, string, number][] = [
    ["/platform/loom-1.jpg", "High Top", 8900],
    ["/platform/loom-2.jpg", "Runner", 6500],
    ["/platform/loom-3.jpg", "Court", 5200],
    ["/platform/loom-4.jpg", "Terrace", 4800],
  ];
  return (
    <div className="relative mx-auto w-[260px] rounded-[44px] bg-[#0d0d50] p-[7px] shadow-[0_50px_100px_-30px_rgba(13,13,80,0.55),0_0_0_1px_rgba(13,13,80,0.08)] sm:w-[280px]">
      <div className="overflow-hidden rounded-[37px] bg-white">
        <div className="flex justify-center pt-2.5">
          <span className="h-[18px] w-[86px] rounded-full bg-[#0d0d50]" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2 pt-2.5">
          <span className="text-[13px] font-bold tracking-tight text-[#121212]">Ecommerce</span>
          <span className="relative">
            <ShoppingBag className="h-4 w-4 text-[#121212]" />
            <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-[#6666ff] text-[8px] font-bold text-white">2</span>
          </span>
        </div>
        <div className="relative mx-2.5 h-[128px] overflow-hidden rounded-[18px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/platform/loom-hero.jpg" alt="" decoding="async" fetchPriority="high" className="h-full w-full object-cover" />
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#121212]">Summer drop</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2.5">
          {items.map(([src, t, p]) => (
            <div key={t}>
              <div className="aspect-square overflow-hidden rounded-[12px] bg-[#f1f1f1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" decoding="async" className="h-full w-full object-cover" />
              </div>
              <p className="mt-1 text-[10px] font-semibold text-[#121212]">{t}</p>
              <p className="text-[9.5px] text-[#6e7686]">{pkr(p)}</p>
            </div>
          ))}
        </div>
        <div className="mx-2.5 mb-4 rounded-full bg-[#6666ff] py-2.5 text-center text-[11px] font-semibold text-white">Add to bag</div>
      </div>
    </div>
  );
}

export function Hero({ signup, login }: { signup: string; login: string }) {
  return (
    <section data-anim-scope className="relative isolate overflow-hidden bg-white">
      {/* The wash: three of Synora's colours, breathing, on white — soft
            gradients rather than blurred boxes, so drifting them repaints nothing. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="lp-breathe absolute -left-[22%] -top-[30%] h-[1000px] w-[1000px] bg-[radial-gradient(closest-side,rgba(183,185,255,0.55),rgba(183,185,255,0)_100%)]" />
        <div className="lp-breathe-2 absolute -right-[20%] -top-[14%] h-[920px] w-[920px] bg-[radial-gradient(closest-side,rgba(200,231,255,0.75),rgba(200,231,255,0)_100%)]" />
        <div className="lp-breathe absolute bottom-[-24%] left-[22%] h-[860px] w-[1000px] bg-[radial-gradient(closest-side,rgba(184,239,214,0.55),rgba(184,239,214,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(13,13,80,0.09)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000_10%,transparent_80%)]" />
      </div>

      <div className="mx-auto max-w-[80rem] px-5 pb-20 pt-32 text-center sm:pt-40">
        <div className="lp-in flex justify-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#0d0d50]/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#0d0d50]/75 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6666ff]" />
            <span>
              Made for Pakistan<span className="hidden sm:inline"> · Cash on delivery, JazzCash and Easypaisa</span>
            </span>
          </p>
        </div>

        <h1 className="lp-in mx-auto mt-7 max-w-5xl text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.045em] text-[#0d0d50] sm:text-[4.6rem] lg:text-[5.9rem]" style={{ animationDelay: "0.08s" }}>
          Your online store,
          <br />
          <span className="relative whitespace-nowrap">
            made for <span className="bg-[linear-gradient(transparent_62%,#b8efd6_62%,#b8efd6_90%,transparent_90%)] px-1">Pakistan.</span>
          </span>
          <br />
          Without the{" "}
          <span className="relative mx-auto mt-1 block w-fit whitespace-nowrap sm:mt-0 sm:inline-block">
            <span className="text-[#0d0d50]/45">app bills.</span>
            <svg aria-hidden viewBox="0 0 400 40" preserveAspectRatio="none" className="pointer-events-none absolute left-[-2%] top-[46%] h-[0.32em] w-[104%] overflow-visible">
              <path d="M4 26 C 90 10, 170 30, 250 16 S 360 14, 396 20" pathLength={1} fill="none" stroke="#6666ff" strokeWidth="9" strokeLinecap="round" className="lp-strike" />
            </svg>
            <span className="lp-stamp absolute -right-1 -top-[0.7em] inline-flex items-center gap-1.5 rounded-full bg-[#b8efd6] px-3 py-1.5 text-[0.2em] sm:-top-[0.55em] sm:text-[0.17em] font-semibold tracking-normal text-[#0d0d50] shadow-[0_10px_24px_-10px_rgba(13,13,80,0.45)] sm:-right-6">
              <Check className="h-[1.1em] w-[1.1em]" /> all included
            </span>
          </span>
        </h1>

        <p className="lp-in mx-auto mt-7 max-w-2xl text-[1.05rem] leading-relaxed text-[#0d0d50]/65 sm:text-lg" style={{ animationDelay: "0.16s" }}>
          The Shopify alternative built for how Pakistan sells. Prices in rupees, cash on delivery, mobile wallets and your own domain, with products, orders, pages and your team in one place. Nothing sold back to you as an add-on.
        </p>

        <div className="lp-in mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.24s" }}>
          <a href={signup} className="group inline-flex items-center gap-2 rounded-full bg-[#6666ff] px-7 py-4 text-[15px] font-semibold text-white shadow-[0_16px_40px_-12px_rgba(102,102,255,0.75)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666ff] focus-visible:ring-offset-2">
            Create your shop
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a href={login} className="inline-flex items-center gap-2 rounded-full border border-[#0d0d50]/15 bg-white/70 px-7 py-4 text-[15px] font-medium text-[#0d0d50] backdrop-blur transition-colors hover:bg-white">
            I already have one
          </a>
        </div>
        <p className="lp-in mt-5 text-[13px] text-[#0d0d50]/50" style={{ animationDelay: "0.3s" }}>
          No card to start. Your free address works the moment you sign up.
        </p>

        {/* The stage: the phone, and the shop gathering round it. */}
        <div className="lp-in relative mx-auto mt-16 max-w-[76rem] lg:mt-20 lg:h-[780px]" style={{ animationDelay: "0.4s" }}>
          <div className="relative z-10 lg:absolute lg:left-1/2 lg:top-6 lg:-translate-x-1/2">
            <Phone />
          </div>
          <div className="mt-10 grid grid-cols-1 justify-items-center gap-4 text-left sm:grid-cols-2 lg:mt-0 lg:block">
            <Pieces />
          </div>
        </div>
      </div>
    </section>
  );
}
