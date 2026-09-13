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
            </div>

            <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:gap-x-20">
              <FooterGroup title="The product">
                <FooterLink href="/#showcase">What it does</FooterLink>
                <FooterLink href={appUrl("/merchant/signup")}>Create your shop</FooterLink>
                <FooterLink href={appUrl("/merchant/login")}>Log in</FooterLink>
              </FooterGroup>

              <FooterGroup title="Synora Digitals">
                <FooterLink href="https://synoradigitals.com">The company</FooterLink>
                <FooterLink href="https://synoradigitals.com/about">About</FooterLink>
                <FooterLink href="https://synoradigitals.com/policies">Policies</FooterLink>
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
