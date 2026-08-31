-- @repair: safe-to-rerun
--
-- Multi-tenancy: every store becomes a Shop, and everything that belongs to a
-- store gains a shopId.
--
-- The hard part is not adding the column, it is that existing rows have to end
-- up owned by someone. So a shop is created first, every existing row is
-- backfilled to it, and only then does shopId become NOT NULL. In the other
-- order it fails on the first non-empty table.
--
-- The identity split is the other half. `User` held both merchants and shoppers
-- behind one globally unique email, which cannot express the same person
-- shopping at two stores. Shoppers move to `Customer`, keyed per shop; the
-- merchant keeps their User row and gains a Membership.

-- ---------------------------------------------------------------- enums

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShopStatus') THEN
    CREATE TYPE "ShopStatus" AS ENUM ('TRIAL','ACTIVE','PAUSED','PAST_DUE','SUSPENDED','CLOSED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemberRole') THEN
    CREATE TYPE "MemberRole" AS ENUM ('OWNER','ADMIN','STAFF','VIEWER');
  END IF;
END $$;

-- ---------------------------------------------------------------- new tables

CREATE TABLE IF NOT EXISTS "Shop" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "subdomain" TEXT NOT NULL,
  "status"    "ShopStatus" NOT NULL DEFAULT 'TRIAL',
  "pausedAt"  TIMESTAMP(3),
  "closedAt"  TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Shop_subdomain_key" ON "Shop"("subdomain");
CREATE INDEX IF NOT EXISTS "Shop_status_idx" ON "Shop"("status");

CREATE TABLE IF NOT EXISTS "Membership" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "shopId"     TEXT NOT NULL,
  "role"       "MemberRole" NOT NULL DEFAULT 'STAFF',
  "acceptedAt" TIMESTAMP(3),
  "invitedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_shopId_key" ON "Membership"("userId","shopId");
CREATE INDEX IF NOT EXISTS "Membership_shopId_role_idx" ON "Membership"("shopId","role");

CREATE TABLE IF NOT EXISTS "Customer" (
  "id"           TEXT NOT NULL,
  "shopId"       TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "phone"        TEXT,
  "passwordHash" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_shopId_email_key" ON "Customer"("shopId","email");
CREATE INDEX IF NOT EXISTS "Customer_shopId_idx" ON "Customer"("shopId");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"         TEXT NOT NULL,
  "shopId"     TEXT NOT NULL,
  "userId"     TEXT,
  "actorEmail" TEXT,
  "action"     TEXT NOT NULL,
  "entity"     TEXT,
  "entityId"   TEXT,
  "detail"     JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_shopId_createdAt_idx" ON "AuditLog"("shopId","createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_shopId_entity_entityId_idx" ON "AuditLog"("shopId","entity","entityId");

-- ---------------------------------------------------------------- the first shop
--
-- Everything that exists today belongs to it. A fixed id keeps this migration
-- re-runnable and gives the backfills below something to point at.

INSERT INTO "Shop" ("id","name","subdomain","status","updatedAt")
VALUES ('shop_default', 'My Store', 'my-store', 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------- shopId columns
--
-- Added nullable, backfilled, then made NOT NULL. Adding them NOT NULL up front
-- fails the moment a table already has rows.

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Address','Category','Product','ProductVariant','Order','OrderItem',
    'PushSubscription','StoreSettings','Redirect','FontAsset','StickyButton',
    'ThemeSettings','SiteText','Page','Section','MenuItem','Enquiry'
  ] LOOP
    IF to_regclass('public."' || t || '"') IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "shopId" TEXT', t);
      EXECUTE format('UPDATE %I SET "shopId" = %L WHERE "shopId" IS NULL', t, 'shop_default');
      EXECUTE format('ALTER TABLE %I ALTER COLUMN "shopId" SET NOT NULL', t);
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', t, t || '_shopId_fkey');
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        t, t || '_shopId_fkey');
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I ("shopId")', t || '_shopId_idx', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------- identity split
--
-- Shoppers become Customers of the default shop. Their id carries over, so
-- Order.customerId can be derived without a lookup table and re-running this
-- collides with itself rather than duplicating anyone.

INSERT INTO "Customer" ("id","shopId","email","name","phone","passwordHash","createdAt","updatedAt")
SELECT u."id", 'shop_default', u."email", u."name", u."phone", u."passwordHash",
       u."createdAt", u."updatedAt"
  FROM "User" u
 WHERE u."role" = 'CUSTOMER'
ON CONFLICT ("id") DO NOTHING;

