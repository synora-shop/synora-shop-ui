-- A visit is counted, not listed.
--
-- Every storefront page view inserted a row. At a thousand concurrent
-- visitors that is a row per view, forever, in the largest table in the
-- database — and retention is 400 days. The arithmetic does not work on any
-- plan: one busy shop writes hundreds of megabytes a month on its own.
--
-- The obvious fix is to stop recording repeat views, and it is wrong: the
-- analytics screen reports **views** and **distinct people** from these same
-- rows, so collapsing them silently changes a merchant's numbers.
--
-- So the row stays and gains a counter. One row per visitor, per path, per
-- day, per referrer, with `views` incremented on each repeat. Growth stops
-- being "page views" and becomes "visitor-path-days", which is bounded by how
-- many people visit rather than by how much they browse — and every figure the
-- screen shows is still exactly derivable:
--
--   views      count(*)                 ->  sum(views)
--   people     count(DISTINCT visitor)  ->  unchanged
--   top paths  count(*) by path         ->  sum(views) by path
--   referrers  count(*) by referrer     ->  sum(views) by referrer
--   live now   createdAt >= now - 5m    ->  lastSeenAt >= now - 5m
--
-- Three details that decide whether this is exact or merely close:
--
-- `day` is the date **in the shop's own time zone**, computed when the row is
-- written. The read grouped by `createdAt AT TIME ZONE tz`; if the key were a
-- UTC day the two would disagree for every shop that is not on UTC — a shop in
-- PKT would have one row spanning two of its own days, and a day's figures
-- would be wrong by whatever happened after 19:00 UTC. Grouping by the stored
-- day is also simpler than the conversion it replaces.
--
-- `referrer` becomes NOT NULL, empty for direct traffic. Postgres treats two
-- NULLs as distinct in a unique index, so a nullable column in the key would
-- de-duplicate nothing at all for direct visits — which are most of them. The
-- same reasoning, and the same remedy, as Metafield.ownerId.
--
-- `lastSeenAt` exists only so "right now" survives. It is the one figure that
-- needs when the *latest* view happened rather than the first.
--
-- Existing rows are aggregated rather than dropped: a merchant's history is
-- the point of keeping them. Their `day` is their UTC date, which is the best
-- that can be recovered and only matters for days already past.

ALTER TABLE "Visit"
  ADD COLUMN IF NOT EXISTS "day"        DATE,
  ADD COLUMN IF NOT EXISTS "views"      INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

UPDATE "Visit"
   SET "day"        = COALESCE("day", ("createdAt")::date),
       "lastSeenAt" = COALESCE("lastSeenAt", "createdAt"),
       "referrer"   = COALESCE("referrer", '')
 WHERE "day" IS NULL OR "lastSeenAt" IS NULL OR "referrer" IS NULL;

ALTER TABLE "Visit"
  ALTER COLUMN "day"        SET NOT NULL,
  ALTER COLUMN "lastSeenAt" SET NOT NULL,
  ALTER COLUMN "referrer"   SET NOT NULL,
  ALTER COLUMN "referrer"   SET DEFAULT '';

-- Collapse what is already there into the shape the unique index requires.
-- Keeps the earliest row of each group, sums the views onto it, and carries
-- the latest sighting across — so no history is lost, only its repetition.
WITH grouped AS (
  SELECT min("id") AS keep_id,
         "shopId", "visitor", "path", "day", "referrer",
         sum("views")      AS total_views,
         max("lastSeenAt") AS last_seen,
         count(*)          AS rows_in_group
    FROM "Visit"
   GROUP BY "shopId", "visitor", "path", "day", "referrer"
  HAVING count(*) > 1
)
UPDATE "Visit" v
   SET "views"      = g.total_views,
       "lastSeenAt" = g.last_seen
  FROM grouped g
 WHERE v."id" = g.keep_id;

DELETE FROM "Visit" v
 USING (
   SELECT "id",
          row_number() OVER (
            PARTITION BY "shopId", "visitor", "path", "day", "referrer"
            -- The same row the UPDATE above summed onto (min("id")). Ordering
            -- by createdAt here could keep a different row and delete the sums.
            ORDER BY "id"
          ) AS rn
     FROM "Visit"
 ) d
 WHERE v."id" = d."id" AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "Visit_shopId_visitor_path_day_referrer_key"
  ON "Visit" ("shopId", "visitor", "path", "day", "referrer");

-- The day grouping every chart now reads, and the five-minute live figure.
CREATE INDEX IF NOT EXISTS "Visit_shopId_day_idx"        ON "Visit" ("shopId", "day");
CREATE INDEX IF NOT EXISTS "Visit_shopId_lastSeenAt_idx" ON "Visit" ("shopId", "lastSeenAt");
