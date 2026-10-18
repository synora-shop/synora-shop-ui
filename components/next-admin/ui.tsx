import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { SectionMark } from "@/components/next-admin/section-mark";

/**
 * The third design's building blocks (/next-admin, 18 October). Server-safe.
 *
 * Three rules, written down so they hold:
 *
 *   1. Black is for doing. The one solid black thing in a view is the action
 *      it exists for (Save, Create order). Nothing is black to be important.
 *   2. Chosen is iris, and only ever a tint: a pale iris ground, iris words,
 *      an iris hairline. A selected tab, filter, row or option is never solid,
 *      so it can not be mistaken for a button.
 *   3. State is a dot and a word. Paid, Pending, Low stock are coloured dots
 *      beside plain text, not filled pills, so a table reads in one pass.
 *
 * In the Synora look the preview set (soft white cards on #f4f4f4, a black
 * rail, iris, lavender, sky and mint), refined: 34px controls, 44px rows,
 * one strip for the numbers, and every screen's heading in one line.
 */

export const pkr = (n: number) => formatMoney(n, "PKR");

/** Selected: a tint, never solid. */
export const SEL = "bg-[#ecebff] text-[#3d3dc4] ring-1 ring-inset ring-[#d6d5ff]";

type Kind = "primary" | "secondary" | "ghost" | "danger" | "light";
const KIND: Record<Kind, string> = {
  primary: "bg-[#0a0a0a] text-white hover:bg-[#3a3a3a]",
  secondary: "bg-white text-[#0a0a0a] ring-1 ring-inset ring-[#dddddd] hover:bg-[#f3f3f3]",
  ghost: "text-[#3a3a3a] hover:bg-[#f3f3f3] hover:text-[#0a0a0a]",
  danger: "bg-white text-[#b91c1c] ring-1 ring-inset ring-[#fecaca] hover:bg-[#fef2f2]",
  light: "bg-white text-[#0a0a0a] hover:bg-[#f3f3f3]",
};
export const btn = (kind: Kind = "secondary", small = false) =>
  `inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] font-semibold transition-colors disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4 ${small ? "h-7 px-2.5 text-[12.5px]" : "h-[34px] px-3.5 text-[13px]"} ${KIND[kind]}`;

export function Btn({ children, kind = "secondary", href, small, title }: { children: ReactNode; kind?: Kind; href?: string; small?: boolean; title?: string }) {
  return href ? (
    <Link href={href} title={title} className={btn(kind, small)}>{children}</Link>
  ) : (
    <button type="button" title={title} className={btn(kind, small)}>{children}</button>
  );
}

/**
 * Every screen: one sticky line with where you are, the screen's name, a few
 * words on it, and its actions. No second bar above it.
 */
