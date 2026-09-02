/**
 * Shopify's product CSV, column for column.
 *
 * Taken verbatim from the template Shopify hands a merchant on its own import
 * screen, in its own order, including the ones this platform never reads. An
 * export from SHOP and an export from Shopify have to diff cleanly: a merchant
 * evaluating a move should be able to open both files and see the same shape,
 * and a file SHOP writes has to load back into Shopify without being edited.
 *
 * Order is part of the format, so this is a list rather than a set, and nothing
 * may be sorted or deduplicated on the way out.
 *
 * Client-safe: pure data.
 */

export const SHOPIFY_PRODUCT_COLUMNS = [
  "Title",
  "URL handle",
  "Description",
  "Vendor",
  "Product category",
  "Type",
  "Tags",
  "Published on online store",
  "Status",
  "SKU",
  "Barcode",
  "Option1 name",
  "Option1 value",
  "Option1 Linked To",
  "Option2 name",
  "Option2 value",
  "Option2 Linked To",
  "Option3 name",
  "Option3 value",
  "Option3 Linked To",
  "Price",
  "Compare-at price",
  "Cost per item",
  "Charge tax",
  "Tax code",
  "Unit price total measure",
  "Unit price total measure unit",
  "Unit price base measure",
  "Unit price base measure unit",
  "Inventory tracker",
  "Inventory quantity",
  "Continue selling when out of stock",
  "Weight value (grams)",
  "Weight unit for display",
  "Requires shipping",
  "Fulfillment service",
  "Product image URL",
  "Image position",
  "Image alt text",
  "Variant image URL",
  "Gift card",
  "SEO title",
  "SEO description",
  "Color (product.metafields.shopify.color-pattern)",
  "Google Shopping / Google product category",
  "Google Shopping / Gender",
  "Google Shopping / Age group",
  "Google Shopping / Manufacturer part number (MPN)",
  "Google Shopping / Ad group name",
  "Google Shopping / Ads labels",
  "Google Shopping / Condition",
  "Google Shopping / Custom product",
  "Google Shopping / Custom label 0",
  "Google Shopping / Custom label 1",
  "Google Shopping / Custom label 2",
  "Google Shopping / Custom label 3",
  "Google Shopping / Custom label 4",
] as const;

export type ShopifyProductColumn = (typeof SHOPIFY_PRODUCT_COLUMNS)[number];

/** How many columns a valid Shopify product CSV has. */
export const SHOPIFY_COLUMN_COUNT = SHOPIFY_PRODUCT_COLUMNS.length;
