-- The new admin's checkout settings (15 October): order notes on or off, the
-- marketing tick box and its words, the automatic checkout reminder, and the
-- delivery estimate. Additive; every default is today's behaviour.
-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "checkoutNotes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "checkoutReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryDaysMax" INTEGER,
ADD COLUMN     "deliveryDaysMin" INTEGER,
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingOptInText" TEXT NOT NULL DEFAULT '';

