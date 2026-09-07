/**
 * Shopify's order export, column for column.
 *
 * Shopify exports orders and does not import them — that gap is why merchants
 * lose their history when they move, and why this file exists. The columns are
 * still Shopify's, in Shopify's order: a merchant moving *in* arrives with a
 * file exactly this shape, and one moving *out* should be able to open ours
 * beside theirs and see the same thing.
 *
 * Every column is written even where this platform has nothing to put in it,
 * so the file keeps its shape and nothing shifts.
 *
 * Client-safe: pure data.
 */

export const SHOPIFY_ORDER_COLUMNS = [
  "Name",
  "Email",
  "Financial Status",
  "Paid at",
  "Fulfillment Status",
  "Fulfilled at",
  "Accepts Marketing",
  "Currency",
  "Subtotal",
  "Shipping",
  "Taxes",
  "Total",
  "Discount Code",
  "Discount Amount",
  "Shipping Method",
  "Created at",
  "Lineitem quantity",
  "Lineitem name",
  "Lineitem price",
  "Lineitem compare at price",
  "Lineitem sku",
  "Lineitem requires shipping",
  "Lineitem taxable",
  "Lineitem fulfillment status",
  "Billing Name",
  "Billing Street",
  "Billing Address1",
  "Billing Address2",
  "Billing Company",
  "Billing City",
  "Billing Zip",
  "Billing Province",
  "Billing Country",
  "Billing Phone",
  "Shipping Name",
  "Shipping Street",
  "Shipping Address1",
  "Shipping Address2",
  "Shipping Company",
  "Shipping City",
  "Shipping Zip",
  "Shipping Province",
  "Shipping Country",
  "Shipping Phone",
  "Notes",
  "Note Attributes",
  "Cancelled at",
  "Payment Method",
  "Payment Reference",
  "Refunded Amount",
  "Vendor",
  "Id",
  "Tags",
  "Source",
  "Phone",
] as const;

export type ShopifyOrderColumn = (typeof SHOPIFY_ORDER_COLUMNS)[number];
