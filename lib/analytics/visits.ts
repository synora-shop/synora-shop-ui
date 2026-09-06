import { createHash } from "crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

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

/** Host only, never the full address — a referrer URL can carry a search query. */
function referrerHost(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
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
      await prisma.visit.create({
        data: { shopId, path: path.slice(0, 300), visitor, country, referrer },
      });
    } catch {
      /* a missed count is not worth an error page */
    }
  });
}
