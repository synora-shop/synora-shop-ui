-- A shop can hold the same theme more than once.
--
-- Add makes a *copy*. Press it twice on KITE and the library holds two KITEs,
-- each with its own edits, its own version and its own Added date, and either
-- can be activated. That is what the Themes screen was drawn showing — KITE at
-- v1.1.1 active and KITE at v1.0.4 below it, offering Update — and it is the
-- point of the library: a design being worked on, beside the one serving
-- customers, without either standing in the other's way.
--
-- It was one row per theme per shop, so the second Add silently did nothing.
--
-- Two consequences, and both are the reason this is a migration rather than a
-- loop over an array:
--
--   1. The unique constraint has to go. It is what made a second copy
--      impossible, and an upsert keyed on it is what made the second Add a
--      no-op instead of an error.
--   2. "Which theme is live" stops being an answer. Two copies of KITE are
--      both KITE, so the live *theme* no longer names the live *design*.
--      ThemeSettings gains the id of the copy, and every edit, reset, preview
--      and activation is addressed to that id from here on.
--
-- themeKey stays on ThemeSettings. It still answers "which design is the
-- storefront rendering", which is what the renderer asks, and it is the only
-- thing that still works if a copy is ever deleted out from under it.

-- 1. A theme may be held more than once.
DROP INDEX IF EXISTS "InstalledTheme_shopId_themeKey_key";

-- Lookups by (shop, theme) are still the common ones — the store counts a
-- shop's copies of each theme — and they no longer have a unique index to ride
-- on, so they get their own.
CREATE INDEX IF NOT EXISTS "InstalledTheme_shopId_themeKey_idx"
  ON "InstalledTheme" ("shopId", "themeKey");

-- 2. Which copy is live.
ALTER TABLE "ThemeSettings" ADD COLUMN IF NOT EXISTS "installedThemeId" TEXT;

-- Every shop that has a copy of the theme it is running is pointed at it.
--
-- Oldest first, deliberately. Before this migration a shop could only have one
-- copy of a theme, so at most one row can match and the ordering decides
-- nothing — it is there so that re-running this after copies exist picks the
-- original rather than an arbitrary one.
--
-- A shop with no matching row is left NULL, which the code reads as "no edits
-- for the live theme" — exactly what it read before, from a lookup that found
-- nothing. Nothing is invented to fill the column.
UPDATE "ThemeSettings" ts
SET "installedThemeId" = (
  SELECT it."id"
  FROM "InstalledTheme" it
  WHERE it."shopId" = ts."shopId"
    AND it."themeKey" = ts."themeKey"
  ORDER BY it."installedAt" ASC
  LIMIT 1
)
WHERE ts."installedThemeId" IS NULL;
