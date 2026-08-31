import { customAlphabet } from "nanoid";

// Short, human-readable order IDs (e.g. for customers to quote over WhatsApp):
// 5 characters, lowercase letters + digits only.
const generate = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 5);

export function generateOrderId(): string {
  return generate();
}
