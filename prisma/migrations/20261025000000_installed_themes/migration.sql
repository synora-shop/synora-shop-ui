-- A shop's own theme library, so adding a theme and publishing it are two acts.
--
-- Until now the theme picker had one button and it changed the live storefront.
-- A merchant browsing six designs was one click away from putting an untried
-- one in front of customers, and there was nowhere to keep a design they were
-- working on but not ready to show.
--
-- Adding copies nothing — themes ship with the platform — so this table is a
-- statement of intent rather than storage. Which theme is *live* stays where it
-- was, in ThemeSettings.themeKey, so there is still one answer to that.
CREATE TABLE "InstalledTheme" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "themeKey" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstalledTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstalledTheme_shopId_idx" ON "InstalledTheme"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "InstalledTheme_shopId_themeKey_key" ON "InstalledTheme"("shopId", "themeKey");

-- AddForeignKey
ALTER TABLE "InstalledTheme" ADD CONSTRAINT "InstalledTheme_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everything already running is already added.
--
-- Without this every existing shop would open the Themes screen and find the
-- design it is *currently wearing* sitting under "Discover", offering to be
-- added — which reads as the platform having lost their theme. Two sources:
-- every theme any shop has chosen, plus Aurora for every shop, because Aurora
-- is what a shop that never chose is running.
INSERT INTO "InstalledTheme" ("id", "shopId", "themeKey", "installedAt")
SELECT
    -- Deterministic enough to be unique, and readable in a database client.
    'seed_' || substr(md5(s."id" || ':' || k."themeKey"), 1, 20),
    s."id",
    k."themeKey",
    COALESCE(s."createdAt", CURRENT_TIMESTAMP)
FROM "Shop" s
CROSS JOIN LATERAL (
    SELECT DISTINCT ts."themeKey"
    FROM "ThemeSettings" ts
    WHERE ts."shopId" = s."id" AND ts."themeKey" IS NOT NULL
    UNION
    SELECT 'aurora'
) k
ON CONFLICT ("shopId", "themeKey") DO NOTHING;
