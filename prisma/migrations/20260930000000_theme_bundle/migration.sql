-- A theme's text files move to one JSON bundle in blob storage.
--
-- Additive and nullable: a null bundleUrl means the text is still inline in
-- ThemeFile.content, which is how every theme ingested before this works and
-- how any deployment without blob storage keeps working. Nothing is dropped,
-- so rolling back to the previous build still renders every theme.
ALTER TABLE "Theme" ADD COLUMN IF NOT EXISTS "bundleUrl" TEXT;
