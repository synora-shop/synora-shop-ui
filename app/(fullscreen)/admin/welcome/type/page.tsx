import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS, themesFor } from "@/lib/themes/registry";
import { chooseBusinessType } from "@/app/(fullscreen)/admin/welcome/actions";

export const dynamic = "force-dynamic";

/** What each kind of business gets, in the merchant's terms rather than ours. */
const BLURB: Record<string, string> = {
  ecommerce: "Products, a cart and checkout.",
  blog: "Posts, written and published by you.",
  restaurant: "A menu, your hours and where to find you.",
};

export default function ChooseTypePage() {
  return (
    <div className="rise rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Step 1 of 3</p>
      <h1 className="rise rise-1 mt-4 text-3xl font-semibold sm:text-4xl">What are you making?</h1>
      <p className="rise rise-2 mt-3 text-sm text-white/70">
        This decides what your dashboard shows and which designs you can pick from. You can
        change it whenever you like, and switching back leaves everything as you had it.
      </p>

      <div className="rise rise-3 mt-8 grid gap-3">
        {BUSINESS_TYPES.map((type) => (
          <form key={type} action={chooseBusinessType.bind(null, type)}>
            <button className="lift group flex w-full items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-left transition-colors hover:border-white/40 hover:bg-white/15">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{BUSINESS_TYPE_LABELS[type]}</span>
                <span className="mt-0.5 block text-sm text-white/60">{BLURB[type]}</span>
              </span>
              <span className="flex-shrink-0 text-xs text-white/40">
                {themesFor(type).length} designs
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
