import { changeBusinessType } from "@/app/admin/settings/business-type-actions";
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
export function BusinessTypeForm({ current }: { current: BusinessType }) {
  return (
    <section className="max-w-xl rounded-xl border border-border bg-surface p-5">
      <h2 className="font-serif text-lg font-semibold">What you sell</h2>
      <p className="mt-1 text-sm text-ink-soft">
        This decides what your dashboard shows and which designs you can pick from.
      </p>

      <div className="mt-4 space-y-2">
        {BUSINESS_TYPES.map((type) => {
          const active = type === current;
          return (
            <form key={type} action={changeBusinessType.bind(null, type)}>
              <button
                disabled={active}
                className={
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors " +
                  (active
                    ? "border-brand-500 bg-brand-50"
                    : "border-border hover:border-ink-faint hover:bg-subtle")
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

      <p className="mt-4 text-xs text-ink-faint">
        Nothing is deleted when you switch. Your pages, design and colours are kept for each
        kind separately, so switching back brings your old storefront straight back. Products,
        posts and orders are always kept.
      </p>
    </section>
  );
}
