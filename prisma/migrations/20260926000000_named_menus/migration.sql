-- @repair: safe-to-rerun
--
-- Menus become things a merchant creates and points somewhere, instead of two
-- fixed lists identified by MenuItem.location.
--
-- Deliberately additive. Nothing is dropped: MenuItem.location keeps its data
-- and merely stops being read, so redeploying the previous build still works if
-- something here is wrong. Dropping it is a separate migration once the new
-- shape has been seen working on real data.
--
-- Every statement is guarded and every insert is ON CONFLICT DO NOTHING, so a
-- half-applied run can be repeated safely.

-- 1. The menus themselves.
CREATE TABLE IF NOT EXISTS "Menu" (
  "id"        TEXT NOT NULL,
  "shopId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "handle"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Menu_shopId_handle_key" ON "Menu"("shopId", "handle");
CREATE INDEX        IF NOT EXISTS "Menu_shopId_idx"        ON "Menu"("shopId");

DO $$ BEGIN
  ALTER TABLE "Menu" ADD CONSTRAINT "Menu_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. One menu per (shop, location) that actually has items today.
--
-- The id is derived from the shop and handle rather than random, so re-running
-- this produces the same rows and the ON CONFLICT below has something to match.
INSERT INTO "Menu" ("id", "shopId", "name", "handle")
SELECT DISTINCT
  'menu_' || "shopId" || '_main',
  "shopId",
  'Main menu',
  'main-menu'
FROM "MenuItem" WHERE "location" = 'HEADER'
ON CONFLICT DO NOTHING;

INSERT INTO "Menu" ("id", "shopId", "name", "handle")
SELECT DISTINCT
  'menu_' || "shopId" || '_footer',
  "shopId",
  'Footer menu',
  'footer-menu'
FROM "MenuItem" WHERE "location" = 'FOOTER'
ON CONFLICT DO NOTHING;

-- A shop with settings but no menu items yet still gets a main menu, so the
-- admin has something to show and the storefront has something to fall back to.
INSERT INTO "Menu" ("id", "shopId", "name", "handle")
SELECT 'menu_' || "id" || '_main', "id", 'Main menu', 'main-menu'
FROM "Shop"
ON CONFLICT DO NOTHING;

-- 3. Point the items at them. Nullable first so the backfill has somewhere to
-- write, NOT NULL afterwards once nothing is left unassigned.
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "menuId" TEXT;

UPDATE "MenuItem" i
   SET "menuId" = m."id"
  FROM "Menu" m
 WHERE m."shopId" = i."shopId"
   AND m."handle" = CASE i."location" WHEN 'FOOTER' THEN 'footer-menu' ELSE 'main-menu' END
   AND i."menuId" IS NULL;

-- Anything still unassigned would fail the NOT NULL below and take the whole
-- migration with it. There should be none; this makes that visible rather than
-- fatal by parking them in the shop's main menu.
UPDATE "MenuItem" i
   SET "menuId" = m."id"
  FROM "Menu" m
 WHERE m."shopId" = i."shopId" AND m."handle" = 'main-menu' AND i."menuId" IS NULL;

ALTER TABLE "MenuItem" ALTER COLUMN "menuId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey"
    FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "MenuItem_shopId_menuId_idx" ON "MenuItem"("shopId", "menuId");
DROP INDEX IF EXISTS "MenuItem_shopId_location_idx";

-- 4. location stops being required, but keeps its values.
ALTER TABLE "MenuItem" ALTER COLUMN "location" DROP NOT NULL;

-- 5. The slots, pointed at what each shop is already showing.
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "headerMenuId" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "footerMenuId" TEXT;

UPDATE "StoreSettings" s
   SET "headerMenuId" = m."id"
  FROM "Menu" m
 WHERE m."shopId" = s."shopId" AND m."handle" = 'main-menu' AND s."headerMenuId" IS NULL;

UPDATE "StoreSettings" s
   SET "footerMenuId" = m."id"
  FROM "Menu" m
 WHERE m."shopId" = s."shopId" AND m."handle" = 'footer-menu' AND s."footerMenuId" IS NULL;

-- Cleared deliberately rather than pointed at a deleted menu: the storefront
-- falls back to the shop's first menu when a slot is empty.
DO $$ BEGIN
  ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_headerMenuId_fkey"
    FOREIGN KEY ("headerMenuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_footerMenuId_fkey"
    FOREIGN KEY ("footerMenuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
