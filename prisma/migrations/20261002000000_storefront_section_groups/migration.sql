-- A merchant's version of the theme's section groups: the header, the
-- overlays and the footer.
--
-- Until now the renderer read those groups straight from the theme's own
-- files, so a merchant could not change anything in them — the header, the
-- whole footer, every drawer and popup. Settings written to sectionSettings
-- were saved and then ignored at render.
--
-- Defaulted rather than nullable, and non-null, so every read is a plain
-- object and no caller has to distinguish "no overrides" from "not set".
ALTER TABLE "Storefront"
  ADD COLUMN IF NOT EXISTS "sectionGroups" JSONB NOT NULL DEFAULT '{}';
