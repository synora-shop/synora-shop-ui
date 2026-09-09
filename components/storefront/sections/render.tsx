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
import { VideoSection } from "./video";
import { ImageComparison } from "./image-comparison";
import { Gallery } from "./gallery";
import { Marquee } from "./marquee";
import { Collage } from "./collage";
import { LogoList } from "./logo-list";
import { ProductCarousel } from "./product-carousel";
import { CollectionShowcase } from "./collection-showcase";
import { CategoryList } from "./category-list";
import { ComparisonTable } from "./comparison-table";
import { Countdown } from "./countdown";
import { TrustBadges } from "./trust-badges";
import { Testimonials } from "./testimonials";
import { Multicolumn } from "./multicolumn";
import { Steps } from "./steps";
import { Timeline } from "./timeline";
import { Stats } from "./stats";
import { HighlightText } from "./highlight-text";
import { Team } from "./team";
import { ButtonRow, Divider, Spacer } from "./layout-bits";
import type { CardLayout } from "@/lib/theme-layout";
import { resolveSectionData, resolveSectionStyle, sectionLabel } from "@/lib/section-schema";
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
  /** The store's own currency code, so every price in every section is in it. */
  currency: string;
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
  /**
   * How the active theme wants a product card to look.
   *
   * Carried on the context rather than read inside each section, because three
   * different sections render product cards and a page renders them thirty at a
   * time — a lookup per card is thirty lookups for one answer that cannot
   * change mid-page.
   */
  cardLayout?: CardLayout;
  cardFeatures?: { hoverSwapImage?: boolean; quickAdd?: boolean; swatchesOnCard?: boolean };
};

/** Sections that own their full-bleed shell and opt out of SectionFrame. */
/**
 * Sections that own their full-bleed shell and opt out of SectionFrame.
 *
 * A spacer is here because the frame's own padding would be added to the gap
 * it exists to create, so "48px of space" would silently be 144.
 */
