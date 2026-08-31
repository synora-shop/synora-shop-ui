import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { StickyButtons } from "@/components/storefront/sticky-buttons";
import { AccentTheme } from "@/components/storefront/accent-theme";
import { ThemeStyle } from "@/components/storefront/theme-style";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { getStoreSettings } from "@/lib/data/settings";
import { currentRegion } from "@/lib/data/regions";
import { getThemeTokens } from "@/lib/data/theme";
import { getFontAssets } from "@/lib/data/fonts";
import { getStickyButtons } from "@/lib/data/sticky-buttons";
import { getMenus, menuForSlot, headerLinks, footerColumns } from "@/lib/data/menus";
import { getSiteText, text } from "@/lib/site-text";
import { toGlobalEdits, footerCopyright } from "@/lib/global-edits";
import { resolveLogoColor } from "@/lib/theme-tokens";
import { guardCanonicalHost, guardShopHost } from "@/lib/canonical";
import { canonicalUrl, currentShop } from "@/lib/data/shop";
import { STORE_DEFAULTS } from "@/lib/store-defaults";
import type { Metadata } from "next";

// Settings (WhatsApp number, etc.), menus and site text are admin-editable
// and shown on every storefront page via the layout — force dynamic
// rendering so changes in /admin show up immediately instead of only after
// the next deploy.
export const dynamic = "force-dynamic";

/**
 * Brands the storefront as the merchant's shop, not as this platform.
 *
 * Without it every store inherits the root layout's metadata, so a merchant's
 * own shopfront opened in a browser tab, shared on WhatsApp, or crawled by a
 * search engine announced itself as "Shop by Synora Digitals — commerce that
 * catches your mistakes", and every inner page was suffixed "· Shop". The
 * platform's marketing copy has no business on a merchant's storefront.
 *
 * Two names exist for a shop: `Shop.name`, set at signup, and the editable
 * `StoreSettings.storeName`. The editable one wins once it has actually been
 * edited — until then it holds a placeholder ("Your Store") that is worse than
 * the name the merchant typed when they signed up.
 */
export async function generateMetadata(): Promise<Metadata> {
  const shop = await currentShop();
  // No shop means the platform's own host, where the root metadata is correct.
  if (!shop) return {};

  const [settings, siteText, tokens] = await Promise.all([
    getStoreSettings(),
    getSiteText(),
    getThemeTokens(),
  ]);
  const edited = settings.storeName?.trim();
  const name = edited && edited !== STORE_DEFAULTS.storeName ? edited : shop.name;
  const description = text(siteText, "footer.tagline");
  const favicon = tokens.faviconUrl || tokens.logoUrl || null;

  return {
    // Relative URLs in metadata resolve against the shop's own address rather
    // than the platform's, so a shared link points at the shop.
    metadataBase: new URL(await canonicalUrl(shop.id)),
    // `absolute` rather than `default`: a nested default is still run through
    // the root layout's "%s · Shop" template, which put the platform's name
    // back on the shop's own front page. Inner pages set a plain string and
    // resolve against the template below, so they read "Shop All · Nautaar".
    title: { absolute: name, template: `%s · ${name}` },
    description,
    openGraph: { type: "website", siteName: name, title: name, description },
    twitter: { card: "summary_large_image", title: name, description },
    // A shop's tab should carry the shop's mark, and failing that nothing of
    // ours. Left to Next's own fallback it served app/icon — which for most of
    // this platform's life was a *different merchant's* wordmark, so every
    // storefront on it showed one particular shop's logo to its customers.
    //
    // The logo stands in when no favicon is set, because a merchant who has
    // uploaded a logo has already answered this question without being asked.
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export default async function StorefrontLayout({ children }: LayoutProps<"/">) {
  // The product's own site is not a shop and has no storefront to show. Without
  // this, a merchant who had picked a store in the dashboard would find that
  // store's shopfront served from shop.synoradigitals.com.
  await guardShopHost();

  // A shop reachable at several addresses is several sites to a search engine,
  // and a basket left on one host is not there on another. Everything that is
  // not the canonical address redirects.
  await guardCanonicalHost();


  const [settings, menus, siteText, tokens, fonts, stickyButtons, region] = await Promise.all([
    getStoreSettings(),
    getMenus(),
    getSiteText(),
    getThemeTokens(),
    getFontAssets(),
    getStickyButtons(),
    currentRegion(),
  ]);
  const edits = toGlobalEdits(settings);

  // A region overrides only what it actually sets; null inherits. A shop with
  // no regions resolves to undefined and everything below reads as it always
  // did, which is what keeps this invisible until a merchant uses it.
  const headerMenu = menuForSlot(menus, region?.headerMenuId ?? settings.headerMenuId, "header");
  const footerMenu = menuForSlot(menus, region?.footerMenuId ?? settings.footerMenuId, "footer");
  const announcementText = region?.announcementText ?? edits.announcementText;
  const announcementBgColor = region?.announcementBgColor ?? edits.announcementBgColor;

  return (
    <div data-heading-style={edits.headingStyle} className="contents">
      <AccentTheme accentColor={edits.accentColor} />
      <ThemeStyle tokens={tokens} fonts={fonts} />
      <AnnouncementBar text={announcementText} bgColor={announcementBgColor} />
      <SiteHeader
        links={headerLinks(headerMenu?.items ?? [])}
        logoColor={resolveLogoColor(tokens, tokens.headerBackground)}
        logoSrc={tokens.logoUrl || undefined}
        logoHeight={tokens.logoHeight}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        columns={footerColumns(footerMenu?.items ?? [])}
        tagline={text(siteText, "footer.tagline")}
        copyrightText={footerCopyright(edits)}
        // Resolved against the footer's own background: a header and footer
        // of different darknesses need different logo treatments.
        logoColor={resolveLogoColor(tokens, tokens.footerBackground)}
        logoSrc={tokens.logoUrl || undefined}
      />
      {/* Configured buttons replace the original hardcoded WhatsApp bubble.
          With none set up the old button still shows, so an existing store
          behaves exactly as before until it opts in. */}
      {stickyButtons.length > 0 ? (
        <StickyButtons buttons={stickyButtons} />
      ) : (
        <WhatsAppButton number={settings.whatsappNumber} />
      )}
    </div>
  );
}
