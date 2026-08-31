-- @repair: safe-to-rerun
--
-- Discount codes: what a customer can type at checkout to pay less.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountType') THEN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Discount" (
  "id"               TEXT NOT NULL,
  "shopId"           TEXT NOT NULL,
  "code"             TEXT NOT NULL,
  "type"             "DiscountType" NOT NULL,
  "value"            INTEGER NOT NULL DEFAULT 0,
  "minSubtotal"      INTEGER,
  "usageLimit"       INTEGER,
  "perCustomerLimit" INTEGER,
  "usageCount"       INTEGER NOT NULL DEFAULT 0,
  "startsAt"         TIMESTAMP(3),
  "endsAt"           TIMESTAMP(3),
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- Per shop, not globally: two merchants both wanting SAVE10 is the normal case.
CREATE UNIQUE INDEX IF NOT EXISTS "Discount_shopId_code_key" ON "Discount"("shopId", "code");
CREATE INDEX IF NOT EXISTS "Discount_shopId_idx" ON "Discount"("shopId");

ALTER TABLE "Discount" DROP CONSTRAINT IF EXISTS "Discount_shopId_fkey";
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "DiscountRedemption" (
  "id"         TEXT NOT NULL,
  "shopId"     TEXT NOT NULL,
  "discountId" TEXT NOT NULL,
  "orderId"    TEXT NOT NULL,
  "customerId" TEXT,
  "amount"     INTEGER NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiscountRedemption_pkey" PRIMARY KEY ("id")
);

-- One discount per order, enforced rather than assumed.
CREATE UNIQUE INDEX IF NOT EXISTS "DiscountRedemption_orderId_key"
  ON "DiscountRedemption"("orderId");
CREATE INDEX IF NOT EXISTS "DiscountRedemption_shopId_idx" ON "DiscountRedemption"("shopId");
CREATE INDEX IF NOT EXISTS "DiscountRedemption_discountId_idx" ON "DiscountRedemption"("discountId");
CREATE INDEX IF NOT EXISTS "DiscountRedemption_customerId_idx" ON "DiscountRedemption"("customerId");

ALTER TABLE "DiscountRedemption" DROP CONSTRAINT IF EXISTS "DiscountRedemption_shopId_fkey";
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountRedemption" DROP CONSTRAINT IF EXISTS "DiscountRedemption_discountId_fkey";
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_discountId_fkey"
  FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- What the order actually got. The code and amount are copied onto the order
-- so it still adds up after the discount is renamed, retired or deleted.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "discountId"     TEXT,
  ADD COLUMN IF NOT EXISTS "discountCode"   TEXT,
  ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_discountId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountId_fkey"
  FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
