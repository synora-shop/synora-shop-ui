import type { ReactNode } from "react";
import {
  BarChart3, Bell, Boxes, CreditCard, Database, FileText, Globe, Home, Inbox, LayoutTemplate, LockKeyhole, Package, Receipt, ScrollText,
  Power, Settings2, Shapes, ShieldCheck, ShoppingCart, SlidersHorizontal, Store, Tag, Truck, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/lib/new-admin/sample";
import { formatMoney } from "@/lib/money";

/**
 * The new admin's building blocks (preview, 15 October). Plain on purpose:
 * one ink (navy), one action colour (iris), state colours only on state, and
 * type size doing the work that boxes and shadows did before.
 */
export const ICONS: Record<string, LucideIcon> = {
  home: Home, orders: Inbox, products: Package, customers: Users, discounts: Tag, content: FileText, analytics: BarChart3,
  app: LayoutTemplate, preferences: SlidersHorizontal, settings: Settings2, store: Store, plan: Shapes, billing: Receipt,
  domains: Globe, payments: Wallet, users: Users, shipping: Truck, security: LockKeyhole, card: CreditCard, boxes: Boxes, shield: ShieldCheck,
  checkout: ShoppingCart, bell: Bell, data: Database, policy: ScrollText, power: Power,
};

/**
 * Black and white carry the admin; the brand colours mark where you are.
 * Each area wears one: its dot in the rail, its icon at the top of the page,
 * its marker on a settings section. Nothing else is coloured but state.
 */
export const TONE: Record<Tone, { chip: string; dot: string }> = {
  iris: { chip: "bg-[#6666ff] text-white", dot: "bg-[#6666ff]" },
  lavender: { chip: "bg-[#b7b9ff] text-[#0a0a0a]", dot: "bg-[#b7b9ff]" },
  sky: { chip: "bg-[#c8e7ff] text-[#0a0a0a]", dot: "bg-[#8cc8f5]" },
  mint: { chip: "bg-[#b8efd6] text-[#0a0a0a]", dot: "bg-[#6fd6a8]" },
  ink: { chip: "bg-[#0a0a0a] text-white", dot: "bg-white" },
};

export const pkr = (n: number) => formatMoney(n, "PKR");

/** The top of every screen: what it is, one line on why, and its actions. */
export function PageHeader({ icon, title, sub, actions, tone = "ink" }: { icon?: string; title: string; sub?: string; actions?: ReactNode; tone?: Tone }) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE[tone].chip}`}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">{title}</h1>
          {sub && <p className="text-[14px] text-[#0a0a0a]/55">{sub}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Button({ children, primary = false, href = "#" }: { children: ReactNode; primary?: boolean; href?: string }) {
  return (
    <a
      href={href}
      className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3.5 text-[13.5px] font-semibold transition-colors ${
        primary ? "bg-[#0a0a0a] text-white hover:bg-[#262626]" : "bg-white text-[#0a0a0a] ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]"
      }`}
    >
      {children}
    </a>
  );
}

/** A card. Titled when it holds one thing; untitled when it is the thing. */
export function Card({ title, action, children, pad = true, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; pad?: boolean; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07] ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-4">
          <h2 className="text-[14.5px] font-semibold text-[#0a0a0a]">{title}</h2>
          {action}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

/**
 * Numbers across the top of a list: the four that matter for that screen.
 * The first is the one to read first, so it is the black one.
 */
export function StatStrip({ stats }: { stats: { label: string; value: string; delta?: string; down?: boolean; spark?: number[] }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {stats.map((s, i) => {
        const lead = i === 0;
        return (
          <div key={s.label} className={`flex items-end justify-between gap-3 rounded-2xl px-5 py-4 ${lead ? "bg-[#0a0a0a] text-white" : "bg-white ring-1 ring-[#0a0a0a]/[0.07]"}`}>
            <div className="min-w-0">
              <p className={`text-[12.5px] font-medium ${lead ? "text-white/55" : "text-[#0a0a0a]/55"}`}>{s.label}</p>
              <p className="mt-1 truncate text-[20px] font-semibold tracking-[-0.02em]">{s.value}</p>
              {s.delta && <p className={`mt-0.5 text-[12px] font-semibold ${s.down ? (lead ? "text-[#ffb4a1]" : "text-[#c2410c]") : lead ? "text-[#b8efd6]" : "text-[#1d7a52]"}`}>{s.delta}</p>}
            </div>
            {s.spark && <Spark points={s.spark} down={s.down} light={lead} />}
          </div>
        );
      })}
    </div>
  );
}

export function Spark({ points, down = false, light = false, w = 84, h = 32 }: { points: number[]; down?: boolean; light?: boolean; w?: number; h?: number }) {
  const max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <polyline points={d} fill="none" stroke={down ? (light ? "#ffb4a1" : "#c2410c") : light ? "#b7b9ff" : "#0a0a0a"} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** A larger chart: an area with its line, and the days along the bottom. */
export function AreaChart({ points, height = 180, label, dark = false, compare }: { points: number[]; height?: number; label: string; dark?: boolean; compare?: number[] }) {
  const w = 600, h = height, max = Math.max(...points, ...(compare ?? [])) * 1.1;
  const toLine = (pts: number[]) => pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - (p / max) * h}`).join(" ");
  const line = toLine(points);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label} className="block h-[180px] w-full">
      <defs>
        <linearGradient id={dark ? "na-area-d" : "na-area"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark ? "#b7b9ff" : "#6666ff"} stopOpacity={dark ? 0.28 : 0.18} />
          <stop offset="100%" stopColor={dark ? "#b7b9ff" : "#6666ff"} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke={dark ? "#ffffff" : "#0a0a0a"} strokeOpacity={dark ? 0.08 : 0.06} />
      ))}
      {compare && <polyline points={toLine(compare)} fill="none" stroke={dark ? "#ffffff" : "#0a0a0a"} strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={dark ? "url(#na-area-d)" : "url(#na-area)"} />
      <polyline points={line} fill="none" stroke={dark ? "#b7b9ff" : "#6666ff"} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

const PILL: Record<string, string> = {
  good: "bg-[#ddf5e9] text-[#11643f]",
  wait: "bg-[#fff1d6] text-[#7a4b00]",
  info: "bg-[#e3f1ff] text-[#1b5d97]",
  off: "bg-[#efeff4] text-[#0a0a0a]/60",
  bad: "bg-[#ffe9e2] text-[#a3330c]",
};
/** State, and only state, wears colour. */
export function Pill({ tone, children }: { tone: keyof typeof PILL; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${PILL[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

/** A list screen's filter row: saved views as tabs, then search. */
export function ListBar({ views, active = 0, placeholder }: { views: string[]; active?: number; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#0a0a0a]/[0.06] px-3 py-2.5 sm:flex-row sm:items-center">
      <div className="flex gap-1 overflow-x-auto">
        {views.map((v, i) => (
          <span key={v} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold ${i === active ? "bg-[#f0f0f0] text-[#0a0a0a]" : "text-[#0a0a0a]/55"}`}>
            {v}
          </span>
        ))}
      </div>
      <div className="flex h-9 flex-1 items-center gap-2 rounded-[10px] bg-[#f5f5f5] px-3 text-[13.5px] text-[#0a0a0a]/40 sm:ml-2">
        <SlidersHorizontal className="h-4 w-4" /> {placeholder}
      </div>
    </div>
  );
}

export const th = "px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-[#0a0a0a]/45";
export const td = "px-4 py-3 text-[14px] text-[#0a0a0a]";
