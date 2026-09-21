-- Free store addresses move from shop.synoradigitals.com to app.synoradigitals.com.
--
-- The product is called Synora App and is served from one address. The store
-- namespace was the last thing still carrying the old name: every shop's free
-- address read `<name>.shop.synoradigitals.com`, so the name a merchant saw in
-- their own address bar was one the product no longer goes by.
--
-- Only the suffix changes. A shop's `subdomain` column is untouched — it never
-- held the domain — so this rewrites the derived hostnames in Domain, which is
-- the single place a full address is stored.
--
-- Both kinds of row move:
--   isPlatform = true   the shop's current free address
--   isPlatform = false  an address it used to have, kept after a rename so old
--                       links still work. Those are ours too and would stop
--                       resolving if left behind.
--
-- A custom domain a merchant owns is untouched: it cannot end in our own
-- domain, because addDomain refuses every hostname classifyHost calls ours.
--
-- No row is dropped and no address stops working: the proxy answers every
-- `*.shop.synoradigitals.com` request with a permanent redirect to the same
-- path on the new address, so links already printed or shared still arrive.

-- A collision would silently lose a row to the unique index on hostname, so
-- refuse to run rather than half-apply. The mapping is one-to-one and nothing
-- has ever been written under the new suffix, so this should never fire —
-- which is exactly when a check is worth having.
DO $$
DECLARE clashes INT;
BEGIN
  SELECT COUNT(*) INTO clashes
  FROM "Domain" d
  WHERE d."hostname" LIKE '%.shop.synoradigitals.com'
    AND EXISTS (
      SELECT 1 FROM "Domain" t
      WHERE t."hostname" =
        LEFT(d."hostname", LENGTH(d."hostname") - LENGTH('.shop.synoradigitals.com'))
        || '.app.synoradigitals.com'
    );

  IF clashes > 0 THEN
    RAISE EXCEPTION
      'stores_move_to_app_host: % hostname(s) already exist under app.synoradigitals.com', clashes;
  END IF;
END $$;

UPDATE "Domain"
SET "hostname" =
  LEFT("hostname", LENGTH("hostname") - LENGTH('.shop.synoradigitals.com'))
  || '.app.synoradigitals.com'
WHERE "hostname" LIKE '%.shop.synoradigitals.com';
