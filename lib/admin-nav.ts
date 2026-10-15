import type { ComponentType } from "react";
// The drawn glyphs from Assestz/SVG wherever one exists. Orders and Bin have
// no drawn glyph yet, so they borrow lucide's until one is drawn.
import { Inbox, Trash2 } from "lucide-react";
import {
  AnalyticsIcon,
  CustomersIcon,
  DataIcon,
  DiscountsIcon,
  HomeIcon,
  ProductIcon,
  SettingsIcon,
  YourAppIcon,
} from "@/components/admin/nav-icons";
import { activeHref } from "@/lib/active-nav";

/**
 * The whole of the panel's navigation, in one place.
 *
 * This is the e-commerce panel. APP.ai and the documentation were drawn for one
 * kind of business — a shop that sells products — and everything here follows
 * that: the six sections, the tabs under them, and the words they use.
 *
 * A restaurant is not this panel with "Dishes" written over "Products". It has
 * different sections, different screens and its own naming, and it gets its own
 * design rather than a translation layer over this one. Half-renaming was worse
 * than either: a merchant saw "Dishes" in the sidebar above a screen still
 * built around SKUs, variants and shipping.
 *
 * Two levels and no more. The sidebar names ten destinations and never moves;
 * the second level is a row of tabs across the top of the page — the navigation
 * bar. Which tabs appear depends entirely on which sidebar item is selected.
 *
 * The second level lived in the sidebar for one day. On 21 September the
 * navigation bar was dissolved and its tabs hung under the section you were
 * standing in, so both levels read in one column. The design of 22 September
 * puts the bar back and returns the sidebar to ten parent rows. The reason it
 * was dissolved — the same links appearing twice — is handled by the sidebar
 * not repeating them, which it does not.
 *
 * Some screens belong to a section and draw no tab: see `hidden` below.
 *
 * This file is the single source of both. The sidebar reads the section labels,
 * the navigation bar reads the tabs of the current section, and the heading bar
 * reads both to build its breadcrumbs. Nothing is written down twice, so a tab
 * cannot end up in the bar without also being reachable, or named one thing in
 * the sidebar and another in a crumb.
 */

/**
 * Still the schema's three, because a shop row carries one. The panel is drawn
 * for ECOMMERCE; the other two are types a shop can be, not designs that exist.
 */
export type BusinessType = "ECOMMERCE" | "BLOG" | "RESTAURANT";

export type NavTab = {
  href: string;
  label: string;
};

/**
 * A screen that belongs to a section and draws no tab.
 *
 * Not every screen earns a place in the navigation bar, and a screen with no
 * tab still has to light the right sidebar row when somebody reaches it by
 * link. Without this, `resolveNav` finds no match, falls back to the first
 * section, and the sidebar says you are on Home while you are looking at
 * something else.
 *
 * It is a holding pattern, not a category. Every entry here is a screen on its
 * way somewhere — folded into its parent screen, or removed once what it does
 * lives elsewhere — and docs/QUEUE.md says which.
 */
export type NavHidden = NavTab;

export type NavIcon = ComponentType<{ className?: string }>;

/** The brand colour a section wears: its dot in the rail and the chip on its pages. */
export type NavTone = "iris" | "lavender" | "sky" | "mint" | "ink";

/**
 * Which band of the sidebar a section sits in.
 *
 * 1 — running the shop: what you sell, who bought it, and how it went.
 * 2 — how the shop looks and behaves.
 * 3 — the account underneath it all.
 *
 * A number rather than a name because the groups are drawn as space, not as
 * headings. Naming them would put three more words on every screen and invite
 * an argument about the names; the gap says the same thing and says it quietly.
 * If they are ever labelled, the label belongs here and nowhere else.
 */
export type NavGroup = 1 | 2 | 3;

