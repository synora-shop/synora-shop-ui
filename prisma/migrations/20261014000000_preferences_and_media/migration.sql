-- Two shop preferences, and a record of what has been uploaded.
--
-- Purely additive. Both new columns default to the behaviour every existing
-- shop already has — crawlers welcome, honeypot on — so no store changes when
-- this lands, and MediaAsset starts empty.

ALTER TABLE "StoreSettings"
  ADD COLUMN IF NOT EXISTS "searchIndexing" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "spamProtection" BOOLEAN NOT NULL DEFAULT true;

-- The media library.
--
-- Uploads have always gone to Blob storage; nothing has ever written down that
-- they happened. Storage keys are grouped by purpose rather than by shop, so a
-- bucket listing would show one merchant another's pictures — the row is what
-- scopes a library to its owner.
--
-- Files uploaded before this migration are not backfilled. They cannot be:
-- there is no record anywhere of which shop they belong to, which is the whole
-- problem. They stay attached to whatever product or section is using them.
CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id"        TEXT NOT NULL,
  "shopId"    TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "filename"  TEXT NOT NULL,
  "format"    TEXT NOT NULL,
  "size"      INTEGER NOT NULL DEFAULT 0,
  "folder"    TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_url_key" ON "MediaAsset"("url");
CREATE INDEX IF NOT EXISTS "MediaAsset_shopId_createdAt_idx" ON "MediaAsset"("shopId", "createdAt");

DO $$
BEGIN
  ALTER TABLE "MediaAsset"
    ADD CONSTRAINT "MediaAsset_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
