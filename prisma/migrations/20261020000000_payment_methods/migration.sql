-- Which ways a customer may pay becomes a per-shop setting.
--
-- It was a constant in lib/payment-methods.ts — one list for the whole
-- platform, set to COD only "temporarily, per request", with a comment saying
-- adding a value back would re-enable it everywhere in one line.
--
-- Meanwhile every merchant's Settings screen offered three boxes for their
-- bank, JazzCash and EasyPaisa details, under the words "leave one blank and it
-- is not offered". That sentence was untrue in both directions: filling a box
-- in offered nothing, because the method was disabled in code, and no merchant
-- could turn one on however much they wanted to.
--
-- Defaults to COD, which is what every shop is serving today, so this changes
-- no storefront until a merchant opens the new screen and says otherwise.
ALTER TABLE "StoreSettings"
  ADD COLUMN IF NOT EXISTS "enabledPaymentMethods" TEXT[] NOT NULL DEFAULT ARRAY['COD']::TEXT[];
