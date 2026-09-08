-- A gateway is a way to pay, so it belongs in the list of ways to pay.
--
-- One value per provider rather than a single "CARD": a merchant reconciling
-- their settlements needs to know which provider took the money, and an order
-- that only says "card" cannot answer that.
--
-- Its own migration because Postgres will not let a new enum value be added and
-- used inside the same transaction. Nothing here uses it; the tables that do
-- were created in the migration before this one.
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'PAYFAST';
