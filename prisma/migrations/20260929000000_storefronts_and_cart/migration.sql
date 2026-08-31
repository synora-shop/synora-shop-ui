-- @repair: safe-to-rerun
--
-- Storefronts (a theme plus its settings) and a server-side cart.
--
-- Additive apart from one nullable column on Region. No existing row changes,
-- so a shop using none of this behaves exactly as before and a rollback needs
-- nothing undone.
--
-- CartLine deliberately stores no price. A line records what and how many; what
-- it costs is read from the variant each time the cart is built, so a basket
-- left open over a price change is never sold at the old number.

CREATE TABLE IF NOT EXISTS "Storefront" (
  "id"              TEXT NOT NULL,
  "shopId"          TEXT NOT NULL,
  "themeId"         TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "handle"          TEXT NOT NULL,
  "settings"        JSONB NOT NULL DEFAULT '{}',
  "sectionSettings" JSONB NOT NULL DEFAULT '{}',
  "templates"       JSONB NOT NULL DEFAULT '{}',
  "isPublished"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Storefront_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Storefront_shopId_handle_key" ON "Storefront"("shopId", "handle");
CREATE INDEX        IF NOT EXISTS "Storefront_shopId_themeId_idx" ON "Storefront"("shopId", "themeId");

DO $$ BEGIN
  ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_themeId_fkey"
    FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- A region may name a storefront. Deleting one clears the pointer rather than
-- the region, which then falls back to whatever is published.
ALTER TABLE "Region" ADD COLUMN IF NOT EXISTS "storefrontId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Region" ADD CONSTRAINT "Region_storefrontId_fkey"
    FOREIGN KEY ("storefrontId") REFERENCES "Storefront"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Cart" (
  "id"         TEXT NOT NULL,
  "shopId"     TEXT NOT NULL,
  "token"      TEXT NOT NULL,
  "customerId" TEXT,
  "note"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- Globally unique: the token is the only thing naming a cart, and it arrives
-- from a cookie before any shop is known.
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_token_key"     ON "Cart"("token");
CREATE INDEX        IF NOT EXISTS "Cart_shopId_idx"     ON "Cart"("shopId");
CREATE INDEX        IF NOT EXISTS "Cart_customerId_idx" ON "Cart"("customerId");

DO $$ BEGIN
  ALTER TABLE "Cart" ADD CONSTRAINT "Cart_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CartLine" (
  "id"        TEXT NOT NULL,
  "cartId"    TEXT NOT NULL,
  "shopId"    TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity"  INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CartLine_pkey" PRIMARY KEY ("id")
);

-- One line per variant: adding the same thing twice raises the quantity rather
-- than making a second line, which is what a shopper expects to see.
CREATE UNIQUE INDEX IF NOT EXISTS "CartLine_cartId_variantId_key" ON "CartLine"("cartId", "variantId");
CREATE INDEX        IF NOT EXISTS "CartLine_shopId_cartId_idx"    ON "CartLine"("shopId", "cartId");

DO $$ BEGIN
  ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_cartId_fkey"
    FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
