-- A theme copy's own page layouts — see InstalledTheme.templates.
-- Additive: one column with a default, so every existing row is valid as it
-- stands and a rollback to the previous build simply never reads it.
ALTER TABLE "InstalledTheme" ADD COLUMN "templates" JSONB NOT NULL DEFAULT '{}';