export type NavSection = {
  key: string;
  label: string;
  labels?: Partial<Record<BusinessType, string>>;
  /** The drawn glyph for this section — see components/admin/nav-icons.tsx. */
  icon: NavIcon;
  tone: NavTone;
  group: NavGroup;
  tabs: NavTab[];
  /** Screens of this section that draw no tab. See NavHidden. */
  hidden?: NavHidden[];
};

/**
 * The ten, in the order they are drawn, in three groups.
 *
 * Order is not alphabetical and not by importance — it is the order a merchant
 * meets them, and the groups are the three questions they are answering.
 *
 * Group 1 is running the shop: who you are, what you sell, the records of it,
 * what you are offering, who bought, and how it went. Group 2 is how the shop
 * looks and how it behaves. Group 3 is the account underneath all of it.
 *
 * Three sections here used to be tabs, and were promoted when the groups were
 * drawn:
 *
 *   Data and Discounts were buried under Your App, between Themes and Site
 *   text — filed with the storefront's appearance, which neither is. A CSV
 *   import is not a look, and a discount code is not either. Both were already
 *   drawn as sidebar glyphs in the design file, which is its own evidence that
 *   they were never meant to be tabs.
 *
 *   Account was the fourth tab under Settings, behind General, Payments and
 *   Domains. Everything else under Settings is about the *shop*; Account is
 *   about the person signed in. Sharing a section made "delete my account" look
 *   like a setting of the store.
 *
 * Customers stays where it was put — between Discounts and Analytics rather
 * than under Products. Filed under the catalogue it read as a property of what
 * you sell; it is not. It is the people, and it belongs next to the numbers
 * about them.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  // Redrawn on 15 October to the new admin: Shopify's grouping, a black rail
  // that opens only the section you are in, and every address unchanged.
  // Group 1 is running the shop, group 2 is the storefront, group 3 is the
  // arrangements underneath (Settings) and the way back from a mistake (Bin).
  { key: "home", label: "Home", icon: HomeIcon, tone: "ink", group: 1, tabs: [{ href: "/admin", label: "Home" }] },
  {
    key: "orders",
    label: "Orders",
    icon: Inbox,
    tone: "iris",
    group: 1,
    tabs: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/orders/drafts", label: "Draft orders" },
      { href: "/admin/orders/abandoned", label: "Abandoned checkouts" },
      { href: "/admin/enquiries", label: "Enquiries" },
    ],
  },
  {
    key: "products",
    label: "Products",
    icon: ProductIcon,
    tone: "mint",
    group: 1,
    tabs: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/products/inventory", label: "Inventory" },
      { href: "/admin/drafts", label: "Drafts" },
      { href: "/admin/categories", label: "Collections" },
    ],
  },
  { key: "customers", label: "Customers", icon: CustomersIcon, tone: "sky", group: 1, tabs: [{ href: "/admin/customers", label: "Customers" }] },
  { key: "discounts", label: "Discounts", icon: DiscountsIcon, tone: "lavender", group: 1, tabs: [{ href: "/admin/discounts", label: "Discounts" }] },
  {
    key: "content",
    label: "Content",
    icon: DataIcon,
    tone: "mint",
    group: 1,
    tabs: [
      { href: "/admin/data", label: "Files" },
      { href: "/admin/menus", label: "Menus" },
      { href: "/admin/metafields", label: "Custom fields" },
      { href: "/admin/site-text", label: "Store wording" },
    ],
  },
  { key: "analytics", label: "Analytics", icon: AnalyticsIcon, tone: "iris", group: 1, tabs: [{ href: "/admin/analytics", label: "Analytics" }] },
  {
    key: "store",
    label: "Online Store",
    icon: YourAppIcon,
    tone: "sky",
    group: 2,
    tabs: [
      { href: "/admin/theme", label: "Themes" },
      { href: "/admin/pages", label: "Pages" },
      { href: "/admin/look", label: "Store-wide look" },
      { href: "/admin/preferences", label: "Preferences" },
      // Directly after Preferences: whether the shop is open is the same
      // question its visibility settings ask (scripts/check-holding.ts).
      { href: "/admin/maintenance", label: "Holding page and status" },
      { href: "/admin/fonts", label: "Fonts" },
      { href: "/admin/buttons", label: "Chat buttons" },
      { href: "/admin/redirects", label: "Links and redirects" },
    ],
    // Page drafts fold into Pages: a draft belongs to the thing it is a draft of.
    hidden: [{ href: "/admin/pages/drafts", label: "Page drafts" }],
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    tone: "ink",
    group: 3,
    // Drawn as the list beside every settings screen rather than in the rail:
    // see components/admin/settings-frame.tsx.
    tabs: [
      { href: "/admin/store", label: "Store details" },
      { href: "/admin/store-defaults", label: "Store defaults" },
      { href: "/admin/settings", label: "Checkout and delivery" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/domains", label: "Domains" },
      { href: "/admin/account", label: "Users and your account" },
    ],
  },
  { key: "bin", label: "Bin", icon: Trash2, tone: "ink", group: 3, tabs: [{ href: "/admin/bin", label: "Bin" }] },
];

/** A section, ready to draw. */
export type ResolvedSection = {
  key: string;
  label: string;
  icon: NavIcon;
  tone: NavTone;
  href: string;
  group: NavGroup;
  tabs: { href: string; label: string }[];
  /** Screens that belong here and draw no tab. Never rendered as navigation. */
  hidden: { href: string; label: string }[];
};

