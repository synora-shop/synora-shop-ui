import { Container } from "@/components/ui/container";
import type { SectionStyle } from "@/lib/section-schema";

const BACKGROUND_CLASS: Record<string, string> = {
  none: "",
  canvas: "bg-canvas",
  subtle: "bg-subtle",
  accent: "bg-brand-500 text-white",
};

/**
 * Applies the style settings every section shares (spacing, background,
 * content width) so no individual section renderer has to implement them.
 *
 * This is what makes "Top spacing" or "Background" work identically on a
 * section written today and one that arrives later in an uploaded theme.
 */
export function SectionFrame({
  style,
  children,
  className = "",
  label,
}: {
  style: SectionStyle;
  children: React.ReactNode;
  className?: string;
  /** What this section is called, for the customizer's empty placeholder. */
  label?: string;
}) {
  const background = BACKGROUND_CLASS[style.background] ?? "";
  const custom = style.background === "custom" ? { backgroundColor: style.backgroundCustom } : undefined;

  /**
   * `section-body` is load-bearing, not decoration.
   *
   * Every renderer returns null when it has nothing to show — no photos, no
   * quotes, no rows. But the *element* handed to this frame is truthy either
   * way, so the frame still drew its padding around nothing: an unconfigured
   * section left a 96px empty band on the page. With twelve sections that was
   * rare enough to miss; at thirty-four it is twenty-two empty bands.
   *
   * The class gives the stylesheet something to test, and globals.css collapses
   * a section whose body came out empty — while the customizer keeps showing it
   * so a merchant who has just added one can still find it.
   */
  const inner =
    style.width === "full" ? (
      <div className={`section-body ${className}`.trim()} data-section-label={label}>
        {children}
      </div>
    ) : (
      <Container
        className={`section-body ${style.width === "narrow" ? "max-w-3xl" : ""} ${className}`.trim()}
        data-section-label={label}
      >
        {children}
      </Container>
    );

  // `relative` + `overflow-hidden` so a section can lay a full-bleed background
  // image or overlay inside the frame (Banner does) without needing its own
  // wrapper element and losing these shared style settings.
  return (
    <section
      className={`relative overflow-hidden ${background}`.trim()}
      style={{ paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, ...custom }}
    >
      {inner}
    </section>
  );
}
