-- CreateTable: implicit many-to-many join table (Prisma's own naming convention —
-- alphabetically first model = column "A", second = column "B").
CREATE TABLE "_CategoryToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Backfill: carry every existing Product.categoryId over into the join table before the
-- column is dropped, so no product silently loses its category.
INSERT INTO "_CategoryToProduct" ("A", "B")
SELECT "categoryId", "id" FROM "Product" WHERE "categoryId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToProduct_AB_unique" ON "_CategoryToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToProduct_B_index" ON "_CategoryToProduct"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey / DropIndex / DropColumn: the old single-category scalar FK is now redundant.
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";
DROP INDEX "Product_categoryId_idx";
ALTER TABLE "Product" DROP COLUMN "categoryId";
