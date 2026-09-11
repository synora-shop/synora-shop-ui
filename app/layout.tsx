import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, DM_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { NavProgress } from "@/components/ui/nav-progress";
import { ToastProvider } from "@/components/ui/toast";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
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
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`}>
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
