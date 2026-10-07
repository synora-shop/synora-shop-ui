"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { LoomHeartOutline } from "@/components/loom/icons";

/**
 * The wishlist, for the reference build: product ids in this browser's
 * storage, shared by every heart on every page and the wishlist page itself,
 * and kept in step across tabs.
 *
 * Ported, the list belongs to the customer's account rather than the browser;
 * the hearts and the page do not change, only where `ids` comes from.
 *
 * The kit draws the Casual Shoe's heart filled, so that is what a first visit
 * starts with. The server always renders that starting state and the stored
 * one takes over after hydration, which is what useSyncExternalStore's
 * server snapshot is for — a heart never renders one way on the server and
 * another in the browser.
 */
const KEY = "loom-wishlist";
const START = ["casual"];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : START;
  } catch {
    cache = START;
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
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

export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, read, () => START);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => write(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    remove: (id: string) => write(ids.filter((x) => x !== id)),
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
 * Given a product id it saves to the wishlist; without one it is the kit's
 * drawing of a heart, shown in the state it is given.
 */
export function LoomLove({ productId, active = false }: { productId?: string; active?: boolean }) {
  const list = useWishlist();
  const isOn = productId ? list.has(productId) : active;
  return (
    <button
      type="button"
      aria-label={isOn ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isOn}
      onClick={productId ? () => list.toggle(productId) : undefined}
      className={cn(
        "absolute right-[calc(8*var(--u))] top-[calc(8*var(--u))] z-[1] flex h-[max(calc(40*var(--u)),32px)] w-[max(calc(40*var(--u)),32px)] items-center justify-center rounded-full text-white md:right-[calc(20*var(--u))] md:top-[calc(20*var(--u))]",
        isOn ? "bg-[#f15353]" : "bg-[#121212]/20"
      )}
    >
      <LoomHeartOutline className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)]" />
    </button>
  );
}
