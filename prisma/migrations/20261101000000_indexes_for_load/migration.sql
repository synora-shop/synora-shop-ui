-- Six indexes the hot paths need and did not have.
--
-- Found while working out what a thousand people on one shop would do to this
-- database. Every one of these is a query that already runs on a schedule or on
-- every page view, against a column combination no index covers — so Postgres
-- reads the whole of that shop's rows (or the whole table) and sorts the result
-- in memory.
--
-- Pure addition: no column changes, no data moves, no behaviour changes. A
-- query that was correct stays correct and gets faster; a query that was slow
-- stops being slow. Nothing reads differently.
--
-- A note for when these tables are big, which they are not yet: CREATE INDEX
-- takes a write lock for the length of the build. At today's row counts that is
-- milliseconds. Once Visit is in the millions, the same statement would hold
-- writes long enough to matter and wants CONCURRENTLY instead — which cannot
-- run inside a transaction, so it needs its own migration run by hand rather
-- than this file. Doing it now, while the tables are small, is what avoids
-- that.

-- 1. The storefront product listing.
--    `WHERE shopId = ? AND status = 'PUBLISHED' AND isActive ORDER BY createdAt DESC`
--    runs on the shop page, every collection page and every search. Product
--    carried only @@index([shopId]), so this read every product the shop owns
--    and sorted them in memory on every request. The single worst read on the
--    storefront.
CREATE INDEX IF NOT EXISTS "Product_shopId_status_isActive_createdAt_idx"
  ON "Product" ("shopId", "status", "isActive", "createdAt");

-- 2. Ordered categories, which the home page and every section context fetch.
CREATE INDEX IF NOT EXISTS "Category_shopId_name_idx"
  ON "Category" ("shopId", "name");

-- 3. A page's sections, always read in `order`. Indexed on pageId alone, so the
--    sort was done in memory — cheap per page, paid on every render of every
--    sectioned page.
CREATE INDEX IF NOT EXISTS "Section_pageId_order_idx"
  ON "Section" ("pageId", "order");

-- 4, 5, 6. The nightly prune.
--
--    `deleteMany({ where: { createdAt: { lt: … } } })` has no shopId in it — it
--    is a platform-wide sweep. Visit's indexes both *lead* with shopId, so
--    neither can serve it, and the prune full-scans what is by far the largest
--    table in the database. AuditLog has the same shape and the same problem.
--    AdminOtp is pruned on expiresAt and indexed on (userId, createdAt).
--
--    PaymentEvent already carries @@index([createdAt]) for exactly this reason,
--    which is how the omission was spotted: the pattern was known and three
--    tables were missed.
CREATE INDEX IF NOT EXISTS "Visit_createdAt_idx"    ON "Visit" ("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");
CREATE INDEX IF NOT EXISTS "AdminOtp_expiresAt_idx" ON "AdminOtp" ("expiresAt");
