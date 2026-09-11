import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { NavProgress } from "@/components/ui/nav-progress";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// IBM Plex, not Inter. Plex was drawn for a company that makes instruments, and
// it has actual character — the flat-topped 'a', the angled terminals — where
// the usual product-sans choices are deliberately characterless. The mono cut
// carries every number this product shows: contrast ratios, pixel sizes, counts,
// hex values. Those are the readings on the dial, and they should look like it.
const sans = IBM_Plex_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
