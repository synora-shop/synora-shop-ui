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
// Once a day, at 04:43. Hourly is what this wants — the backoff starts at a
// minute and doubles, so an hourly schedule lets the backoff decide how often a
// registrar is asked rather than the cron deciding for it. The Vercel plan this
// runs on allows one cron run per day, and a deploy carrying a finer expression
// is refused outright, so daily is the honest ceiling today. Change the one
// line in vercel.json to `43 * * * *` the day the plan allows it; nothing else
// here assumes either.
//
// What daily costs, concretely: a merchant who corrects their DNS at midnight
// is brought live the following morning rather than within the hour. The
// "Check now" button is the answer for anyone unwilling to wait, and it is
// offered on live domains too — so the slow path is only for merchants who
// have walked away, which is exactly who a scheduled checker is for.
//
// Gated exactly like /api/cron/prune — Vercel's scheduler sends
// `Authorization: Bearer $CRON_SECRET`, nothing else is accepted, and with no
// secret configured it refuses rather than running open. This one issues DNS
// queries and calls the hosting vendor, so an open version is a way to spend
// someone else's rate limit.

export const dynamic = "force-dynamic";
/**
 * Every domain on the platform, each a DNS lookup and a vendor call.
 *
 * Higher than the prune's because this one runs once a day: every domain that
 * is due comes due on the same run, so the whole platform is checked in one
 * pass rather than spread across twenty-four.
 */
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
