-- @repair: safe-to-rerun
--
-- Domains: the hostnames a shop is reachable at.
--
-- Backfills a platform domain for every existing shop, so host resolution has
-- one path from the moment this lands rather than "look in Domain, and if that
-- finds nothing fall back to Shop.subdomain".

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DomainStatus') THEN
    CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Domain" (
  "id"                TEXT NOT NULL,
  "shopId"            TEXT NOT NULL,
  "hostname"          TEXT NOT NULL,
  "status"            "DomainStatus" NOT NULL DEFAULT 'PENDING',
  "isPlatform"        BOOLEAN NOT NULL DEFAULT false,
  "isPrimary"         BOOLEAN NOT NULL DEFAULT false,
  "verificationToken" TEXT NOT NULL,
  "verifiedAt"        TIMESTAMP(3),
  "activatedAt"       TIMESTAMP(3),
  "lastError"         TEXT,
  "lastCheckedAt"     TIMESTAMP(3),
  "failedChecks"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- Platform-wide, not per shop: two merchants must not both serve one hostname,
-- and this is the only place that can be made genuinely impossible.
CREATE UNIQUE INDEX IF NOT EXISTS "Domain_hostname_key" ON "Domain"("hostname");
CREATE INDEX IF NOT EXISTS "Domain_shopId_idx" ON "Domain"("shopId");
CREATE INDEX IF NOT EXISTS "Domain_status_idx" ON "Domain"("status");

ALTER TABLE "Domain" DROP CONSTRAINT IF EXISTS "Domain_shopId_fkey";
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- At most one canonical domain per shop, enforced rather than assumed. A shop
-- with two primaries has an ambiguous canonical URL, and the code that sets one
-- would have to be perfect forever for that never to happen.
CREATE UNIQUE INDEX IF NOT EXISTS "Domain_one_primary_per_shop"
  ON "Domain"("shopId") WHERE "isPrimary";

-- Likewise: exactly one free address per shop.
CREATE UNIQUE INDEX IF NOT EXISTS "Domain_one_platform_per_shop"
  ON "Domain"("shopId") WHERE "isPlatform";

-- Every existing shop gets its free address as a real row.
--
-- The apex is written literally rather than read from configuration, because
-- SQL cannot see the app's environment. In production that is the right value;
-- anywhere PLATFORM_DOMAIN differs (a preview deploy, local development) the
-- hostname here would be wrong, so lib/data/domains.ts corrects a stale
-- platform row when it next reads one. This is a head start, not the authority.
--
-- ON CONFLICT DO NOTHING rather than a NOT EXISTS guard, so re-running after a
-- partial apply cannot produce a duplicate. gen_random_uuid() stands in for
-- cuid(), which is application-side; nothing parses these ids.
INSERT INTO "Domain" ("id", "shopId", "hostname", "status", "isPlatform", "isPrimary",
                      "verificationToken", "verifiedAt", "activatedAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  s."id",
  s."subdomain" || '.bettershp.com',
  'ACTIVE',
  true,
  true,
  '',
  s."createdAt",
  s."createdAt",
  s."createdAt",
  CURRENT_TIMESTAMP
FROM "Shop" s
ON CONFLICT ("hostname") DO NOTHING;
