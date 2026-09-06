/**
 * Checks the arithmetic behind the analytics screen — `npm run check:analytics`.
 *
 * A chart that renders beautifully off a bad bucket is worse than no chart: it
 * is a number a merchant will act on. These are the ways it goes wrong quietly.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  RANGES, daySpan, dayKey, funnel, niceCeiling, percentChange,
  readRange, seriesByDay, topBy,
} from "../lib/analytics";
import { windowFor } from "../lib/analytics/queries";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else { fail++; console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
};

/* -------------------------------------------------------------------------- */
/* Days are cut in the shop's zone, not the server's                          */
/* -------------------------------------------------------------------------- */

// 2026-09-06 20:00 UTC is already the 7th in Karachi (+05:00). A shop reading a
// UTC boundary files five hours of this morning's sales under yesterday.
const evening = new Date("2026-09-06T20:00:00Z");
check("a Karachi shop sees the next day", dayKey(evening, "Asia/Karachi") === "2026-09-07");
check("a UTC shop still sees the 6th", dayKey(evening, "UTC") === "2026-09-06");
check("a New York shop sees the 6th", dayKey(evening, "America/New_York") === "2026-09-06");
// An unknown zone must not take the whole screen down with it.
check("an unknown zone falls back rather than throwing", dayKey(evening, "Not/AZone") === "2026-09-06");

/* -------------------------------------------------------------------------- */
/* Gaps are zeros, not missing points                                         */
/* -------------------------------------------------------------------------- */

const from = new Date("2026-09-01T00:00:00Z");
const to = new Date("2026-09-05T00:00:00Z");
const span = daySpan(from, to, "UTC");
check("the span covers both ends", span[0] === "2026-09-01" && span[span.length - 1] === "2026-09-05");
check("the span has no duplicates", new Set(span).size === span.length);

const sparse = seriesByDay(
  [
    { createdAt: new Date("2026-09-01T10:00:00Z"), value: 100 },
    { createdAt: new Date("2026-09-01T18:00:00Z"), value: 50 },
    { createdAt: new Date("2026-09-05T09:00:00Z"), value: 25 },
  ],
  from, to, "UTC"
);
// Chart only the days that have rows and the line runs straight from the 1st to
// the 5th, implying trade on days there was none.
check("every day in the window is present", sparse.length === 5, `got ${sparse.length}`);
check("a quiet day is a zero", sparse[1].value === 0 && sparse[2].value === 0);
check("two rows on one day are added", sparse[0].value === 150);
check("the last day is included", sparse[4].value === 25);

/* -------------------------------------------------------------------------- */
/* A change from nothing has no percentage                                    */
/* -------------------------------------------------------------------------- */

check("a rise is positive", percentChange(150, 100) === 50);
check("a fall is negative", percentChange(50, 100) === -50);
check("no change is zero", percentChange(100, 100) === 0);
// Not infinity, and not 100%. There is no percentage, and inventing one is the
// difference between a figure and a lie.
check("growth from nothing has no percentage", percentChange(500, 0) === null);
check("nothing from nothing has no percentage", percentChange(0, 0) === null);

/* -------------------------------------------------------------------------- */
/* Windows                                                                    */
/* -------------------------------------------------------------------------- */

const now = new Date("2026-09-06T12:00:00Z");
const w = windowFor(30, now);
check("the window ends now", w.to.getTime() === now.getTime());
check("the window is as long as asked", Math.round((w.to.getTime() - w.from.getTime()) / 86_400_000) === 30);
// The comparison is meaningless unless the two windows are the same length.
check("the previous window is the same length",
  w.from.getTime() - w.previousFrom.getTime() === w.to.getTime() - w.from.getTime());

check("no range means thirty days", readRange({}).days === 30);
check("a range is honoured", readRange({ range: "7d" }).days === 7);
check("an unknown range falls back", readRange({ range: "all-time" }).days === 30);
check("every range has a distinct key", new Set(RANGES.map((r) => r.value)).size === RANGES.length);

/* -------------------------------------------------------------------------- */
/* Ranking and axes                                                           */
/* -------------------------------------------------------------------------- */

const ranked = topBy(
  [{ t: "Hat", v: 5 }, { t: "Shoe", v: 20 }, { t: "Hat", v: 15 }, { t: "Belt", v: 1 }],
  (r) => r.t, (r) => r.v, 2
);
check("rows are totalled by label", ranked[0].label === "Hat" && ranked[0].value === 20);
check("biggest first", ranked[0].value >= ranked[1].value);
check("the limit is honoured", ranked.length === 2);

check("an axis ends on a round number", niceCeiling(83) === 100);
check("and does not round down", niceCeiling(101) >= 101);
// An empty chart still needs a scale, or every point divides by zero.
check("an empty chart still has a ceiling", niceCeiling(0) === 1);

const stages = funnel({ DELIVERED: 4, PENDING: 2 });
check("the funnel keeps its order", stages[0].stage === "PENDING" && stages[4].stage === "DELIVERED");
check("a stage with no orders is a zero", stages[1].count === 0);
// Cancelled is a way out of the sequence, not the step every order ends on.
check("cancelled is not a stage", !stages.some((s) => String(s.stage) === "CANCELLED"));

/* -------------------------------------------------------------------------- */
/* Raw queries carry their own tenancy                                        */
/* -------------------------------------------------------------------------- */

// Visits need date_trunc in the shop's zone, which Prisma cannot express, so
// those reads bypass the tenant-scoped client. Nothing else is protecting them.
const queries = readFileSync(join(process.cwd(), "lib/analytics/queries.ts"), "utf8");
const raws = queries.match(/\$queryRaw<[^`]*`[\s\S]*?`/g) ?? [];
check("the raw visit queries were found", raws.length >= 3, `found ${raws.length}`);
for (const [i, raw] of raws.entries()) {
  check(`raw query ${i + 1} filters by shop`, /"shopId"\s*=\s*\$\{/.test(raw),
    "a raw read is not tenant-scoped by the client");
}
check("no raw query interpolates a bare string",
  !/\$queryRawUnsafe/.test(queries), "$queryRawUnsafe cannot parameterise");

/* -------------------------------------------------------------------------- */
/* The screen shows two measures as two charts                                */
/* -------------------------------------------------------------------------- */

const charts = readFileSync(join(process.cwd(), "components/admin/charts.tsx"), "utf8");
// Revenue and order count on one plot need two scales, and the alignment
// between them is arbitrary — a chart that invents a correlation.
check("a trend chart takes one series", /points: Point\[\]/.test(charts) && !/series\[\]/.test(charts));
check("a format travels as a name, not a function", /export type Format = "number" \| "currency"/.test(charts));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
