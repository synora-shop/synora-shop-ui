import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Placeholder product images until real photography is uploaded via the admin panel.
      { protocol: "https", hostname: "picsum.photos" },
      // Vercel Blob storage (admin-uploaded product images) — hostname is per-store, wildcarded here.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
