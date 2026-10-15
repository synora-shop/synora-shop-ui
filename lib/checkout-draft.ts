import { useEffect, useRef } from "react";

/**
 * Started checkouts, saved as they are filled in (new admin, 15 October).
 *
 * Every storefront checkout (the classic form, Loom's, Kite's) uses this to
 * post what it has a moment after the customer stops typing, to
 * /api/checkouts, so a merchant can see who reached checkout and stopped, and
 * remind them (Orders > Abandoned checkouts). The order, when it comes, sends
 * the same token, and the draft is marked recovered.
 *
 * Quiet by design: it never shows anything, never blocks the checkout, and a
 * failure is swallowed. It only sends when what it would send has changed.
 */
const KEY = "synora-checkout-token";

export type DraftLine = { title: string; qty: number; price: number; productId?: string; variantId?: string };
export type DraftState = {
  email: string;
  phone: string;
  name: string;
  city: string;
  step: "contact" | "address" | "delivery" | "payment";
  lines: DraftLine[];
};

/** This browser tab's checkout token, made the first time it is asked for. */
export function checkoutToken(): string {
  try {
    let token = sessionStorage.getItem(KEY);
    if (!token) {
      token = (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/[^\w]/g, "").slice(0, 40);
      sessionStorage.setItem(KEY, token);
    }
    return token;
  } catch {
    return "";
  }
}

/** Once an order is placed, the next checkout in this tab is a new one. */
export function forgetCheckoutToken(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

/** How far into the checkout someone has got, from what they have filled in. */
export function draftStep(f: { email: string; name: string; address: string; city: string; phone: string; paymentTouched?: boolean }): DraftState["step"] {
  if (f.paymentTouched) return "payment";
  const addressDone = !!(f.name.trim() && f.address.trim() && f.city.trim() && f.phone.trim());
  if (addressDone) return "delivery"; // they have seen the delivery charge
  if (f.name.trim() || f.address.trim() || f.city.trim() || f.phone.trim()) return "address";
  return "contact";
}

function send(state: DraftState, base: string) {
  const token = checkoutToken();
  if (!token) return;
  void fetch(`${base}/api/checkouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...state, token }),
    keepalive: true,
  }).catch(() => {});
}

const reachable = (s: DraftState) => /^\S+@\S+\.\S+$/.test(s.email.trim()) || s.phone.replace(/\D/g, "").length >= 10;

/** For a checkout that keeps its fields in state (Loom, Kite). */
export function useCheckoutDraft(state: DraftState, { base = "", enabled }: { base?: string; enabled: boolean }) {
  const json = JSON.stringify(state);
  const last = useRef("");
  useEffect(() => {
    if (!enabled) return;
    const id = setTimeout(() => {
      const current = JSON.parse(json) as DraftState;
      if (json === last.current || current.lines.length === 0 || !reachable(current)) return;
      last.current = json;
      send(current, base);
    }, 2000);
    return () => clearTimeout(id);
  }, [json, enabled, base]);
}

/**
 * For a checkout that reads its fields from the form only on submit (the
 * classic one): call on every input, and it saves after a pause.
 */
export function draftSaver() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = "";
  return (state: DraftState, base = "") => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const json = JSON.stringify(state);
      if (json === last || state.lines.length === 0 || !reachable(state)) return;
      last = json;
      send(state, base);
    }, 2000);
  };
}
