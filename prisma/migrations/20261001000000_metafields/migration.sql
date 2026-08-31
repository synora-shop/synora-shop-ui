-- Custom fields, in Shopify's shape.
--
-- Purely additive: a new table, no changes to existing ones. A shop with no
-- metafields behaves exactly as it did, and rolling back to the previous build
-- loses nothing but these rows.
--
-- Owner is (ownerType, ownerId) rather than a nullable foreign key per model.
-- The set of things that can carry a metafield grows, and a column per owner
-- would mean a migration each time one is added. The database therefore cannot
-- enforce the reference; lib/data/metafields.ts is the only writer and checks
-- the owner exists before writing.
--
-- ownerId is NOT NULL with "" for shop-level fields. A nullable column inside
-- the unique index below would defeat it: two nulls are never equal in SQL, so
-- the same shop-level field could be stored twice.
CREATE TABLE IF NOT EXISTS "Metafield" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT '',
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metafield_pkey" PRIMARY KEY ("id")
);

-- Every read is "the metafields for this owner", so this is the index that
-- matters: rendering a product page must not scan a shop's whole set.
CREATE INDEX IF NOT EXISTS "Metafield_shopId_ownerType_ownerId_idx"
    ON "Metafield"("shopId", "ownerType", "ownerId");

-- One value per field per owner, so saving the same field twice is an edit
-- rather than a duplicate a reader would have to choose between. Named as
-- Prisma names it, so the schema and the database agree.
CREATE UNIQUE INDEX IF NOT EXISTS "Metafield_shopId_ownerType_ownerId_namespace_key_key"
    ON "Metafield"("shopId", "ownerType", "ownerId", "namespace", "key");

ALTER TABLE "Metafield"
    ADD CONSTRAINT "Metafield_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
