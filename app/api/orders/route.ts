import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentShopId, requireShop, shopNotificationEmail } from "@/lib/data/shop";
import { storefrontClosure } from "@/lib/maintenance";
import { claimDiscountUse, quoteDiscountWith } from "@/lib/data/discounts";
import { getStoreSettings } from "@/lib/data/settings";
import { sendOrderEmails } from "@/lib/email";
import { sendOrderPushNotifications } from "@/lib/push";
import { effectivePrice } from "@/lib/data/products";
import { provinceForCity } from "@/lib/cities";
import { isValidEmail, isValidPakistaniPhone } from "@/lib/validation";
import { generateOrderId } from "@/lib/order-id";
import { ENABLED_PAYMENT_METHOD_VALUES } from "@/lib/payment-methods";
import { isEnquiryOnly, PRODUCT_KIND_META } from "@/lib/product-kind";

// Full set the DB/type system supports — which of these are actually
// accepted right now is controlled by ENABLED_PAYMENT_METHOD_VALUES below.
type PaymentMethod = "COD" | "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA";

type CheckoutItem = { productId: string; variantId: string; quantity: number };

type CheckoutPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingPostalCode?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  /** Optional. Validated and priced server-side; never trusted. */
  discountCode?: string;
  items: CheckoutItem[];
};

