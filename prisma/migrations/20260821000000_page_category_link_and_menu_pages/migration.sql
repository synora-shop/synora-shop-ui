-- AlterTable: Page can now represent a Category's collection page (categoryId) or a fixed
-- utility route (routePath) — see the model comment in schema.prisma.
ALTER TABLE "Page" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Page" ADD COLUMN "routePath" TEXT;
CREATE UNIQUE INDEX "Page_categoryId_key" ON "Page"("categoryId");
ALTER TABLE "Page" ADD CONSTRAINT "Page_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: MenuItem can now point at a Page instead of a free-text href. Deleting the
-- Page (directly, or via its Category cascading) deletes the MenuItem too.
ALTER TABLE "MenuItem" ADD COLUMN "pageId" TEXT;
CREATE INDEX "MenuItem_pageId_idx" ON "MenuItem"("pageId");
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing Category gets its auto-created collection Page (retroactively
-- applying the new invariant "every category has a page" to categories that predate it).
-- gen_random_uuid() stands in for Prisma's client-side cuid() default, which only applies
-- to inserts made through the Prisma Client, not raw SQL.
INSERT INTO "Page" (id, slug, title, "isSystem", "isPublished", "categoryId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.slug, c.name, false, true, c.id, now(), now()
FROM "Category" c
WHERE NOT EXISTS (SELECT 1 FROM "Page" p WHERE p."categoryId" = c.id)
  AND NOT EXISTS (SELECT 1 FROM "Page" p2 WHERE p2.slug = c.slug);

-- Backfill: relink existing MenuItem rows that already point at a collection/about/faq href
-- to the actual Page row now that one exists, so they immediately benefit from live
-- title/href resolution instead of their frozen text — see lib/data/menus.ts.
UPDATE "MenuItem" m
SET "pageId" = p.id
FROM "Page" p
JOIN "Category" c ON c.id = p."categoryId"
WHERE m.href = '/collections/' || c.slug AND m."pageId" IS NULL;

UPDATE "MenuItem" m
SET "pageId" = p.id
FROM "Page" p
WHERE p.slug = 'about' AND m.href = '/about' AND m."pageId" IS NULL;

UPDATE "MenuItem" m
SET "pageId" = p.id
FROM "Page" p
WHERE p.slug = 'faq' AND m.href = '/faq' AND m."pageId" IS NULL;
