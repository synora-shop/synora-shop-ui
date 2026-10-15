-- Orders made by hand (new admin, 15 October): a draft the merchant builds
-- for a WhatsApp or phone customer, made into an ordinary order later. New
-- table only.
-- CreateTable
CREATE TABLE "DraftOrder" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WhatsApp',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "customerName" TEXT NOT NULL DEFAULT '',
    "customerEmail" TEXT NOT NULL DEFAULT '',
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "shippingLine1" TEXT NOT NULL DEFAULT '',
    "shippingLine2" TEXT NOT NULL DEFAULT '',
    "shippingCity" TEXT NOT NULL DEFAULT '',
    "shippingPostalCode" TEXT NOT NULL DEFAULT '',
    "lines" JSONB NOT NULL DEFAULT '[]',
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "orderId" TEXT,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DraftOrder_shopId_updatedAt_idx" ON "DraftOrder"("shopId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DraftOrder_shopId_number_key" ON "DraftOrder"("shopId", "number");

-- AddForeignKey
ALTER TABLE "DraftOrder" ADD CONSTRAINT "DraftOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

