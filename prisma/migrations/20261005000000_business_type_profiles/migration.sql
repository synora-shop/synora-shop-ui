-- Switching business type must not cost a merchant their store.
--
-- A shop can run an online store, switch to a blog, and switch back — and find
-- the store exactly as it was. That only works if the rows describing a
-- storefront are partitioned by business type rather than overwritten when the
-- type changes. Two are: the theme and its colours, and the pages.
--
-- Products and articles are deliberately NOT partitioned. They coexist
-- harmlessly, and a shop that switches to a blog and back should still have its
-- products — partitioning them would hide a merchant's catalogue behind a
-- setting.
--
-- Every existing row becomes ECOMMERCE, which is what every shop on the
-- platform already is, so the new unique constraints hold with no data changes.

ALTER TABLE "ThemeSettings"
  ADD COLUMN IF NOT EXISTS "businessType" "BusinessType" NOT NULL DEFAULT 'ECOMMERCE',
  -- Moved off Shop: one source of truth, and it has to live beside the tokens
  -- it belongs with or a switch could restore one without the other.
  ADD COLUMN IF NOT EXISTS "themeKey" TEXT NOT NULL DEFAULT 'aurora';

ALTER TABLE "Shop" DROP COLUMN IF EXISTS "themeKey";

DROP INDEX IF EXISTS "ThemeSettings_shopId_key";
CREATE UNIQUE INDEX "ThemeSettings_shopId_businessType_key"
  ON "ThemeSettings"("shopId", "businessType");

ALTER TABLE "Page"
  ADD COLUMN IF NOT EXISTS "businessType" "BusinessType" NOT NULL DEFAULT 'ECOMMERCE';

DROP INDEX IF EXISTS "Page_shopId_slug_key";
CREATE UNIQUE INDEX "Page_shopId_businessType_slug_key"
  ON "Page"("shopId", "businessType", "slug");
