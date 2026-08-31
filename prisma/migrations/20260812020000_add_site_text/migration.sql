-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN "contactEmail" TEXT;

-- CreateTable
CREATE TABLE "SiteText" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteText_pkey" PRIMARY KEY ("key")
);
