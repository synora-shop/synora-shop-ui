-- Retire the bettershp name. It is not a brand any more and it is not a URL.
--
-- One row survived the rename: "My Store" still carried
-- my-store.bettershp.com as its platform address, which is why the theme
-- preview pointed at a domain nobody owns. Every other shop had already been
-- moved to <subdomain>.shop.synoradigitals.com.
--
-- Rebuilt from the shop's own subdomain rather than by string-replacing the
-- host, so the result is the address the application would generate today —
-- see PLATFORM_DOMAIN in lib/shop-context.ts.
--
-- The 20260910000000_domains migration still contains the old suffix. That is
-- correct and deliberate: it has been applied, its checksum is recorded, and
-- editing it would make `prisma migrate deploy` refuse to run. A migration is a
-- record of what happened, not a description of how things are now.

UPDATE "Domain" d
   SET "hostname" = s."subdomain" || '.shop.synoradigitals.com'
  FROM "Shop" s
 WHERE d."shopId" = s."id"
   AND d."hostname" LIKE '%.bettershp.com'
   -- Only where the correct address is not already taken, so a shop that has
   -- both rows loses the dead one below rather than colliding here.
   AND NOT EXISTS (
     SELECT 1 FROM "Domain" x
      WHERE x."hostname" = s."subdomain" || '.shop.synoradigitals.com'
   );

-- Anything still on the old suffix now has a working twin, so it is dead weight.
DELETE FROM "Domain" WHERE "hostname" LIKE '%.bettershp.com';
