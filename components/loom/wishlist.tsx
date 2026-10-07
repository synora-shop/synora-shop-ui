"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { LoomHeartOutline } from "@/components/loom/icons";
import type { KitProduct } from "@/lib/themes/kit";

/**
 * The wishlist: what a customer has hearted, in this browser, shared by every
 * heart on every page and the wishlist page, and kept in step across tabs.
 *
 * Each heart saves a snapshot — name, price, photograph, address — not just
 * an id, so the wishlist page can draw what was saved without knowing every
 * product in the shop. (It first saved ids and looked them up among "the
 * products on this page", which works in a six-shoe demo and nowhere else.)
 * Ported to accounts, the list belongs to the customer instead of the
 * browser; the hearts and the page do not change.
 *
 * The kit draws the Casual Shoe's heart filled. That starting heart belongs to
 * the reference build alone: on /loom an empty browser starts with it, on a
 * real shop an empty browser starts empty — a shop's wishlist must never open
 * holding a demo shoe.
 *
 * The server renders the list a page was handed (`start`, empty on a real
 * shop) and the browser's own takes over after hydration — what
 * useSyncExternalStore's server snapshot is for.
 */
export type WishItem = Pick<KitProduct, "id" | "title" | "price" | "src" | "href">;

const KEY = "loom-wishlist-v2";
const EMPTY: WishItem[] = [];
const DEMO_START: WishItem[] = [
  { id: "casual", title: "Casual Shoe", price: 225, src: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png", href: "#" },
];
const listeners = new Set<() => void>();
let cache: WishItem[] | null = null;

function read(): WishItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as WishItem[]) : window.location.pathname.startsWith("/loom") ? DEMO_START : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(items: WishItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Private windows and full storage: the hearts still work for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWishlist(start: WishItem[] = EMPTY) {
  const items = useSyncExternalStore(subscribe, read, () => start);
  const has = (id: string) => items.some((x) => x.id === id);
  return {
    items,
    has,
    toggle: (item: WishItem) => write(has(item.id) ? items.filter((x) => x.id !== item.id) : [...items, item]),
    remove: (id: string) => write(items.filter((x) => x.id !== id)),
  };
}

/**
 * The favourite button on a product card: a 40px circle, inset 20 from the
 * card's top-right on desktop and 8 on the phone, never under 32px.
 *
 * Inactive is `#121212` at twenty per cent — translucent ink over the
 * photograph, not a grey — and active is the kit's one accent, `#f15353`.
 * It sits above the card's whole-card link (`z-[1]`) so pressing the heart
 * saves the product instead of opening it.
 *
 * Given a product it saves to the wishlist; without one it is the kit's
 * drawing of a heart, shown in the state it is given.
 */
export function LoomLove({ product, active = false }: { product?: WishItem; active?: boolean }) {
  const list = useWishlist();
  const isOn = product ? list.has(product.id) : active;
  return (
    <button
      type="button"
      aria-label={isOn ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isOn}
      onClick={product ? () => list.toggle(product) : undefined}
      className={cn(
        "absolute right-[calc(8*var(--u))] top-[calc(8*var(--u))] z-[1] flex h-[max(calc(40*var(--u)),32px)] w-[max(calc(40*var(--u)),32px)] items-center justify-center rounded-full text-white md:right-[calc(20*var(--u))] md:top-[calc(20*var(--u))]",
        isOn ? "bg-[#f15353]" : "bg-[#121212]/20"
      )}
    >
      <LoomHeartOutline className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)]" />
    </button>
  );
}
