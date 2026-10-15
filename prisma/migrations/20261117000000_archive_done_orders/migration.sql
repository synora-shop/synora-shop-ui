-- Tidy delivered, paid orders out of the main list (new admin, 15 October).
-- Additive; off by default, so no list changes.
-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "archiveDoneOrders" BOOLEAN NOT NULL DEFAULT false;

