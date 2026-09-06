-- Regions are gone, replaced by hiding a shop from chosen countries.
--
-- Regions let a merchant vary the header menu, footer menu and announcement bar
-- by the visitor's country. Nobody used it: the table is empty on production,
-- so every override already fell through to the shop's own settings and this
-- drop changes what no visitor sees.
--
-- What replaced it is smaller on purpose. "Do not show my shop in these
-- countries" is the thing merchants actually asked for, and it needs one column
-- on StoreSettings rather than a table, a resolver and four override columns.

DROP TABLE IF EXISTS "Region";
