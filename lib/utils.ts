import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts (last one wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// formatPKR lived here and hard-coded rupees on every screen of a product
// whose Settings offered nine currencies. It is lib/money.ts now, and it takes
// the store's own currency — see the comment at the top of that file.
