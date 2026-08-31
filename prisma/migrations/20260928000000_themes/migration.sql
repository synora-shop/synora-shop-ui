-- @repair: safe-to-rerun
--
-- Uploaded Shopify themes and their files.
--
-- Purely additive: two new tables, nothing else touched, no rows written. A
-- shop that uploads no theme is unaffected, and rolling back needs nothing
-- undone.
--
-- ThemeFile.content is TEXT and holds the file inline. That is deliberate — it
-- is what the renderer reads on every request and what the code editor writes,
-- and a round trip to object storage for each of a couple of hundred snippets
-- would dominate both. Binary assets keep only a URL.

CREATE TABLE IF NOT EXISTS "Theme" (
  "id"               TEXT NOT NULL,
  "shopId"           TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "author"           TEXT,
  "version"          TEXT,
  "originalFilename" TEXT NOT NULL,
  "sourceRoot"       TEXT NOT NULL DEFAULT '',
  "fileCount"        INTEGER NOT NULL,
  "bytes"            INTEGER NOT NULL,
  "compatScore"      INTEGER NOT NULL,
  "compatReport"     JSONB NOT NULL,
  "securityReport"   JSONB NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Theme_shopId_idx" ON "Theme"("shopId");

DO $$ BEGIN
  ALTER TABLE "Theme" ADD CONSTRAINT "Theme_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ThemeFile" (
  "id"          TEXT NOT NULL,
  "themeId"     TEXT NOT NULL,
  "shopId"      TEXT NOT NULL,
  "path"        TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size"        INTEGER NOT NULL,
  "content"     TEXT,
  "url"         TEXT,
  CONSTRAINT "ThemeFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ThemeFile_themeId_path_key" ON "ThemeFile"("themeId", "path");
CREATE INDEX        IF NOT EXISTS "ThemeFile_shopId_themeId_idx" ON "ThemeFile"("shopId", "themeId");

DO $$ BEGIN
  ALTER TABLE "ThemeFile" ADD CONSTRAINT "ThemeFile_themeId_fkey"
    FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ThemeFile" ADD CONSTRAINT "ThemeFile_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
