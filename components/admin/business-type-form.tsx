import Link from "next/link";
import { PauseCircle } from "lucide-react";
import { changeBusinessType } from "@/app/admin/settings/business-type-actions";
import { typeSwitchGate, type ShopStatusName } from "@/lib/store-type-switch";
import { Fieldset } from "@/components/ui/primitives";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  themesFor,
  type BusinessType,
} from "@/lib/themes/registry";

/** What changes when you switch, in the merchant's terms. */
const EFFECT: Record<BusinessType, string> = {
  ecommerce: "Products, a cart and checkout.",
  blog: "Posts, written and published by you.",
  restaurant: "A menu, your hours and where to find you.",
};

/**
 * Changing what kind of business a shop is.
 *
 * The reassurance is the point of this screen. A merchant will not press a
 * button that might delete their shop, and this one cannot: the previous
 * storefront is kept and comes back whole on switching back. Saying so plainly
 * is what makes the feature usable rather than frightening.
 */
export function BusinessTypeForm({
  current,
  status,
}: {
  current: BusinessType;
  /** Whether the store is open. An open store cannot change what it sells. */
  status: ShopStatusName;
}) {
  const gate = typeSwitchGate(status);

  return (
    <Fieldset
      title="What you sell"
      description="This decides what your dashboard shows and which designs you can pick from. Nothing is deleted when you switch: your pages, design and colours are kept for each kind separately, so switching back brings your old storefront straight back. Products, posts and orders are always kept."
    >
      {/* The same rule as the top bar's, said the same way. A control that is
          offered here and refused there is a bug the merchant finds. */}
      {!gate.allowed && (
        <p className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber-bg px-3.5 py-3 text-sm leading-snug text-ink">
          <PauseCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber" aria-hidden />
          {gate.reason}
          {gate.canPause && (
            <>
              {" "}
              <Link
                href="/admin/theme#opening-and-closing"
                className="font-medium underline underline-offset-2"
              >
                Pause it from Themes
              </Link>
              .
            </>
          )}
        </p>
      )}

      <div className="space-y-1.5">
        {BUSINESS_TYPES.map((type) => {
          const active = type === current;
          return (
            <form key={type} action={changeBusinessType.bind(null, type)}>
              <button
                disabled={active || !gate.allowed}
                className={
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors " +
                  (active
                    ? "border-brand-500 bg-brand-50"
                    : gate.allowed
                      ? "border-border hover:border-ink-faint hover:bg-subtle"
                      : "border-border opacity-60")
                }
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{BUSINESS_TYPE_LABELS[type]}</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">{EFFECT[type]}</span>
                </span>
                <span className="flex-shrink-0 text-xs text-ink-faint">
                  {active ? "Current" : `${themesFor(type).length} designs`}
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </Fieldset>
  );
}
