import type { ReactNode } from "react";
import {
  BarChart3, Boxes, CreditCard, FileText, Globe, Home, Inbox, LayoutTemplate, LockKeyhole, Package, Receipt, Settings2,
  Shapes, ShieldCheck, SlidersHorizontal, Store, Tag, Truck, Users, Wallet, type LucideIcon,
} from "lucide-react";
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
};

export const pkr = (n: number) => formatMoney(n, "PKR");

/** The top of every screen: what it is, one line on why, and its actions. */
export function PageHeader({ icon, title, sub, actions }: { icon?: string; title: string; sub?: string; actions?: ReactNode }) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0f0f6] text-[#0d0d50]">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0d0d50]">{title}</h1>
          {sub && <p className="text-[14px] text-[#0d0d50]/55">{sub}</p>}
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
        primary ? "bg-[#0d0d50] text-white hover:bg-[#1c1c6b]" : "bg-white text-[#0d0d50] ring-1 ring-[#0d0d50]/12 hover:bg-[#f6f6fa]"
      }`}
    >
      {children}
    </a>
  );
}

/** A card. Titled when it holds one thing; untitled when it is the thing. */
export function Card({ title, action, children, pad = true, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; pad?: boolean; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07] ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-4">
          <h2 className="text-[14.5px] font-semibold text-[#0d0d50]">{title}</h2>
          {action}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

/** Numbers across the top of a list: the four that matter for that screen. */
export function StatStrip({ stats }: { stats: { label: string; value: string; delta?: string; down?: boolean; spark?: number[] }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07] lg:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={`flex items-end justify-between gap-3 px-5 py-4 ${i > 0 ? "border-[#0d0d50]/[0.06] lg:border-l" : ""} ${i % 2 === 1 ? "border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""}`}>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-[#0d0d50]/55">{s.label}</p>
            <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#0d0d50]">{s.value}</p>
            {s.delta && <p className={`mt-0.5 text-[12px] font-semibold ${s.down ? "text-[#c2410c]" : "text-[#1d7a52]"}`}>{s.delta}</p>}
          </div>
          {s.spark && <Spark points={s.spark} down={s.down} />}
        </div>
      ))}
    </div>
  );
}

export function Spark({ points, down = false, w = 84, h = 32 }: { points: number[]; down?: boolean; w?: number; h?: number }) {
  const max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <polyline points={d} fill="none" stroke={down ? "#c2410c" : "#6666ff"} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** A larger chart: an area with its line, and the days along the bottom. */
export function AreaChart({ points, height = 180, label }: { points: number[]; height?: number; label: string }) {
  const w = 600, h = height, max = Math.max(...points) * 1.1;
  const xy = points.map((p, i) => [(i / (points.length - 1)) * w, h - (p / max) * h] as const);
  const line = xy.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label} className="block h-[180px] w-full">
      <defs>
        <linearGradient id="na-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6666ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6666ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="#0d0d50" strokeOpacity="0.06" />
      ))}
      <polygon points={`0,${h} ${line} ${w},${h}`} fill="url(#na-area)" />
      <polyline points={line} fill="none" stroke="#6666ff" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

const PILL: Record<string, string> = {
  good: "bg-[#ddf5e9] text-[#11643f]",
  wait: "bg-[#fff1d6] text-[#7a4b00]",
  info: "bg-[#e3f1ff] text-[#1b5d97]",
  off: "bg-[#efeff4] text-[#0d0d50]/60",
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
    <div className="flex flex-col gap-2 border-b border-[#0d0d50]/[0.06] px-3 py-2.5 sm:flex-row sm:items-center">
      <div className="flex gap-1 overflow-x-auto">
        {views.map((v, i) => (
          <span key={v} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold ${i === active ? "bg-[#f0f0f6] text-[#0d0d50]" : "text-[#0d0d50]/55"}`}>
            {v}
          </span>
        ))}
      </div>
      <div className="flex h-9 flex-1 items-center gap-2 rounded-[10px] bg-[#f6f6fa] px-3 text-[13.5px] text-[#0d0d50]/40 sm:ml-2">
        <SlidersHorizontal className="h-4 w-4" /> {placeholder}
      </div>
    </div>
  );
}

export const th = "px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-[#0d0d50]/45";
export const td = "px-4 py-3 text-[14px] text-[#0d0d50]";
