import type { MetadataRoute } from "next";

// Lets the admin "install" the site to a phone home screen (Add to Home
// Screen on iOS Safari 16.4+, install prompt on Android Chrome) so it can
// receive Web Push notifications for new orders — without publishing an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shop Admin",
    short_name: "Shop Admin",
    description: "Manage your Shop orders, products and settings.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#f8f5f1",
    theme_color: "#4c100f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