/**
 * The navigation.
 *
 * It used to take a business type and filter and rename its way to a different
 * answer for each. There is one answer now. The parameter is gone rather than
 * ignored, so nothing can pass a type and quietly expect a different panel.
 */
export function sections(): ResolvedSection[] {
  return NAV_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label,
    icon: section.icon,
    tone: section.tone,
    group: section.group,
    // A section is a link as well as a heading — clicking it lands on its first
    // tab. Computed rather than written down so the two cannot disagree.
    href: section.tabs[0].href,
    tabs: section.tabs.map((t) => ({ href: t.href, label: t.label })),
    hidden: (section.hidden ?? []).map((t) => ({ href: t.href, label: t.label })),
  }));
}

export type Crumb = { label: string; href: string };

/**
 * Where the current URL sits in the navigation.
 *
 * `section` is what the sidebar should light and what the heading bar should
 * be titled. `tabs` is the navigation bar — empty when the section has only one
 * screen, because a bar with a single tab in it is furniture, not navigation.
 *
 * The active match is the longest href that covers the path, so /admin/products
 * beats /admin, and a detail page like /admin/products/abc still belongs to the
 * Products tab. See lib/active-nav.ts for why the obvious rule does not work.
 */
export function resolveNav(pathname: string) {
  const all = sections();
  // Hidden screens are matched here and nowhere else. Leaving them out is what
  // made /admin/site-text light "Home" — no href covered it, so the fallback
  // won and the sidebar named the wrong section.
  const everyHref = all.flatMap((s) => [...s.tabs, ...s.hidden].map((t) => t.href));
  const current = activeHref(everyHref, pathname);

  const section =
    all.find((s) => [...s.tabs, ...s.hidden].some((t) => t.href === current)) ?? all[0];
  const tab =
    section.tabs.find((t) => t.href === current) ??
    section.hidden.find((t) => t.href === current) ??
    null;

  const crumbs: Crumb[] = [{ label: section.label, href: section.href }];
  // A crumb that repeats the heading above it is noise. "Products > Products"
  // and a lone "Home" under a heading that already says Home are both the
  // trail telling you something you have just read.
  if (tab && section.tabs.length > 1 && tab.label !== section.label) {
    crumbs.push({ label: tab.label, href: tab.href });
  }

  return {
    sections: all,
    section,
    current,
    // One crumb is not a trail — it is the heading again. The breadcrumb only
    // earns its line once there is somewhere above you to go back to.
    crumbs: crumbs.length > 1 ? crumbs : [],
    tabs: section.tabs.length > 1 ? section.tabs : [],
  };
}
