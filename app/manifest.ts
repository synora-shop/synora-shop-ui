import type { MetadataRoute } from "next";

/**
 * Lets the admin "install" to a phone home screen (Add to Home Screen on iOS
 * Safari 16.4+, install prompt on Android Chrome) so it can receive Web Push
 * notifications for new orders — without publishing an app.
 *
 * The colours here are not decoration: a mobile browser paints its own chrome
 * from `theme_color`, so this file decides what colour the strip around the
 * status bar is on a phone. It was #4c100f — a maroon from a palette this
 * product stopped using, and one that belongs to a different business
 * entirely — which is why the top of the page came out maroon in a mobile
 * browser long after nothing on screen was.
 *
 * It is the panel's own ground now, because `start_url` is the panel.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "APP by Synora Digitals",
    short_name: "APP",
    description: "Run your shop — orders, products, pages and settings.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#f5f5f5",
    icons: [
      // Versioned for the same reason the <link> icons are: a browser keeps an
      // installed app's icon in a store of its own that a reload does not touch.
      { src: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
  };
}
