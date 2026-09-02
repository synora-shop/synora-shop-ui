-- Variants become named options, the way Shopify has them.
--
-- SHOP had exactly two axes, hardcoded as size and color. Shopify has three,
-- freely named, and two of the three products in Shopify's own sample template
-- could not be represented here at all: a digital product sold by "Format"
-- (PDF, EPUB) and a perfume sold by "Title" (Premium). Forcing those into the
-- size column would show a customer "Size: PDF", which is worse than refusing
-- the import.
--
-- Expand and contract. This half only adds: every option column is filled from
-- the size and color already there, both shapes are valid at once, and nothing
-- reading the old columns changes. The old columns come out in a later
-- migration, once every reader has moved, so the live storefront never has a
-- moment where it is half migrated.

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "option1Name" TEXT,
  ADD COLUMN IF NOT EXISTS "option2Name" TEXT,
  ADD COLUMN IF NOT EXISTS "option3Name" TEXT,
  ADD COLUMN IF NOT EXISTS "vendor"      TEXT,
  ADD COLUMN IF NOT EXISTS "tags"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  -- Thirteen of the columns kept here are Google Shopping fields nothing in
  -- this platform will ever query, so they are JSON rather than real columns.
  ADD COLUMN IF NOT EXISTS "csvExtras"   JSONB  NOT NULL DEFAULT '{}';

ALTER TABLE "ProductVariant"
  ADD COLUMN IF NOT EXISTS "option1"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "option2"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "option3"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "barcode"     TEXT,
  ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER,
  ADD COLUMN IF NOT EXISTS "imageUrl"    TEXT,
  ADD COLUMN IF NOT EXISTS "csvExtras"   JSONB NOT NULL DEFAULT '{}';

-- Every existing variant keeps exactly what it had, under the new names.
UPDATE "ProductVariant"
   SET "option1" = "size",
       "option2" = "color"
 WHERE "option1" = '' AND "option2" = '';

-- And every product that has variants gets the axis names it has always
-- implied. A product whose variants all say "One size" is still a Size axis;
-- naming it anything else would rewrite what the merchant meant.
UPDATE "Product" p
   SET "option1Name" = 'Size',
       "option2Name" = CASE
         WHEN EXISTS (
           SELECT 1 FROM "ProductVariant" v
            WHERE v."productId" = p."id" AND v."color" <> ''
         ) THEN 'Colour'
         ELSE NULL
       END
 WHERE p."option1Name" IS NULL
   AND EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id");

-- The new identity of a variant. Added after the backfill so it is checked
-- against real values rather than a table of empty strings.
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_option1_option2_option3_key"
  ON "ProductVariant"("productId", "option1", "option2", "option3");
