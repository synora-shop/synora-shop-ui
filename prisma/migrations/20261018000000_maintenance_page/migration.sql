-- The holding page becomes the merchant's, and can offer to write back.
--
-- Until now a shut store showed words we wrote, and a merchant who paused for
-- an afternoon had no way to say why or when they would return. Worse, pausing
-- and turning on maintenance mode showed two *different* notices, so a merchant
-- who edited one had no idea the other existed.
--
-- One page for both from here on. "Closed" and "suspended" are untouched and
-- stay ours: a store that has closed for good is not the merchant's message to
-- write to someone waiting on an order, and a suspension is ours, not theirs.
--
-- Every column defaults to empty rather than to the text we currently show.
-- Seeding the default wording into every row would freeze today's copy in the
-- database forever — improving it later would then reach nobody. Empty means
-- "use ours", so a shop that never touches this screen keeps getting the best
-- version of it.
--
-- Purely additive. Nothing is rewritten, nothing is dropped, and a deployment
-- running the old code against this schema behaves exactly as before.

ALTER TABLE "StoreSettings"
  ADD COLUMN IF NOT EXISTS "maintenanceHeading"  TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "maintenanceMessage"  TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "maintenanceLogoUrl"  TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "maintenanceShowLogo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "maintenanceSignups"  BOOLEAN NOT NULL DEFAULT false;

-- Someone who asked to be told when the store opens again.
--
-- Its own table rather than a Customer row. A Customer has a required name, an
-- address book and an order history; a visitor who typed one field into a
-- holding page has given us none of that and has not shopped here. Writing
-- them into Customer would mean inventing a name for them and would put people
-- who have never bought anything into every count, export and mailing the
-- merchant runs.
--
-- The email and the moment they asked are the whole of it. That moment is also
-- the consent record, because it is the whole of what they agreed to.
CREATE TABLE IF NOT EXISTS "ReopenSignup" (
  "id"         TEXT NOT NULL,
  "shopId"     TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notifiedAt" TIMESTAMP(3),

  CONSTRAINT "ReopenSignup_pkey" PRIMARY KEY ("id")
);

-- One row per address. Reloading a holding page and submitting again is not a
-- second signup, and the storefront relies on this to stay quiet about whether
-- an address was already there.
CREATE UNIQUE INDEX IF NOT EXISTS "ReopenSignup_shopId_email_key"
  ON "ReopenSignup" ("shopId", "email");

CREATE INDEX IF NOT EXISTS "ReopenSignup_shopId_idx"
  ON "ReopenSignup" ("shopId");

-- Deleting a shop takes its signups with it. These are people who never became
-- customers of a store that no longer exists; there is nothing to keep.
ALTER TABLE "ReopenSignup"
  DROP CONSTRAINT IF EXISTS "ReopenSignup_shopId_fkey";
ALTER TABLE "ReopenSignup"
  ADD CONSTRAINT "ReopenSignup_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
