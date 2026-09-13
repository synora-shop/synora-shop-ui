import type { Viewport } from "next";
import Link from "next/link";
import { appUrl } from "@/lib/shop-context";
import { SynoraAppMark } from "@/components/ui/synora-marks";

/**
 * The product's own site, at shop.synoradigitals.com.
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
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
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
      <footer className="border-t border-white/10 bg-night">
        <div className="mx-auto max-w-[78rem] px-5 py-14">
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <SynoraAppMark className="text-white" />
              <p className="mt-4 text-sm leading-relaxed text-white/45">
                An online shop that argues with you before you make the expensive mistake, not
                after.
              </p>

              {/* The company that makes it. On its own, in the brand colour,
                  with a slow pulse on the light around it — visible at the
                  edge of vision without competing with anything being read. */}
              <a
                href="https://synoradigitals.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Synora Digitals"
                className="mt-7 inline-flex items-center gap-2.5 text-xs text-white/40 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-night"
              >
                <svg viewBox="0 0 48 48" className="sd-mark h-7 w-7 flex-shrink-0" aria-hidden>
                  <defs>
                    {/* The mark's own outline, used to clip the light — so the
                        band travels through the letterform and not across the
                        box around it. */}
                    <clipPath id="sdClip">
                      <path d="M9.47,32.8c1.68-4.8,7.36-21.1,19.47-24.12.62-.16,1.48-.33,2.54-.42.62-.05.92.74.41,1.09h0c-1.69,1.17-3.9,2.73-6.44,5.23-3.81,3.75-6.54,6.93-6.67,7.08-2.39,2.8-5.48,6.59-8.96,11.32-.13.18-.43.04-.35-.18h0ZM15.02,38.24c4.9-1.65,21.52-7.21,24.6-19.09.16-.61.34-1.45.43-2.49.05-.61-.75-.9-1.11-.4h0c-1.19,1.66-2.78,3.82-5.33,6.32-3.82,3.73-7.07,6.41-7.22,6.54-2.86,2.35-6.72,5.38-11.54,8.78-.19.13-.04.42.18.35h0ZM37.67,10.6c-1.21-1.19-5.11.7-10.04,5.53-9.47,9.28-15.77,17.78-18.46,21.65-.34.5.27,1.09.77.76,3.95-2.64,12.62-8.82,22.08-18.1,4.93-4.83,6.86-8.65,5.64-9.84ZM11.62,22.92c1.44-3.28,3.7-8.26,8.61-12.25.6-.49,1.37-1.07,2.33-1.67.59-.38.2-1.27-.49-1.11-2.65.62-5.16,1.94-7.22,3.97-.58.57-1.11,1.18-1.58,1.82-1.82,2.46-2.78,5.34-2.88,8.25-.01.44,0,.89.02,1.33.03.54.79.67,1.01.16.07-.16.14-.32.21-.49ZM40.44,25.9c.16-.67-.75-1.06-1.13-.48-.62.93-1.21,1.69-1.71,2.28-4.07,4.82-9.16,7.03-12.5,8.44-.17.07-.34.14-.5.21-.51.21-.39.96.17.99.45.02.91.03,1.36.02,2.96-.1,5.9-1.04,8.41-2.82,0,0,0,0,0,0,.65-.46,1.27-.98,1.85-1.55,2.07-2.03,3.41-4.49,4.05-7.08Z" />
                    </clipPath>
                    <linearGradient id="sdSheen" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="45%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M9.47,32.8c1.68-4.8,7.36-21.1,19.47-24.12.62-.16,1.48-.33,2.54-.42.62-.05.92.74.41,1.09h0c-1.69,1.17-3.9,2.73-6.44,5.23-3.81,3.75-6.54,6.93-6.67,7.08-2.39,2.8-5.48,6.59-8.96,11.32-.13.18-.43.04-.35-.18h0ZM15.02,38.24c4.9-1.65,21.52-7.21,24.6-19.09.16-.61.34-1.45.43-2.49.05-.61-.75-.9-1.11-.4h0c-1.19,1.66-2.78,3.82-5.33,6.32-3.82,3.73-7.07,6.41-7.22,6.54-2.86,2.35-6.72,5.38-11.54,8.78-.19.13-.04.42.18.35h0ZM37.67,10.6c-1.21-1.19-5.11.7-10.04,5.53-9.47,9.28-15.77,17.78-18.46,21.65-.34.5.27,1.09.77.76,3.95-2.64,12.62-8.82,22.08-18.1,4.93-4.83,6.86-8.65,5.64-9.84ZM11.62,22.92c1.44-3.28,3.7-8.26,8.61-12.25.6-.49,1.37-1.07,2.33-1.67.59-.38.2-1.27-.49-1.11-2.65.62-5.16,1.94-7.22,3.97-.58.57-1.11,1.18-1.58,1.82-1.82,2.46-2.78,5.34-2.88,8.25-.01.44,0,.89.02,1.33.03.54.79.67,1.01.16.07-.16.14-.32.21-.49ZM40.44,25.9c.16-.67-.75-1.06-1.13-.48-.62.93-1.21,1.69-1.71,2.28-4.07,4.82-9.16,7.03-12.5,8.44-.17.07-.34.14-.5.21-.51.21-.39.96.17.99.45.02.91.03,1.36.02,2.96-.1,5.9-1.04,8.41-2.82,0,0,0,0,0,0,.65-.46,1.27-.98,1.85-1.55,2.07-2.03,3.41-4.49,4.05-7.08Z" fill="#6666ff" />
                  <g clipPath="url(#sdClip)">
                    <rect className="sd-sheen" x="0" y="-10" width="22" height="68" fill="url(#sdSheen)" />
                  </g>
                </svg>
                <span>A Synora Digitals product</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:gap-x-20">
              <FooterGroup title="The product">
                <FooterLink href="/#showcase">What it does</FooterLink>
                <FooterLink href={appUrl("/merchant/signup")}>Create your shop</FooterLink>
                <FooterLink href={appUrl("/merchant/login")}>Log in</FooterLink>
              </FooterGroup>

              {/* The company's own pages left this column: they are one click
                  away through the mark above, and a merchant standing in a
                  footer looking for help is not looking for our About page. */}
              <FooterGroup title="Help">
                <FooterLink href="/documentation">Documentation</FooterLink>
                <FooterLink href="/documentation">Release notes</FooterLink>
                <FooterLink href="/documentation">Known issues</FooterLink>
              </FooterGroup>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Synora Digitals. All rights reserved.</p>
            <p>Built for people who sell things.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] font-medium uppercase tracking-[0.09em] text-white/40">{title}</h2>
      <ul className="mt-3.5 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-night"
      >
        {children}
      </a>
    </li>
  );
}
