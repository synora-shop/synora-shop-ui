"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { buildWhatsAppLink, productInquiryMessage } from "@/lib/whatsapp";
import { stockDisplay } from "@/lib/global-edits";
import { useMoney } from "@/components/ui/currency";

type Variant = {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  stock: number;
};

export function ProductPurchasePanel({
  productId,
  slug,
  title,
  image,
  price,
  variants,
  whatsappNumber,
  showInventoryCount = true,
  lowStockThreshold = 5,
  lowStockBadgeText = "Only {n} left!",
  whatsappOrderButton = true,
  addToCartLabel = "Add to Cart",
  addedToCartLabel = "Added to Cart",
  buyNowLabel = "Buy Now",
  orderViaWhatsAppLabel = "Order via WhatsApp",
  stickyBuyBar = false,
}: {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  variants: Variant[];
  whatsappNumber?: string;
  showInventoryCount?: boolean;
  lowStockThreshold?: number;
  lowStockBadgeText?: string;
  whatsappOrderButton?: boolean;
  addToCartLabel?: string;
  addedToCartLabel?: string;
  buyNowLabel?: string;
  orderViaWhatsAppLabel?: string;
  /**
   * Whether the price and Add to basket follow the page down.
   *
   * A theme's choice, off by default. It only ever appears on narrow screens:
   * on a desktop the buttons are beside the photo and rarely leave the view,
   * so a fixed bar there would cover the page to solve nothing.
   */
  stickyBuyBar?: boolean;
}) {
  const money = useMoney();
  const router = useRouter();

  /**
   * Whether the real buy buttons have scrolled out of view.
   *
   * Watched rather than measured against a scroll position, because the
   * distance depends on how long the description is, how many variants there
   * are and how wide the window is — a fixed threshold is wrong on most pages.
   */
  const buyRowRef = useRef<HTMLDivElement | null>(null);
  const [buyRowGone, setBuyRowGone] = useState(false);

  useEffect(() => {
    const el = buyRowRef.current;
    if (!stickyBuyBar || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setBuyRowGone(!entry.isIntersecting),
      // A little margin, so the bar does not flicker in and out while the
      // buttons sit exactly on the edge of the viewport.
      { rootMargin: "-8px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stickyBuyBar]);
  const addItem = useCartStore((s) => s.addItem);

  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants]);
  const colors = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const v of variants) map.set(v.color, v.colorHex);
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0]?.name ?? null);
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.size === size && v.color === color) ?? null;
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;

  const productUrl = typeof window !== "undefined" ? window.location.href : `/product/${slug}`;
  const whatsappHref = buildWhatsAppLink(productInquiryMessage(title, productUrl), whatsappNumber);

  function handleAddToCart() {
    if (!selectedVariant || outOfStock) return;
    addItem({
      productId,
      variantId: selectedVariant.id,
      slug,
      title,
      image,
      size: selectedVariant.size,
      color: selectedVariant.color,
      price,
      quantity: 1,
      stock: selectedVariant.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-6">
      <p className="text-2xl font-medium text-brand-600">{money(price)}</p>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={cn(
                "rounded border border-border px-4 py-2 text-sm",
                size === s && "border-brand-500 bg-brand-500 text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Color
        </p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.name)}
              title={c.name}
              className={cn(
                "h-8 w-8 rounded-full border-2",
                color === c.name ? "border-brand-500" : "border-border"
              )}
              style={{ backgroundColor: c.hex ?? "#ccc" }}
            />
          ))}
        </div>
      </div>

      {selectedVariant &&
        (outOfStock ? (
          <p className="text-sm text-rose">Out of stock in this size/color</p>
        ) : (
          (() => {
            const stock = stockDisplay(
              { showInventoryCount, lowStockThreshold, lowStockBadgeText },
              selectedVariant.stock
            );
            return stock ? (
              <p className={cn("text-sm", stock.urgent ? "font-medium text-amber" : "text-green")}>{stock.label}</p>
            ) : null;
          })()
        ))}

      <div ref={buyRowRef} className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || outOfStock}
          className="flex-1 rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> {addedToCartLabel}
            </span>
          ) : (
            addToCartLabel
          )}
        </button>
        <button
          onClick={() => {
            handleAddToCart();
            router.push("/checkout");
          }}
          disabled={!selectedVariant || outOfStock}
          className="flex-1 rounded-full border border-brand-500 px-8 py-3 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buyNowLabel}
        </button>
      </div>

      {/*
        The buy bar that follows the page.
 
        Shown only once the real buttons have scrolled away, and hidden again
        the moment they are back — a bar duplicating a button three inches
        below it is clutter, not help. It is the same handler and the same
        disabled rule as the button above, not a second way to buy that could
        drift from the first.
      */}
      {stickyBuyBar && buyRowGone && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[var(--shp-surface,#fff)]/95 px-4 py-3 backdrop-blur lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-soft">{title}</p>
              <p className="text-sm font-medium text-ink">{money(price)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || outOfStock}
              className="shrink-0 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {added ? addedToCartLabel : addToCartLabel}
            </button>
          </div>
        </div>
      )}

      {whatsappOrderButton && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full border border-[#25D366] px-8 py-3 text-sm font-medium text-[#128C4A] transition-colors hover:bg-[#25D366]/10 active:bg-[#25D366]/20"
        >
          {orderViaWhatsAppLabel}
        </a>
      )}
    </div>
  );
}
