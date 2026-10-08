"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoomButton } from "@/components/loom/primitives";
import { LoomField } from "@/components/loom/commerce";
import { T } from "@/components/loom/type";
import type { LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";
import { kitLookUpOrder } from "@/lib/themes/kit-actions";

/**
 * An order's page opened without its link's key, by someone not signed in as
 * the customer who placed it. Shopify asks for the order number and the email
 * or phone it was placed with; so does this, and a match goes to the link.
 *
 * The sign-in page's column — 411, a Heading 1 over the fields, the kit's
 * button — because it is the same kind of moment: say who you are.
 */
export function LoomOrderLookup({ ctx, id }: { ctx: LoomContext; id: string }) {
  const [number, setNumber] = useState(id);
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="flex justify-center px-[calc(16*var(--u))] pb-[calc(80*var(--u))] pt-[calc(16*var(--u))] md:pb-[calc(120*var(--u))] md:pt-[calc(40*var(--u))]">
      <form
        noValidate
        data-m="order-lookup"
        onSubmit={(e) => {
          e.preventDefault();
          if (!number.trim() || !contact.trim()) {
            setError(tx(ctx, "order.lookupError"));
            return;
          }
          setBusy(true);
          setError(null);
          void kitLookUpOrder(number, contact).then((r) => {
            if (r.ok) {
              window.location.assign(r.href);
              return;
            }
            setError(r.error);
            setBusy(false);
          });
        }}
        className="flex w-full flex-col gap-[calc(16*var(--u))] md:w-[calc(411*var(--u))]"
      >
        <h1 className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
          {tx(ctx, "order.lookupHeading")}
        </h1>
        <p className={cn(T.body6, "pb-[calc(16*var(--u))] text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")}>
          {tx(ctx, "order.lookupText", { id })}
        </p>
        <LoomField label={tx(ctx, "order.lookupNumber")} value={number} onChange={(e) => setNumber(e.target.value)} />
        <LoomField
          label={tx(ctx, "order.lookupContact")}
          autoComplete="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          error={error ?? undefined}
        />
        <LoomButton type="submit" data-m="order-lookup-submit" className="mt-[calc(8*var(--u))] w-full min-w-0" disabled={busy}>
          {tx(ctx, "order.lookupButton")}
        </LoomButton>
      </form>
    </section>
  );
}
