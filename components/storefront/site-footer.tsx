import { StoreLink as Link } from "@/components/storefront/store-link";
import { Container } from "@/components/ui/container";
import { THEME_LAYOUT_DEFAULTS, type FooterLayout } from "@/lib/theme-layout";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";


type FooterLink = { id: string; href: string; label: string };
type FooterColumn = { heading: string; links: FooterLink[] };

// Falls back to the original hardcoded columns if no admin-managed menu
// items exist yet — never show an empty footer.
const FALLBACK_COLUMNS: FooterColumn[] = [
  {
    heading: "Shop",
    links: [
      { id: "shop", href: "/shop", label: "All Products" },
      { id: "lawn", href: "/collections/lawn", label: "Lawn" },
      { id: "formal", href: "/collections/formal", label: "Formal" },
      { id: "sale", href: "/collections/sale", label: "Sale" },
    ],
  },
  {
    heading: "Help",
    links: [
      { id: "faq", href: "/faq", label: "FAQs" },
      { id: "contact", href: "/contact", label: "Contact Us" },
      { id: "orders", href: "/account/orders", label: "Track Order" },
    ],
  },
  { heading: "Company", links: [{ id: "about", href: "/about", label: "Our Story" }] },
];

const FALLBACK_TAGLINE =
  "Contemporary Pakistani women's fashion, lawn, formal and unstitched collections crafted for everyday elegance.";

export function SiteFooter({
  columns,
  tagline,
  copyrightText,
  logoColor,
  logoSrc,
  storeName,
  paymentMethods = [],
  layout,
}: {
  /** How the footer is arranged. Defaults to the original columns. */
  layout?: FooterLayout;
  columns?: FooterColumn[];
  tagline?: string;
  copyrightText?: string;
  /** Resolved against the footer background, which differs from the header's. */
  logoColor?: string | null;
  /** Resolved for the footer's own background, which may differ from the header's. */
  logoSrc?: string;
  /** Drawn when the shop has no logo at all. Never the platform's artwork. */
  storeName?: string;
  /**
   * The ways this shop takes money, named in the footer.
   *
   * Passed in rather than imported: it used to be a platform-wide constant, so
   * every footer on every store listed the same thing whatever the merchant
   * accepted. See lib/payment-methods.ts.
   */
  paymentMethods?: readonly string[];
}) {
  const footerColumns = columns && columns.length > 0 ? columns : FALLBACK_COLUMNS;

  const mode = layout ?? THEME_LAYOUT_DEFAULTS.footer;

  return (
    <footer
      data-shp-region="footer"
      style={{
        backgroundColor: "var(--shp-footer-bg, var(--color-subtle))",
        color: "var(--shp-footer-text, var(--color-ink))",
      }}
      className="mt-24 border-t border-border"
    >
      {/* Band collapses the columns into one centred stack and halves the
          padding. On a phone the columns footer is most of a screen's worth of
          scrolling before the page ends, which is the thing this fixes. */}
      {/* Band collapses the columns into one centred stack and halves the
          padding. Masthead does the opposite: the shop's name and what it is
          take the left, the menus sit together on the right, and the whole
          thing is given room. */}
      <Container
        className={
          mode === "band"
            ? "flex flex-col items-center gap-6 py-8 text-center"
            : mode === "masthead"
              ? "flex flex-col gap-12 py-14 lg:flex-row lg:items-start lg:justify-between lg:gap-20"
              : "grid grid-cols-2 gap-8 py-12 sm:grid-cols-4"
        }
      >
        <div className={cn(mode === "masthead" ? "max-w-[290px] shrink-0" : "col-span-2 sm:col-span-1")}>
          <Logo color={logoColor} height={24} src={logoSrc} fallbackText={storeName} />
          <p
            className={cn(
              "mt-3 text-sm",
              // The only place in this design where muting is opacity rather
              // than a second colour — it has to sit on whatever ground the
              // merchant chose for the footer, which a fixed grey cannot.
              mode === "masthead" ? "max-w-none opacity-80" : "max-w-xs text-ink-soft"
            )}
          >
            {tagline || FALLBACK_TAGLINE}
          </p>
        </div>

        <div
          className={cn(
            // A row of columns, not a grid of them. `justify-items-end` put
            // each column box at the right of an equal-width cell, so a short
            // label and a long one started at different x positions and the
            // whole block read as ragged — the columns are already pushed
            // right as a group by the parent's justify-between.
            mode === "masthead" && "flex flex-wrap gap-10 sm:gap-16 lg:gap-20",
            mode !== "masthead" && "contents"
          )}
        >
          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h3
                className={cn(
                  mode === "masthead"
                    ? "text-[11px] font-semibold uppercase tracking-[0.09em]"
                    : "text-sm font-semibold text-ink"
                )}
              >
                {column.heading}
              </h3>
              <ul
                className={cn(
                  "mt-3 space-y-2",
                  mode === "masthead" ? "text-[13px] opacity-[0.52]" : "text-sm text-ink-soft"
                )}
              >
                {column.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className={cn(
                        "transition-colors",
                        mode === "masthead" ? "hover:opacity-100" : "hover:text-brand-600"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-border py-4">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-ink-soft sm:flex-row">
          <p>{copyrightText || `© ${new Date().getFullYear()} Your Store. All rights reserved.`}</p>
          <p>{paymentMethods.join(" · ")}</p>
        </Container>
      </div>
    </footer>
  );
}
