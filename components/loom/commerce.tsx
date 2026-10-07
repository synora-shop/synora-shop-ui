"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { LOOM_RULE } from "@/components/loom/primitives";
import { LoomHeartFill, LoomPhoneIcon, LoomRefreshIcon } from "@/components/loom/icons";
import { T } from "@/components/loom/type";

/**
 * The parts the shopping pages share — product, cart, checkout, account.
 * None of them is in the kit; each is assembled from something that is.
 */

/**
 * Quantity: a pill outlined #dddddd, the Trending chips' own outline, with
 * the count in Body 4 between a minus and a plus. 140 wide on the product
 * page, narrower in a cart row — the call site says.
 */
export function LoomStepper({
  value,
  onChange,
  min = 1,
  className,
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex h-[max(calc(50*var(--u)),40px)] w-[calc(140*var(--u))] min-w-[112px] shrink-0 items-center justify-between rounded-[200px] border border-[#dddddd] px-[calc(8*var(--u))]",
        className
      )}
    >
      <button
        type="button"
        aria-label="One fewer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(T.body4, "flex h-full w-[calc(36*var(--u))] min-w-[28px] items-center justify-center text-[#121212] disabled:text-[#121212]/30")}
      >
        −
      </button>
      <span className={cn(T.body4, "text-[#121212]")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="One more"
        onClick={() => onChange(value + 1)}
        className={cn(T.body4, "flex h-full w-[calc(36*var(--u))] min-w-[28px] items-center justify-center text-[#121212]")}
      >
        +
      </button>
    </div>
  );
}

/**
 * The Service section's three promises, a line each, in the header's
 * `#2e3a59` — the kit's only named glyph colour.
 */
export function LoomPromises({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-[calc(16*var(--u))]", className)}>
      {[
        { Icon: LoomHeartFill, text: "Packed with care, like a birthday gift" },
        { Icon: LoomPhoneIcon, text: "Questions answered, any time you ask" },
        { Icon: LoomRefreshIcon, text: "Free returns within 30 days" },
      ].map(({ Icon, text }) => (
        <li key={text} className={cn(T.body6, "flex items-center gap-[calc(12*var(--u))] text-[#121212]/80")}>
          <Icon className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)] shrink-0 text-[#2e3a59]" />
          {text}
        </li>
      ))}
    </ul>
  );
}

/**
 * A text field. The kit's only fields are the header's search (34 tall,
 * outlined #e3e3e3, a pill) and the footer's newsletter (45 tall, a pill). A
 * form field here is that search pill grown to the buttons' 50, so a field
 * and the button beside it stand the same height.
 *
 * It always has a visible label — Single text 2, uppercase, at 80%, the
 * product page's option labels — because a placeholder disappears as soon as
 * somebody types. An error turns the outline the kit's one accent, `#f15353`,
 * and says what is wrong under the field in words. The words are a step
 * darker, `#cc3a3a`: the kit's red is 3.4:1 on white, enough for an outline
 * and too faint to read as text (4.5 is the floor; this is 4.96). The same
 * call the theme made for the kit's grey.
 */
export function LoomField({
  label,
  error,
  className,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-[calc(8*var(--u))]", className)}>
      <label htmlFor={id} className={cn(T.single2, "uppercase text-[#121212]/80")}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : undefined}
        {...input}
        className={cn(
          T.body6,
          "h-[max(calc(50*var(--u)),40px)] w-full min-w-0 rounded-[2000px] border bg-transparent px-[calc(20*var(--u))] text-[#121212] outline-none placeholder:text-[#121212]/50 focus:border-[#121212]",
          error ? "border-[#f15353]" : "border-[#e3e3e3]"
        )}
      />
      {error && (
        <p id={`${id}-e`} role="alert" className={cn(T.body6, "text-[#cc3a3a]")}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Money, the way the kit prints it: "$125". */
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * Subtotal, delivery and total, on the section rule. Labels in Body 6 at 80%,
 * figures right-aligned; the total in Heading 4, the size the product page
 * prints its price in, because it is the one number the page is about.
 */
export function LoomTotals({ subtotal, delivery, className }: { subtotal: number; delivery: number | null; className?: string }) {
  const total = subtotal + (delivery ?? 0);
  return (
    <dl className={cn("flex flex-col gap-[calc(12*var(--u))] pt-[calc(24*var(--u))]", LOOM_RULE, className)}>
      <Row label="Subtotal" value={money(subtotal)} />
      <Row label="Delivery" value={delivery === null ? "Worked out at checkout" : delivery === 0 ? "Free" : money(delivery)} />
      <div className={cn("mt-[calc(12*var(--u))] flex items-baseline justify-between pt-[calc(24*var(--u))]", LOOM_RULE)}>
        <dt className={cn(T.body3, "text-[#121212]")}>Total</dt>
        <dd data-m="total" className={cn(T.h4, "text-[#121212]")}>
          {money(total)}
        </dd>
      </div>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-[calc(16*var(--u))]">
      <dt className={cn(T.body6, "text-[#121212]/80")}>{label}</dt>
      <dd className={cn(T.body6, "text-right text-[#121212]")}>{value}</dd>
    </div>
  );
}

/** Free delivery from $200 — the threshold the cart and checkout both use. */
export const FREE_DELIVERY_FROM = 200;
