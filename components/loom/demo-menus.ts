import type { LoomMenu } from "@/components/loom/contract";

/**
 * The menus a merchant would build under Admin → Menus for the demo shop —
 * the kit's own link lists, with the dropdowns its chevrons promise.
 *
 * Ids stand in for the database ids a `menu` setting stores. The kit's header
 * draws a chevron beside each of its three categories, so each has children;
 * the utility strip and the footer columns are flat.
 */
const m = (id: string, name: string, items: LoomMenu["items"]): LoomMenu => ({ id, name, items });

export const DEMO_MENUS: Record<string, LoomMenu> = Object.fromEntries(
  [
    m("main-menu", "Main menu", [
      {
        id: "all",
        label: "All Category",
        href: "/loom/collection",
        children: [
          { id: "all-shoes", label: "Shoes", href: "/loom/collection" },
          { id: "all-tshirt", label: "T-Shirt", href: "#" },
          { id: "all-jackets", label: "Jackets", href: "#" },
          { id: "all-hat", label: "Hat", href: "#" },
          { id: "all-acc", label: "Accessories", href: "#" },
        ],
      },
      {
        id: "gift",
        label: "Gift Cards",
        href: "#",
        children: [
          { id: "gift-digital", label: "Digital gift card", href: "#" },
          { id: "gift-boxed", label: "Boxed gift card", href: "#" },
        ],
      },
      {
        id: "event",
        label: "Special Event",
        href: "#",
        children: [
          { id: "event-summer", label: "Summer Outfit", href: "#" },
          { id: "event-new", label: "New Arrivals", href: "#" },
          { id: "event-sale", label: "Last Pairs", href: "#" },
        ],
      },
    ]),
    m("help", "Help", [
      { id: "track", label: "Tracking Package", href: "#" },
      { id: "faq", label: "FAQ", href: "#" },
      { id: "about", label: "About Us", href: "#" },
      { id: "contact", label: "Contact Us", href: "#" },
    ]),
    m("popular", "Popular", [
      { id: "p-shoes", label: "Shoes", href: "/loom/collection" },
      { id: "p-tshirt", label: "T-Shirt", href: "#" },
      { id: "p-jackets", label: "Jackets", href: "#" },
      { id: "p-hat", label: "Hat", href: "#" },
      { id: "p-acc", label: "Accessories", href: "#" },
    ]),
    m("footer-menu", "Footer menu", [
      { id: "f-all", label: "All Category", href: "/loom/collection" },
      { id: "f-gift", label: "Gift Cards", href: "#" },
      { id: "f-event", label: "Special Events", href: "#" },
      { id: "f-testimonial", label: "Testimonial", href: "#" },
      { id: "f-blog", label: "Blog", href: "#" },
    ]),
    m("other", "Other", [
      { id: "o-track", label: "Tracking Package", href: "#" },
      { id: "o-faq", label: "FAQ", href: "#" },
      { id: "o-about", label: "About Us", href: "#" },
      { id: "o-contact", label: "Contact Us", href: "#" },
      { id: "o-terms", label: "Terms and Conditions", href: "#" },
    ]),
    m("trending-chips", "Trending chips", [
      { id: "t-shorts", label: "Shorts", href: "#" },
      { id: "t-hat", label: "Hat", href: "#" },
      { id: "t-jackets", label: "Jackets", href: "#" },
      { id: "t-shoes", label: "Shoes", href: "/loom/collection" },
      { id: "t-tshirt", label: "T-Shirt", href: "#" },
    ]),
    m("popular-searches", "Popular searches", [
      { id: "s-skate", label: "Skateboard", href: "/loom/search?q=skateboard" },
      { id: "s-red", label: "Red", href: "/loom/search?q=red" },
      { id: "s-white", label: "White", href: "/loom/search?q=white" },
      { id: "s-basket", label: "Basket", href: "/loom/search?q=basket" },
    ]),
  ].map((x) => [x.id, x])
);
