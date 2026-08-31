-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable: Product gets draft/publish status + soft-delete (Bin) marker.
-- Default 'PUBLISHED' so existing live products stay published after this migration.
ALTER TABLE "Product" ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Order gets a soft-delete (Bin) marker — excluded from revenue/profit
-- aggregates while set, restored to normal accounting when cleared.
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: OrderItem.productId/variantId become optional with ON DELETE SET NULL
-- (were required/RESTRICT) so a Product or ProductVariant can be permanently deleted
-- from the Bin even if it has order history — OrderItem already snapshots title/size/
-- color/price/costPrice, so nothing in the UI depends on the live relation.
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "variantId" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
