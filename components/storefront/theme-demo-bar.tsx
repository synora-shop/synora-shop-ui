import { SynoraAppMark } from "@/components/ui/synora-marks";
import { THEME_STORE_ROOT, THEME_STORE_SLUGS } from "@/lib/themes/demo";

/**
 * Synora's own bar across the top of a theme demo.
 *
 * A theme demo is a complete, believable shop, and that is the problem it
 * creates: somebody arriving from a search has no way to know the goods are
 * ours and the shop is not real. The bar is the answer, and it is the same
 * answer every theme store gives — it says whose page this is, which theme is
 * being shown, that the products are examples, and offers the one thing the
 * page is for.
 *
 * Rendered **outside** StoreBaseProvider on purpose. Its links belong to the
 * platform — the other themes, the sign-up — and must not be prefixed into the
 * demo the way a storefront link is.
 *
 * Its colours are its own rather than the theme's. It is chrome sitting on top
 * of somebody's design, so it has to read as separate from whatever is beneath
 * it, and a bar that borrowed the theme's palette would read as part of the
 * shop — which is the one thing it exists to deny.
 */
export function ThemeDemoBar({ themeName, slug }: { themeName: string; slug: string }) {
  const others = Object.keys(THEME_STORE_SLUGS).filter((s) => s !== slug);

  return (
    <div className="relative z-50 bg-[#0c0c4a] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-[13px] sm:px-6">
        <a
          href="https://app.synoradigitals.com/"
          className="flex flex-shrink-0 items-center gap-2 font-medium"
        >
          <SynoraAppMark className="h-4 w-auto" title="Synora App" />
        </a>

        <p className="min-w-0 flex-1 text-white/70">
          <span className="font-medium text-white">{themeName} demo.</span>{" "}
          {/* Said plainly, because the alternative is a visitor believing a
              shop exists. Everything on the page is ours. */}
          Every product and photograph here is an example.
        </p>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {others.map((other) => (
            <a
              key={other}
              href={`${THEME_STORE_ROOT}/${other}`}
              className="rounded-full border border-white/25 px-3 py-1 capitalize text-white/85 hover:border-white/50 hover:text-white"
            >
              {other}
            </a>
          ))}
          <a
            href="https://app.synoradigitals.com/merchant/signup"
            className="rounded-full bg-white px-3 py-1 font-medium text-[#0c0c4a]"
          >
            Use this theme
          </a>
        </div>
      </div>
    </div>
  );
}
