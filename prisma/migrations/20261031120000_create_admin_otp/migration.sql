-- The one table the migrations never created.
--
-- `AdminOtp` has been in schema.prisma and used by live code —
-- `app/api/admin/request-otp/route.ts` writes it on every admin sign-in code,
-- and the nightly prune deletes from it — while no migration has ever created
-- it. Found by applying the whole history to an empty database, which is the
-- only thing that finds this: `prisma generate` reads the schema and is happy,
-- every type checks, and production works because the table got there some
-- other way (a `db push`, most likely, before the hand-written migrations
-- became the rule).
--
-- What it costs, until now: the migration history does not describe the
-- database. A fresh Preview branch, a rebuild from backup, or any new
-- environment comes up without this table, and admin sign-in throws the first
-- time anybody asks for a code. It is also why
-- `20261101000000_indexes_for_load` could not apply — it indexes a table that,
-- on a database built from these files, does not exist.
--
-- `IF NOT EXISTS` throughout, so this is a no-op everywhere the table already
-- is — which includes production. Nothing is dropped and nothing is rewritten:
-- this migration either creates what was missing or does nothing at all.
--
-- Ordered before the index migration deliberately. Migrations apply in
-- filename order, so a table has to be created by a file that sorts earlier
-- than the one indexing it.

CREATE TABLE IF NOT EXISTS "AdminOtp" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "codeHash"   TEXT NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "attempts"   INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminOtp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminOtp_userId_createdAt_idx" ON "AdminOtp" ("userId", "createdAt");

-- Cascade, matching the schema: a deleted user's unused codes go with them.
-- Guarded because an existing database already has this constraint under the
-- same name, and adding it twice is an error rather than a no-op.
DO $$
BEGIN
  ALTER TABLE "AdminOtp"
    ADD CONSTRAINT "AdminOtp_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
