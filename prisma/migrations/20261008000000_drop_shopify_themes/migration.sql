-- Shopify theme compatibility, removed.
--
-- The platform ships its own React themes now, so nothing uploads a theme,
-- nothing interprets Liquid, and none of this is reachable. Dropped rather than
-- left behind: a table nothing writes to is a table someone later has to work
-- out the meaning of.
--
-- Storefront held a merchant's arrangement of an uploaded theme. Theme and
-- ThemeFile held the archive itself.
--
-- Cart and CartLine go with them. A server side basket existed because a
-- Shopify theme renders its cart server side and calls /cart/add.js expecting
-- an answer; the React storefront keeps its basket in the browser. Worth
-- rebuilding later on its own terms, as a basket that survives changing device,
-- rather than kept in the shape Shopify needed.
--
-- Region survives. Its storefront pointer was already nullable, so a region
-- simply stops naming a look and keeps its locale and currency.
ALTER TABLE "Region" DROP COLUMN IF EXISTS "storefrontId";

DROP TABLE IF EXISTS "CartLine";
DROP TABLE IF EXISTS "Cart";
DROP TABLE IF EXISTS "Storefront";
DROP TABLE IF EXISTS "ThemeFile";
DROP TABLE IF EXISTS "Theme";
