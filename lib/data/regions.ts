import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@/lib/data/shop";
import { GEO_COUNTRY_HEADER, normaliseCountry, resolveRegion } from "@/lib/region";
import { REGION_HEADER } from "@/lib/shop-context";

/** Every region this shop has defined, oldest first. */
export const getRegions = cache(async () => {
  return (await db()).region.findMany({ orderBy: { createdAt: "asc" } });
});

export type RegionRow = Awaited<ReturnType<typeof getRegions>>[number];

/**
 * The country the edge resolved for this request, or null.
 *
 * The single point at which this application learns a visitor's location. It
 * reads one header, the one the platform overwrites on ingress, and validates
 * the shape before returning it. No IP address is touched — see lib/region.ts
 * for why the forwarded header is not consulted.
 */
export const visitorCountry = cache(async (): Promise<string | null> => {
  return normaliseCountry((await headers()).get(GEO_COUNTRY_HEADER));
});

/**
 * The region to render.
 *
 * The requested handle arrives as a header because a layout is given no
 * searchParams; proxy.ts reads it off the URL and clears anything the client
 * sent under that name. It is whatever was in the address bar either way, which
 * is safe because a region decides presentation only — see the note at the top
 * of lib/region.ts, which check-regions.ts enforces.
 */
export const currentRegion = cache(async () => {
  const [regions, country, h] = await Promise.all([getRegions(), visitorCountry(), headers()]);
  return resolveRegion(regions, country, h.get(REGION_HEADER));
});
