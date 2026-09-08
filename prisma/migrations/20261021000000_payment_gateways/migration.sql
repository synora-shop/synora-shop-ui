-- Hosted payment gateways: a shop can take card and wallet money into its own
-- bank account.
--
-- The platform is not a party to any of it. The merchant holds the account with
-- the provider, the provider settles into the merchant's bank, and these tables
-- hold only what is needed to speak to the provider on the merchant's behalf.
-- That is the difference between being software and being a payment
-- aggregator, and it is a line this schema is built not to cross.
--
-- Three tables and one column:
--
--   PaymentGateway  one per shop per provider, holding sealed credentials
--   Payment         one row per attempt, carrying the amount asked for
--   PaymentEvent    everything that ever claimed something about a payment,
--                   including claims that turn out to be forged
--   Order.reservedUntil  when an unpaid order stops holding its stock
--
-- Nothing here changes an existing storefront: no gateway is connected, so
-- every shop keeps offering exactly the methods it offers today.

-- CreateEnum
CREATE TYPE "GatewayProvider" AS ENUM ('PAYFAST');

-- CreateEnum
CREATE TYPE "GatewayMode" AS ENUM ('SANDBOX', 'LIVE');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'MISMATCHED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reservedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "provider" "GatewayProvider" NOT NULL,
    "mode" "GatewayMode" NOT NULL DEFAULT 'SANDBOX',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    -- Sealed with AES-256-GCM (lib/payments/crypto.ts). Never a readable
    -- column: a database dump is not a set of working merchant credentials.
    "secret" BYTEA,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "connectedAt" TIMESTAMP(3),
    "credentialsUpdatedAt" TIMESTAMP(3),
    -- The go-live gate. Written only by a sandbox payment that actually
    -- confirmed, never by saving a form.
    "sandboxVerifiedAt" TIMESTAMP(3),
    "liveVerifiedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gatewayId" TEXT,
    "provider" "GatewayProvider" NOT NULL,
    "mode" "GatewayMode" NOT NULL,
    -- Random and globally unique, not the order id: order ids are five
    -- characters and unique only within a shop, so two shops routinely hold
    -- the same one, and a callback carrying a shared reference is one shop
    -- confirming another shop's order.
    "reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "providerRef" TEXT,
    "failureReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    -- Nullable: an event that resolves to no known payment belongs to no shop,
    -- and filing a stranger's forgery in a merchant's records would be a lie.
    "shopId" TEXT,
    "paymentId" TEXT,
    "provider" "GatewayProvider" NOT NULL,
    "source" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentGateway_shopId_idx" ON "PaymentGateway"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGateway_shopId_provider_key" ON "PaymentGateway"("shopId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_shopId_orderId_idx" ON "Payment"("shopId", "orderId");

-- CreateIndex
CREATE INDEX "Payment_status_expiresAt_idx" ON "Payment"("status", "expiresAt");

-- CreateIndex
-- What makes a replayed callback a no-op rather than a second payment.
CREATE UNIQUE INDEX "Payment_provider_providerRef_key" ON "Payment"("provider", "providerRef");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentEvent_shopId_createdAt_idx" ON "PaymentEvent"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentGateway" ADD CONSTRAINT "PaymentGateway_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
