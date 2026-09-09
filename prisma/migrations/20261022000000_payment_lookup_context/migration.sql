-- What a provider needs back before it will answer a question about a payment.
--
-- PayFast's Get Transaction Status API requires `order_date` and `customer_ip`
-- alongside the basket id. Neither can be recovered after the fact: the IP
-- belonged to a browser that has gone, and the date has to be the exact string
-- that was sent rather than a re-derivation of it.
--
-- So they are captured when the customer is sent to pay. A payment written
-- without them cannot be verified, and the adapter says so plainly rather than
-- confirming an order it could not check.
--
-- Nullable, because the payments written before this column existed genuinely
-- do not have it — and there are none in production, since no gateway has ever
-- been connected there.
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "customerIp" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "orderDate" TEXT;
