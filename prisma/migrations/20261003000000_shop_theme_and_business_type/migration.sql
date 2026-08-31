-- What kind of business a shop is, and which of our themes it wears.
--
-- Both defaulted and non-null so every existing shop gets a valid value and no
-- read has to handle "not set". ECOMMERCE and 'aurora' are what every shop on
-- the platform already is: Aurora is the storefront that has always shipped,
-- registered under a name so a second one can stand beside it.
--
-- Nothing reads either column yet. This migration changes no behaviour.
CREATE TYPE "BusinessType" AS ENUM ('ECOMMERCE', 'BLOG', 'RESTAURANT');

ALTER TABLE "Shop"
  ADD COLUMN IF NOT EXISTS "businessType" "BusinessType" NOT NULL DEFAULT 'ECOMMERCE',
  ADD COLUMN IF NOT EXISTS "themeKey" TEXT NOT NULL DEFAULT 'aurora';
