-- A stable name for a page whose address the merchant can now change.
--
-- Home, About and FAQ were identified by their slug: /about loaded the page
-- whose slug was "about". That made the address the identity, so changing the
-- address could not work — renaming the About page to "our-story" would have
-- left /about with nothing to find, and getOrCreateAboutPage would have made a
-- second, empty About page underneath the merchant.
--
-- systemKey is the identity now, and the slug is free to be edited. Backfilled
-- from the slug, which is what it has always been.
--
-- Purely additive: a nullable column and one index. Every custom page keeps a
-- NULL key, and NULLs do not collide under a unique index in Postgres.

ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "systemKey" TEXT;

UPDATE "Page"
   SET "systemKey" = "slug"
 WHERE "isSystem" = true
   AND "systemKey" IS NULL
   AND "slug" IN ('home', 'about', 'faq');

CREATE UNIQUE INDEX IF NOT EXISTS "Page_shopId_businessType_systemKey_key"
  ON "Page" ("shopId", "businessType", "systemKey");
