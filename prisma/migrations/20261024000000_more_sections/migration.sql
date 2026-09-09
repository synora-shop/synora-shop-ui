-- Twenty-two more kinds of section, taking a page from twelve to thirty-four.
--
-- The section a merchant picks is stored as an enum, so a type that exists in
-- lib/section-schema.ts and not here is a section nobody can add: the picker
-- offers it, the settings panel renders, and saving fails. Every schema entry
-- needs its value here, and `npm run check:sections` asserts the two lists
-- agree so this cannot drift again.
--
-- Additive only. Nothing existing changes, no page is touched, and a shop that
-- never opens the picker renders exactly what it rendered before.

ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'VIDEO';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'IMAGE_COMPARISON';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'GALLERY';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'MARQUEE';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'COLLAGE';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'LOGO_LIST';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'PRODUCT_CAROUSEL';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'COLLECTION_SHOWCASE';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'CATEGORY_LIST';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'COMPARISON_TABLE';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'COUNTDOWN';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'TRUST_BADGES';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'TESTIMONIALS';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'MULTICOLUMN';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'STEPS';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'TIMELINE';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'STATS';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'HIGHLIGHT_TEXT';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'TEAM';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'DIVIDER';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'SPACER';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'BUTTON_ROW';
