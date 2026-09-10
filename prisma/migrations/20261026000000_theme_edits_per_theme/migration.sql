-- A theme's colours and arrangement move onto the theme itself.
--
-- They lived on ThemeSettings, which is one row per shop per business type — so
-- a merchant's edits applied to whichever theme happened to be live. There was
-- exactly one set of colours, and therefore no way to work on a second design
-- without changing the first, or the storefront.
--
-- Moving them onto InstalledTheme is what makes an unpublished theme editable:
-- each added theme carries its own edits, so Atlas can be worked on for a week
-- while Aurora keeps serving customers, and switching back and forth loses
-- nothing either way.
ALTER TABLE "InstalledTheme" ADD COLUMN IF NOT EXISTS "tokens" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "InstalledTheme" ADD COLUMN IF NOT EXISTS "layout" JSONB NOT NULL DEFAULT '{}';

-- Carry every shop's existing work onto the theme it was made for.
--
-- Matched on themeKey, because that is the theme those edits were being applied
-- to. A shop whose edits were made against Aurora keeps them on Aurora; adding
-- Atlas afterwards starts from Atlas's own look rather than inheriting somebody
-- else's colours, which is the behaviour that was impossible before.
UPDATE "InstalledTheme" it
SET "tokens" = ts."tokens",
    "layout" = ts."layout"
FROM "ThemeSettings" ts
WHERE ts."shopId" = it."shopId"
  AND ts."themeKey" = it."themeKey"
  AND ts."tokens" IS NOT NULL;

-- ThemeSettings.tokens and .layout are left in place and read by nothing. They
-- are the only record of what a shop looked like before this ran, and a dropped
-- column cannot be un-dropped.
