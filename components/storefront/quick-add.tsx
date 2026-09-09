"use client";

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

/**
 * Add to basket without leaving the grid.
 *
 * Only ever rendered for a product with exactly one version. That restriction
 * is the whole design: a shop selling shirts in four sizes must not have a
 * button that quietly picks one, and the alternative — opening a size chooser
 * on top of a grid — is a product page with extra steps. So anything with a
 * choice to make goes to its own page, and this button is not shown at all.
 *
 * A button inside a link, which needs care: the card is an anchor, so without
 * stopping the event a click here would add the item *and* navigate away from
 * the grid the customer is still browsing.
 */
export function QuickAdd({
  product,
  variant,
  price,
  label = "Add",
  addedLabel = "Added",
}: {
  product: { id: string; slug: string; title: string; image: string };
  variant: { id: string; size: string; color: string; stock: number };
  price: number;
  label?: string;
  addedLabel?: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [state, setState] = useState<"idle" | "adding" | "done">("idle");

  function add(e: React.MouseEvent) {
    // The card around this is a link to the product page.
    e.preventDefault();
    e.stopPropagation();
    if (state !== "idle") return;

    setState("adding");
    addItem({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      title: product.title,
      image: product.image,
      size: variant.size,
      color: variant.color,
      price,
      quantity: 1,
      stock: variant.stock,
    });
    setState("done");
    // Back to normal rather than staying green forever: the same card may be
    // added again, and a button stuck on "Added" cannot say so.
    setTimeout(() => setState("idle"), 1600);
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={state === "adding"}
      aria-label={`${label} ${product.title}`}
      className="lift inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--sf-button-radius,999px)] border border-border bg-white/95 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60"
    >
      {state === "adding" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {state === "done" && <Check className="h-3.5 w-3.5 text-green" aria-hidden />}
      {state === "idle" && <Plus className="h-3.5 w-3.5" aria-hidden />}
      {state === "done" ? addedLabel : label}
    </button>
  );
}
