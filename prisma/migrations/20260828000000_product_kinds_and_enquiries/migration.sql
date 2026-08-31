-- Product types (standard / bulk / made-to-order) and the enquiries they create.
--
-- Every existing product becomes NORMAL, which is what it already was, so this
-- changes nothing about a catalog that hasn't opted in.

CREATE TYPE "ProductKind" AS ENUM ('NORMAL', 'BULK', 'CUSTOM');
CREATE TYPE "BulkPricing" AS ENUM ('HIDDEN', 'RANGE', 'TIERED');
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUOTED', 'WON', 'LOST');

ALTER TABLE "Product"
  ADD COLUMN "kind"             "ProductKind" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "bulkPricing"      "BulkPricing" NOT NULL DEFAULT 'HIDDEN',
  ADD COLUMN "minOrderQuantity" INTEGER,
  ADD COLUMN "bulkPriceMin"     INTEGER,
  ADD COLUMN "bulkPriceMax"     INTEGER,
  ADD COLUMN "bulkTiers"        JSONB,
  ADD COLUMN "customFields"     JSONB,
  ADD COLUMN "enquiryUrl"       TEXT;

CREATE TABLE "Enquiry" (
  "id"           TEXT NOT NULL,
  "productId"    TEXT,
  "productTitle" TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "phone"        TEXT NOT NULL,
  "company"      TEXT,
  "quantity"     INTEGER,
  "message"      TEXT NOT NULL,
  "details"      JSONB,
  "status"       "EnquiryStatus" NOT NULL DEFAULT 'NEW',
  "notes"        TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");
CREATE INDEX "Enquiry_productId_idx" ON "Enquiry"("productId");

-- SetNull, not Cascade: an enquiry outlives the product it was about. The
-- productTitle snapshot is what keeps it readable afterwards.
ALTER TABLE "Enquiry"
  ADD CONSTRAINT "Enquiry_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
