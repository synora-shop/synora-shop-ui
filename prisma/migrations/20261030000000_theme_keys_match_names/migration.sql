-- A theme's key now matches the name a merchant reads.
--
-- The registry said the opposite, and said it for a good reason: "stable
-- across renames — this is what every storefront has stored, and renaming it
-- would drop every shop running it back to a default." That reasoning holds
-- for a rename done in code alone. It is answered here by moving the stored
-- rows in the same deploy, and by the alias map in lib/themes/registry.ts
-- that keeps the old keys resolving either way.
--
-- Why do it at all: the display names changed on 22 September (Aurora became
-- Loom, Atlas became Kite) and the keys did not. Every document, every check
-- and every log line has since had to carry the translation in someone's head,
-- and `/theme-store/loom` already served a theme whose key said `aurora`. One
-- of the two names had to go, and the one nobody sees is the cheaper one.
--
-- Safe in both directions, which matters because Preview and Production share
-- one database and a rollback must still find its data:
--
--   * New code, unmigrated row ('aurora')  -> LEGACY_THEME_KEYS maps it to
--     'loom'. Correct theme, no change on screen.
--   * Old code, migrated row ('loom')      -> themeFor() does not know the key
--     and falls back to Aurora, which IS Loom under its old name. Correct
--     theme again.
--   * The same holds for atlas/kite, and that pair is the reason the alias map
--     exists rather than relying on the fallback alone: a Kite shop falling
--     back to the default would be served Loom, which is the wrong design
--     rather than the same one under another name.
--
-- Additive in the sense the deployment model requires: no column is dropped,
-- no table rewritten, and every statement is idempotent, so a re-run after a
-- failed deploy changes nothing.

UPDATE "ThemeSettings"  SET "themeKey" = 'loom' WHERE "themeKey" = 'aurora';
UPDATE "ThemeSettings"  SET "themeKey" = 'kite' WHERE "themeKey" = 'atlas';

UPDATE "InstalledTheme" SET "themeKey" = 'loom' WHERE "themeKey" = 'aurora';
UPDATE "InstalledTheme" SET "themeKey" = 'kite' WHERE "themeKey" = 'atlas';

-- The column default was 'aurora': a shop created between this migration and
-- the next deploy would otherwise be stamped with a key the registry no longer
-- has. It would still resolve through the alias, but storing a retired key on
-- a brand-new row is how the next person inherits this same problem.
ALTER TABLE "ThemeSettings" ALTER COLUMN "themeKey" SET DEFAULT 'loom';
