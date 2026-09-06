import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { analytics } from "@/lib/analytics/queries";
import { readRange } from "@/lib/analytics";

/**
 * The window on screen, as a file.
 *
 * A day per row with everything that varies by day beside it, so it opens in a
 * spreadsheet and can be handed to an accountant without explanation. The
 * headline totals are not repeated — they are sums of these columns, and a file
 * carrying both invites the two to disagree.
 */
export async function GET(request: Request) {
  await requireRole("STAFF");

  const sp = Object.fromEntries(new URL(request.url).searchParams.entries());
  const range = readRange(sp);
  const data = await analytics(range.days);

  const rows = [
    ["Day", "Revenue", "Orders", "Visits", "People"],
    ...data.revenueSeries.map((point, i) => [
      point.day,
      String(point.value),
      String(data.orderSeries[i]?.value ?? 0),
      String(data.visitSeries[i]?.value ?? 0),
      String(data.peopleSeries[i]?.value ?? 0),
    ]),
  ];

  // Quoted and doubled, the same as the product export: a value with a comma in
  // it is not a reason for a file to lose a column.
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-${range.value}-${data.to.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
