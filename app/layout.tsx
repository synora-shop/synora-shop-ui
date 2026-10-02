import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, DM_Mono, Inter, Cormorant_Garamond } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { NavProgress } from "@/components/ui/nav-progress";
import { ToastProvider } from "@/components/ui/toast";
import { appUrl } from "@/lib/shop-context";
import "./globals.css";

/**
 * DM Sans, the app's typeface, and DM Mono for the figures.
 *
 * It replaces IBM Plex, which was chosen here for its character and was fine —
 * the reason for moving is that the design files are drawn in this one, so the
 * panel and the drawings now measure the same.
 *
 * `weight: "variable"` is the whole variable font rather than a handful of cut
 * weights, which is one file for every weight instead of four files for four of
 * them. It also means a weight that was never packaged can no longer fall back
 * to a heavier one or get synthesised — the panel asks for 500 in 278 places
 * and 600 in 136, and both are now real.
 *
 * `axes: ["opsz"]` carries the optical size axis. The face is drawn differently
 * for small text than for large — wider spacing, more open apertures — and with
 * the axis present the browser picks the right drawing from the font-size on its
 * own. This panel runs from 13px labels to 30px headings, which is exactly the
 * range that axis exists for.
 *
 * Served from this app's own domain: next/font fetches at build time, so no
 * request leaves for a font CDN and nothing about a merchant's visit is told to
 * one.
 */
const sans = DM_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
});

// Every number this product shows — contrast ratios, pixel sizes, counts, hex
// values, addresses. Those are the readings on the dial and they should look
// like it. DM Mono rather than a leftover Plex: it is the same family's
// monospace, so a figure in a table and the label above it belong together.
const mono = DM_Mono({
  variable: "--font-mono-brand",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * The two typefaces a *merchant's storefront* can choose, as opposed to the
 * two above, which are this product's own.
 *
 * `FONT_STACKS` in lib/theme-tokens.ts has offered "Inter (clean sans)" and
 * "Cormorant Garamond (serif)" since it was written, as `var(--font-inter)`
 * and `var(--font-heading)` — and neither variable was defined anywhere in the
 * codebase. Both silently fell through to their fallback, so a merchant who
 * picked Inter got system-ui and one who picked Cormorant got Georgia. The
 * picker saved, showed the right label, and changed nothing. Kite asks for
 * Inter on both its heading and its body, so the one theme that was supposed
 * to prove the registry works has never rendered in the face it names.
 *
 * They must be declared on <html>, not on the storefront layout. The theme's
 * CSS is emitted as `:root{--font-sans:var(--font-inter),…}`, and a custom
 * property is substituted where it is *declared* — so with --font-inter set on
 * any element below <html>, :root would still resolve the fallback and the fix
 * would look applied while changing nothing. That is the same shape as the bug
 * itself.
 *
 * `preload: false` because the admin panel is the common case and wears
 * neither of them: the @font-face rules ship, and a browser fetches a font
 * file only when text actually uses it. Declaring the variable costs a
 * merchant's admin nothing.
 */
const storefrontSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  preload: false,
});

const storefrontSerif = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  // Variable, like the two above: one file covering 300–700 rather than five
  // static cuts. It matters more here than it looks — `headingWeight` is a
  // merchant-editable token with a 100–900 range, so any fixed set of cuts
  // leaves weights that get synthesised by the browser instead of drawn.
  weight: "variable",
  display: "swap",
  preload: false,
});

// The address relative metadata resolves against — og:image, og:url, and any
// canonical written as a path.
//
// Built from APP_HOST rather than read from NEXT_PUBLIC_SITE_URL, which is how
// it used to work and which quietly went wrong: that variable was set once, to
// `shop.synoradigitals.com`, and stayed pointing there after the product moved
// to one address. Nothing errored. The pages simply named a host they were no
// longer served from, in the metadata search engines read. Deriving it from
// the host setting the rest of the application already uses means it cannot
// drift again, and there is no second copy of the answer to keep in step.
//
// A merchant's storefront does not use this: app/(storefront)/layout.tsx sets
// its own metadataBase to that shop's canonical address.
const SITE_URL =
  process.env.NODE_ENV === "production"
    ? appUrl("/")
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
const DESCRIPTION =
  "Open an online store in minutes. Your own domain, your own team, and an app that stops you making the mistakes that cost sales.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "APP by Synora Digitals · commerce that catches your mistakes",
    template: "%s · APP",
  },
  description: DESCRIPTION,
  // Declared here rather than as app/icon.svg, and that is load-bearing. Next
  // gives a file convention priority over metadata, so while the icon lived at
  // the app root it won on *every* route — including a merchant's storefront,
  // whose layout sets its own. The favicon a merchant uploads would have been
  // stored, previewed, and then silently overridden by ours on the one screen
  // it exists for. Config-based icons inherit and override down the tree the
  // way the rest of the metadata does.
  icons: {
    // Two, and the PNG is not decoration. Only the SVG was declared here, and
    // a search engine that will not rasterise SVG had nothing to show for
    // app.synoradigitals.com at all — no icon beside the result rather than a
    // wrong one. The PNG is the same 192 the manifest already serves, so this
    // adds a declaration rather than a file.
    // ?v=2 is a cache-buster, and it is doing real work. A browser keeps
    // favicons in a store of their own, separate from the page cache, and it
    // survives a reload and usually a hard reload too — so a merchant who had
    // the panel open before the mark changed kept seeing the old one no matter
    // what the server sent. The query changes the URL without moving the file,
    // so every browser fetches it again and the paths stay exactly where they
    // are. Bump it if the artwork changes again.
    icon: [
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/icons/icon-192.png?v=2", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png?v=2", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "APP by Synora Digitals",
    title: "APP by Synora Digitals, commerce that catches your mistakes",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "APP by Synora Digitals, commerce that catches your mistakes",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${storefrontSans.variable} ${storefrontSerif.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink antialiased">
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <ToastProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
