-- Customers sign in with a code sent to their email — no password (decided
-- 8 October). See CustomerOtp and Customer.signedUpAt.
-- Additive: a new table, and a nullable column on Customer.
CREATE TABLE "CustomerOtp" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerOtp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CustomerOtp_shopId_email_createdAt_idx" ON "CustomerOtp"("shopId", "email", "createdAt");
CREATE INDEX "CustomerOtp_expiresAt_idx" ON "CustomerOtp"("expiresAt");
ALTER TABLE "CustomerOtp" ADD CONSTRAINT "CustomerOtp_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- When a customer first signed in. Null for somebody who has only ever
-- checked out as a guest: that is what "has an account" means now.
ALTER TABLE "Customer" ADD COLUMN "signedUpAt" TIMESTAMP(3);
-- Anyone who registered with a password before this has an account too.
UPDATE "Customer" SET "signedUpAt" = "createdAt" WHERE "passwordHash" IS NOT NULL;
