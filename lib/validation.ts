// Shared checkout/account validators — kept simple and used both client-side
// (for instant feedback) and server-side (as the actual source of truth).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

// Pakistani mobile numbers: 03XX-XXXXXXX (11 digits) or +923XX-XXXXXXX /
// 00923XX-XXXXXXX with the country code. Spaces and dashes are ignored.
const PK_PHONE_RE = /^(?:\+92|0092|92|0)3\d{9}$/;

export function isValidPakistaniPhone(phone: string): boolean {
  const digitsAndPlus = phone.trim().replace(/[\s-]/g, "");
  return PK_PHONE_RE.test(digitsAndPlus);
}
