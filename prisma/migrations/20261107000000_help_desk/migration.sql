-- The help desk (14 October): tickets and suggestions from merchants at /help,
-- answered from the Synora console at /synora, and the patch notes at
-- /release-notes. Additive only: new types and tables, nothing existing is
-- altered. The release notes published so far are inserted below so the team
-- manages every note in one place.

-- CreateEnum
CREATE TYPE "HelpKind" AS ENUM ('TICKET', 'SUGGESTION');

-- CreateEnum
CREATE TYPE "HelpStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'UNDER_REVIEW', 'PLANNED', 'SHIPPED', 'DECLINED');

-- CreateTable
CREATE TABLE "HelpRequest" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "kind" "HelpKind" NOT NULL,
    "status" "HelpStatus" NOT NULL DEFAULT 'OPEN',
    "topic" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "shopId" TEXT,
    "teamRepliedAt" TIMESTAMP(3),
    "userSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromTeam" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "viaEmail" BOOLEAN NOT NULL DEFAULT false,
    "statusTo" "HelpStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedOn" DATE NOT NULL,
    "changes" JSONB NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HelpRequest_number_key" ON "HelpRequest"("number");

-- CreateIndex
CREATE INDEX "HelpRequest_userId_createdAt_idx" ON "HelpRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HelpRequest_kind_status_updatedAt_idx" ON "HelpRequest"("kind", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "HelpRequest_shopId_idx" ON "HelpRequest"("shopId");

-- CreateIndex
CREATE INDEX "HelpMessage_requestId_createdAt_idx" ON "HelpMessage"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "ReleaseNote_publishedOn_idx" ON "ReleaseNote"("publishedOn");

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpMessage" ADD CONSTRAINT "HelpMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HelpRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ticket numbers people quote start at #1001.
ALTER SEQUENCE "HelpRequest_number_seq" RESTART WITH 1001;

-- The notes published before the console existed.
INSERT INTO "ReleaseNote" ("id", "title", "publishedOn", "changes", "authorName", "updatedAt") VALUES
  ('rn_2026_10_14', 'A new front page, and sign-in to match', '2026-10-14', '[{"kind": "New", "text": "A new front page for Synora App, made for how Pakistan sells."}, {"kind": "Improved", "text": "Sign in, sign up and password reset have a new look. Nothing about how they work changed."}, {"kind": "Fixed", "text": "If an account email ever fails to send, you are now told so, instead of waiting for an email that is not coming."}, {"kind": "Fixed", "text": "Your order confirmation and your new-order notice are sent separately, so one failing never stops the other."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP),
  ('rn_2026_10_09', 'Kite is here', '2026-10-09', '[{"kind": "New", "text": "Kite, a second complete theme, ready to choose for your shop."}, {"kind": "Fixed", "text": "Every link and button in the Loom demo now goes somewhere, and pages change in place without reloading."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP),
  ('rn_2026_10_07', 'Loom, rebuilt', '2026-10-07', '[{"kind": "Improved", "text": "The Loom theme''s home page was rebuilt to match its original design exactly, on phones and on wide screens."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP),
  ('rn_2026_10_03', 'Shopify imports do what the file says', '2026-10-03', '[{"kind": "Fixed", "text": "Product descriptions imported from Shopify show their formatting, instead of raw code."}, {"kind": "Fixed", "text": "SEO titles and descriptions now come across with your products."}, {"kind": "Fixed", "text": "“Continue selling when out of stock” is now respected, so pre-orders keep working after a move."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP),
  ('rn_2026_10_02', 'Theme fonts load', '2026-10-02', '[{"kind": "Fixed", "text": "The storefront fonts a theme asks for now load, so headings look the way the theme was designed."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP),
  ('rn_2026_09_23', 'A faster panel', '2026-09-23', '[{"kind": "Improved", "text": "Panel pages ask the database fewer questions, and ask them side by side instead of one after another."}, {"kind": "Improved", "text": "Product photos are served in a smaller format and kept for a year, instead of being reprocessed on almost every view."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP),
  ('rn_2026_09_08', 'Card payments', '2026-09-08', '[{"kind": "New", "text": "Take card payments through PayFast."}, {"kind": "New", "text": "An order counts as paid only once the payment provider confirms it, and stock held for an unfinished card payment is given back after thirty minutes."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP),
  ('rn_2026_09_07', 'Your own domain', '2026-09-07', '[{"kind": "New", "text": "Connect your own domain. Once it is live it becomes your main address, and your free address sends people to it."}]'::jsonb, 'Synora', CURRENT_TIMESTAMP);
