-- The four columns a Shopify import was silently dropping.
--
-- All 57 columns of Shopify's product CSV already round-tripped — unread ones
-- ride in `csvExtras` and come back byte-identical — so no *data* was lost.
-- What was lost was behaviour, which is worse, because nothing said so:
--
--   1. `Description` is HTML in Shopify and was rendered as text here, so every
--      imported product printed its own tags at the customer.
--   2. `SEO title` / `SEO description` were read by nothing. Page, Category and
--      Article all have them; Product did not. A merchant's hand-written search
--      titles vanished on migration and their rankings followed.
--   3. `Continue selling when out of stock` was ignored, so pre-order and
--      made-to-order products went from selling at zero stock to refusing the
--      sale.
--   4. `Inventory tracker` and `Requires shipping` were ignored, so an e-book
--      or a service was given a stock count, a weight and a shipping fee.
--
-- Scoping, and why it is not the obvious one: 3 and 4 are **per variant**,
-- because that is how Shopify's CSV carries them — one row per variant, each
-- with its own value. Hanging them off the product instead would read the
-- first variant's value and write it back to all of them, which silently
-- flattens a catalogue that varies them and breaks the lossless round trip
-- that `check:csv` asserts. The admin edits them product-wide, the way
-- Shopify's own editor does; the storage stays faithful to the format.
--
-- `descriptionHtml` is a new column rather than a rewrite of `description`.
-- The plain field is what the admin's own editor writes and what every
-- existing row holds, and overwriting it with markup would corrupt every
-- product that was typed in here rather than imported. HTML is additive: a
-- product has one or the other, and the renderer prefers the HTML when it is
-- there.
--
-- Additive and idempotent, as the deployment model requires: Preview and
-- Production share one database, and a rollback must still find its data. Every
-- default matches the behaviour the code had before this ran, so applying the
-- migration on its own — before the build that reads these columns — changes
-- nothing a customer can see.

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "descriptionHtml" TEXT,
  ADD COLUMN IF NOT EXISTS "seoTitle"        TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription"  TEXT;

-- Defaults are today's behaviour, stated out loud:
--   * everything was tracked          -> trackInventory = true
--   * nothing oversold                -> continueSellingWhenOutOfStock = false
--   * everything was physical         -> requiresShipping = true
ALTER TABLE "ProductVariant"
  ADD COLUMN IF NOT EXISTS "trackInventory"                BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "continueSellingWhenOutOfStock" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requiresShipping"              BOOLEAN NOT NULL DEFAULT true;