function isValidPayload(body: unknown): body is CheckoutPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.customerName === "string" &&
    b.customerName.trim().length > 0 &&
    typeof b.customerEmail === "string" &&
    isValidEmail(b.customerEmail) &&
    typeof b.customerPhone === "string" &&
    isValidPakistaniPhone(b.customerPhone) &&
    typeof b.shippingLine1 === "string" &&
    typeof b.shippingCity === "string" &&
    provinceForCity(b.shippingCity) !== null &&
    ENABLED_PAYMENT_METHOD_VALUES.includes(b.paymentMethod as string) &&
    Array.isArray(b.items) &&
    b.items.length > 0 &&
    b.items.every(
      (i) =>
        i &&
        typeof i === "object" &&
        typeof (i as CheckoutItem).productId === "string" &&
        typeof (i as CheckoutItem).variantId === "string" &&
        Number.isInteger((i as CheckoutItem).quantity) &&
        (i as CheckoutItem).quantity > 0
    )
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  // A paused store must actually stop taking orders, not merely stop showing
  // the pages that lead to one. Guarding only the checkout page left a stale
  // tab — or a direct POST — able to place an order and take the stock with
  // it, which is exactly what the merchant pressed Pause to prevent.
  const closed = await storefrontClosure();
  if (closed) {
    return NextResponse.json(
      {
        error:
          closed === "maintenance"
            ? "This store is briefly unavailable. Please try again shortly."
            : "This store isn't taking orders at the moment.",
      },
      { status: 409 }
    );
  }

  const session = await auth();
  const settings = await getStoreSettings();

  const sid = await currentShopId();

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Re-fetch authoritative prices/stock from DB — never trust client-supplied prices.
      const variantIds = body.items.map((i) => i.variantId);
      // Scoped to this shop explicitly. `tx` is a raw transaction client — the
      // extension in lib/tenant.ts does not wrap one — so nothing in here is
      // filtered unless it says so. Without the shopId, a checkout posted to
      // one storefront carrying another shop's variant ids found them, priced
      // the order from that shop's products, and decremented its stock: a
      // competitor's inventory drained through a form anyone can submit.
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds }, shopId: sid },
        include: { product: true },
      });

      const orderItemsData = body.items.map((cartItem) => {
        const variant = variants.find((v) => v.id === cartItem.variantId);
        if (!variant || variant.productId !== cartItem.productId) {
          throw new Error(`Product/variant not found: ${cartItem.variantId}`);
        }
        // An admin may have drafted, hidden, or bin'd this product after it was added to the
        // cart client-side — re-check it's still actually purchasable before charging for it.
        if (
          variant.product.deletedAt ||
          variant.product.status !== "PUBLISHED" ||
          !variant.product.isActive
        ) {
          throw new Error(`"${variant.product.title}" is no longer available`);
        }
        // Bulk and made-to-order products are quoted, not sold at a published
        // price. The storefront never offers an add-to-cart for them, but this
        // is the check that actually holds: a stale cart, a replayed request or
        // a product switched to bulk after it was added must not become an
        // order at a price nobody agreed.
        if (isEnquiryOnly(variant.product.kind)) {
          throw new Error(
            // Guarded rather than indexed directly: this runs inside a
            // checkout transaction, and a kind added later must refuse the
            // order with a clear message, not throw an unhandled TypeError.
            `"${variant.product.title}" is sold as ${(
              PRODUCT_KIND_META[variant.product.kind]?.label ?? "an enquiry-only product"
            ).toLowerCase()}, please send an enquiry instead of checking out.`
          );
        }
        if (variant.stock < cartItem.quantity) {
          throw new Error(`"${variant.product.title}" (${variant.size}/${variant.color}) is out of stock`);
        }
        return {
          productId: variant.productId,
          variantId: variant.id,
          title: variant.product.title,
          size: variant.size,
          color: variant.color,
          price: variant.priceOverride ?? effectivePrice(variant.product),
          costPrice: variant.product.costPrice,
          quantity: cartItem.quantity,
        };
      });

      const subtotal = orderItemsData.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const baseShipping =
        settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
          ? 0
          : settings.shippingFee;

      // shippingCity is already validated against the known city list, so this is never null.
      const shippingProvince = provinceForCity(body.shippingCity)!;

      /**
       * The customer this order belongs to, created on first purchase.
       *
       * Every shop keeps its own record of a shopper — (shopId, email) is
       * unique — so the same address buying from two shops is two rows and
       * neither merchant learns about the other. `passwordHash` stays null
       * until they choose to register, which is what makes a guest checkout
       * and an account the same person rather than two.
       *
       * Inside the transaction so an order can never exist without one.
       */
      const buyer = await tx.customer.upsert({
        where: { shopId_email: { shopId: sid, email: body.customerEmail.toLowerCase() } },
        update: { name: body.customerName, phone: body.customerPhone },
        create: {
          shopId: sid,
          email: body.customerEmail.toLowerCase(),
          name: body.customerName,
          phone: body.customerPhone,
        },
      });
      const customerId = buyer.id;

      /**
       * The discount, re-priced here from the code alone.
       *
       * Whatever the client believed it was worth is ignored — the amount is
       * recomputed from the same rules the storefront previewed with, for the
       * same reason line prices are re-fetched rather than taken from the cart.
       */
      let discountId: string | null = null;
      let discountCode: string | null = null;
      let offSubtotal = 0;
      let offShipping = 0;

      if (body.discountCode?.trim()) {
        // On `tx`, not the pooled client: a query issued from inside an
        // interactive transaction waits for a connection this transaction is
        // holding, which is a deadlock rather than a slow query.
        const quote = await quoteDiscountWith(tx, sid, {
          code: body.discountCode,
          cart: { subtotal, shippingFee: baseShipping },
          customerId,
        });
        if (!quote.ok) throw new Error(quote.reason);

        // Claimed before the order is written, and inside this transaction: if
        // the last use went to somebody else a moment ago, the checkout fails
        // here rather than creating an order at a price the code no longer
        // justifies.
        const claimed = await claimDiscountUse(tx, quote.discountId, sid);
        if (!claimed) throw new Error("That code has just been fully claimed.");

        discountId = quote.discountId;
        discountCode = quote.code;
        offSubtotal = quote.outcome.amountOffSubtotal;
        offShipping = quote.outcome.amountOffShipping;
      }

      // Kept as two separate reductions rather than one, because they come off
      // two different lines and the order has to show both.
      const shippingFee = baseShipping - offShipping;
      const discountAmount = offSubtotal + offShipping;
      const total = subtotal - offSubtotal + shippingFee;

      // Order ids are short (5 chars) and randomly generated, not sequential — collisions
      // are extremely unlikely (36^5 possibilities) but retry a few times just in case.
      let created;
      for (let attempt = 1; ; attempt++) {
        try {
          created = await tx.order.create({
            data: {
              id: generateOrderId(),
              shopId: sid,
              // Filed against a customer record, which is what makes "this
              // person has ordered four times" answerable at all. Guest
              // checkout still works — the record is created from the email
              // with no password, and signing up later attaches to the same
              // row because (shopId, email) is unique.
              //
              // Deliberately not taken from the session: the session here is a
              // *merchant* one, and a merchant browsing their own storefront
              // must not have orders filed against them.
              customerId,
              customerName: body.customerName,
              customerEmail: body.customerEmail,
              customerPhone: body.customerPhone,
              shippingLine1: body.shippingLine1,
              shippingLine2: body.shippingLine2,
              shippingCity: body.shippingCity,
              shippingProvince,
              shippingPostalCode: body.shippingPostalCode,
              paymentMethod: body.paymentMethod,
              notes: body.notes,
              discountId,
              discountCode,
              discountAmount,
              subtotal,
              shippingFee,
              total,
              items: { create: orderItemsData.map((i) => ({ ...i, shopId: sid })) },
            },
            include: { items: true },
          });
          break;
        } catch (err) {
          const isIdCollision =
            err && typeof err === "object" && "code" in err && err.code === "P2002";
          if (!isIdCollision || attempt >= 5) throw err;
        }
      }

      // The redemption row, written now the order has an id.
      //
      // Not bookkeeping for its own sake: the per-customer limit is a count of
      // these, so without one a "one per customer" code is unlimited in
      // practice. It also answers which orders a promotion actually paid for,
      // which the counter on the discount cannot.
      if (discountId) {
        await tx.discountRedemption.create({
          data: {
            shopId: sid,
            discountId,
            orderId: created.id,
            customerId,
            amount: discountAmount,
          },
        });
      }

      for (const item of orderItemsData) {
        // updateMany rather than update: it is the form that accepts a
        // non-unique filter, and the shop belongs in the filter rather than
        // being assumed from the lookup above.
        await tx.productVariant.updateMany({
          where: { id: item.variantId, shopId: sid },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    // The notice goes to this shop, not to the platform — see
    // shopNotificationEmail. Resolved after the order is committed so a slow
    // lookup cannot hold the transaction open.
    await sendOrderEmails({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      shopName: (await requireShop()).name,
      notifyEmail: await shopNotificationEmail(order.shopId),
    });

    await sendOrderPushNotifications({
      id: order.id,
      customerName: order.customerName,
      total: order.total,
      shopId: order.shopId,
    });

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
