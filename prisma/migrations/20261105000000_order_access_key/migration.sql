-- An order's secret key — see Order.accessKey.
-- Additive: one column whose default the database fills, for every existing
-- order as for every new one, so no row is left without a key and the code
-- that creates orders does not change. gen_random_uuid() is built into
-- Postgres 13 and later and is cryptographically random: 122 random bits,
-- written here as 32 hex characters.
ALTER TABLE "Order" ADD COLUMN "accessKey" TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '');
