import { RenderSection, type RenderableSection } from "./sections/render";
import { PreviewSections } from "./preview-sections";
import { getSectionContext } from "@/lib/data/section-context";

/**
 * Renders a page's sections.
 *
 * For a customer this is pure server rendering — no preview JavaScript is
 * shipped at all. Inside the customizer's iframe it hands off to
 * PreviewSections, the client component the customizer streams draft edits to.
 */
export async function PageSections({
  sections,
  preview = false,
}: {
  sections: RenderableSection[];
  preview?: boolean;
}) {
  const ctx = await getSectionContext();
  if (preview) return <PreviewSections sections={sections} ctx={ctx} />;

  return (
    <>
      {sections
        .filter((section) => section.isVisible !== false)
        .map((section) => (
          <RenderSection key={section.id} section={section} ctx={ctx} />
        ))}
    </>
  );
}
