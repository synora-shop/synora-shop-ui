import type { KitContext, TemplateName } from "@/lib/themes/kit";
import { resolveKitSection } from "@/lib/themes/kit";
import type { ThemeKit } from "@/lib/themes/kits";
import { templateFor } from "@/lib/themes/kit-templates";
import { KitLive } from "@/components/storefront/kit-live";

/**
 * One page of a storefront whose theme brings its own sections: the shop's
 * template for `name` (its own edit, or the kit's default), drawn section by
 * section with the context the page assembled.
 *
 * A section type the kit no longer has draws nothing rather than failing the
 * page — though templateFor already falls back to the default for an edit
 * that no longer validates, so this is the second net, not the first.
 */
export function KitPage({
  kit,
  templates,
  name,
  ctx,
  preview = false,
}: {
  kit: ThemeKit;
  templates: unknown;
  name: TemplateName;
  ctx: KitContext;
  /** Drawn inside the customizer: live to its drafts. See KitLive. */
  preview?: boolean;
}) {
  const template = templateFor(kit, templates, name);
  const drawn = (
    <>
      {template.sections
        .filter((s) => s.visible !== false)
        .map((s) => {
          const def = kit.sections[s.type];
          if (!def) return null;
          const Render = def.Render;
          return (
            <div key={s.id} data-kit-section={s.id} className="contents">
              <Render data={resolveKitSection(def, s.data)} ctx={ctx} />
            </div>
          );
        })}
    </>
  );
  return preview ? (
    <KitLive kitKey={kit.themeKey} name={name} ctx={ctx}>
      {drawn}
    </KitLive>
  ) : (
    drawn
  );
}
