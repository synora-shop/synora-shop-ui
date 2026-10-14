import type { Viewport } from "next";
import Link from "next/link";
import { appUrl } from "@/lib/shop-context";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { PlatformFooter } from "@/components/platform/platform-footer";

/**
 * The product's own site, at app.synoradigitals.com.
 *
 * Not a storefront and not the admin — the front door: what this is, why it
 * exists, and the way in. It has its own chrome because a merchant's theme has
 * no business styling our marketing, and because none of the storefront's
 * per-shop data (menus, site text, fonts) means anything here.
 *
 * Both doors lead to app.synoradigitals.com, absolutely rather than relatively.
 * The two hosts deliberately do not share a session cookie — scoping one to
 * .synoradigitals.com would hand it to every merchant storefront and to the
 * automation business, which is a different product on the same name. The
 * consequence is that this site cannot tell whether you are signed in, so the
 * header always offers to sign you in rather than guessing.
 */
/**
 * What colour a phone paints around the status bar on this site.
 *
 * Declared here rather than left to the manifest, because the manifest belongs
 * to the panel — its start_url is /admin and its colour is the panel's ground.
 * This site opens and closes on night, so a light strip above it reads as a
 * different page bolted on top.
 */
export const viewport: Viewport = {
  themeColor: "#0c0c1e",
};

export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="platform-shell flex min-h-dvh flex-col bg-night font-sans text-ink">
      <header data-platform-header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex max-w-[78rem] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-night/70 px-5 py-3 text-white backdrop-blur-xl">
          <Link
            href="/"
            className="rounded text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-night"
          >
            <SynoraAppMark />
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <a
              href={appUrl("/merchant/login")}
              className="rounded-pill px-3 py-2 font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Log in
            </a>
            <a
              href={appUrl("/merchant/signup")}
              className="rounded-pill bg-white px-4 py-2 font-medium text-night transition-colors hover:bg-white/90"
            >
              Start free
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* The footer, with somewhere to go.
          
          It was a mark and one line, in the panel's dark ink — which had been
          readable while the page's ground was light and stopped being so the
          moment the shell went dark for the floating header. On a page that
          closes dark it also read as having run out rather than finished.
          
          Every destination is real. There are two pages on this host, so the
          rest point at the application and at the company site that owns the
          name. */}
      <PlatformFooter tone="dark" data-platform-footer />
    </div>
  );
}
