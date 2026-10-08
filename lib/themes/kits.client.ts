import type { KitSectionDef } from "@/lib/themes/kit";
import { LOOM_SECTIONS } from "@/components/loom/sections";
import { KITE_SECTIONS } from "@/components/kite/sections";

/**
 * Every kit's sections, for drawing in the browser — which only the
 * customizer's preview ever does. Imported dynamically by KitLive the first
 * time a draft arrives, so not one of these components is sent to a shopper.
 */
export const CLIENT_KITS: Record<string, Record<string, KitSectionDef>> = {
  loom: LOOM_SECTIONS,
  kite: KITE_SECTIONS,
};
