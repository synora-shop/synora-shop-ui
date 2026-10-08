import type { SectionSchema } from "@/lib/section-schema";

/** Kite's product page sections, as the live customizer offers them — every default the file's. */
export const kiteProductSchema: SectionSchema = {
  type: "KITE_PRODUCT",
  label: "Product",
  description: "The product: its photographs, its name and maker, sizes, and the bag.",
  category: "Commerce",
  singleton: true,
  fields: [
    { key: "byLabel", kind: "text", label: "Before the maker", info: "In script, before the maker's name.", default: "by" },
    { key: "colourLabel", kind: "text", label: "Colour", info: "The row's label.", default: "COLOR" },
    { key: "note", kind: "text", label: "Note", info: "Small, over the bag. Put a word between ** to set it bold. Leave empty for none.", default: "This collection is limited to **350** pieces." },
    { key: "addLabel", kind: "text", label: "Add to bag", info: "The words on the light button that adds to the bag.", default: "ADD TO BAG" },
    { key: "favouriteLabel", kind: "text", label: "Add to favourites", info: "Underlined, under the button.", default: "ADD TO FAVORITES" },
    { key: "detailsLabel", kind: "text", label: "Details", info: "The first fold-out row; it opens the product's own details.", default: "details" },
    { key: "shippingLabel", kind: "text", label: "Shipping", info: "The second fold-out row.", default: "SHIPPING" },
    { key: "shippingText", kind: "textarea", label: "Shipping words", info: "What the shipping row opens to.", default: "" },
    // "Style with" sits beside the column above on the desktop — one
    // composition in the file, so one section here.
    { key: "showStyleWith", kind: "checkbox", label: "Show “Style with”", info: "Three pieces to wear with it, on the desktop.", default: true },
    { key: "styleHeading", kind: "text", label: "“Style with” heading", info: "Over the three pieces to wear with it, in Khand capitals.", default: "STYLE WITH", disabledWhen: { field: "showStyleWith", equals: false, message: "“Style with” is hidden." } },
  ],
};
