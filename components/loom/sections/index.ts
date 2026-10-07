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
import { blogSchema, exploreSchema, heroSchema, serviceSchema, testimonialSchema, trendingSchema } from "@/components/loom/sections/home.schema";
import { LoomHero } from "@/components/loom/hero";
import { LoomTrending } from "@/components/loom/trending";
import { LoomExploreColors } from "@/components/loom/explore-colors";
import { LoomTestimonial } from "@/components/loom/testimonial";
import { LoomService } from "@/components/loom/service";
import { LoomBlog } from "@/components/loom/blog";
import { accountSchema, cartSchema, checkoutSchema, collectionSchema, productSchema, signInSchema } from "@/components/loom/sections/commerce.schema";
import { LoomProductMain } from "@/components/loom/sections/product";
import { LoomCollection } from "@/components/loom/collection/collection";
import { LoomCart } from "@/components/loom/cart/cart";
import { LoomCheckout } from "@/components/loom/checkout/checkout";
import { LoomAccount } from "@/components/loom/account/account";
import { LoomSignIn } from "@/components/loom/account/sign-in";

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
  LOOM_HERO: { schema: heroSchema, Render: LoomHero },
  LOOM_TRENDING: { schema: trendingSchema, Render: LoomTrending },
  LOOM_EXPLORE_COLORS: { schema: exploreSchema, Render: LoomExploreColors },
  LOOM_TESTIMONIAL: { schema: testimonialSchema, Render: LoomTestimonial },
  LOOM_SERVICE: { schema: serviceSchema, Render: LoomService },
  LOOM_BLOG: { schema: blogSchema, Render: LoomBlog },
  LOOM_PRODUCT: { schema: productSchema, Render: LoomProductMain },
  LOOM_COLLECTION: { schema: collectionSchema, Render: LoomCollection },
  LOOM_CART: { schema: cartSchema, Render: LoomCart },
  LOOM_CHECKOUT: { schema: checkoutSchema, Render: LoomCheckout },
  LOOM_ACCOUNT: { schema: accountSchema, Render: LoomAccount },
  LOOM_SIGN_IN: { schema: signInSchema, Render: LoomSignIn },
};
