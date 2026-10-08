import type { KiteSectionDef } from "@/components/kite/contract";
import { kiteHeaderSchema } from "@/components/kite/sections/header.schema";
import { KiteHeader } from "@/components/kite/sections/header";
import { kiteAboutSchema, kiteCitiesSchema, kiteCuratedSchema, kiteLimitedSchema, kiteNewsletterSchema } from "@/components/kite/sections/home.schema";
import { KiteAbout } from "@/components/kite/sections/about";
import { KiteNewsletter } from "@/components/kite/sections/newsletter";
import { KiteCurated } from "@/components/kite/sections/curated";
import { KiteLimited } from "@/components/kite/sections/limited";
import { KiteCities } from "@/components/kite/sections/cities";

/** Every section Kite brings, by type — what its templates and the customizer can use. */
export const KITE_SECTIONS: Record<string, KiteSectionDef> = {
  KITE_HEADER: { schema: kiteHeaderSchema, Render: KiteHeader },
  KITE_CITIES: { schema: kiteCitiesSchema, Render: KiteCities },
  KITE_LIMITED: { schema: kiteLimitedSchema, Render: KiteLimited },
  KITE_CURATED: { schema: kiteCuratedSchema, Render: KiteCurated },
  KITE_NEWSLETTER: { schema: kiteNewsletterSchema, Render: KiteNewsletter },
  KITE_ABOUT: { schema: kiteAboutSchema, Render: KiteAbout },
};
