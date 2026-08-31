-- URL redirects, so a link that used to work keeps working.
--
-- Not per-environment on purpose: this is about the shape of the site's URLs,
-- which live and test share, and an indexed or bookmarked link doesn't care
-- which copy of the store it lands on.
CREATE TABLE "Redirect" (
    "id"        TEXT NOT NULL,
    "fromPath"  TEXT NOT NULL,
    "toPath"    TEXT NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "hits"      INTEGER NOT NULL DEFAULT 0,
    "note"      TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");
CREATE INDEX "Redirect_isActive_idx" ON "Redirect"("isActive");
