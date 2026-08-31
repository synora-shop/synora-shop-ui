-- @repair: safe-to-rerun
--
-- Regions: a storefront that can look different depending on where the visitor
-- is connecting from.
--
-- Purely additive. No existing table is altered and no row is written, so a
-- shop that defines no regions behaves exactly as it does today and rolling
-- back to the previous build needs nothing undone.
--
-- Every override column is nullable on purpose: null means "inherit the shop's
-- setting", so a region only stores what actually differs.

CREATE TABLE IF NOT EXISTS "Region" (
  "id"                  TEXT NOT NULL,
  "shopId"              TEXT NOT NULL,
  "name"                TEXT NOT NULL,
  "handle"              TEXT NOT NULL,
  -- ISO 3166-1 alpha-2 codes. Empty is allowed: a default region covers
  -- whatever is left over rather than naming every country on earth.
  "countries"           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isDefault"           BOOLEAN NOT NULL DEFAULT false,
  "isActive"            BOOLEAN NOT NULL DEFAULT true,
  "headerMenuId"        TEXT,
  "footerMenuId"        TEXT,
  "announcementText"    TEXT,
  "announcementBgColor" TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Region_shopId_handle_key" ON "Region"("shopId", "handle");
CREATE INDEX        IF NOT EXISTS "Region_shopId_idx"        ON "Region"("shopId");

DO $$ BEGIN
  ALTER TABLE "Region" ADD CONSTRAINT "Region_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- A menu deleted while a region points at it clears the override, which then
-- inherits the shop's menu — the same fallback an unassigned slot already has.
DO $$ BEGIN
  ALTER TABLE "Region" ADD CONSTRAINT "Region_headerMenuId_fkey"
    FOREIGN KEY ("headerMenuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Region" ADD CONSTRAINT "Region_footerMenuId_fkey"
    FOREIGN KEY ("footerMenuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