export function Page({ title, crumbs = [], sub, meta, actions, children, wide = false }: { title: ReactNode; crumbs?: { label: string; href: string }[]; sub?: string; meta?: ReactNode; actions?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[#0a0a0a]/[0.06] bg-[#f4f4f4]/90 backdrop-blur-md max-lg:top-12">
        <div className={`mx-auto flex min-h-[56px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 ${wide ? "" : "max-w-[84rem]"}`}>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <SectionMark />
            {crumbs.map((c) => (
              <span key={c.href} className="flex shrink-0 items-center gap-1.5 text-[13px] text-[#737373]">
                <Link href={c.href} className="hover:text-[#0a0a0a]">{c.label}</Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#a3a3a3]" />
              </span>
            ))}
            <h1 className="shrink-0 text-[16px] font-semibold tracking-[-0.015em] text-[#0a0a0a]">{title}</h1>
            {meta && <span className="flex shrink-0 items-center gap-2 pl-1">{meta}</span>}
            {sub && <p className="ml-2 hidden min-w-0 truncate text-[12.5px] text-[#737373] xl:block" title={sub}>{sub}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
        </div>
      </header>
      <div className={`mx-auto flex flex-col gap-3 px-4 pb-12 pt-4 sm:px-6 ${wide ? "" : "max-w-[84rem]"}`}>{children}</div>
    </>
  );
}

/** A white panel with a hairline. Titled when it holds one thing. */
export function Panel({ title, action, children, flush = false, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; flush?: boolean; className?: string }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[16px] bg-white ring-1 ring-[#0a0a0a]/[0.07] ${className}`}>
      {title && (
        <div className="flex h-11 items-center justify-between gap-3 border-b border-[#0a0a0a]/[0.05] px-4">
          <h2 className="text-[13.5px] font-semibold text-[#0a0a0a]">{title}</h2>
          {action && <div className="flex items-center gap-2 text-[12.5px]">{action}</div>}
        </div>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/**
 * The numbers for a screen, in one strip: a hairline between each, the value
 * beside its change, a small line at the end. 56px, not four cards.
 */
export type Metric = { label: string; value: string; delta?: string; down?: boolean; spark?: number[]; href?: string };
export function Metrics({ items }: { items: Metric[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[16px] bg-[#0a0a0a]/[0.07] p-px [gap:1px] md:grid-flow-col md:auto-cols-fr md:grid-cols-none">
      {items.map((m) => {
        const body = (
          <>
            <span className="min-w-0">
              <span className="block truncate text-[12px] text-[#737373]">{m.label}</span>
              <span className="mt-0.5 flex items-baseline gap-1.5">
                <span className="truncate text-[18px] font-semibold tabular-nums tracking-[-0.02em] text-[#0a0a0a]">{m.value}</span>
                {m.delta && <span className={`truncate text-[12px] font-semibold ${m.down ? "text-[#c2410c]" : "text-[#1d7a52]"}`}>{m.delta}</span>}
              </span>
            </span>
            {m.spark && m.spark.length > 1 && <Spark points={m.spark} down={m.down} />}
          </>
        );
        const cls = "flex min-w-0 items-end justify-between gap-2 bg-white px-4 py-3";
        return m.href ? (
          <Link key={m.label} href={m.href} className={`${cls} hover:bg-[#fafafa]`}>{body}</Link>
        ) : (
          <div key={m.label} className={cls}>{body}</div>
        );
      })}
    </div>
  );
}

export function Spark({ points, down = false, w = 64, h = 24 }: { points: number[]; down?: boolean; w?: number; h?: number }) {
  const max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / (max - min || 1)) * (h - 3) - 1.5}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <polyline points={d} fill="none" stroke={down ? "#dc2626" : "#6666ff"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** A chart that leads a page: a line, a soft fill, and the period before dashed. */
export function LineChart({ points, compare, label, height = 160 }: { points: number[]; compare?: number[]; label: string; height?: number }) {
  const w = 600, h = height;
  const max = Math.max(1, ...points, ...(compare ?? [])) * 1.08;
  const line = (pts: number[]) => pts.map((p, i) => `${(i / Math.max(1, pts.length - 1)) * w},${h - (p / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label} className="block w-full" style={{ height }}>
      <defs>
        <linearGradient id="na3-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6666ff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#6666ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="#f1f1f1" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
      {compare && <polyline points={line(compare)} fill="none" stroke="#a3a3a3" strokeWidth="1.25" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
      <polygon points={`0,${h} ${line(points)} ${w},${h}`} fill="url(#na3-fill)" />
      <polyline points={line(points)} fill="none" stroke="#6666ff" strokeWidth="1.75" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** State, and only state, wears colour: the preview's soft pills, a size smaller. */
export type Tone = "good" | "wait" | "bad" | "info" | "off";
const PILL: Record<Tone, string> = {
  good: "bg-[#ddf5e9] text-[#11643f]",
  wait: "bg-[#fff1d6] text-[#7a4b00]",
  info: "bg-[#e3f1ff] text-[#1b5d97]",
  off: "bg-[#efeff4] text-[#0a0a0a]/60",
  bad: "bg-[#ffe9e2] text-[#a3330c]",
};
export function Status({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[2px] text-[11.5px] font-semibold ${PILL[tone]}`}>
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

/** A quiet label: a code, a tag, a kind. */
export function Tag({ children, mono = false }: { children: ReactNode; mono?: boolean }) {
  return <span className={`inline-flex items-center rounded-[6px] bg-[#f3f3f3] px-1.5 py-0.5 text-[12px] text-[#3a3a3a] ${mono ? "font-mono font-medium" : ""}`}>{children}</span>;
}

/** Table classes. Rows are 40px and one line; a second fact sits beside the first, muted. */
export const T = {
  wrap: "overflow-x-auto",
  table: "w-full border-collapse text-[13px]",
  th: "h-9 border-b border-[#0a0a0a]/[0.06] bg-[#fafafa] px-3 text-left text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#0a0a0a]/45 whitespace-nowrap",
  td: "h-11 border-b border-[#0a0a0a]/[0.05] px-3 whitespace-nowrap text-[13.5px] text-[#1f1f1f]",
  tr: "group hover:bg-[#fafafa]",
  muted: "text-[#737373]",
};

export function Thumb({ src, size = 28 }: { src: string; size?: number }) {
  return <Image src={src} alt="" width={size * 2} height={size * 2} className="shrink-0 rounded-[6px] bg-[#f3f3f3] object-cover" style={{ width: size, height: size }} />;
}

/** One line of settings: what it is, how it is set, and its control. */
export function Row({ label, value, right, href }: { label: ReactNode; value?: ReactNode; right?: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium text-[#0a0a0a]">{label}</div>
        {value && <div className="mt-0.5 text-[12.5px] text-[#737373]">{value}</div>}
      </div>
      {right ?? <ChevronRight className="h-4 w-4 shrink-0 text-[#a3a3a3]" />}
    </>
  );
  const cls = "flex min-h-[48px] items-center gap-3 px-4 py-2.5";
  return href ? <Link href={href} className={`${cls} hover:bg-[#fafafa]`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** A field that looks and behaves like the real one. */
export function Field({ label, value, hint, area = false, prefix, mono = false }: { label: string; value: string; hint?: string; area?: boolean; prefix?: string; mono?: boolean }) {
  const cls = `w-full rounded-[10px] border border-[#dddddd] bg-white px-2.5 text-[13px] text-[#0a0a0a] outline-none focus:border-[#6666ff] focus:ring-2 focus:ring-[#6666ff]/20 ${mono ? "font-mono" : ""}`;
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-[#3a3a3a]">{label}</span>
      {area ? (
        <textarea defaultValue={value} rows={3} className={`${cls} py-2 leading-relaxed`} />
      ) : (
        <span className="relative block">
          {prefix && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12.5px] text-[#a3a3a3]">{prefix}</span>}
          <input defaultValue={value} className={`${cls} h-8 ${prefix ? "pl-9" : ""}`} />
        </span>
      )}
      {hint && <span className="mt-1 block text-[12px] text-[#737373]">{hint}</span>}
    </label>
  );
}

/** A panel of rows. */
export function Rows({ title, action, children }: { title?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <Panel title={title} action={action} flush>
      <div className="divide-y divide-[#f1f1f1]">{children}</div>
    </Panel>
  );
}

/** Where a page sends you that is not a button: plain iris words. */
export const link = "font-medium text-[#4b4bea] hover:underline underline-offset-2";
