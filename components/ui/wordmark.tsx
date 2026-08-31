import { cn } from "@/lib/utils";

/**
 * The wordmark: the mark, the product name, and who makes it.
 *
 * The product is "shop"; Synora Digitals is the company behind it. A one-word
 * product name is too generic to stand alone on a sign-in page — "shop" could
 * be anything — so the maker is set beside it, small, the way a publisher sits
 * under a masthead. It is not a tagline and should not grow into one.
 *
 * The name is HTML text rather than paths in the SVG, so it renders in the
 * actual webfont at any size and stays selectable and searchable.
 *
 * This is the platform's own chrome. Deliberately not the same component as
 * <Logo>, which renders whatever logo a *merchant* has uploaded for their
 * storefront — the platform's identity and a customer's identity must never be
 * able to leak into each other.
 */
export function Wordmark({
  className,
  size = "md",
  markOnly = false,
  maker = "synoradigitals",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Just the mark, for tight spaces like a collapsed sidebar. */
  markOnly?: boolean;
  /**
   * How the maker is credited. "SD" for tight chrome, the full name where
   * there is room — a sign-in page, the marketing site.
   */
  maker?: string;
}) {
  const dims = {
    sm: { mark: "h-4 w-4", text: "text-[13px]", maker: "text-[7px]", gap: "gap-1.5" },
    md: { mark: "h-5 w-5", text: "text-[15px]", maker: "text-[8px]", gap: "gap-2" },
    lg: { mark: "h-7 w-7", text: "text-xl", maker: "text-[10px]", gap: "gap-2.5" },
  }[size];

  return (
    <span className={cn("inline-flex items-center text-brand-600", dims.gap, className)}>
      <svg viewBox="0 0 40 40" aria-hidden className={cn("flex-shrink-0", dims.mark)} fill="currentColor">
        <path d="M2 7.5A5.5 5.5 0 0 1 7.5 2h25A5.5 5.5 0 0 1 38 7.5v25a5.5 5.5 0 0 1-5.5 5.5h-25A5.5 5.5 0 0 1 2 32.5zm3.4 0v25c0 1.16.94 2.1 2.1 2.1h25c1.16 0 2.1-.94 2.1-2.1v-25c0-1.16-.94-2.1-2.1-2.1h-25c-1.16 0-2.1.94-2.1 2.1z" />
        <path d="M7.5 5.4h6.1v29.2H7.5a2.1 2.1 0 0 1-2.1-2.1v-25c0-1.16.94-2.1 2.1-2.1z" />
        <rect x="17.4" y="10.2" width="13.6" height="2.8" rx="1.4" />
        <rect x="17.4" y="17" width="9.4" height="2.8" rx="1.4" opacity="0.45" />
        <rect x="17.4" y="23.8" width="11.6" height="2.8" rx="1.4" opacity="0.45" />
      </svg>
      {!markOnly && (
        <span className="inline-flex flex-col leading-none">
          <span className={cn("font-mono font-semibold tracking-tight text-ink", dims.text)}>
            shop
          </span>
          {/* Sized off the product name rather than fixed, so the lockup holds
              together at every size the mark is used at. */}
          <span className={cn("mt-0.5 tracking-wide text-ink-faint", dims.maker)}>
            {maker}
          </span>
        </span>
      )}
    </span>
  );
}
