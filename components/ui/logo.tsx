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
  src = BUILTIN_LOGO,
  alt = "Store logo",
}: {
  /** null or omitted renders the original artwork untouched. */
  color?: string | null;
  className?: string;
  height?: number;
  src?: string;
  alt?: string;
}) {
  // Re-checked at the point of use, not only where it was stored: this value
  // reaches both an <img src> and a CSS url(), and a bad one falls back to the
  // built-in mark rather than rendering something unverified.
  const safeSrc = safeAssetUrl(src) ?? BUILTIN_LOGO;

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
