-- Whether a shop has seen the welcome flow.
--
-- Nullable, and every existing shop is backfilled as already onboarded: they
-- have been running for weeks and must not be shown a first-run wizard the next
-- time they open the admin.
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "onboardedAt" TIMESTAMP(3);

UPDATE "Shop" SET "onboardedAt" = "createdAt" WHERE "onboardedAt" IS NULL;
