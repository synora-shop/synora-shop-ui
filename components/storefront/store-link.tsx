"use client";

import NextLink from "next/link";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { storeHref } from "@/lib/themes/demo";

/**
 * Every link on a storefront, prefixed when the storefront is a theme demo.
 *
 * `/theme-store/kite` renders a demo shop of ours from the ordinary storefront
 * routes, so the HTML it produces is full of ordinary storefront links — `/`,
 * `/shop`, `/product/heavyweight-tee`. Followed as written, the first click
 * would leave the demo and land on the application host's own pages. Prefixing
 * them keeps browsing inside the demo, and inside the one URL the theme store
 * publishes.
 *
 * **The base is the empty string on every real shop**, and that is the whole
 * safety argument for a change this wide: a merchant's storefront renders
 * byte-for-byte the HTML it rendered before the theme store existed, so a fault
 * in any of this can only ever show up inside a demo.
 *
 * A context rather than a prop threaded through forty components: a link is
 * five levels below the layout in places, and the alternative is an argument
 * every future section has to remember to pass. Forgetting it would not be a
 * type error — it would be a link that quietly escapes the demo.
 */
const StoreBaseContext = createContext("");

export function StoreBaseProvider({ base, children }: { base: string; children: ReactNode }) {
  return <StoreBaseContext.Provider value={base}>{children}</StoreBaseContext.Provider>;
}

/** The prefix this storefront's links carry — "" on a merchant's own shop. */
export function useStoreBase(): string {
  return useContext(StoreBaseContext);
}

/** One href, prefixed. For the few places that need a string rather than a link. */
export function useStoreHref(href: string): string {
  return storeHref(useContext(StoreBaseContext), href);
}

/**
 * A drop-in for `next/link`.
 *
 * Imported as `Link` throughout the storefront, so the call sites read exactly
 * as they did — deliberately, because a rename across forty files is a diff
 * nobody reads, and the point of this change is that the storefront is
 * unchanged except for where its links point.
 *
 * Only a string href is touched. `next/link` also accepts a UrlObject, which
 * nothing on the storefront uses and which would need its own handling rather
 * than a silent guess.
 */
export function StoreLink({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const base = useContext(StoreBaseContext);
  return <NextLink href={typeof href === "string" ? storeHref(base, href) : href} {...rest} />;
}
