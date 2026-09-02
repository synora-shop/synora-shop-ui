-- Hide a shop from chosen countries.
--
-- Purely additive: an empty list means "serve everyone", which is what every
-- existing shop is doing now, so no row changes behaviour when this lands.

ALTER TABLE "StoreSettings"
  ADD COLUMN IF NOT EXISTS "blockedCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
