import type { ReactNode } from "react";
import { appUrl } from "@/lib/shop-context";
import { LightHeader } from "@/components/platform/lp-hero";
import { PlatformFooter } from "@/components/platform/platform-footer";

/**
 * The front page's frame for the site's other pages (documentation, release
 * notes): its light header, a white page, the light footer. `data-lp-light`
 * is what makes the shared dark header and footer stand aside
 * (app/globals.css), exactly as on the front page.
 */
export function LightPage({ children }: { children: ReactNode }) {
  return (
    <div data-lp-light className="bg-white text-[#0d0d50]">
      <LightHeader signup={appUrl("/merchant/signup")} login={appUrl("/merchant/login")} />
      {children}
      <PlatformFooter tone="light" />
    </div>
  );
}

/**
 * The top of such a page: the front page's colour washes and dot grid, a
 * small pill, a big headline and a line under it.
 */
export function LightPageHero({
  pill,
  title,
  lead,
  children,
}: {
  pill: string;
  title: ReactNode;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-14 pt-36 sm:pb-20 sm:pt-44">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_10%_0%,rgba(183,185,255,0.45),rgba(255,255,255,0)_70%),radial-gradient(45%_55%_at_95%_10%,rgba(200,231,255,0.6),rgba(255,255,255,0)_70%),radial-gradient(40%_40%_at_60%_100%,rgba(184,239,214,0.35),rgba(255,255,255,0)_70%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(13,13,80,0.07)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(70%_80%_at_50%_30%,#000,transparent)]" />
      <div className="mx-auto max-w-[78rem]">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#0d0d50]/10 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#0d0d50]/75">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6666ff]" />
          {pill}
        </p>
        <h1 className="mt-6 max-w-4xl text-[2.8rem] font-semibold leading-[1] tracking-[-0.045em] sm:text-[4.6rem]">{title}</h1>
        <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-[#0d0d50]/65 sm:text-lg">{lead}</p>
        {children}
      </div>
    </section>
  );
}

/** The mint highlighter stroke the front page puts under "Pakistan". */
export function Highlight({ children }: { children: ReactNode }) {
  return <span className="bg-[linear-gradient(transparent_62%,#b8efd6_62%,#b8efd6_90%,transparent_90%)] px-1">{children}</span>;
}
