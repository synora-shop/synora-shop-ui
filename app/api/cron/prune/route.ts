import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { pruneExpiredRows } from "@/lib/retention";

// Scheduled housekeeping. Wired to a daily cron in vercel.json.
//
// Runs unattended, deletes rows, and is reachable over the public internet, so
// it is gated. Vercel's scheduler sends `Authorization: Bearer $CRON_SECRET`;
// nothing else is accepted, and with no secret configured the route refuses
// outright rather than running open to anyone who guesses the path. Refusing is
// the safe direction: a sweep that does not happen costs storage, one that
// anyone can trigger is a denial-of-service lever.

export const dynamic = "force-dynamic";
/** Deleting across several tables can outlast the default budget. */
export const maxDuration = 60;

export async function GET() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/prune] CRON_SECRET is not set, refusing to run");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const authorization = (await headers()).get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    // Deliberately 404, not 401: an unauthenticated caller learns nothing about
    // whether this path exists.
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const started = Date.now();
  const report = await pruneExpiredRows();
  const ms = Date.now() - started;

  // Logged as well as returned — the cron's own response is not somewhere
  // anyone looks, but the build logs are.
  console.log(`[cron/prune] ${ms}ms`, report);
  return NextResponse.json({ ok: true, ms, report });
}
