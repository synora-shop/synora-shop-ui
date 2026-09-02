"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { readCollapsedPreference, useAdminNav } from "@/lib/admin-nav-store";
import { registryBusinessType } from "@/lib/themes/business-type";
import { vocabularyFor } from "@/lib/themes/vocabulary";
import {
  Braces,
  FileText,
  Globe,
  Inbox,
  LayoutDashboard,
  Link2,
  ListTree,
  MessageCircle,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Power,
  Settings2,
  Languages,
  Store,
  ShoppingBag,
  Tag,
  Tags,
  Trash2,
  Type,
  UserCog,
  Users,
  X,
  Newspaper,
  Clock,
  MapPin,
} from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/utils";

/**
 * Both halves of the product, in one navigation tree.
 *
 * They used to be separate panels joined by a single text link, which meant
 * that finding a setting required first knowing which panel owned it — the most
 * common way to fail to find a feature here. "Online store" now sits alongside
 * catalog and orders, because from a merchant's point of view it always was
 * part of the same job.
 */
const NAV_SECTIONS = [
  {
    label: "Home",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    // The storefront, as a merchant thinks of it: what it looks like and how a
    // visitor moves around it. The preview and theme picker that belong at the
    // top of this group are not built yet, so for now it is the appearance
    // screens that already work.
    label: "Your SHOP",
    items: [
      { href: "/admin/theme", label: "Design", icon: Palette },
      { href: "/admin/fonts", label: "Fonts", icon: Type },
      { href: "/admin/buttons", label: "Sticky buttons", icon: MessageCircle },
      { href: "/admin/redirects", label: "Links & redirects", icon: Link2 },
    ],
  },
  {
    // The one group that changes shape with the business. A restaurant sees
    // Dishes and Courses, a shop sees Products and Categories, and a blog sells
    // nothing so it sees almost none of this. Catalog and Sales used to be two
    // groups; they are one because a merchant filling in a product and a
    // merchant reading an order are doing the same job — running the shop.
    label: "Catalog & orders",
    labels: { RESTAURANT: "Menu & orders" },
    items: [
      { href: "/admin/products", label: "Products", icon: Package, hideFor: ["BLOG"], term: "products" },
      { href: "/admin/categories", label: "Categories", icon: Tags, hideFor: ["BLOG"], term: "categories" },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, hideFor: ["BLOG"] },
      { href: "/admin/customers", label: "Customers", icon: Users, hideFor: ["BLOG"] },
      { href: "/admin/discounts", label: "Discounts", icon: Tag, hideFor: ["BLOG"] },
      { href: "/admin/enquiries", label: "Enquiries", icon: Inbox, hideFor: ["BLOG"] },
      { href: "/admin/bin", label: "Bin", icon: Trash2, hideFor: ["BLOG"] },
    ],
  },
  {
    label: "Pages",
    items: [
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/blog", label: "Blog", icon: Newspaper, onlyFor: ["BLOG"] },
      // A blog has no catalog group to file these under, and a group holding
      // one link named after itself is worse than no group.
      { href: "/admin/enquiries", label: "Enquiries", icon: Inbox, onlyFor: ["BLOG"] },
      // "Menus" here is navigation, never food. A restaurant's food menu is its
      // products, and two things called a menu in one sidebar is the confusion
      // this label avoids.
      { href: "/admin/menus", label: "Menus", icon: ListTree, labels: { RESTAURANT: "Navigation" } },
      { href: "/admin/site-text", label: "Site text", icon: Type },
      { href: "/admin/metafields", label: "Custom fields", icon: Braces },
    ],
  },
  {
    // Preferences of the shop, not of the account. Whether customers can see
    // it, when it opens, where it is, what languages it speaks. Spam
    // protection and the crawler rules belong here too and are not built yet.
    label: "Preferences",
    items: [
      { href: "/admin/store", label: "Store status", icon: Power },
      { href: "/admin/hours", label: "Opening hours", icon: Clock, onlyFor: ["RESTAURANT"] },
      { href: "/admin/locations", label: "Locations", icon: MapPin, onlyFor: ["RESTAURANT"] },
      { href: "/admin/regions", label: "Regions", icon: Languages },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings2 },
      { href: "/admin/domains", label: "Domains", icon: Globe },
    ],
  },
  {
    // The account, as opposed to the shop above it. One account can hold
    // several shops and the people who work on them.
    label: "Account",
    items: [
      { href: "/admin/account", label: "Your account", icon: UserCog },
      { href: "/admin/staff", label: "People", icon: Users },
    ],
  },
];

/** Which business types an item belongs to. Absent means every one of them. */
type BusinessType = "ECOMMERCE" | "BLOG" | "RESTAURANT";

/**
 * The sidebar for one kind of business.
 *
 * Hiding is deliberate but narrow: a blog has no orders and a shop has no
 * opening hours, and offering either is a door that leads nowhere. Anything a
 * merchant might plausibly use in any of the three stays visible, because
 * hiding a feature someone is paying for is its own kind of frustrating.
 *
 * Some items only change their word. A restaurant's dishes really are products
 * and its courses really are categories, so the screens are the same and only
 * the label follows the trade.
 */
