import { resolve, type KiteContext, type KiteTemplate } from "@/components/kite/contract";
import { KITE_SECTIONS } from "@/components/kite/sections";

/** A template drawn section by section — the reference build's renderer. */
export function KiteTemplateView({ template, ctx }: { template: KiteTemplate; ctx: KiteContext }) {
  return (
    <>
      {template.sections
        .filter((s) => s.visible !== false)
        .map((s) => {
          const def = KITE_SECTIONS[s.type];
          if (!def) return null;
          const Render = def.Render;
          return <Render key={s.id} data={resolve(def, s.data)} ctx={ctx} />;
        })}
    </>
  );
}
