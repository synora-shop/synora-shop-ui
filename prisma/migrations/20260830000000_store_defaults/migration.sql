-- Store defaults: the facts a store is expressed in.
--
-- All defaulted, so an existing store keeps working and simply reports the
-- values it was already implicitly using.

ALTER TABLE "StoreSettings"
  ADD COLUMN "storeName"   TEXT NOT NULL DEFAULT 'Your Store',
  ADD COLUMN "currency"    TEXT NOT NULL DEFAULT 'PKR',
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'PK',
  ADD COLUMN "unitSystem"  TEXT NOT NULL DEFAULT 'METRIC',
  ADD COLUMN "weightUnit"  TEXT NOT NULL DEFAULT 'kg',
  ADD COLUMN "timeZone"    TEXT NOT NULL DEFAULT 'Asia/Karachi';
