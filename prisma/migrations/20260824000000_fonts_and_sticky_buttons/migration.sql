-- Admin-uploaded font files. Shared across environments (the file is an asset);
-- which font is actually used is a per-environment theme token.
CREATE TABLE "FontAsset" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "format"    TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FontAsset_pkey" PRIMARY KEY ("id")
);

-- Floating contact buttons (WhatsApp, Instagram, chat link, …), per environment
-- like everything else presentational, so they publish with the rest.
CREATE TABLE "StickyButton" (
    "id"        TEXT NOT NULL,
    "env"       TEXT NOT NULL DEFAULT 'live',
    "kind"      TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "value"     TEXT NOT NULL,
    "message"   TEXT NOT NULL DEFAULT '',
    "scope"     TEXT NOT NULL DEFAULT 'ALL',
    "iconKind"  TEXT NOT NULL DEFAULT 'BUILTIN',
    "iconValue" TEXT NOT NULL DEFAULT '',
    "color"     TEXT NOT NULL DEFAULT '#25D366',
    "order"     INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "StickyButton_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StickyButton_env_idx" ON "StickyButton"("env");
