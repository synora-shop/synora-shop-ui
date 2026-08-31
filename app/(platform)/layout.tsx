import Link from "next/link";
import { appUrl } from "@/lib/shop-context";
import { Wordmark } from "@/components/ui/wordmark";

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
    <div className="flex min-h-dvh flex-col bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link
            href="/"
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4"
          >
            <Wordmark size="md" maker="by synoradigitals" />
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <a
              href={appUrl("/merchant/login")}
              className="rounded-lg px-3 py-2 font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
            >
              Log in
            </a>
            <a
              href={appUrl("/merchant/signup")}
              className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-700"
            >
              Start free
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-ink-faint">
          <Wordmark size="sm" />
          <p>Built for people who sell things.</p>
        </div>
      </footer>
    </div>
  );
}
