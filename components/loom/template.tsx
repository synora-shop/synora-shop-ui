import { resolve, type LoomContext, type LoomTemplate } from "@/components/loom/contract";
import { LOOM_SECTIONS } from "@/components/loom/sections";

/**
 * Draws a page from its template: each visible section, in order, with its
 * stored settings filled out to their defaults. The whole of "the customizer
 * changed something" is a different template handed to this.
 *
 * A type nobody registered draws nothing rather than failing the page — a
 * template saved by a newer theme version must not take an older one down.
 */
export function LoomTemplateView({ template, ctx }: { template: LoomTemplate; ctx: LoomContext }) {
  return (
    <>
      {template.sections
        .filter((s) => s.visible !== false)
        .map((s) => {
          const def = LOOM_SECTIONS[s.type];
          if (!def) return null;
          const Render = def.Render;
          return <Render key={s.id} data={resolve(def, s.data)} ctx={ctx} />;
        })}
    </>
  );
}