const UNFRAMED = new Set(["HERO_SLIDESHOW", "SPACER", "MARQUEE"]);

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
          currency={ctx.currency}
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

    /* ----------------------------------------------------------- media -- */
    case "VIDEO":
      return (
        <VideoSection
          url={d.url as string}
          poster={d.poster as string}
          heading={d.heading as string}
          body={d.body as string}
          height={d.height as string}
          overlayOpacity={d.overlayOpacity as number}
          ctaLabel={d.ctaLabel as string}
          ctaHref={d.ctaHref as string}
        />
      );
    case "IMAGE_COMPARISON":
      return (
        <ImageComparison
          heading={d.heading as string}
          beforeImage={d.beforeImage as string}
          afterImage={d.afterImage as string}
          beforeLabel={d.beforeLabel as string}
          afterLabel={d.afterLabel as string}
          startAt={d.startAt as number}
        />
      );
    case "GALLERY":
      return (
        <Gallery
          heading={d.heading as string}
          columns={d.columns as number}
          shape={d.shape as string}
          images={d.images as { image?: string; caption?: string; href?: string }[]}
        />
      );
    case "MARQUEE":
      return (
        <Marquee
          text={d.text as string}
          separator={d.separator as string}
          speed={d.speed as number}
          size={d.size as string}
        />
      );
    case "COLLAGE":
      return (
        <Collage
          heading={d.heading as string}
          layout={d.layout as string}
          tiles={d.tiles as { image?: string; label?: string; href?: string }[]}
        />
      );
    case "LOGO_LIST":
      return (
        <LogoList
          heading={d.heading as string}
          logos={d.logos as { image?: string; alt?: string; href?: string }[]}
          grayscale={d.grayscale as boolean}
          logoHeight={d.logoHeight as number}
        />
      );

    /* -------------------------------------------------------- commerce -- */
    case "PRODUCT_CAROUSEL":
      return (
        <ProductCarousel
          heading={d.heading as string}
          products={ctx.featuredProducts}
          limit={d.limit as number}
          cardWidth={d.cardWidth as string}
          ctaLabel={d.ctaLabel as string}
          ctaHref={d.ctaHref as string}
          currency={ctx.currency}
          saleBadgeLabel={ctx.saleBadgeLabel}
          edits={ctx.edits}
          cardLayout={ctx.cardLayout}
          features={ctx.cardFeatures}
        />
      );
    case "COLLECTION_SHOWCASE":
      return (
        <CollectionShowcase
          collection={d.collection as string}
          categories={ctx.categories}
          heading={d.heading as string}
          body={d.body as string}
          products={ctx.featuredProducts}
          limit={d.limit as number}
          imagePosition={d.imagePosition as string}
          currency={ctx.currency}
          saleBadgeLabel={ctx.saleBadgeLabel}
          edits={ctx.edits}
          cardLayout={ctx.cardLayout}
          features={ctx.cardFeatures}
        />
      );
    case "CATEGORY_LIST":
      return (
        <CategoryList
          heading={d.heading as string}
          categories={ctx.categories}
          align={d.align as string}
          showCount={d.showCount as boolean}
        />
      );
    case "COMPARISON_TABLE":
      return (
        <ComparisonTable
          heading={d.heading as string}
          body={d.body as string}
          rows={d.rows as { label?: string; a?: string; b?: string; c?: string; d?: string }[]}
          highlightColumn={d.highlightColumn as number}
        />
      );
    case "COUNTDOWN":
      return (
        <Countdown
          heading={d.heading as string}
          endsAt={d.endsAt as string}
          finishedText={d.finishedText as string}
          hideWhenFinished={d.hideWhenFinished as boolean}
          ctaLabel={d.ctaLabel as string}
          ctaHref={d.ctaHref as string}
        />
      );
    case "TRUST_BADGES":
      return (
        <TrustBadges
          heading={d.heading as string}
          badges={d.badges as { icon?: string; title?: string; text?: string }[]}
          columns={d.columns as number}
        />
      );

    /* --------------------------------------------------------- content -- */
    case "TESTIMONIALS":
      return (
        <Testimonials
          heading={d.heading as string}
          quotes={d.quotes as { quote?: string; name?: string; rating?: number; image?: string }[]}
          columns={d.columns as number}
          showRating={d.showRating as boolean}
        />
      );
    case "MULTICOLUMN":
      return (
        <Multicolumn
          heading={d.heading as string}
          columnsList={d.columnsList as { image?: string; title?: string; text?: string; ctaLabel?: string; ctaHref?: string }[]}
          columns={d.columns as number}
          align={d.align as string}
        />
      );
    case "STEPS":
      return (
        <Steps
          heading={d.heading as string}
          steps={d.steps as { title?: string; text?: string }[]}
          direction={d.direction as string}
        />
      );
    case "TIMELINE":
      return (
        <Timeline
          heading={d.heading as string}
          events={d.events as { date?: string; title?: string; text?: string }[]}
        />
      );
    case "STATS":
      return (
        <Stats
          heading={d.heading as string}
          stats={d.stats as { value?: string; label?: string }[]}
          columns={d.columns as number}
        />
      );
    case "HIGHLIGHT_TEXT":
      return (
        <HighlightText
          text={d.text as string}
          size={d.size as string}
          align={d.align as string}
          ctaLabel={d.ctaLabel as string}
          ctaHref={d.ctaHref as string}
        />
      );
    case "TEAM":
      return (
        <Team
          heading={d.heading as string}
          people={d.people as { image?: string; name?: string; role?: string; text?: string }[]}
          columns={d.columns as number}
          shape={d.shape as string}
        />
      );

    /* ---------------------------------------------------------- layout -- */
    case "DIVIDER":
      return (
        <Divider
          style={d.style as string}
          thickness={d.thickness as number}
          widthPercent={d.widthPercent as number}
        />
      );
    case "SPACER":
      return <Spacer height={d.height as number} showOnMobile={d.showOnMobile as boolean} />;
    case "BUTTON_ROW":
      return (
        <ButtonRow
          heading={d.heading as string}
          buttons={d.buttons as { label?: string; href?: string; style?: string }[]}
          align={d.align as string}
        />
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
        // The label rides on the frame so the customizer's placeholder can name
        // an empty section without this component knowing it is in a preview.
        <SectionFrame style={resolveSectionStyle(section.data)} label={sectionLabel(section.type)}>
          {inner}
        </SectionFrame>
      )}
    </div>
  );
}
