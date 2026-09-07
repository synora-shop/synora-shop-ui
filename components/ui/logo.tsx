import { safeAssetUrl } from "@/lib/icon-validation";
import { cn } from "@/lib/utils";

/** The artwork shipped with the app, used when nothing has been uploaded. */
export const BUILTIN_LOGO = "/logo.svg";

/**
 * The store's wordmark, optionally re-tinted.
 *
 * Recolouring uses a CSS mask rather than inlining the SVG. That matters for
 * two reasons: the artwork stays a fetched file (so nothing has to parse or
 * embed it), and — more importantly — it keeps working for a logo an admin
 * uploads without weakening the rule that uploaded SVGs are rendered through
 * <img> and never inlined. An inline-to-recolour approach would have forced a
 * choice between the feature and that protection.
 *
 * The masked branch sizes itself from a hidden copy of the image rather than a
 * hard-coded aspect ratio, so an uploaded logo of any proportion renders
 * undistorted without anyone having to record its dimensions.
 *
 * The trade-off is that a mask carries shape, not colour, so it suits a
 * single-colour mark. A multi-colour upload should stay on "Original artwork",
 * and the Theme panel says so.
 */
export function Logo({
  color,
  className,
  height = 24,
  src,
  alt = "Store logo",
  fallbackText,
}: {
  /** null or omitted renders the original artwork untouched. */
  color?: string | null;
  className?: string;
  height?: number;
  src?: string;
  alt?: string;
  /**
   * Drawn as a wordmark when there is no image — the shop's own name.
   *
   * Without this the empty case fell through to BUILTIN_LOGO, which is *this
   * platform's* artwork, so every storefront that had never uploaded a logo
   * wore our mark in its header. The Home screen had been telling merchants
   * the opposite for as long as it existed: "leave this empty and your store
   * name is used as the header instead."
   *
   * Omitted only by the platform's own site, which really does want its own
   * artwork.
   */
  fallbackText?: string;
}) {
  // Re-checked at the point of use, not only where it was stored: this value
  // reaches both an <img src> and a CSS url(), and a bad one is treated as no
  // image at all rather than rendered unverified.
  const safeSrc = src ? safeAssetUrl(src) : null;

  if (!safeSrc) {
    // A shop with no mark gets its name, set in the storefront's heading face.
    // Only the platform's own site, which passes no fallbackText, still gets
    // the built-in artwork.
    if (fallbackText) {
      return (
        <span
          className={cn("font-serif leading-none font-semibold whitespace-nowrap", className)}
          // Matched to the height the image would have taken, so switching a
          // logo on or off does not change the height of the header.
          style={{ fontSize: Math.round(height * 0.75), color: color ?? undefined }}
        >
          {fallbackText}
        </span>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- SVG logo, skip the image optimizer
      <img src={BUILTIN_LOGO} alt={alt} className={cn("w-auto", className)} style={{ height }} />
    );
  }

  if (!color) {
    // eslint-disable-next-line @next/next/no-img-element -- SVG logo, skip the image optimizer
    return <img src={safeSrc} alt={alt} className={cn("w-auto", className)} style={{ height }} />;
  }

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn("inline-block align-middle", className)}
      style={{
        height,
        backgroundColor: color,
        maskImage: `url("${safeSrc}")`,
        WebkitMaskImage: `url("${safeSrc}")`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    >
      {/* Sizes the masked box to the artwork's own proportions. Hidden rather
          than removed, because the box needs its width from something. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- sizing proxy, never painted */}
      <img src={safeSrc} alt="" aria-hidden style={{ height, width: "auto", visibility: "hidden" }} />
    </span>
  );
}
