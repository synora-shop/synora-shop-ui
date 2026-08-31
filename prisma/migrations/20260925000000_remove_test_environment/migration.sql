-- @repair: safe-to-rerun
--
-- Removes the test/live split.
--
-- The customizer used to edit a draft copy of a store (env = 'test') and copy
-- it over the real one on Publish. That is gone: there is one store, and the
-- customizer edits it directly.
--
-- Order matters. Every one of these tables is keyed on env, so the draft rows
-- have to go *before* the column does — otherwise dropping it collides two rows
-- onto one primary key and the migration fails halfway.
--
-- This deletes data and cannot be undone. It is deliberate.

-- 1. The drafts themselves. Sections cascade from Page, so they go with it.
DELETE FROM "MenuItem"      WHERE "env" = 'test';
DELETE FROM "Page"          WHERE "env" = 'test';
DELETE FROM "SiteText"      WHERE "env" = 'test';
DELETE FROM "StickyButton"  WHERE "env" = 'test';
DELETE FROM "StoreSettings" WHERE "env" = 'test';
DELETE FROM "ThemeSettings" WHERE "env" = 'test';

-- 2. Constraints that name env, dropped before the column they depend on.
ALTER TABLE "SiteText"      DROP CONSTRAINT IF EXISTS "SiteText_pkey";
DROP INDEX IF EXISTS "Page_shopId_slug_env_key";
DROP INDEX IF EXISTS "Page_shopId_categoryId_env_key";
DROP INDEX IF EXISTS "StoreSettings_shopId_env_key";
DROP INDEX IF EXISTS "ThemeSettings_shopId_env_key";
DROP INDEX IF EXISTS "MenuItem_shopId_location_env_idx";
DROP INDEX IF EXISTS "SiteText_shopId_env_idx";

-- 3. The column.
ALTER TABLE "MenuItem"      DROP COLUMN IF EXISTS "env";
ALTER TABLE "Page"          DROP COLUMN IF EXISTS "env";
ALTER TABLE "SiteText"      DROP COLUMN IF EXISTS "env";
ALTER TABLE "StickyButton"  DROP COLUMN IF EXISTS "env";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "env";
ALTER TABLE "ThemeSettings" DROP COLUMN IF EXISTS "env";

-- 4. The same constraints, rebuilt without it.
--
-- A shop that somehow ended up with two settings rows would block the unique
-- index below, so the extras are removed first, keeping the newest. This cannot
-- happen through the app, but a migration that fails on live data because of a
-- case nobody expected is worse than three lines guarding against it.
DELETE FROM "StoreSettings" a
  USING "StoreSettings" b
  WHERE a."shopId" = b."shopId" AND a."id" < b."id";
DELETE FROM "ThemeSettings" a
  USING "ThemeSettings" b
  WHERE a."shopId" = b."shopId" AND a."id" < b."id";

ALTER TABLE "SiteText" ADD CONSTRAINT "SiteText_pkey" PRIMARY KEY ("shopId", "key");

CREATE UNIQUE INDEX IF NOT EXISTS "Page_shopId_slug_key" ON "Page"("shopId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Page_shopId_categoryId_key" ON "Page"("shopId", "categoryId");
CREATE UNIQUE INDEX IF NOT EXISTS "StoreSettings_shopId_key" ON "StoreSettings"("shopId");
CREATE UNIQUE INDEX IF NOT EXISTS "ThemeSettings_shopId_key" ON "ThemeSettings"("shopId");
CREATE INDEX IF NOT EXISTS "MenuItem_shopId_location_idx" ON "MenuItem"("shopId", "location");
CREATE INDEX IF NOT EXISTS "SiteText_shopId_idx" ON "SiteText"("shopId");
