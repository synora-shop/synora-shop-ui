-- AlterTable: StoreSettings gains the "Global Edits" fields — site-wide behavior
-- toggles/values, read live everywhere they apply (including future products/pages).
-- Every default below matches the site's existing behavior exactly, so applying this
-- migration changes nothing visible until an admin actually opens Settings > Global
-- Edits and changes something.
ALTER TABLE "StoreSettings" ADD COLUMN "showInventoryCount" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "StoreSettings" ADD COLUMN "lowStockBadgeText" TEXT NOT NULL DEFAULT 'Only {n} left!';
ALTER TABLE "StoreSettings" ADD COLUMN "outOfStockDisplay" TEXT NOT NULL DEFAULT 'SOLD_OUT';
ALTER TABLE "StoreSettings" ADD COLUMN "newArrivalBadge" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "newArrivalWindowDays" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "StoreSettings" ADD COLUMN "newArrivalBadgeText" TEXT NOT NULL DEFAULT 'New';
ALTER TABLE "StoreSettings" ADD COLUMN "saleBadge" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "defaultShopSort" TEXT NOT NULL DEFAULT 'newest';
ALTER TABLE "StoreSettings" ADD COLUMN "shopGridColumns" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "StoreSettings" ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#4c100f';
ALTER TABLE "StoreSettings" ADD COLUMN "headingStyle" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "StoreSettings" ADD COLUMN "footerCopyrightText" TEXT NOT NULL DEFAULT '© {year} Nautaar. All rights reserved.';
ALTER TABLE "StoreSettings" ADD COLUMN "announcementText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "announcementBgColor" TEXT NOT NULL DEFAULT '#4c100f';
ALTER TABLE "StoreSettings" ADD COLUMN "whatsappOrderButton" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreSettings" ADD COLUMN "shopFilterBar" BOOLEAN NOT NULL DEFAULT true;
