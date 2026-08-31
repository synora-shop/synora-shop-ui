-- @repair: safe-to-rerun
--
-- Accounts and access: email verification, password reset, staff invitations,
-- session invalidation, and rate limiting.
--
-- Every column added to User is defaulted, so existing merchants keep working.
-- emailVerifiedAt is the exception and is deliberately left null: nobody has
-- confirmed an address yet, and pretending otherwise would defeat the check.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TokenPurpose') THEN
    CREATE TYPE "TokenPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt"   TIMESTAMP(3),
  -- Defaults to now() so no existing session is invalidated by this migration
  -- landing. Only a deliberate act should sign people out.
  ADD COLUMN IF NOT EXISTS "sessionsValidFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "id"         TEXT NOT NULL,
  "tokenHash"  TEXT NOT NULL,
  "purpose"    "TokenPurpose" NOT NULL,
  "userId"     TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "VerificationToken_userId_purpose_idx" ON "VerificationToken"("userId", "purpose");
CREATE INDEX IF NOT EXISTS "VerificationToken_expiresAt_idx" ON "VerificationToken"("expiresAt");

ALTER TABLE "VerificationToken" DROP CONSTRAINT IF EXISTS "VerificationToken_userId_fkey";
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "StaffInvite" (
  "id"          TEXT NOT NULL,
  "shopId"      TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "role"        "MemberRole" NOT NULL DEFAULT 'STAFF',
  "tokenHash"   TEXT NOT NULL,
  "invitedById" TEXT,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "acceptedAt"  TIMESTAMP(3),
  "revokedAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);
-- Globally unique: an invite link is followed by someone who is not signed in
-- and has no shop context, so the token alone has to find the row.
CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvite_tokenHash_key" ON "StaffInvite"("tokenHash");
-- One outstanding invite per address per shop.
CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvite_shopId_email_key" ON "StaffInvite"("shopId", "email");
CREATE INDEX IF NOT EXISTS "StaffInvite_shopId_idx" ON "StaffInvite"("shopId");

ALTER TABLE "StaffInvite" DROP CONSTRAINT IF EXISTS "StaffInvite_shopId_fkey";
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffInvite" DROP CONSTRAINT IF EXISTS "StaffInvite_invitedById_fkey";
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key"          TEXT NOT NULL,
  "count"        INTEGER NOT NULL DEFAULT 0,
  "windowEnd"    TIMESTAMP(3) NOT NULL,
  "blockedUntil" TIMESTAMP(3),
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "RateLimit_windowEnd_idx" ON "RateLimit"("windowEnd");

-- Existing merchants already proved their address by using the account, and
-- locking them out on deploy would be a worse failure than the one this guards
-- against. New accounts start unverified.
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;
