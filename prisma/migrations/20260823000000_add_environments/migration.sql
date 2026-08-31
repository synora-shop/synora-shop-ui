-- Splits the presentation layer into two parallel environments: "live" (the real
-- storefront at /) and "test" (the customizer sandbox at /test). The catalog
-- (products, categories, orders, users) is deliberately NOT touched — it stays
-- shared between both. See the ENVIRONMENTS note at the top of schema.prisma.
--
-- Every existing row defaults to 'live', so production is bit-for-bit unchanged
-- the moment this applies; the test environment is then populated as an exact
-- copy at the bottom of this file.

-- --------------------------------------------------------------------------
-- 1. Add the env discriminator
-- --------------------------------------------------------------------------
ALTER TABLE "Page" ADD COLUMN "env" TEXT NOT NULL DEFAULT 'live';
ALTER TABLE "MenuItem" ADD COLUMN "env" TEXT NOT NULL DEFAULT 'live';
ALTER TABLE "SiteText" ADD COLUMN "env" TEXT NOT NULL DEFAULT 'live';
ALTER TABLE "StoreSettings" ADD COLUMN "env" TEXT NOT NULL DEFAULT 'live';

-- --------------------------------------------------------------------------
-- 2. Re-scope uniqueness per environment
--    Page.slug and Page.categoryId were globally unique; both must now allow
--    exactly one row per (value, env) so live and test can each own a "home"
--    page and a collection page per category.
-- --------------------------------------------------------------------------
DROP INDEX "Page_slug_key";
DROP INDEX "Page_categoryId_key";
CREATE UNIQUE INDEX "Page_slug_env_key" ON "Page"("slug", "env");
CREATE UNIQUE INDEX "Page_categoryId_env_key" ON "Page"("categoryId", "env");
CREATE INDEX "Page_env_idx" ON "Page"("env");

DROP INDEX "MenuItem_location_idx";
CREATE INDEX "MenuItem_location_env_idx" ON "MenuItem"("location", "env");

-- SiteText keyed by (key) becomes keyed by (key, env).
ALTER TABLE "SiteText" DROP CONSTRAINT "SiteText_pkey";
ALTER TABLE "SiteText" ADD CONSTRAINT "SiteText_pkey" PRIMARY KEY ("key", "env");
CREATE INDEX "SiteText_env_idx" ON "SiteText"("env");

-- StoreSettings keeps its id PK but gains one-row-per-env.
CREATE UNIQUE INDEX "StoreSettings_env_key" ON "StoreSettings"("env");

-- --------------------------------------------------------------------------
-- 3. Design tokens for the visual customizer, one row per environment
-- --------------------------------------------------------------------------
CREATE TABLE "ThemeSettings" (
    "id"        TEXT NOT NULL,
    "env"       TEXT NOT NULL,
    "tokens"    JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ThemeSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ThemeSettings_env_key" ON "ThemeSettings"("env");

-- --------------------------------------------------------------------------
-- 4. Seed the test environment as an exact copy of live
--
--    Ids are derived as 'test:' || <live id> rather than freshly generated, so
--    the live->test mapping is computable in plain SQL (needed to remap
--    Section.pageId and MenuItem.pageId below) and so re-running this logic is
--    naturally idempotent.
--
--    The temp-table + SELECT * approach avoids enumerating every column, which
--    matters most for StoreSettings — it already has 25 columns and gains more
--    with each Global Edit added.
-- --------------------------------------------------------------------------
CREATE TEMP TABLE _page_copy AS SELECT * FROM "Page" WHERE "env" = 'live';
UPDATE _page_copy SET "id" = 'test:' || "id", "env" = 'test';
INSERT INTO "Page" SELECT * FROM _page_copy;

CREATE TEMP TABLE _section_copy AS
  SELECT s.* FROM "Section" s JOIN "Page" p ON p."id" = s."pageId" WHERE p."env" = 'live';
UPDATE _section_copy SET "id" = 'test:' || "id", "pageId" = 'test:' || "pageId";
INSERT INTO "Section" SELECT * FROM _section_copy;

CREATE TEMP TABLE _menu_copy AS SELECT * FROM "MenuItem" WHERE "env" = 'live';
UPDATE _menu_copy
   SET "id" = 'test:' || "id",
       "env" = 'test',
       -- fixed utility links have no page; only remap real page targets
       "pageId" = CASE WHEN "pageId" IS NULL THEN NULL ELSE 'test:' || "pageId" END;
INSERT INTO "MenuItem" SELECT * FROM _menu_copy;

-- SiteText's PK is (key, env), so the key itself is reused as-is.
CREATE TEMP TABLE _sitetext_copy AS SELECT * FROM "SiteText" WHERE "env" = 'live';
UPDATE _sitetext_copy SET "env" = 'test';
INSERT INTO "SiteText" SELECT * FROM _sitetext_copy;

CREATE TEMP TABLE _settings_copy AS SELECT * FROM "StoreSettings" WHERE "env" = 'live';
UPDATE _settings_copy SET "id" = 'settings-test', "env" = 'test';
INSERT INTO "StoreSettings" SELECT * FROM _settings_copy;
