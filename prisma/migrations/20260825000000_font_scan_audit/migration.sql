-- Malware-scan audit trail for uploaded fonts (see lib/virus-scan.ts).
--
-- Existing rows default to "unscanned": they were uploaded before scanning
-- existed, and recording that honestly is better than back-dating a clean
-- verdict nobody actually produced.
ALTER TABLE "FontAsset" ADD COLUMN "scanStatus" TEXT NOT NULL DEFAULT 'unscanned';
ALTER TABLE "FontAsset" ADD COLUMN "scanProvider" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "FontAsset" ADD COLUMN "scanDetail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FontAsset" ADD COLUMN "sha256" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FontAsset" ADD COLUMN "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
