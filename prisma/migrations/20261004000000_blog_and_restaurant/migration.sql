-- Blog and restaurant, the two business types besides ecommerce.
--
-- Deliberately small. A dish is a Product in a Category — it has a name, a
-- description, a price, a photo and a category, which is exactly that — so a
-- restaurant reuses the product admin, search, the existing sections, and the
-- cart if it ever wants online ordering. Inventing FoodMenu/MenuCategory/Dish
-- would duplicate all of it and collide with the Menu and MenuItem models that
-- already exist for navigation: two things called a menu in one admin.
--
-- So restaurant adds only what a product genuinely lacks — dietary flags, when
-- the shop is open, and where it is — and blog adds one model, because a post is
-- not a Page.
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE "Dietary" AS ENUM (
  'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'HALAL', 'SPICY'
);

-- Flags on the product, not a table: nobody queries "all vegan things across all
-- shops", they filter one menu by one.
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "dietary" "Dietary"[] NOT NULL DEFAULT ARRAY[]::"Dietary"[];

CREATE TABLE "Article" (
  "id"             TEXT NOT NULL,
  "shopId"         TEXT NOT NULL,
  "slug"           TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "excerpt"        TEXT,
  "body"           TEXT NOT NULL,
  "coverImage"     TEXT,
  "authorName"     TEXT,
  "status"         "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt"    TIMESTAMP(3),
  "tags"           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "seoTitle"       TEXT,
  "seoDescription" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- Slugs are unique per shop, never platform-wide: two shops may both write
-- "opening-soon" and neither should be told the name is taken.
CREATE UNIQUE INDEX "Article_shopId_slug_key" ON "Article"("shopId", "slug");
-- The blog index reads published posts newest first; this is that query.
CREATE INDEX "Article_shopId_status_publishedAt_idx"
  ON "Article"("shopId", "status", "publishedAt");

ALTER TABLE "Article" ADD CONSTRAINT "Article_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OpeningHours" (
  "id"         TEXT NOT NULL,
  "shopId"     TEXT NOT NULL,
  -- 0-6 with 0 = Sunday, matching JavaScript's getDay() so nothing converts.
  "day"        INTEGER NOT NULL,
  -- Text, not TIME: these are hours on a sign, not instants, and a
  -- timezone-aware type would invite a conversion that is always wrong somewhere.
  "opensAt"    TEXT,
  "closesAt"   TEXT,
  "closed"     BOOLEAN NOT NULL DEFAULT false,
  -- A second service, for a kitchen that shuts between lunch and dinner.
  "reopensAt"  TEXT,
  "reclosesAt" TEXT,
  CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpeningHours_shopId_day_key" ON "OpeningHours"("shopId", "day");

ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Location" (
  "id"        TEXT NOT NULL,
  "shopId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "address"   TEXT NOT NULL,
  "city"      TEXT,
  "phone"     TEXT,
  -- A link, never an embed: an embedded map is a third-party script running on
  -- a merchant's own domain.
  "mapUrl"    TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Location_shopId_order_idx" ON "Location"("shopId", "order");

ALTER TABLE "Location" ADD CONSTRAINT "Location_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
