"use client";

import Image from "next/image";
import { AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The pieces every product row and tile is built from.
 *
 * They live here rather than in one list because the catalogue is shown in
 * four places — the list, the tiles, the Bin, and search — and a product that
 * looks like a different object in each of them is four things to learn
 * instead of one.
 */

/**
 * The picture, or an honest blank.
 *
 * A product with no image used to be a tinted rectangle, indistinguishable
 * from one whose picture had failed to load. The glyph says "there is nothing
 * here yet" rather than "something went wrong".
 */
export function Thumb({ src, size }: { src?: string; size: "row" | "tile" }) {
  const box = size === "row" ? "h-11 w-11 rounded-lg" : "aspect-square w-full rounded-none";
  return (
    <div className={cn("relative flex-shrink-0 overflow-hidden bg-brand-50", box)}>
      {src ? (
        <Image src={src} alt="" fill sizes={size === "row" ? "44px" : "(max-width:640px) 50vw, 20vw"} className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <Package className={cn("text-brand-500/40", size === "row" ? "h-4 w-4" : "h-7 w-7")} />
        </span>
      )}
    </div>
  );
}

/**
 * How many are left, in the one form a merchant acts on.
 *
 * "0 in stock" read exactly like "148 in stock" — same size, same grey, same
 * sentence — so the one row that needed doing something about was the hardest
 * to find. Out and low carry a colour *and* a word, never colour alone.
 */
export function StockMark({ stock, low, className }: { stock: number; low: number; className?: string }) {
  if (stock <= 0)
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-rose", className)}>
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        Out of stock
      </span>
    );
  if (stock <= low)
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-amber", className)}>
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        {stock} left
      </span>
    );
  return (
    <span className={cn("text-xs tabular-nums text-ink-soft", className)}>{stock} in stock</span>
  );
}

/** Draft or published, in the same place on every row. */
export function StatusMark({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "DRAFT" ? "bg-amber-bg text-amber" : "bg-green-bg text-green"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "DRAFT" ? "bg-amber" : "bg-green")} aria-hidden />
      {status === "DRAFT" ? "Draft" : "Published"}
    </span>
  );
}
