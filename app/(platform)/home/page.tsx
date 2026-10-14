import type { Metadata } from "next";
import { appUrl, PLATFORM_DOMAIN } from "@/lib/shop-context";
import { Hero, LightHeader } from "@/components/platform/lp-hero";
import { Comparison, Included, Marquee, Slabs } from "@/components/platform/lp-sections";
import { ShopPreviewClaim } from "@/components/platform/shop-preview-claim";
import { PlatformFooter } from "@/components/platform/platform-footer";
import { PauseOffscreen } from "@/components/platform/pause-offscreen";

export const metadata: Metadata = {
  // Absolute, not "/". A relative canonical resolves against metadataBase,
  // which points at the platform domain — so this page told Google its real
  // address was a host it is no longer served from. Naming it outright means
  // the canonical does not move when an environment variable does.
  alternates: { canonical: appUrl("/") },
};

/**
 * The front door — redrawn 14 October, in white and all five of Synora's
 * colours (#6666ff, #b7b9ff, #c8e7ff, #b8efd6, #0d0d50).
 *
 * Copy rule for this file: say what a shop owner gets, in the words they would
 * use, and stop. Not how it works. Every feature named is one the panel has.
 *
 * The page, top to bottom:
 *   the hero        "app bills" struck through as you arrive; a
 *                   phone with the pieces of a shop floating round it,
 *                   gathering in as you scroll
 *   the marquee     everything in it, in giant pills of every colour
 *   the slabs       what makes it different — four colour slabs that stack
 *                   as you scroll, each with a picture of it working
 *   included        everything else, as a keyboard: press a key, read it
 *   comparison      coming from somewhere else
 *   the ask         type a name, and a preview of the shop builds beside it
 *
 * It draws its own light header and the light colouring of the shared
 * footer (the dark ones stand aside on this page, see app/globals.css).
 */
export default function PlatformHome() {
  const signup = appUrl("/merchant/signup");
  const login = appUrl("/merchant/login");
  return (
    <div data-lp-light className="bg-white">
      <PauseOffscreen />
      <LightHeader signup={signup} login={login} />
      <Hero signup={signup} login={login} />
      <Marquee />
      <Slabs />
      <Included />
      <Comparison />

      {/* The ask: Synora's colours running together, and the address you would get. */}
      <section className="lp-later bg-white px-4 pb-16 sm:px-6 sm:pb-24">
        <div
          className="relative isolate mx-auto max-w-[78rem] overflow-hidden rounded-[2.75rem] px-6 py-16 sm:px-12 sm:py-20 lg:px-16"
          style={{ background: "linear-gradient(125deg, #6666ff 0%, #7375ff 50%, #9fa1ff 72%, #c8e7ff 90%, #b8efd6 100%)" }}
        >
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(60%_70%_at_50%_50%,#000,transparent)]" />
          <ShopPreviewClaim platformDomain={PLATFORM_DOMAIN} signupHref={signup} />
        </div>
      </section>
      <PlatformFooter tone="light" />
    </div>
  );
}
