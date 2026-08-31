import { HeroSlideshow, type HeroSlide } from "./hero-slideshow";
import { Banner } from "./banner";
import { CategoryGridView, type CategoryTile } from "./category-grid";
import { FeaturedProductsView } from "./featured-products";
import { TextBlock } from "./text-block";
import { ImageText } from "./image-text";
import { Story } from "./story";
import { FaqList } from "./faq-list";
import { SectionFrame } from "./section-frame";
import { ArticleList, type ArticleCard } from "./article-list";
import { MenuList, type MenuGroup } from "./menu-list";
import { OpeningHours, type DayHours } from "./opening-hours";
import { LocationInfo, type LocationCard } from "./location-info";
import { resolveSectionData, resolveSectionStyle } from "@/lib/section-schema";
import type { ProductCardProduct } from "@/components/storefront/product-card";
import type { GlobalEdits } from "@/lib/global-edits";

/**
 * The live catalog data sections need, fetched once per page rather than by
 * each section, and handed to the renderer.
 *
 * Passing it in (rather than querying inside each section) is what lets the
 * customizer re-render sections on the client as you type: the same render
 * function drives both the real server-rendered storefront and the live
 * preview, so the preview can't drift from what actually ships.
 */
export type SectionContext = {
  categories: CategoryTile[];
  featuredProducts: ProductCardProduct[];
  saleBadgeLabel: string;
  edits: Partial<GlobalEdits>;
  /**
   * Blog and restaurant data, empty for a shop that is neither.
   *
   * Always present rather than optional so a renderer never has to ask whether
   * the shop is the right kind — it renders what it was given, and was given
   * nothing.
   */
  articles?: ArticleCard[];
  /**
   * Dishes grouped by course.
   *
   * Fetched rather than regrouped from `featuredProducts`: a menu needs every
   * dish, its description and its dietary flags, and a product card carries
   * none of those — it exists to sell one thing, not to list forty.
   */
  menu?: MenuGroup[];
  hours?: DayHours[];
  locations?: LocationCard[];
};

/** Sections that own their full-bleed shell and opt out of SectionFrame. */
const UNFRAMED = new Set(["HERO_SLIDESHOW"]);

function body(type: string, d: Record<string, unknown>, ctx: SectionContext) {
  switch (type) {
    case "HERO_SLIDESHOW":
      return (
        <HeroSlideshow
          slides={(d.slides as HeroSlide[]) ?? []}
          autoplaySeconds={d.autoplaySeconds as number}
          height={d.height as string}
          overlayOpacity={d.overlayOpacity as number}
        />
      );
    case "ARTICLE_LIST":
      return (
        <ArticleList
          heading={d.heading as string}
          columns={d.columns as number}
          limit={d.limit as number}
          showExcerpt={d.showExcerpt as boolean}
          articles={ctx.articles ?? []}
        />
      );
    case "MENU_LIST":
      return (
        <MenuList
          heading={d.heading as string}
          groups={ctx.menu ?? []}
          showImages={d.showImages as boolean}
          showDescriptions={d.showDescriptions as boolean}
        />
      );
    case "OPENING_HOURS":
      return (
        <OpeningHours
          heading={d.heading as string}
          hours={ctx.hours ?? []}
          note={d.note as string}
        />
      );
    case "LOCATION_INFO":
      return (
        <LocationInfo
          heading={d.heading as string}
          locations={ctx.locations ?? []}
          showPhone={d.showPhone as boolean}
        />
      );
    case "BANNER":
      return (
        <Banner
          image={d.image as string}
          headline={d.headline as string}
          ctaLabel={d.ctaLabel as string}
          ctaHref={d.ctaHref as string}
          textAlign={d.textAlign as "left" | "center" | "right"}
        />
      );
    case "CATEGORY_GRID":
      return (
        <CategoryGridView
          heading={d.heading as string}
          columns={d.columns as number}
          categories={ctx.categories}
        />
      );
    case "FEATURED_PRODUCTS":
      return (
        <FeaturedProductsView
          heading={d.heading as string}
          limit={d.limit as number}
          columns={d.columns as number}
          products={ctx.featuredProducts}
          saleBadgeLabel={ctx.saleBadgeLabel}
          edits={ctx.edits}
        />
      );
    case "TEXT_BLOCK":
      return (
        <TextBlock
          heading={d.heading as string}
          body={d.body as string}
          image={d.image as string}
          textAlign={d.textAlign as "left" | "center"}
        />
      );
    case "IMAGE_TEXT":
      return (
        <ImageText
          image={d.image as string}
          heading={d.heading as string}
          body={d.body as string}
          imagePosition={d.imagePosition as "left" | "right"}
          ctaLabel={d.ctaLabel as string}
          ctaHref={d.ctaHref as string}
        />
      );
    case "STORY":
      return (
        <Story
          heading={d.heading as string}
          body={d.body as string}
          ctaLabel={d.ctaLabel as string}
          ctaHref={d.ctaHref as string}
        />
      );
    case "FAQ_LIST":
      return (
        <FaqList heading={d.heading as string} items={d.items as { question: string; answer: string }[]} />
      );
    default:
      return null;
  }
}

export type RenderableSection = { id: string; type: string; data: unknown; isVisible?: boolean };

/**
 * Renders one section.
 *
 * `data` is untyped JSON in the DB, so it's run through the section's schema
 * first — that fills in any setting added after the row was saved, which is
 * what lets a section gain new options without a data migration.
 *
 * `data-section-id` is how the customizer maps a click in the preview iframe
 * back to the matching entry in its settings panel.
 */
export function RenderSection({ section, ctx }: { section: RenderableSection; ctx: SectionContext }) {
  const d = resolveSectionData(section.type, section.data);
  const inner = body(section.type, d, ctx);
  if (!inner) return null;

  return (
    <div data-section-id={section.id}>
      {UNFRAMED.has(section.type) ? (
        inner
      ) : (
        <SectionFrame style={resolveSectionStyle(section.data)}>{inner}</SectionFrame>
      )}
    </div>
  );
}
