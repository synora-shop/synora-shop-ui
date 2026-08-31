-- Finishing the menu partition.
--
-- Menu was partitioned by business type and MenuItem was not, so the links
-- themselves still escaped the filter: a restaurant's broken-link report kept
-- listing the clothing shop's four collections, because the report reads menu
-- items rather than menus.
--
-- The column is duplicated from the parent menu rather than joined for it. The
-- tenant client filters on columns of the row it is querying, and a link that
-- escapes that filter is the header pointing somewhere the shop has never been.
ALTER TABLE "MenuItem"
  ADD COLUMN IF NOT EXISTS "businessType" "BusinessType" NOT NULL DEFAULT 'ECOMMERCE';

-- Existing items follow the menu they belong to, which is every menu on the
-- platform being an ecommerce menu today.
UPDATE "MenuItem" i
   SET "businessType" = m."businessType"
  FROM "Menu" m
 WHERE i."menuId" = m."id"
   AND i."businessType" <> m."businessType";
