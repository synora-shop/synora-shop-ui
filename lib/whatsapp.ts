/**
 * Store WhatsApp number, E.164 without the leading "+" (e.g. Pakistan mobile: "923001234567").
 * Overridden at runtime by StoreSettings once the admin panel/DB is wired up (Phase 2+);
 * this env var is the fallback used until then.
 */
const FALLBACK_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923218408190";

export function buildWhatsAppLink(message: string, number = FALLBACK_WHATSAPP_NUMBER) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function productInquiryMessage(productTitle: string, url: string) {
  return `Hi! I'm interested in "${productTitle}"\n${url}`;
}
