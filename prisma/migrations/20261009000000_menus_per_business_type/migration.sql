-- Navigation belongs to a kind of business.
--
-- Pages and the theme were partitioned by business type; menus were not, and
-- the gap showed. A shop that switched to Restaurant kept its clothing
-- navigation, so its header pointed at /collections/lawn and every one of those
-- links took a customer to a Not Found page. The admin correctly reported four
-- broken links and the merchant had no way to understand why a restaurant was
-- being asked about lawn.
--
-- Every existing menu becomes an ecommerce menu, which is what every shop on
-- the platform already was, so the new unique holds with no data changes.
ALTER TABLE "Menu"
  ADD COLUMN IF NOT EXISTS "businessType" "BusinessType" NOT NULL DEFAULT 'ECOMMERCE';

DROP INDEX IF EXISTS "Menu_shopId_handle_key";
CREATE UNIQUE INDEX "Menu_shopId_businessType_handle_key"
  ON "Menu"("shopId", "businessType", "handle");
