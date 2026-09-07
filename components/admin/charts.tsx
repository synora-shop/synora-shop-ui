"use client";

import { useState } from "react";
import { useCurrencySymbol } from "@/components/ui/currency";
import { niceCeiling, type Point } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * The panel's charts, drawn by hand in SVG.
 *
 * No charting library, for two reasons. Every one of them ships its own idea of
 * a palette, a grid and a tooltip, and this panel has exactly four colours and
 * has already thrown one accent scheme away. And these are simple shapes — a
 * path, some rectangles — where the library would be the largest dependency in
 * the project.
 *
 * The specs are fixed and shared: 2px lines with round joins, a 10% wash under
 * them, hairline solid gridlines a single step off the surface, bars capped at
 * 24px with a rounded data-end and a square foot on the baseline, and markers
 * with a 2px ring in the surface colour so they stay legible where they cross.
 *
 * One accent, so every chart here is a single series and none carries a legend:
 * with one colour there is nothing to tell apart, and a legend box with one
 * swatch in it only restates the title.
 *
 * Text never wears the data colour. Values, labels and axes use ink tokens; the
 * mark beside them carries the identity.
 */

const AXIS = "rgb(128 128 128 / 0.28)";

function shortDay(key: string): string {
  const [, m, d] = key.split("-");
  return `${Number(d)}/${Number(m)}`;
}

/**
 * How a chart writes a number.
 *
 * A name, not a function. A server component cannot hand a client component a
 * callback — React has no way to send one across that boundary — so the choice
 * of format travels as a string and the formatting happens here.
 */
export type Format = "number" | "currency";

export function render(n: number, as: Format, symbol: string): string {
  return as === "currency" ? `${symbol} ${compact(n)}` : compact(n);
}

/**
 * The same, bound to the store's own currency.
 *
 * A hook rather than a parameter threaded through four chart components: the
 * symbol is one value that never changes while anybody is looking at a chart,
 * and the axis, the tooltip, the ranked list and the tile all need it.
 */
export function useRender(): (n: number, as?: Format) => string {
  const symbol = useCurrencySymbol();
  // The symbol is required rather than defaulted: a default is a currency
  // nobody chose, printed on somebody's money.
  return (n, as = "number") => render(n, as, symbol);
}

/** Thousands separated, and big money shortened so a tick is not 9 characters. */
export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (abs >= 10_000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString("en-PK");
}

/* -------------------------------------------------------------------------- */
/* Trend                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One measure over time.
 *
 * Never two. Revenue and order count on one plot would need two scales, and the
 * alignment between them would be arbitrary — a chart that invents a
 * correlation. Two measures are two charts, side by side.
 */