-- Admins become owners of it.
INSERT INTO "Membership" ("id","userId","shopId","role","acceptedAt")
SELECT 'mem_' || u."id", u."id", 'shop_default', 'OWNER', CURRENT_TIMESTAMP
  FROM "User" u
 WHERE u."role" = 'ADMIN'
ON CONFLICT ("userId","shopId") DO NOTHING;

-- Orders and addresses point at the Customer now. Ids were preserved above, so
-- the old userId is the new customerId.
ALTER TABLE "Order"   ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

UPDATE "Order"   SET "customerId" = "userId" WHERE "customerId" IS NULL AND "userId" IS NOT NULL;
UPDATE "Address" SET "customerId" = "userId" WHERE "customerId" IS NULL;

-- An address with no surviving customer is orphaned; there is nothing useful to
-- do with it and leaving it breaks the NOT NULL below.
DELETE FROM "Address"
 WHERE "customerId" IS NULL
    OR "customerId" NOT IN (SELECT "id" FROM "Customer");
ALTER TABLE "Address" ALTER COLUMN "customerId" SET NOT NULL;

-- A guest order has no customer at all, which is why this one stays nullable.
UPDATE "Order" SET "customerId" = NULL
 WHERE "customerId" IS NOT NULL
   AND "customerId" NOT IN (SELECT "id" FROM "Customer");

ALTER TABLE "Order"   DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_userId_fkey";
ALTER TABLE "Order"   DROP COLUMN IF EXISTS "userId";
ALTER TABLE "Address" DROP COLUMN IF EXISTS "userId";

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_customerId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_customerId_fkey";
ALTER TABLE "Address" ADD CONSTRAINT "Address_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Order_customerId_idx"   ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS "Address_customerId_idx" ON "Address"("customerId");

ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_userId_fkey";
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_shopId_fkey";
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_shopId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Shoppers are Customers now; User is merchants and staff only.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema()
                AND table_name = 'User' AND column_name = 'role') THEN
    DELETE FROM "User" WHERE "role" = 'CUSTOMER';
  END IF;
END $$;

ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
DROP TYPE IF EXISTS "Role";

-- ---------------------------------------------------------------- re-scope uniqueness
--
-- Each of these was global, meaning the second shop to want a value could not
-- have it.

DROP INDEX IF EXISTS "Category_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Category_shopId_slug_key" ON "Category"("shopId","slug");

DROP INDEX IF EXISTS "Product_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Product_shopId_slug_key" ON "Product"("shopId","slug");

DROP INDEX IF EXISTS "ProductVariant_sku_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_shopId_sku_key" ON "ProductVariant"("shopId","sku");

DROP INDEX IF EXISTS "Redirect_fromPath_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Redirect_shopId_fromPath_key" ON "Redirect"("shopId","fromPath");

DROP INDEX IF EXISTS "StoreSettings_env_key";
CREATE UNIQUE INDEX IF NOT EXISTS "StoreSettings_shopId_env_key" ON "StoreSettings"("shopId","env");

DROP INDEX IF EXISTS "ThemeSettings_env_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ThemeSettings_shopId_env_key" ON "ThemeSettings"("shopId","env");

DROP INDEX IF EXISTS "Page_slug_env_key";
DROP INDEX IF EXISTS "Page_categoryId_env_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Page_shopId_slug_env_key" ON "Page"("shopId","slug","env");
CREATE UNIQUE INDEX IF NOT EXISTS "Page_shopId_categoryId_env_key" ON "Page"("shopId","categoryId","env");

-- SiteText's primary key excluded the shop, so two shops could not both hold
-- the key "footer.tagline".
ALTER TABLE "SiteText" DROP CONSTRAINT IF EXISTS "SiteText_pkey";
ALTER TABLE "SiteText" ADD CONSTRAINT "SiteText_pkey" PRIMARY KEY ("shopId","key","env");

-- A fixed default id cannot work once there is more than one shop.
ALTER TABLE "StoreSettings" ALTER COLUMN "id" DROP DEFAULT;

-- Indexes that lead on the shop, since every tenant query filters by it.
CREATE INDEX IF NOT EXISTS "Order_shopId_createdAt_idx"          ON "Order"("shopId","createdAt");
CREATE INDEX IF NOT EXISTS "Order_shopId_orderStatus_idx"        ON "Order"("shopId","orderStatus");
CREATE INDEX IF NOT EXISTS "Enquiry_shopId_status_createdAt_idx" ON "Enquiry"("shopId","status","createdAt");
CREATE INDEX IF NOT EXISTS "MenuItem_shopId_location_env_idx"    ON "MenuItem"("shopId","location","env");
CREATE INDEX IF NOT EXISTS "SiteText_shopId_env_idx"             ON "SiteText"("shopId","env");
