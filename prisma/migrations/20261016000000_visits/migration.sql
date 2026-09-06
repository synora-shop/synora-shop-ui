-- Storefront visits, counted by person rather than by request.
--
-- Purely additive: a new table, empty. Nothing reads it until the analytics
-- screen does, and nothing writes it until the storefront layout does.
--
-- `visitor` is a salted hash of the address, never the address. A visitor count
-- must not become a list of who visited, and a table that holds addresses in
-- the clear becomes exactly that the moment anyone reads it.

CREATE TABLE IF NOT EXISTS "Visit" (
  "id"        TEXT NOT NULL,
  "shopId"    TEXT NOT NULL,
  "path"      TEXT NOT NULL,
  "visitor"   TEXT NOT NULL,
  "country"   TEXT,
  "referrer"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- Every query this table exists for is "this shop, this window", and the live
-- count is "this shop, the last five minutes" — both are this index.
CREATE INDEX IF NOT EXISTS "Visit_shopId_createdAt_idx" ON "Visit"("shopId", "createdAt");
-- Unique-visitor counts group by the hash within a shop.
CREATE INDEX IF NOT EXISTS "Visit_shopId_visitor_idx" ON "Visit"("shopId", "visitor");

DO $$
BEGIN
  ALTER TABLE "Visit"
    ADD CONSTRAINT "Visit_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