function sectionsFor(businessType: BusinessType) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    // A group's own name changes with the business too, not just the links
    // inside it. Without this a restaurant reads "Catalog & orders" above a
    // list that says Dishes and Courses, and a blog reads it above a single
    // Enquiries link — the group heading contradicting everything under it.
    label:
      (section as { labels?: Record<string, string> }).labels?.[businessType] ?? section.label,
    items: section.items
      .filter((item) => {
        const only = (item as { onlyFor?: string[] }).onlyFor;
        const hide = (item as { hideFor?: string[] }).hideFor;
        if (only && !only.includes(businessType)) return false;
        if (hide && hide.includes(businessType)) return false;
        return true;
      })
      .map((item) => ({
        ...item,
        // One vocabulary, shared with the dashboard. Two copies is how the
        // sidebar came to say "Dishes" beside a button saying "Add product".
        label: (() => {
          const term = (item as { term?: string }).term;
          if (term) return vocabularyFor(registryBusinessType(businessType))[term as "products"];
          return (item as { labels?: Record<string, string> }).labels?.[businessType] ?? item.label;
        })(),
      })),
  })).filter((section) => section.items.length > 0);
}

export function AdminSidebar({ businessType = "ECOMMERCE" }: { businessType?: BusinessType }) {
  const open = useAdminNav((s) => s.open);
  const setOpen = useAdminNav((s) => s.setOpen);
  const collapsed = useAdminNav((s) => s.collapsed);
  const setCollapsed = useAdminNav((s) => s.setCollapsed);
  const toggleCollapsed = useAdminNav((s) => s.toggleCollapsed);
  const pathname = usePathname();

  // After mount, not during render: reading localStorage while rendering makes
  // the server's HTML and the client's first paint disagree.
  useEffect(() => {
    setCollapsed(readCollapsedPreference());
  }, [setCollapsed]);

  // The drawer is always labelled — it is only ever open on a small screen,
  // where there is room for words and no rail to speak of.
  const railed = (cls: string) => (collapsed ? cls : "");

  const navList = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 lg:px-2 xl:px-3">
      {sectionsFor(businessType).map((section, i) => (
        <div
          key={section.label}
          className={cn(
            // Collapsed, the group headings are gone and the groups would run
            // together as one undifferentiated column of icons. A hairline
            // does the job the heading was doing.
            i > 0 && railed("lg:border-t lg:border-border lg:pt-4")
          )}
        >
          <p className={cn("px-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-soft", railed("lg:hidden"))}>
            {section.label}
          </p>
          <div className="mt-1.5 flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  // The label is hidden in rail mode, so the only thing naming
                  // this link is the icon. `title` restores the name on hover;
                  // the label itself stays in the DOM for screen readers.
                  title={item.label}
                  className={cn(
                    // The active rail is positioned rather than a left border,
                    // so selecting an item can't nudge its label sideways.
                    "relative flex items-center gap-2.5 rounded-md py-2 pl-3 pr-2 text-sm",
                    railed("lg:justify-center lg:px-0"),
                    active
                      ? "bg-brand-600 font-medium text-white shadow-brand"
                      : "text-ink-soft hover:bg-subtle hover:text-ink active:bg-brand-100"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className={cn(railed("lg:sr-only"))}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        id="admin-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface shadow-lg transition-transform duration-200 lg:shadow-none",
          // Three states, not two. Below lg it is a drawer. Between lg and xl
          // it is an icon rail: the window is wide enough to keep navigation
          // on screen but not wide enough to spend 15rem on it — which is
          // exactly the width a laptop lands at once Safari's sidebar is open.
          // From xl it is the full labelled sidebar.
          "lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 lg:translate-x-0 lg:transition-none",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-60",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            "hidden pb-3 pt-5 lg:block",
            collapsed ? "lg:px-0 lg:text-center" : "lg:px-4"
          )}
        >
          <Link href="/admin" className="inline-flex items-center">
            {/* The lockup sets the product name beside the mark; there is no
                room for it on a 4.5rem rail, and the mark alone is what the
                component's markOnly prop is for. */}
            <Wordmark size="md" markOnly={collapsed} />
          </Link>
        </div>

        {/* The drawer's own header. It used to be a spacer clearing a second
            fixed bar; that bar is gone, so the drawer names itself instead. */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 lg:hidden">
          <Link href="/admin" className="flex items-center" onClick={() => setOpen(false)}>
            <Wordmark size="md" />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-ink transition-colors hover:bg-subtle active:bg-brand-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {navList}

        <div className="mx-3 hidden border-t border-border lg:block" />

        {/* Desktop only: on a small screen this is a drawer that is either open
            or gone, and a width control for it would mean nothing. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
          className={cn(
            "m-2 hidden flex-shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink lg:flex",
            collapsed && "lg:justify-center lg:px-0"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 flex-shrink-0" />
              Collapse
            </>
          )}
        </button>
      </aside>
    </>
  );
}
