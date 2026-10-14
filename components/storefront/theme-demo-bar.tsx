import { SynoraAppMark } from "@/components/ui/synora-marks";
import { THEME_STORE_ROOT, THEME_STORE_SLUGS } from "@/lib/themes/demo";
import { appUrl } from "@/lib/shop-context";
import { ThemeAdd } from "@/components/platform/theme-add";

/**
 * Synora's own bar across the top of a theme demo.
 *
 * A theme demo is a complete, believable shop, and that is the problem it
 * creates: somebody arriving from a search has no way to know the goods are
 * ours and the shop is not real. The bar is the answer, and it is the same
 * answer every theme store gives — it says whose page this is, which theme is
 * being shown, that the products are examples, and offers the one thing the
 * page is for: since 14 October, Log in / Sign up free for a visitor, and for
 * someone signed in their avatar and "Add to my store" (components/platform/
 * theme-add.tsx), with a way back to the whole Theme Store.
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
export function ThemeDemoBar({ themeName, themeKey, slug }: { themeName: string; themeKey: string; slug: string }) {
  const others = Object.keys(THEME_STORE_SLUGS).filter((s) => s !== slug);

  return (
    <div className="relative z-50 bg-[#0c0c4a] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-[13px] sm:px-6">
        <a href={appUrl("/")} className="flex flex-shrink-0 items-center gap-2 font-medium">
          <SynoraAppMark className="h-4 w-auto" title="Synora App" />
        </a>

        <p className="min-w-0 flex-1 text-white/70">
          <a href={appUrl(THEME_STORE_ROOT)} className="font-medium text-white/85 underline-offset-4 hover:text-white hover:underline">
            Theme Store
          </a>
          <span className="mx-1.5 text-white/35">/</span>
          <span className="font-semibold text-white">{themeName} demo.</span>{" "}
          {/* Said plainly, because the alternative is a visitor believing a
              shop exists. Everything on the page is ours. */}
          <span className="hidden md:inline">Every product and photograph here is an example.</span>
        </p>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {others.map((other) => (
            <a
              key={other}
              href={appUrl(`${THEME_STORE_ROOT}/${other}`)}
              className="hidden rounded-full border border-white/25 px-3 py-1 capitalize text-white/85 hover:border-white/50 hover:text-white sm:inline-block"
            >
              {other}
            </a>
          ))}
          {/* Log in and sign up for a visitor; for someone signed in, their
              avatar and the way to add this theme to their own store. */}
          <ThemeAdd themeKey={themeKey} name={themeName} login={appUrl("/merchant/login")} signup={appUrl("/merchant/signup")} tone="dark" withAvatar />
        </div>
      </div>
    </div>
  );
}
