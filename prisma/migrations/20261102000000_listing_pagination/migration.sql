-- A sortable price column, so the storefront listing can be paginated.
--
-- The listing had no `take`: it read every product a shop owns, with every
-- variant and category, then filtered by price and sorted in JavaScript. At a
-- thousand concurrent visitors on a shop with a real catalogue that is the
-- whole catalogue, in memory, per request.
--
-- Pagination alone does not fix it, because of what the sort is. The price a
-- customer pays is `salePrice ?? basePrice`, which is not a column, so it
-- cannot be ordered by — and ordering a *page* in JavaScript is not sorting,
-- it is sorting twenty-four arbitrary rows. Sorting by price has to happen in
-- the database or it is wrong.
--
-- So the rule gets a column. `effectivePrice` is exactly what
-- lib/product-pricing.ts has always computed, written whenever a price is
-- written, backfilled here for every row that exists.
--
-- Why not a Postgres generated column, which would make drift impossible: a
-- GENERATED ALWAYS column cannot be written by the application, and Prisma
-- includes every scalar it knows about in its INSERT statements. Declaring one
-- in the schema risks every product save failing, and the only way to find out
-- is in production. A column the app maintains is predictable, and
-- `check:scale` fails the build if a write path sets a price without it — which
-- is the drift that would otherwise be invisible until a shop's prices sorted
-- wrongly.
--
-- Additive: the column has a default, the backfill is idempotent, and nothing
-- reads it until the build that ships with this does.

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "effectivePrice" INTEGER NOT NULL DEFAULT 0;

-- COALESCE, not `salePrice IS NULL`, because that is precisely what
-- effectivePrice() returns: the sale price when there is one, the base price
-- otherwise. Re-running this is harmless.
UPDATE "Product"
   SET "effectivePrice" = COALESCE("salePrice", "basePrice")
 WHERE "effectivePrice" IS DISTINCT FROM COALESCE("salePrice", "basePrice");

-- The listing's other orderings are covered by
-- Product_shopId_status_isActive_createdAt_idx. This is the same query sorted
-- the other common way, and without it a price sort reads the shop's rows and
-- sorts them anyway — which is the thing being fixed.
CREATE INDEX IF NOT EXISTS "Product_shopId_status_isActive_effectivePrice_idx"
  ON "Product" ("shopId", "status", "isActive", "effectivePrice");