export function TrendChart({
  points,
  format = "number",
  height = 160,
  width = 640,
  label,
}: {
  points: Point[];
  format?: Format;
  height?: number;
  /**
   * The viewBox width, which sets the chart's shape.
   *
   * An SVG scaled to its container keeps its aspect ratio, so a box drawn 640
   * wide and 160 tall becomes 330px tall in a full-width card. A wider box for
   * a wider card keeps the proportion the chart was designed at, without
   * stretching the strokes the way preserveAspectRatio="none" would.
   */
  width?: number;
  /** What the line is, for a screen reader and for the tooltip. */
  label: string;
}) {
  const draw = useRender();
  const [hover, setHover] = useState<number | null>(null);

  const W = width;
  const padL = 44, padR = 12, padT = 12, padB = 22;
  const plotW = W - padL - padR;
  const plotH = height - padT - padB;

  const max = niceCeiling(Math.max(...points.map((p) => p.value), 0));
  const n = points.length;
  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH - (max === 0 ? 0 : (v / max) * plotH);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${padT + plotH} L${x(0).toFixed(1)},${padT + plotH} Z`;
  const last = points[n - 1];

  const ticks = [0, max / 2, max];
  const active = hover === null ? null : points[hover];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${label}. ${points.length} days, ending at ${draw(last?.value ?? 0, format)}.`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={AXIS} strokeWidth="1" />
            <text x={padL - 8} y={y(t) + 3.5} textAnchor="end" className="fill-ink-faint text-[9px]">
              {draw(t, format)}
            </text>
          </g>
        ))}

        {max > 0 && <path d={area} fill="var(--color-brand-500)" fillOpacity="0.1" />}
        <path
          d={line}
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* The end of the line, ringed in the surface colour so it stays legible
            wherever it lands. */}
        {last && (
          <circle cx={x(n - 1)} cy={y(last.value)} r="4"
            fill="var(--color-brand-500)" stroke="var(--color-control)" strokeWidth="2" />
        )}

        {/* One hit target per day, the full height of the plot — a 4px dot is
            not something anyone can point at. */}
        {points.map((p, i) => (
          <rect
            key={p.day}
            x={x(i) - plotW / Math.max(n - 1, 1) / 2}
            y={padT}
            width={plotW / Math.max(n - 1, 1)}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {active && (
          <>
            <line x1={x(hover!)} x2={x(hover!)} y1={padT} y2={padT + plotH} stroke={AXIS} strokeWidth="1" />
            <circle cx={x(hover!)} cy={y(active.value)} r="4.5"
              fill="var(--color-brand-500)" stroke="var(--color-control)" strokeWidth="2" />
          </>
        )}

        {points.length > 1 && (
          <>
            <text x={padL} y={height - 6} className="fill-ink-faint text-[9px]">{shortDay(points[0].day)}</text>
            <text x={W - padR} y={height - 6} textAnchor="end" className="fill-ink-faint text-[9px]">
              {shortDay(points[n - 1].day)}
            </text>
          </>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg border border-control-line bg-control px-2 py-1 text-[11px] shadow-sm"
          style={{ left: `${(x(hover!) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <span className="font-medium">{draw(active.value, format)}</span>
          <span className="ml-1.5 text-ink-faint">{shortDay(active.day)}</span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Ranked list                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A few things, biggest first, with a bar behind each.
 *
 * One colour for every bar. Shading them darker-where-bigger would spend the
 * only free channel on information the bar length already carries, and these
 * are names — products, pages, referrers — with no natural order to a ramp.
 */
export function RankedBars({
  rows,
  format = "number",
  empty = "Nothing yet.",
}: {
  rows: { label: string; value: number }[];
  format?: Format;
  empty?: string;
}) {
  const draw = useRender();
  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-ink-soft">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="space-y-2">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-xs text-ink" title={row.label}>{row.label}</span>
            <span className="flex-shrink-0 font-mono text-xs tabular-nums text-ink-soft">{draw(row.value, format)}</span>
          </div>
          {/* A track one step off the surface, so a small value still reads as
              a small share rather than as nothing at all. */}
          <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-panel">
            <div
              className="h-full rounded-pill bg-brand-500"
              style={{ width: `${Math.max((row.value / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* Part to whole                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Where the orders in this window are, as one bar.
 *
 * A bar rather than a donut. The stages are an ordered sequence and their
 * shares are often close, and close values in a ring are the hardest thing in
 * charting to read. Ordered categories are the one case where a ramp is right,
 * so the stages run light to dark in a single hue.
 *
 * Every segment carries its name in the row beneath, so identity never depends
 * on matching a colour to a key.
 */
export function StageBar({
  stages,
  empty = "No orders in this period.",
}: {
  stages: { stage: string; count: number; label: string }[];
  empty?: string;
}) {
  const total = stages.reduce((s, x) => s + x.count, 0);
  if (total === 0) return <p className="py-6 text-center text-xs text-ink-soft">{empty}</p>;

  // Light to dark across the sequence — the ordinal case, not a value ramp.
  const shade = (i: number) => 0.28 + (i / Math.max(stages.length - 1, 1)) * 0.72;

  return (
    <div className="space-y-3">
      {/* 2px gaps in the surface colour separate the segments; nothing is
          outlined, because a stroke would add ink that is not data. */}
      <div className="flex h-3 w-full gap-[2px] overflow-hidden">
        {stages.map((s, i) => (
          s.count > 0 && (
            <div
              key={s.stage}
              className={cn("h-full", i === 0 && "rounded-l-pill", i === stages.length - 1 && "rounded-r-pill")}
              style={{ width: `${(s.count / total) * 100}%`, backgroundColor: "var(--color-brand-500)", opacity: shade(i) }}
              title={`${s.label}: ${s.count}`}
            />
          )
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {stages.map((s, i) => (
          <li key={s.stage} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-brand-500)", opacity: shade(i) }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{s.label}</span>
            <span className="font-mono tabular-nums text-ink">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric tile                                                                */
/* -------------------------------------------------------------------------- */

/**
 * One headline figure, with what it was before.
 *
 * The change is the part that makes the number mean something — a revenue of
 * 1.2m says
 * nothing until you know last month was 900k. When there is no previous
 * period to compare against, it says so rather than printing a percentage
 * invented from a division by zero.
 *
 * Up is not automatically good: a rise in cancelled orders is bad news in green
 * if the arrow decides the colour. `goodWhen` says which direction is which,
 * and the colour follows that rather than the sign.
 */
export function MetricTile({
  label,
  value,
  change,
  spark,
  href,
  goodWhen = "up",
  hint,
}: {
  label: string;
  value: string;
  /** Percent against the previous window; null when there is nothing to compare. */
  change?: number | null;
  spark?: Point[];
  href?: string;
  goodWhen?: "up" | "down" | "neither";
  hint?: string;
}) {
  const rising = (change ?? 0) > 0;
  const flat = change === 0 || change === undefined || change === null;
  const good = goodWhen === "neither" ? null : goodWhen === "up" ? rising : !rising;

  const body = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <p className="mt-1 font-mono text-[22px] font-semibold tabular-nums leading-none text-ink">{value}</p>

      <div className="mt-1.5 flex min-h-4 items-center gap-1.5">
        {change === null || change === undefined ? (
          <span className="text-[11px] text-ink-faint">{hint ?? "No earlier period"}</span>
        ) : (
          <>
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                flat ? "text-ink-faint" : good ? "text-green" : "text-rose"
              )}
            >
              {rising ? "↑" : change < 0 ? "↓" : "→"} {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-[11px] text-ink-faint">vs previous</span>
          </>
        )}
      </div>

      {spark && spark.length > 1 && <Sparkline points={spark} />}
    </>
  );

  const shell =
    "rounded-xl border border-control-line bg-control p-3 transition-colors";
  return href ? (
    <a href={href} className={cn(shell, "block hover:border-brand-300")}>{body}</a>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/** A line with no axes — shape only, to sit under a figure. */
function Sparkline({ points }: { points: Point[] }) {
  const W = 200, H = 28;
  const max = Math.max(...points.map((p) => p.value), 1);
  const n = points.length;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (n - 1)) * W).toFixed(1)},${(H - (p.value / max) * H).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-7 w-full" aria-hidden preserveAspectRatio="none">
      <path d={`${d} L${W},${H} L0,${H} Z`} fill="var(--color-brand-500)" fillOpacity="0.08" />
      <path d={d} fill="none" stroke="var(--color-brand-500)" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
