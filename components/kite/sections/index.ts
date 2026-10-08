import type { KiteSectionDef } from "@/components/kite/contract";
import { kiteHeaderSchema } from "@/components/kite/sections/header.schema";
import { KiteHeader } from "@/components/kite/sections/header";
import { kiteAboutSchema, kiteCitiesSchema, kiteCuratedSchema, kiteJourneySchema, kiteLimitedSchema, kiteNewsletterSchema, kiteUpcomingSchema } from "@/components/kite/sections/home.schema";
import { KiteJourney } from "@/components/kite/sections/journey";
import { kiteFooterSchema } from "@/components/kite/sections/footer.schema";
import { kiteProductSchema } from "@/components/kite/sections/pages.schema";
import { KiteProduct } from "@/components/kite/sections/product";
import { kiteAccountSchema } from "@/components/kite/sections/account.schema";
import { KiteAccount } from "@/components/kite/sections/account";
import { KiteFooter } from "@/components/kite/sections/footer";
import { KiteUpcoming } from "@/components/kite/sections/upcoming";
import { KiteAbout } from "@/components/kite/sections/about";
import { KiteNewsletter } from "@/components/kite/sections/newsletter";
import { KiteCurated } from "@/components/kite/sections/curated";
import { KiteLimited } from "@/components/kite/sections/limited";
import { KiteCities } from "@/components/kite/sections/cities";
import { kiteCartSchema, kiteCheckoutSchema, kiteCollectionSchema, kiteOrderSchema, kiteSearchSchema, kiteSignInSchema, kiteWishlistSchema } from "@/components/kite/sections/commerce.schema";
import { KiteCollection, KiteSearch } from "@/components/kite/sections/collection";
import { KiteCart } from "@/components/kite/sections/cart";
import { KiteCheckout } from "@/components/kite/sections/checkout";
import { KiteSignIn } from "@/components/kite/sections/sign-in";
import { KiteOrderView } from "@/components/kite/sections/order";
import { KiteWishlist } from "@/components/kite/sections/wishlist";

/** Every section Kite brings, by type — what its templates and the customizer can use. */
export const KITE_SECTIONS: Record<string, KiteSectionDef> = {
  KITE_HEADER: { schema: kiteHeaderSchema, Render: KiteHeader },
  KITE_CITIES: { schema: kiteCitiesSchema, Render: KiteCities },
  KITE_LIMITED: { schema: kiteLimitedSchema, Render: KiteLimited },
  KITE_CURATED: { schema: kiteCuratedSchema, Render: KiteCurated },
  KITE_NEWSLETTER: { schema: kiteNewsletterSchema, Render: KiteNewsletter },
  KITE_ABOUT: { schema: kiteAboutSchema, Render: KiteAbout },
  KITE_UPCOMING: { schema: kiteUpcomingSchema, Render: KiteUpcoming },
  KITE_JOURNEY: { schema: kiteJourneySchema, Render: KiteJourney },
  KITE_FOOTER: { schema: kiteFooterSchema, Render: KiteFooter },
  KITE_PRODUCT: { schema: kiteProductSchema, Render: KiteProduct },
  KITE_ACCOUNT: { schema: kiteAccountSchema, Render: KiteAccount },
  // Not in the file: Kite's own parts (decided 8 October).
  KITE_COLLECTION: { schema: kiteCollectionSchema, Render: KiteCollection },
  KITE_SEARCH: { schema: kiteSearchSchema, Render: KiteSearch },
  KITE_CART: { schema: kiteCartSchema, Render: KiteCart },
  KITE_CHECKOUT: { schema: kiteCheckoutSchema, Render: KiteCheckout },
  KITE_SIGN_IN: { schema: kiteSignInSchema, Render: KiteSignIn },
  KITE_ORDER: { schema: kiteOrderSchema, Render: KiteOrderView },
  KITE_WISHLIST: { schema: kiteWishlistSchema, Render: KiteWishlist },
};
