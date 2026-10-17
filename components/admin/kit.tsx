import Link from "next/link";
import type { ReactNode } from "react";
import type { NavTone } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * The new admin's building blocks (15 October), for the screens drawn to it.
 *
 * Black and white carry the panel; the brand colours mark which section you
 * are in (the chip on a page's heading, the dot in the rail); and state, and
 * only state, wears green, amber and red. The first figure in a row of
 * figures is the black one, because it is the one to read first.
 *
 * Server-safe: nothing here holds state, so a server page can use it directly.
 */
export const TONE: Record<NavTone, string> = {
  iris: "bg-[#6666ff] text-white",
  lavender: "bg-[#b7b9ff] text-[#0a0a0a]",
  sky: "bg-[#c8e7ff] text-[#0a0a0a]",
  mint: "bg-[#b8efd6] text-[#0a0a0a]",
  ink: "bg-[#0a0a0a] text-white",
};

/** The top of a screen: what it is, one line on why, and its actions. */
export function ScreenHeader({ icon, tone = "ink", title, sub, actions }: { icon?: ReactNode; tone?: NavTone; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl [&_svg]:h-[18px] [&_svg]:w-[18px]", TONE[tone])}>{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">{title}</h2>
          {sub && <p className="text-[14px] text-[#0a0a0a]/55">{sub}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A button-shaped link. Black when it is the thing to do on the screen. */
export function ActionLink({ href, children, primary = false, external = false }: { href: string; children: ReactNode; primary?: boolean; external?: boolean }) {
  const cls = cn(
    "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3.5 text-[13.5px] font-semibold transition-colors",
    primary ? "bg-[#0a0a0a] text-white hover:bg-[#262626]" : "bg-white text-[#0a0a0a] ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]"
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{children}</a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  );
}

/** A card. Titled when it holds one thing; untitled when it is the thing. */
export function Panel({ title, action, children, pad = true, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; pad?: boolean; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-4">
          <h3 className="text-[14.5px] font-semibold text-[#0a0a0a]">{title}</h3>
          {action}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export type Figure = { label: string; value: string; delta?: string | null; down?: boolean; spark?: number[]; href?: string };

/** The four figures that matter on a screen. The first is black. */
export function Figures({ items }: { items: Figure[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {items.map((f, i) => {
        const lead = i === 0;
        const body = (
          <>
            <div className="min-w-0">
              <p className={cn("text-[12.5px] font-medium", lead ? "text-white/55" : "text-[#0a0a0a]/55")}>{f.label}</p>
              <p className="mt-0.5 truncate text-[20px] font-semibold leading-tight tracking-[-0.02em]">{f.value}</p>
              {f.delta && (
                <p className={cn("mt-0.5 text-[12px] font-semibold", f.down ? (lead ? "text-[#ffb4a1]" : "text-[#c2410c]") : lead ? "text-[#b8efd6]" : "text-[#1d7a52]")}>{f.delta}</p>
              )}
            </div>
            {f.spark && f.spark.length > 1 && <Spark points={f.spark} down={f.down} light={lead} />}
          </>
        );
        const cls = cn("flex items-end justify-between gap-3 rounded-2xl px-4 py-3", lead ? "bg-[#0a0a0a] text-white" : "bg-white text-[#0a0a0a] ring-1 ring-[#0a0a0a]/[0.07]", f.href && "transition-shadow hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.45)]");
        return f.href ? (
          <Link key={f.label} href={f.href} className={cls}>{body}</Link>
        ) : (
          <div key={f.label} className={cls}>{body}</div>
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

/** A larger chart: an area under its line. Dark for the one chart a page leads with. */
export function AreaChart({ points, label, dark = false, compare }: { points: number[]; label: string; dark?: boolean; compare?: number[] }) {
  const w = 600, h = 180;
  const max = Math.max(1, ...points, ...(compare ?? [])) * 1.1;
  const line = (pts: number[]) => pts.map((p, i) => `${(i / Math.max(1, pts.length - 1)) * w},${h - (p / max) * h}`).join(" ");
  const id = dark ? "kit-area-d" : "kit-area";
  const ink = dark ? "#b7b9ff" : "#6666ff";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label} className="block h-[180px] w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ink} stopOpacity={dark ? 0.28 : 0.18} />
          <stop offset="100%" stopColor={ink} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke={dark ? "#ffffff" : "#0a0a0a"} strokeOpacity={dark ? 0.08 : 0.06} />
      ))}
      {compare && <polyline points={line(compare)} fill="none" stroke={dark ? "#ffffff" : "#0a0a0a"} strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
      {points.length > 1 && <polygon points={`0,${h} ${line(points)} ${w},${h}`} fill={`url(#${id})`} />}
      <polyline points={line(points)} fill="none" stroke={ink} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

const PILL = {
  good: "bg-[#ddf5e9] text-[#11643f]",
  wait: "bg-[#fff1d6] text-[#7a4b00]",
  info: "bg-[#e3f1ff] text-[#1b5d97]",
  off: "bg-[#efeff4] text-[#0a0a0a]/60",
  bad: "bg-[#ffe9e2] text-[#a3330c]",
} as const;
export type PillTone = keyof typeof PILL;

/** State, and only state, wears colour. */
export function StatePill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold", PILL[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

/** "+12% on the 30 days before", or nothing when there is nothing to compare. */
export function changeText(now: number, before: number, unit = "on the 30 days before"): { delta: string | null; down: boolean } {
  if (before === 0) return { delta: now > 0 ? "New this month" : null, down: false };
  const pct = Math.round(((now - before) / before) * 100);
  return { delta: `${pct >= 0 ? "+" : ""}${pct}% ${unit}`, down: pct < 0 };
}

/**
 * The orders list's columns, shared by its head (drawn by the server page)
 * and its rows (a client component). Here, in a server-safe file, because a
 * server page that imports a plain value from a client file gets a reference
 * to it, not the string.
 */
export const ORDER_GRID = "lg:grid lg:grid-cols-[1.25rem_6.5rem_minmax(0,1.4fr)_8rem_minmax(0,1fr)_7.5rem_7.5rem] lg:items-center";

/** Each order stage's colour, and how its money stands, in a merchant's words. */
export const STAGE_TONE: Record<string, PillTone> = {
  PENDING: "wait", CONFIRMED: "info", PACKED: "info", SHIPPED: "info", DELIVERED: "good", CANCELLED: "off",
};

/** How the money stands, in the words a merchant would use. */
export function paymentState(method: string, status: string): { tone: PillTone; label: string } {
  if (status === "CONFIRMED") return { tone: "good", label: "Paid" };
  if (status === "FAILED") return { tone: "bad", label: "Payment failed" };
  if (status === "AWAITING_VERIFICATION") return { tone: "wait", label: "Check the payment" };
  return method === "COD" ? { tone: "wait", label: "Collect on delivery" } : { tone: "wait", label: "Awaiting payment" };
}


/**
 * The rows of a list sit in a SwipeRow, which on a desktop keeps 48px at the
 * end of each row for its hover actions. A list's head pads its right by the
 * same, so the column names stand over their columns.
 */
export const HEAD_PAD = "pl-4 pr-16";

/** The products list's columns: tick, picture, name, stock, price, status. */
export const PRODUCT_GRID = "lg:grid-cols-[1.25rem_2.75rem_minmax(0,1fr)_7.5rem_9rem_7rem]";
export const PRODUCT_GRID_NO_STATUS = "lg:grid-cols-[1.25rem_2.75rem_minmax(0,1fr)_7.5rem_9rem]";

/** "2026-09-15" as a person reads it: "15 Sep". */
export function shortDay(day: string | undefined): string {
  if (!day) return "";
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
