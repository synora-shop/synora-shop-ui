import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP behind it.
    //
    // next/image served WebP only, which is the safe default from when Safari
    // could not read AVIF. It has been able to since 16.4. AVIF is typically a
    // quarter to a third smaller than WebP at the same quality, and a
    // storefront is mostly photographs — this is the single largest thing a
    // customer downloads, and the one a merchant has no way to optimise
    // themselves.
    //
    // The order is the order they are offered; a browser that cannot read AVIF
    // is served WebP, and one that can read neither is served the original.
    formats: ["image/avif", "image/webp"],
    // A year. These URLs are content-addressed by the source image and the
    // width, so a cached one can never be stale — it was 60 seconds, which
    // meant re-optimising the same photograph on every page view after the
    // first minute, at the cost of a function invocation each time.
    minimumCacheTTL: 31_536_000,
    remotePatterns: [
      // Placeholder product images until real photography is uploaded via the admin panel.
      { protocol: "https", hostname: "picsum.photos" },
      // Vercel Blob storage (admin-uploaded product images) — hostname is per-store, wildcarded here.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },

  // Nothing is served by a header that names the framework.
  poweredByHeader: false,

  // No `optimizePackageImports` here, and that is a finding rather than an
  // omission. `import { Bell } from "lucide-react"` reaches a barrel
  // re-exporting some fifteen hundred icons, in a hundred files — worth
  // rewriting to each icon's own module, and Next already does it: lucide-react
  // is in its built-in default list. Adding it explicitly changed the built
  // chunks by zero bytes, measured, so the line is not kept.
};

export default nextConfig;
