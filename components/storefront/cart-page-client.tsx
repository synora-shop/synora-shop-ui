"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useCartStore } from "@/lib/cart-store";
import { formatPKR } from "@/lib/utils";

type Labels = {
  emptyHeading: string;
  continueShopping: string;
  heading: string;
  orderSummary: string;
  subtotal: string;
  shippingNote: string;
  proceedToCheckout: string;
};

export function CartPageClient({ labels }: { labels: Labels }) {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  if (items.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">{labels.emptyHeading}</h1>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
        >
          {labels.continueShopping}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="font-serif text-3xl font-semibold text-ink">{labels.heading}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 divide-y divide-border">
          {items.map((item) => (
            <SwipeRow
              key={item.key}
              actions={[
                {
                  key: "remove",
                  label: "Remove",
                  icon: Trash2,
                  tone: "danger",
                  onClick: () => removeItem(item.key),
                },
              ]}
            >
              <div className="flex gap-4 py-5">
                <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-brand-50">
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/product/${item.slug}`} className="text-sm font-medium text-ink hover:text-brand-600">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-ink-soft">
                      {item.size} · {item.color}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                        className="rounded border border-border p-1 transition-colors hover:border-brand-300 hover:bg-subtle active:bg-brand-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                        className="rounded border border-border p-1 transition-colors hover:border-brand-300 hover:bg-subtle active:bg-brand-100 disabled:pointer-events-none disabled:opacity-40"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-brand-600">
                      {formatPKR(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            </SwipeRow>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-white p-6 h-fit">
          <h2 className="font-serif text-lg font-semibold text-ink">{labels.orderSummary}</h2>
          <div className="mt-4 flex justify-between text-sm text-ink-soft">
            <span>{labels.subtotal}</span>
            <span>{formatPKR(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">{labels.shippingNote}</p>
          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-brand-500 px-8 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            {labels.proceedToCheckout}
          </Link>
        </div>
      </div>
    </Container>
  );
}
