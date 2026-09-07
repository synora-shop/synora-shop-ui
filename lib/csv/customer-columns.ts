/**
 * Shopify's customer CSV, column for column.
 *
 * The same contract as the product columns beside this: an export from SHOP
 * and an export from Shopify have to diff cleanly, and a file SHOP writes has
 * to load back into Shopify without being edited. Order is part of the format,
 * so this is a list rather than a set.
 *
 * Every column is written even where this platform has nothing to say, so the
 * file keeps its shape and a merchant who set a field on Shopify can see where
 * it goes.
 *
 * Client-safe: pure data.
 */

export const SHOPIFY_CUSTOMER_COLUMNS = [
  "First Name",
  "Last Name",
  "Email",
  "Accepts Email Marketing",
  "Company",
  "Address1",
  "Address2",
  "City",
  "Province",
  "Province Code",
  "Country",
  "Country Code",
  "Zip",
  "Phone",
  "Accepts SMS Marketing",
  "Total Spent",
  "Total Orders",
  "Note",
  "Tax Exempt",
  "Tags",
] as const;

export type ShopifyCustomerColumn = (typeof SHOPIFY_CUSTOMER_COLUMNS)[number];
