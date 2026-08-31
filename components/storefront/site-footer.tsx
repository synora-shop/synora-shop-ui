import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { ENABLED_PAYMENT_METHODS } from "@/lib/payment-methods";

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
}: {
  columns?: FooterColumn[];
  tagline?: string;
  copyrightText?: string;
  /** Resolved against the footer background, which differs from the header's. */
  logoColor?: string | null;
  logoSrc?: string;
}) {
  const footerColumns = columns && columns.length > 0 ? columns : FALLBACK_COLUMNS;

  return (
    <footer
      data-shp-region="footer"
      style={{
        backgroundColor: "var(--shp-footer-bg, var(--color-subtle))",
        color: "var(--shp-footer-text, var(--color-ink))",
      }}
      className="mt-24 border-t border-border"
    >
      <Container className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Logo color={logoColor} height={24} src={logoSrc} />
          <p className="mt-3 max-w-xs text-sm text-ink-soft">{tagline || FALLBACK_TAGLINE}</p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-semibold text-ink">{column.heading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {column.links.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="transition-colors hover:text-brand-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-border py-4">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-ink-soft sm:flex-row">
          <p>{copyrightText || `© ${new Date().getFullYear()} Your Store. All rights reserved.`}</p>
          <p>{ENABLED_PAYMENT_METHODS.map((m) => m.label).join(" · ")}</p>
        </Container>
      </div>
    </footer>
  );
}
