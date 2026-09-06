import {
  AnalyticsIcon,
  HomeIcon,
  PreferencesIcon,
  ProductIcon,
  SettingsIcon,
  YourAppIcon,
} from "@/components/admin/nav-icons";
import { activeHref } from "@/lib/active-nav";
import { registryBusinessType } from "@/lib/themes/business-type";
import { vocabularyFor } from "@/lib/themes/vocabulary";

/**
 * The whole of the panel's navigation, in one place.
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

export type BusinessType = "ECOMMERCE" | "BLOG" | "RESTAURANT";

export type NavTab = {
  href: string;
  label: string;
  /** A different word for the same screen — a restaurant's products are dishes. */
  labels?: Partial<Record<BusinessType, string>>;
  /** Takes its word from the shared vocabulary instead, so it cannot drift. */
  term?: "products" | "categories";
  /** Business types this belongs to. Absent means all of them. */
  onlyFor?: BusinessType[];
  hideFor?: BusinessType[];
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
    labels: { RESTAURANT: "Menu", BLOG: "Posts" },
    icon: ProductIcon,
    // Everything about selling: the catalogue, and what happens to it. A blog
    // sells nothing, so it keeps only the two screens that still mean something.
    tabs: [
      { href: "/admin/products", label: "Products", term: "products", hideFor: ["BLOG"] },
      { href: "/admin/categories", label: "Categories", term: "categories", hideFor: ["BLOG"] },
      { href: "/admin/blog", label: "Posts", onlyFor: ["BLOG"] },
      { href: "/admin/orders", label: "Orders", hideFor: ["BLOG"] },
      { href: "/admin/customers", label: "Customers", hideFor: ["BLOG"] },
      { href: "/admin/enquiries", label: "Enquiries" },
      { href: "/admin/bin", label: "Bin", hideFor: ["BLOG"] },
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
      { href: "/admin/theme", label: "Themes" },
      { href: "/admin/data", label: "Data" },
      { href: "/admin/menus", label: "Menus" },
      { href: "/admin/discounts", label: "Discounts", hideFor: ["BLOG"] },
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
      { href: "/admin/hours", label: "Opening hours", onlyFor: ["RESTAURANT"] },
      { href: "/admin/locations", label: "Locations", onlyFor: ["RESTAURANT"] },
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

/** A section with its words and its tabs settled for one kind of business. */
export type ResolvedSection = {
  key: string;
  label: string;
  icon: NavIcon;
  href: string;
  tabs: { href: string; label: string }[];
};

/**
 * The navigation for one kind of business.
 *
 * Hiding is narrow and deliberate: a blog has no orders and a shop has no
 * opening hours, and offering either is a door to nowhere. Everything a
 * merchant might plausibly use stays.
 */
export function sectionsFor(businessType: BusinessType): ResolvedSection[] {
  const words = vocabularyFor(registryBusinessType(businessType));
  return NAV_SECTIONS.map((section) => {
    const tabs = section.tabs
      .filter((tab) => {
        if (tab.onlyFor && !tab.onlyFor.includes(businessType)) return false;
        if (tab.hideFor && tab.hideFor.includes(businessType)) return false;
        return true;
      })
      .map((tab) => ({
        href: tab.href,
        label: tab.term
          ? words[tab.term]
          : (tab.labels?.[businessType] ?? tab.label),
      }));
    return {
      key: section.key,
      label: section.labels?.[businessType] ?? section.label,
      icon: section.icon,
      // A section is a link as well as a heading — clicking it lands on its
      // first tab. Computed rather than written down so the two can never
      // disagree about where the section starts.
      href: tabs[0]?.href ?? "/admin",
      tabs,
    };
  }).filter((section) => section.tabs.length > 0);
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
export function resolveNav(pathname: string, businessType: BusinessType) {
  const sections = sectionsFor(businessType);
  const everyHref = sections.flatMap((s) => s.tabs.map((t) => t.href));
  const current = activeHref(everyHref, pathname);

  const section =
    sections.find((s) => s.tabs.some((t) => t.href === current)) ?? sections[0];
  const tab = section.tabs.find((t) => t.href === current) ?? null;

  const crumbs: Crumb[] = [{ label: section.label, href: section.href }];
  // A crumb that repeats the heading above it is noise. "Products > Products"
  // and a lone "Home" under a heading that already says Home are both the
  // trail telling you something you have just read.
  if (tab && section.tabs.length > 1 && tab.label !== section.label) {
    crumbs.push({ label: tab.label, href: tab.href });
  }

  return {
    sections,
    section,
    current,
    // One crumb is not a trail — it is the heading again. The breadcrumb only
    // earns its line once there is somewhere above you to go back to.
    crumbs: crumbs.length > 1 ? crumbs : [],
    tabs: section.tabs.length > 1 ? section.tabs : [],
  };
}
