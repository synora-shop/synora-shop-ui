-- The sections blog and restaurant storefronts are built from.
--
-- Added to the existing SectionType rather than given a type of their own: a
-- section is a section, and one library shared across every theme is what makes
-- the seventh theme cheap. A restaurant theme offers these and an ecommerce
-- theme does not, which is a decision in the theme registry, not in the data.
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'ARTICLE_LIST';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'MENU_LIST';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'OPENING_HOURS';
ALTER TYPE "SectionType" ADD VALUE IF NOT EXISTS 'LOCATION_INFO';
