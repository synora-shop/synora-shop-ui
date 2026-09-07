-- A shop's logos move from its theme to the shop.
--
-- They were in ThemeSettings.tokens, which is stored per business type. So a
-- merchant who switched from a shop to a restaurant found the header empty,
-- switched back and found it empty again — the same company, the same mark,
-- and two storefronts each holding half of it. A logo is not a style. It
-- belongs to the business.
--
-- Four slots now, on two axes: wide or compact, light or dark background. Only
-- the first is ever needed; lib/brand-marks.ts holds the order a theme walks
-- when it asks for a combination nobody filled in.
--
-- Nothing is destroyed here. The old token keys stay exactly where they are
-- and are simply no longer read, so a deployment that rolls back to the
-- previous build finds every logo still in its theme. They are cleaned up in a
-- later migration, once this one has been live long enough to be sure of.

ALTER TABLE "StoreSettings"
  ADD COLUMN IF NOT EXISTS "logoUrl"            TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "logoDarkUrl"        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "logoCompactUrl"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "logoCompactDarkUrl" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "faviconUrl"         TEXT NOT NULL DEFAULT '';

-- Carry across whatever each shop already had.
--
-- A shop may hold one theme row per business type, and the two facts we want
-- are not necessarily on the same row: a merchant can have uploaded a logo
-- while running as a restaurant and a favicon while running as a shop. So the
-- logo and the favicon are picked independently.
--
-- Within each, the order is: a row that actually has the thing beats one that
-- does not, and only then does the live business type win. Putting the live
-- type first — which is what this did on the first attempt — silently loses the
-- artwork of every merchant who uploaded it under a type they have since
-- switched away from. It looked reasonable and it was wrong; the test for it
-- is scripts/check-brand.ts.

-- A plain temp table rather than ON COMMIT DROP, and dropped explicitly at the
-- end: the two statements below both read it, and ON COMMIT DROP disappears
-- the moment the first one commits when this is applied outside a transaction.
CREATE TEMP TABLE "_carry" AS
WITH logo AS (
  SELECT DISTINCT ON (t."shopId")
         t."shopId",
         COALESCE(NULLIF(t."tokens" ->> 'logoUrl', ''), '') AS value
    FROM "ThemeSettings" t
    JOIN "Shop" s ON s."id" = t."shopId"
   ORDER BY t."shopId",
            (COALESCE(t."tokens" ->> 'logoUrl', '') <> '') DESC,
            (t."businessType" = s."businessType") DESC
),
favicon AS (
  SELECT DISTINCT ON (t."shopId")
         t."shopId",
         COALESCE(NULLIF(t."tokens" ->> 'faviconUrl', ''), '') AS value
    FROM "ThemeSettings" t
    JOIN "Shop" s ON s."id" = t."shopId"
   ORDER BY t."shopId",
            (COALESCE(t."tokens" ->> 'faviconUrl', '') <> '') DESC,
            (t."businessType" = s."businessType") DESC
)
SELECT COALESCE(logo."shopId", favicon."shopId") AS "shopId",
       COALESCE(logo.value, '')    AS logo,
       COALESCE(favicon.value, '') AS favicon
  FROM logo
  FULL OUTER JOIN favicon ON favicon."shopId" = logo."shopId";

-- Only ever fills an empty column, so re-running this changes nothing and a
-- merchant who has already set a mark on the new screen keeps it.
UPDATE "StoreSettings" ss
   SET "logoUrl"    = CASE WHEN ss."logoUrl"    = '' THEN c.logo    ELSE ss."logoUrl"    END,
       "faviconUrl" = CASE WHEN ss."faviconUrl" = '' THEN c.favicon ELSE ss."faviconUrl" END
  FROM "_carry" c
 WHERE c."shopId" = ss."shopId"
   AND (c.logo <> '' OR c.favicon <> '');

-- A shop with a theme but no settings row would otherwise lose its logo, since
-- the update above has no row to write into. Settings are created lazily on
-- first save, so a shop that has never opened Settings is an ordinary state
-- rather than an edge case.
INSERT INTO "StoreSettings" ("id", "shopId", "logoUrl", "faviconUrl")
SELECT gen_random_uuid()::text, c."shopId", c.logo, c.favicon
  FROM "_carry" c
 WHERE (c.logo <> '' OR c.favicon <> '')
   AND NOT EXISTS (SELECT 1 FROM "StoreSettings" x WHERE x."shopId" = c."shopId");

DROP TABLE "_carry";
