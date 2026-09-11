import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { StickyButtons } from "@/components/storefront/sticky-buttons";
import { ThemeStyle } from "@/components/storefront/theme-style";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { getStoreSettings } from "@/lib/data/settings";
import { CurrencyProvider } from "@/components/ui/currency";
import { getThemeTokens, getThemeLayout } from "@/lib/data/theme";
import { getFontAssets } from "@/lib/data/fonts";
import { getStickyButtons } from "@/lib/data/sticky-buttons";
import { getMenus, menuForSlot, headerLinks, footerColumns } from "@/lib/data/menus";
import { getSiteText, text } from "@/lib/site-text";
import { toGlobalEdits, footerCopyright } from "@/lib/global-edits";
import { toBrandMarks, pickLogo, faviconType } from "@/lib/brand-marks";
import { checkoutMethods } from "@/lib/payment-methods";
import { offerableGateways } from "@/lib/payments/offer";
import { shopSession } from "@/lib/auth-guard";
import { isDarkBackground } from "@/lib/contrast";
import { resolveLogoColor } from "@/lib/theme-tokens";
import { guardCanonicalHost, guardShopHost } from "@/lib/canonical";
import { headers } from "next/headers";
import { SHOP_PATH_HEADER } from "@/lib/shop-context";
import { canonicalUrl, currentShop } from "@/lib/data/shop";
import { recordVisit } from "@/lib/analytics/visits";
import { STORE_DEFAULTS, resolveStoreDefaults } from "@/lib/store-defaults";
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
 * search engine announced itself as "APP by Synora Digitals — commerce that
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
  // The shop's own marks, not the theme's — see lib/brand-marks.ts. The logo
  // stands in when no favicon is set, because a merchant who has uploaded a
  // logo has already answered this question without being asked.
  const marks = toBrandMarks(settings);
  const favicon = marks.faviconUrl || pickLogo(marks) || null;

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
    ...(favicon
      ? { icons: { icon: { url: favicon, type: faviconType(favicon) } } }
      : {}),
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

  // Counted here, after the two guards, so a redirect is never recorded as a
  // visit — otherwise every non-canonical request would be counted twice, once
  // on the way through and once at its destination. The write itself happens
  // after the response; see lib/analytics/visits.ts.
  const visiting = await currentShop();
  if (visiting) {
    // The proxy already passes the path down for the canonical redirect. Its
    // query is dropped: a URL's parameters carry campaign tags and sometimes
    // worse, and none of it belongs in a table this size.
    const raw = (await headers()).get(SHOP_PATH_HEADER) ?? "/";
    const path = raw.split("?")[0] || "/";
    await recordVisit(visiting.id, path);
  }


  const [settings, menus, siteText, tokens, fonts, stickyButtons, layout] = await Promise.all([
    getStoreSettings(),
    getMenus(),
    getSiteText(),
    getThemeTokens(),
    getFontAssets(),
    getStickyButtons(),
    getThemeLayout(),
  ]);
  const edits = toGlobalEdits(settings);

  // The shop's marks, and the two facts a theme needs to choose between them.
  const marks = toBrandMarks(settings);
  const headerIsDark = isDarkBackground(tokens.headerBackground);
  // Falls back to the shop's own name, so a store with no logo shows its name
  // rather than this platform's artwork — which is what it used to do, on
  // every storefront that had never uploaded one.
  const storeDisplayName = resolveStoreDefaults(settings).storeName;

  // What the footer lists as ways to pay.
  //
  // The same rule the checkout uses, so the two cannot disagree: a gateway
  // still in test mode is named only for the shop's own staff, never for a
  // customer who could not use it.
  const shop = await currentShop();
  const staff = shop ? await shopSession() : null;
  const footerGateways = shop
    ? await offerableGateways(
        shop.id,
        resolveStoreDefaults(settings).currency,
        !!staff && staff.shop.id === shop.id
      )
    : [];
  const footerMethods = checkoutMethods(
    settings.enabledPaymentMethods,
    settings,
    footerGateways
  ).map((m) => m.label);

  const headerMenu = menuForSlot(menus, settings.headerMenuId, "header");
  const footerMenu = menuForSlot(menus, settings.footerMenuId, "footer");
  const announcementText = edits.announcementText;
  const announcementBgColor = edits.announcementBgColor;

  return (
    // Prices on the storefront read in the shop's own currency, which is the
    // half of this bug a customer would have seen.
    <CurrencyProvider currency={resolveStoreDefaults(settings).currency}>
    <div data-heading-style={edits.headingStyle} className="contents">
      {/* AccentTheme used to sit here, emitting a brand ramp from the shop's
          `accentColor` so that ThemeStyle below could override it. Two style
          blocks fighting over one colour, decided by which happened to emit
          anything — see withLegacyAccent in lib/data/theme.ts. One block now,
          and the accent inside it is already the right one. */}
      <ThemeStyle tokens={tokens} fonts={fonts} />
      <AnnouncementBar text={announcementText} bgColor={announcementBgColor} />
      {/* The theme asks brand-marks for a mark that suits this header — its
          own darkness, and a compact one for narrow widths — and gets the
          nearest thing the merchant has actually uploaded. It never has to
          know which of the four slots were filled in. */}
      <SiteHeader
        layout={layout.header}
        links={headerLinks(headerMenu?.items ?? [])}
        logoColor={resolveLogoColor(tokens, tokens.headerBackground)}
        logoSrc={pickLogo(marks, { dark: headerIsDark }) || undefined}
        logoSrcCompact={pickLogo(marks, { dark: headerIsDark, compact: true }) || undefined}
        logoHeight={tokens.logoHeight}
        storeName={storeDisplayName}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        layout={layout.footer}
        columns={footerColumns(footerMenu?.items ?? [])}
        tagline={text(siteText, "footer.tagline")}
        copyrightText={footerCopyright(edits)}
        // Resolved against the footer's own background: a header and footer
        // of different darknesses need different logo treatments.
        logoColor={resolveLogoColor(tokens, tokens.footerBackground)}
        logoSrc={pickLogo(marks, { dark: isDarkBackground(tokens.footerBackground) }) || undefined}
        storeName={storeDisplayName}
        // What this shop actually takes, not what the platform used to list for
        // everybody. See lib/payment-methods.ts. Gateways included, so a footer
        // that says "Cash on Delivery" alone is not the last thing a customer
        // reads before a checkout that also takes cards.
        paymentMethods={footerMethods}
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
    </CurrencyProvider>
  );
}
