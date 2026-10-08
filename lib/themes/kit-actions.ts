"use client";

import { useSyncExternalStore } from "react";
import { signOut } from "next-auth/react";
import { requestCustomerCode, signInWithCode } from "@/app/(storefront)/account/sign-in-actions";
import { useCartStore } from "@/lib/cart-store";
import { previewDiscount } from "@/app/(storefront)/checkout/actions";
import { addAddress, deleteAddress } from "@/app/(storefront)/account/addresses/actions";
import { lookUpOrder } from "@/app/(storefront)/order-confirmation/lookup";
import { CITIES } from "@/lib/cities";
import type { KitCartLine, KitProductPage } from "@/lib/themes/kit";

/**
 * What a theme kit's sections may *do*, as opposed to read: the platform's own
 * cart, checkout and sign-in, behind the one door every kit uses. A kit never
 * imports the cart store, an API route or a server action directly, so those
 * can change underneath without every theme changing with them — and every
 * rule they enforce (stock, delivery cities, payment methods, rate limits) is
 * enforced for a kit exactly as for the platform's own pages.
 */

/** The cart: its lines in a kit's shape, and the changes a customer can make. */
export function useKitCart() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  // The cart lives in this browser's storage, which the server cannot read:
  // until the page has mounted, what the server drew (an empty cart) and what
  // the browser holds differ, so a kit waits for `ready` before saying "empty".
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const lines: KitCartLine[] = items.map((i) => ({
    id: i.key,
    title: i.title,
    price: i.price,
    src: i.image,
    colour: i.color,
    size: i.size,
    qty: i.quantity,
    href: `/product/${i.slug}`,
  }));

  return {
    ready,
    lines,
    /** The most of a line the shop has — the stepper stops there. */
    stockOf: (key: string) => items.find((i) => i.key === key)?.stock ?? 1,
    setQty: (key: string, qty: number) => setQuantity(key, qty),
    remove: (key: string) => removeItem(key),
    clear,
    /**
     * Add the variant with this colour and size. Returns false — and adds
     * nothing — when there is no such variant or it is out of stock: the same
     * two refusals the platform's own product panel makes.
     */
    add(product: KitProductPage, choice: { colour?: string; size?: string }, quantity: number): boolean {
      const v = product.variants.find(
        (x) => (!choice.size || x.size === choice.size) && (!choice.colour || x.color === choice.colour)
      );
      if (!v || v.stock <= 0) return false;
      addItem({
        productId: product.id,
        variantId: v.id,
        slug: product.slug,
        title: product.title,
        image: product.photos[0]?.src ?? "",
        size: v.size,
        color: v.color,
        price: product.amount,
        quantity: Math.max(1, quantity),
        stock: v.stock,
      });
      return true;
    },
    /** What the order API needs from the cart. */
    orderItems: () => items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
  };
}

/** Check a discount code against the cart, priced by the server. */
export async function kitPreviewDiscount(code: string, items: { variantId: string; quantity: number }[]) {
  return previewDiscount(code, items);
}

/**
 * Place an order through the platform's order API — the same one the
 * platform's checkout uses, with every rule it enforces. A card payment comes
 * back as a provider's form, which is submitted here: the customer leaves for
 * the provider's own page and no card number is ever typed into the shop's.
 */
export async function kitPlaceOrder(payload: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentMethod: string;
  notes?: string;
  discountCode?: string;
  items: { productId: string; variantId: string; quantity: number }[];
}): Promise<{ ok: true; orderId: string; accessKey: string; leaving: boolean } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "The order could not be placed." };
    if (data.redirect?.url && data.redirect.fields) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.redirect.url;
      form.style.display = "none";
      for (const [name, value] of Object.entries(data.redirect.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      return { ok: true, orderId: data.orderId, accessKey: data.accessKey, leaving: true };
    }
    return { ok: true, orderId: data.orderId, accessKey: data.accessKey, leaving: false };
  } catch {
    return { ok: false, error: "The order could not be placed. Check your connection and try again." };
  }
}

/** Email a sign-in code — the only way a customer signs in, or makes an account. */
export async function kitRequestCode(email: string) {
  return requestCustomerCode(email);
}

/** Sign in with the emailed code. */
export async function kitSignInWithCode(email: string, code: string) {
  return signInWithCode(email, code);
}

/** Sign the customer out and return to the shop's home page. */
export async function kitSignOut(home: string) {
  await signOut({ redirectTo: home });
}

/** Remove one of the signed-in customer's addresses. */
export async function kitDeleteAddress(id: string) {
  const form = new FormData();
  form.set("id", id);
  await deleteAddress(form);
}

/** Save an address for the signed-in customer. The province follows from the city. */
export async function kitAddAddress(a: { label: string; line1: string; city: string; postcode: string; phone: string }) {
  const form = new FormData();
  form.set("label", a.label || "Home");
  form.set("line1", a.line1);
  form.set("city", a.city);
  form.set("province", CITIES.find((c) => c.name === a.city)?.province ?? "");
  form.set("postalCode", a.postcode);
  form.set("phone", a.phone);
  await addAddress(form);
}

/** Find an order by its number and its email or phone; a match is its link. */
export async function kitLookUpOrder(orderId: string, contact: string) {
  return lookUpOrder(orderId, contact);
}
