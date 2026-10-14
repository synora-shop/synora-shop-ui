import type { Metadata } from "next";
import Image from "next/image";
import { Check, Eye, LayoutTemplate } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { THEMES } from "@/lib/themes/registry";
import { THEME_STORE_ROOT, THEME_STORE_SLUGS } from "@/lib/themes/demo";
import { LightPage } from "@/components/platform/light-page";
import { ThemeAdd } from "@/components/platform/theme-add";

export const metadata: Metadata = {
  title: "Theme Store",
  description: "Every Synora App theme, included. See each as a complete shop, then add it to yours.",
  alternates: { canonical: appUrl(THEME_STORE_ROOT) },
};

/**
 * The Theme Store (14 October): every theme, each shown the way a merchant
 * would meet it, on a laptop and a phone at once, from its real home page
 * (public/platform/theme-*.jpg, captured from /kite and /loom).
 *
 * Each theme sits on its own ground, dark for Kite and sage for Loom, so the
 * page reads as a row of rooms rather than a list. Three ways on from each:
 * the live demo (a complete shop at /theme-store/<slug>), and "Add to my
 * store", which for someone signed in opens their Themes page in a new tab
 * with the theme waiting, and for a visitor offers sign-up first.
 *
 * What each theme is like is said in words a shop owner uses; the facts come
 * from the registry (lib/themes/registry.ts).
 */
const LOOK: Record<string, { ground: string; text: string; soft: string; chip: string; traits: string[]; bestFor: string }> = {
  kite: {
    ground: "bg-[#0b0b0f]",
    text: "text-white",
    soft: "text-white/65",
    chip: "bg-white/10 text-white/85",
    traits: ["Dark and editorial", "Serif headlines", "Full-bleed photography"],
    bestFor: "A fashion label, a lookbook, anything that sells on mood.",
  },
  loom: {
    ground: "bg-[linear-gradient(160deg,#f1f5ee_0%,#e8efe3_100%)]",
    text: "text-[#0d0d50]",
    soft: "text-[#0d0d50]/65",
    chip: "bg-white/80 text-[#0d0d50]/80",
    traits: ["Light and roomy", "Large imagery", "Calm, rounded cards"],
    bestFor: "A first shop, or any goods that should speak for themselves.",
  },
};

export default function ThemeStorePage() {
  const themes = Object.entries(THEME_STORE_SLUGS).map(([slug, key]) => ({ slug, theme: THEMES[key] })).filter((t) => t.theme);
  const login = appUrl("/merchant/login");
  const signup = appUrl("/merchant/signup");

  return (
    <LightPage>
      {/* The band. */}
      <section className="relative isolate overflow-hidden bg-[#0d0d50] px-5 pb-12 pt-32 text-white sm:pt-36">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_85%_0%,rgba(102,102,255,0.55),rgba(13,13,80,0)_70%),radial-gradient(40%_60%_at_10%_100%,rgba(184,239,214,0.18),rgba(13,13,80,0)_70%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:22px_22px]" />
        <div className="mx-auto grid max-w-[78rem] items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#b7b9ff]">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10">
                <LayoutTemplate className="h-4 w-4" />
              </span>
              Theme Store
            </p>
            <h1 className="mt-4 text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[3.4rem]">Pick how your shop looks.</h1>
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-white/70">Every theme is included. Walk through each as a complete shop, then add it to yours and make it your own.</p>
          </div>
          <ul className="flex flex-wrap gap-2 text-[13.5px] font-medium">
            {["All themes included", "Works on every phone", "Try before it goes live"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-white/85">
                <Check className="h-4 w-4 text-[#b8efd6]" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {themes.map(({ slug, theme }, i) => {
        const look = LOOK[slug] ?? LOOK.loom;
        const flip = i % 2 === 1;
        return (
          <section key={slug} id={slug} aria-labelledby={`${slug}-name`} className={`scroll-mt-24 px-5 py-16 sm:py-20 ${look.ground}`}>
            <div className={`mx-auto grid max-w-[78rem] items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
              {/* The theme on a laptop and a phone. */}
              <div className="relative pb-10 pr-8 sm:pr-14">
                <div className="overflow-hidden rounded-[14px] bg-[#1b1b22] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] ring-1 ring-black/20">
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#4fd1a5]" />
                    <span className="ml-3 truncate rounded-md bg-white/10 px-3 py-0.5 font-mono text-[11px] text-white/55">yourshop.app.synoradigitals.com</span>
                  </div>
                  <Image src={`/platform/theme-${slug}.jpg`} alt={`${theme.name} on a laptop`} width={1440} height={1000} className="block h-auto w-full" sizes="(min-width: 1024px) 680px, 100vw" />
                </div>
                <div className="absolute bottom-0 right-0 w-[27%] min-w-[96px] overflow-hidden rounded-[22px] border-[5px] border-[#1b1b22] bg-[#1b1b22] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)]">
                  <Image src={`/platform/theme-${slug}-phone.jpg`} alt={`${theme.name} on a phone`} width={780} height={1688} className="block h-auto w-full rounded-[17px]" sizes="200px" />
                </div>
              </div>

              {/* What it is. */}
              <div className={look.text}>
                <p className={`text-[13px] font-bold uppercase tracking-[0.14em] ${look.soft}`}>Theme {String(i + 1).padStart(2, "0")}</p>
                <h2 id={`${slug}-name`} className="mt-2 text-[3rem] font-semibold leading-none tracking-[-0.045em] sm:text-[4rem]">
                  {theme.name}
                </h2>
                <p className={`mt-4 max-w-md text-[18px] leading-relaxed ${look.soft}`}>{theme.description}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {look.traits.map((t) => (
                    <li key={t} className={`rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold ${look.chip}`}>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className={`mt-6 max-w-md text-[15.5px] leading-relaxed ${look.soft}`}>
                  <span className={`font-semibold ${look.text}`}>Best for: </span>
                  {look.bestFor}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <ThemeAdd themeKey={theme.key} name={theme.name} login={login} signup={signup} onDark={slug === "kite"} />
                  <a
                    href={`${THEME_STORE_ROOT}/${slug}`}
                    className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold ring-1 transition-colors ${slug === "kite" ? "text-white ring-white/30 hover:bg-white/10" : "bg-white/70 text-[#0d0d50] ring-[#0d0d50]/15 hover:bg-white"}`}
                  >
                    <Eye className="h-4 w-4" /> View the live demo
                  </a>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </LightPage>
  );
}
