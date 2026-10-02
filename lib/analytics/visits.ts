import { createHash } from "crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/data/settings";

/**
 * Counting who visits a storefront, without recording who they are.
 *
 * The documentation asks for "visits grouped by IP address". The grouping is
 * the useful part — how many *people*, not how many requests — and the address
 * itself is not needed to get it. So the address is hashed with the server's
 * own secret and only the hash is stored: two visits from one person still
 * match, and nobody holding the database can turn the rows back into a list of
 * who visited.
 *
 * Storefront only, and never the admin: a merchant refreshing their own product
 * list is not traffic, and counting it would make every quiet day look busy.
 */

/** Requests that are not people. Kept short — this is a filter, not a war. */
const BOTS = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|monitor|preview|curl|wget|python-requests/i;

/**
 * A stable, one-way id for a visitor.
 *
 * Salted with AUTH_SECRET so the hash cannot be reversed by trying every
 * address — there are only four billion of them, which is minutes of work
 * against an unsalted hash. The user agent joins the address so two people
 * behind one office router are not counted as one.
 */
function fingerprint(ip: string, userAgent: string): string {
  const salt = process.env.AUTH_SECRET ?? "unsalted-development-only";
  return createHash("sha256").update(`${salt}:${ip}:${userAgent}`).digest("hex").slice(0, 32);
}

/**
 * Host only, never the full address — a referrer URL can carry a search query.
 *
 * Empty rather than null for direct traffic: this is part of the row's unique
 * key, and Postgres counts two NULLs as different, so a null here would
 * de-duplicate nothing for the visits that have no referrer — which is most
 * of them.
 */
function referrerHost(raw: string | null): string {
  if (!raw) return "";
  try {
    return new URL(raw).hostname.replace(/^www\./, "") || "";
  } catch {
    return "";
  }
}

/**
 * Today's date in a given time zone, as a date with no time on it.
 *
 * `en-CA` because it formats as YYYY-MM-DD, which is both what Postgres wants
 * and what sorts correctly — the alternative is three calls to
 * formatToParts and a template string.
 */
function localDay(timeZone: string): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  return new Date(`${ymd}T00:00:00.000Z`);
}

/**
 * Records one storefront page view, after the response has gone out.
 *
 * Inside `after()` on purpose: a visitor must never wait on our bookkeeping,
 * and a page that fails to render because analytics could not write would be an
 * absurd way to lose a sale. Every failure here is swallowed for the same
 * reason.
 */
export async function recordVisit(shopId: string, path: string): Promise<void> {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? "";
  if (BOTS.test(userAgent)) return;

  const forwarded = h.get("x-forwarded-for");
  // "none" rather than skipping. Hosting always sets one of these, so this
  // fallback is reached only in local development — and an early return there
  // meant the whole feature could not be exercised before it shipped, which is
  // a worse problem than the one visitor it would have merged. The user agent
  // still separates people either way.
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "none";

  const visitor = fingerprint(ip, userAgent);
  const country = h.get("x-vercel-ip-country");
  const referrer = referrerHost(h.get("referer"));

  after(async () => {
    try {
      // The shop's own day, not the server's. Every chart groups by this
      // column, and a UTC day would put one row across two of the shop's days
      // for any shop that is not on UTC. getStoreSettings is cached per shop,
      // so this costs nothing per view.
      const settings = await getStoreSettings();
      const day = localDay(settings.timeZone || "UTC");

      // Counted, not listed. A row per view grew without limit, in the biggest
      // table here, kept for over a year — see the migration. One row per
      // visitor, per path, per day, per referrer, and repeats increment it, so
      // `sum(views)` is exactly what `count(*)` used to be and `count(DISTINCT
      // visitor)` is untouched.
      await prisma.visit.upsert({
        where: {
          shopId_visitor_path_day_referrer: {
            shopId,
            visitor,
            path: path.slice(0, 300),
            day,
            referrer,
          },
        },
        create: {
          shopId,
          path: path.slice(0, 300),
          visitor,
          country,
          referrer,
          day,
          lastSeenAt: new Date(),
        },
        // Deliberately not touching country or referrer: they are part of what
        // this row *is*, and the first sighting is the one that explains where
        // the visitor came from.
        update: { views: { increment: 1 }, lastSeenAt: new Date() },
      });
    } catch {
      /* a missed count is not worth an error page */
    }
  });
}
