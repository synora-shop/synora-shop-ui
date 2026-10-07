import type { LoomSectionDef } from "@/components/loom/contract";
import { headerSchema } from "@/components/loom/sections/header.schema";
import { LoomHeader } from "@/components/loom/sections/header";
import { footerSchema } from "@/components/loom/sections/footer.schema";
import { LoomFooter } from "@/components/loom/footer";
import { orderSchema, recommendationsSchema, searchSchema, wishlistSchema } from "@/components/loom/sections/pages.schema";
import { LoomWishlist } from "@/components/loom/sections/wishlist";
import { LoomRecommendations } from "@/components/loom/sections/recommendations";
import { LoomOrderView } from "@/components/loom/sections/order";
import { LoomSearch } from "@/components/loom/sections/search";

/**
 * Every Loom section a template may name, by type — the theme's half of what
 * SECTION_SCHEMAS is for the platform. The customizer's "Add section" list and
 * its settings panel come from the schemas here; the storefront draws with the
 * Render beside each.
 */
export const LOOM_SECTIONS: Record<string, LoomSectionDef> = {
  LOOM_HEADER: { schema: headerSchema, Render: LoomHeader },
  LOOM_FOOTER: { schema: footerSchema, Render: LoomFooter },
  LOOM_WISHLIST: { schema: wishlistSchema, Render: LoomWishlist },
  LOOM_RECOMMENDATIONS: { schema: recommendationsSchema, Render: LoomRecommendations },
  LOOM_ORDER: { schema: orderSchema, Render: LoomOrderView },
  LOOM_SEARCH: { schema: searchSchema, Render: LoomSearch },
};
