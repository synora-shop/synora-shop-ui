-- Collection copy and SEO, and two-level navigation menus.
--
-- Every column is nullable with no default, so existing collections and menus
-- are unchanged: a collection with no description shows none, and a menu with
-- no nesting renders exactly as it did.

ALTER TABLE "Category"
  ADD COLUMN "description"    TEXT,
  ADD COLUMN "seoTitle"       TEXT,
  ADD COLUMN "seoDescription" TEXT;

-- Self-relation for dropdowns. Cascade on delete: removing a parent removes
-- the items that only existed underneath it, which is what deleting a
-- dropdown means.
ALTER TABLE "MenuItem" ADD COLUMN "parentId" TEXT;

CREATE INDEX "MenuItem_parentId_idx" ON "MenuItem"("parentId");

ALTER TABLE "MenuItem"
  ADD CONSTRAINT "MenuItem_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
