import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sweepDomains } from "@/lib/data/domains";

// The domain checker.
//
// Every custom domain on the platform that is due a look gets one: those still
// being set up, on the backoff, so a merchant who fixed their records at two in
// the morning wakes up live; and those already live, every six hours, so a
// domain that has stopped working is noticed rather than going on claiming to
// serve a store that has vanished.
//
// Hourly, because the backoff starts at a minute and doubles: any finer and the
// schedule, not the backoff, would be deciding how often a registrar is asked.
//
// Gated exactly like /api/cron/prune — Vercel's scheduler sends
// `Authorization: Bearer $CRON_SECRET`, nothing else is accepted, and with no
// secret configured it refuses rather than running open. This one issues DNS
// queries and calls the hosting vendor, so an open version is a way to spend
// someone else's rate limit.

export const dynamic = "force-dynamic";
/** Every domain on the platform, each a DNS lookup and a vendor call. */
export const maxDuration = 300;

export async function GET() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/domains] CRON_SECRET is not set, refusing to run");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const authorization = (await headers()).get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    // 404, not 401: an unauthenticated caller learns nothing about whether this
    // path exists.
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const started = Date.now();
  const report = await sweepDomains();
  const ms = Date.now() - started;

  console.log(`[cron/domains] ${ms}ms`, report);
  return NextResponse.json({ ok: true, ms, report });
}
