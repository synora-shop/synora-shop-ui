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
}: {
  style: SectionStyle;
  children: React.ReactNode;
  className?: string;
}) {
  const background = BACKGROUND_CLASS[style.background] ?? "";
  const custom = style.background === "custom" ? { backgroundColor: style.backgroundCustom } : undefined;

  const inner =
    style.width === "full" ? (
      <div className={className}>{children}</div>
    ) : (
      <Container className={`${style.width === "narrow" ? "max-w-3xl" : ""} ${className}`.trim()}>
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
