"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { ktx } from "@/components/kite/text";
import { kitLookUpOrder } from "@/lib/themes/kit-actions";
import { KiteButton, KiteField, KitePage, KiteTitle } from "@/components/kite/ui";

/**
 * An order's page opened without its link's key by someone not signed in as
 * its customer: the order number and the email or phone it was placed with
 * (Shopify's way), a match going to the order. The sign-in page's column.
 */
export function KiteOrderLookup({ ctx, id }: { ctx: KiteContext; id: string }) {
  const [number, setNumber] = useState(id);
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = kt("sans", 14, 20);
  return (
    <KitePage k="order-lookup" className="flex justify-center">
      <form
        noValidate
        className="flex w-full flex-col gap-[calc(32*var(--u))] md:w-[calc(425*var(--u))] md:py-[calc(64*var(--u))]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!number.trim() || !contact.trim()) return setError(ktx(ctx, "order.lookupError"));
          setBusy(true);
          setError(null);
          void kitLookUpOrder(number, contact).then((r) => {
            if (r.ok) return window.location.assign(r.href);
            setError(r.error);
            setBusy(false);
          });
        }}
      >
        <div className="flex flex-col gap-[calc(8*var(--u))]">
          <KiteTitle>{ktx(ctx, "order.lookupHeading")}</KiteTitle>
          <p {...t} className={cn(t.className)}>{ktx(ctx, "order.lookupText", { id })}</p>
        </div>
        <KiteField label={ktx(ctx, "order.lookupNumber")} value={number} onChange={(e) => setNumber(e.target.value)} />
        <KiteField label={ktx(ctx, "order.lookupContact")} autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} error={error ?? undefined} />
        <KiteButton type="submit" disabled={busy} className="w-full">{ktx(ctx, "order.lookupButton")}</KiteButton>
      </form>
    </KitePage>
  );
}
