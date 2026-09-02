/**
 * The colour of the admin's own chrome, per kind of business.
 *
 * A merchant who runs a restaurant and a clothing shop switches between them
 * all day, and the two panels are otherwise identical — same sidebar, same
 * screens, same words in most places. The colour of the bar is what tells them
 * at a glance which one they are editing, before they read anything. That is
 * the whole job: recognition, not decoration.
 *
 * All four are dark and roughly equally heavy, so the app reads as one product
 * wearing four skins rather than four different applications. White text and
 * icons sit on every one of them at well past the contrast floor.
 *
 * `service` is here ahead of the business type itself, which does not exist
 * yet. A colour with nothing to paint is harmless; a type arriving to find no
 * colour would fall back to the default and look broken on the day it ships.
 *
 * Client-safe: pure data, no imports.
 */

export type ChromeSkin = {
  /** The bar itself. */
  bar: string;
  /** A lift for the search field and other insets sitting on the bar. */
  inset: string;
  /** Hover for controls on the bar. */
  hover: string;
};

/**
 * Keyed by the registry's spelling ("ecommerce"), not the database's
 * ("ECOMMERCE"), because this is read by components that already hold the
 * registry form. See lib/themes/business-type.ts for the conversion.
 */
export const CHROME: Record<string, ChromeSkin> = {
  /** Deep maroon. From the BlackBuc mockup. */
  ecommerce: { bar: "#550B01", inset: "#6B1A0D", hover: "#7A2416" },
  /** Deep purple. The second mockup page. */
  restaurant: { bar: "#451058", inset: "#57206B", hover: "#652B7A" },
  /** Deep teal-blue: calm and professional, for consultations and bookings. */
  service: { bar: "#0B3A55", inset: "#164C6B", hover: "#1F5A7A" },
  /** Deep green, for writing. */
  blog: { bar: "#1F4023", inset: "#2C5231", hover: "#36613C" },
};

/** The skin for a business type, falling back rather than rendering colourless. */
export function chromeFor(businessType: string | null | undefined): ChromeSkin {
  return CHROME[businessType ?? ""] ?? CHROME.ecommerce;
}
