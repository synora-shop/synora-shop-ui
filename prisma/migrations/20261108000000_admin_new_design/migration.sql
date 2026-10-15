-- The new admin (15 October): what its screens need that the database did
-- not hold yet. Additive only: new columns with defaults, two new tables,
-- nothing existing altered or dropped.
--
--   CheckoutDraft  checkouts customers started and did not finish, for
--                  Orders > Abandoned checkouts and its reminders
--   OrderEvent     each order's timeline: stage and payment changes, the
--                  courier handover, notes the team leaves
--   Order          courier and tracking number
--   Enquiry        the quote (price per piece, when) and when it was first
--                  answered, for "Usually answered in"
--   Customer       the team's note, tags, and the customer's own yes to offers
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "acceptsMarketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "quotedAt" TIMESTAMP(3),
ADD COLUMN     "quotedPrice" INTEGER;

-- CreateTable
CREATE TABLE "CheckoutDraft" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "lines" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "step" TEXT NOT NULL DEFAULT 'contact',
    "remindedAt" TIMESTAMP(3),
    "recoveredOrderId" TEXT,
    "recoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "by" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutDraft_shopId_updatedAt_idx" ON "CheckoutDraft"("shopId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutDraft_shopId_token_key" ON "CheckoutDraft"("shopId", "token");

-- CreateIndex
CREATE INDEX "OrderEvent_shopId_orderId_createdAt_idx" ON "OrderEvent"("shopId", "orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "CheckoutDraft" ADD CONSTRAINT "CheckoutDraft_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

