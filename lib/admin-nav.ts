import {
  AnalyticsIcon,
  HomeIcon,
  PreferencesIcon,
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
 * Two levels and no more, which is the change. The sidebar used to hold seven
 * collapsible groups with links nested inside them, so reaching Orders meant
 * finding the right group, opening it, and reading past six siblings. Now the
 * sidebar names six destinations and never moves, and the second level is a row
 * of tabs across the top of the page — the navigation bar. Which tabs appear
 * depends entirely on which sidebar item is selected.
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

export type NavIcon = (props: { className?: string; title?: string }) => React.ReactElement;

export type NavSection = {
  key: string;
  label: string;
  labels?: Partial<Record<BusinessType, string>>;
  /** The drawn glyph for this section — see components/admin/nav-icons.tsx. */
  icon: NavIcon;
  tabs: NavTab[];
};

/**
 * The six, in the order they are drawn.
 *
 * Order is not alphabetical and not by importance — it is the order a merchant
 * meets them. Who you are, what you sell, what it looks like, how it behaves,
 * how it is doing, and the account underneath all of it.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    key: "home",
    label: "Home",
    icon: HomeIcon,
    // The store's own identity: its name, its logo, its address and its phone
    // number. One screen, so no navigation bar is drawn for it.
    tabs: [{ href: "/admin", label: "Home" }],
  },
  {
    key: "products",
    label: "Products",
    icon: ProductIcon,
    // Everything about selling: the catalogue, and what happens to it.
    tabs: [
      { href: "/admin/products", label: "Products" },
      // Beside Products because it is products: everything started and not yet
      // put out. It sits before Categories rather than beside Bin — a draft is
      // on its way in, not on its way out.
      { href: "/admin/drafts", label: "Drafts" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/enquiries", label: "Enquiries" },
      { href: "/admin/bin", label: "Bin" },
    ],
  },
  {
    key: "shop",
    label: "Your App",
    icon: YourAppIcon,
    // The storefront as a visitor meets it. Pages, Themes, Data, Menus and
    // Discounts are the five named in the documentation, in that order; Site
    // text is the sixth because it is the same job — words on the shop.
    tabs: [
      { href: "/admin/pages", label: "Pages" },
      // The same idea as Products' Drafts, for pages: everything written and
      // not yet published, in one place, with a tick beside each one.
      { href: "/admin/pages/drafts", label: "Drafts" },
      { href: "/admin/theme", label: "Themes" },
      // The one storefront page a merchant cannot reach through the
      // customizer, because it is only ever shown when the storefront is shut.
      // Next to Themes rather than at the end: closing the shop and what it
      // looks like closed are the same thought.
      { href: "/admin/maintenance", label: "Maintenance" },
      { href: "/admin/data", label: "Data" },
      { href: "/admin/menus", label: "Menus" },
      { href: "/admin/discounts", label: "Discounts" },
      { href: "/admin/site-text", label: "Site text" },
    ],
  },
  {
    key: "preferences",
    label: "Preferences",
    icon: PreferencesIcon,
    // How the shop behaves, as opposed to how it looks. Whether it is open to
    // customers at all is the first question, so it is the first tab.
    tabs: [
      { href: "/admin/preferences", label: "Visibility" },
      { href: "/admin/fonts", label: "Fonts" },
      { href: "/admin/buttons", label: "Sticky buttons" },
      { href: "/admin/redirects", label: "Links & redirects" },
      { href: "/admin/metafields", label: "Custom fields" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: AnalyticsIcon,
    tabs: [{ href: "/admin/analytics", label: "Analytics" }],
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    tabs: [
      { href: "/admin/settings", label: "General" },
      { href: "/admin/domains", label: "Domains" },
      { href: "/admin/account", label: "Account" },
    ],
  },
];

/** A section, ready to draw. */
export type ResolvedSection = {
  key: string;
  label: string;
  icon: NavIcon;
  href: string;
  tabs: { href: string; label: string }[];
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
    // A section is a link as well as a heading — clicking it lands on its first
    // tab. Computed rather than written down so the two cannot disagree.
    href: section.tabs[0].href,
    tabs: section.tabs.map((t) => ({ href: t.href, label: t.label })),
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
  const everyHref = all.flatMap((s) => s.tabs.map((t) => t.href));
  const current = activeHref(everyHref, pathname);

  const section = all.find((s) => s.tabs.some((t) => t.href === current)) ?? all[0];
  const tab = section.tabs.find((t) => t.href === current) ?? null;

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
