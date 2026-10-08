import { KiteTemplateView } from "@/components/kite/template";
import { HEADER_GROUP, HOME } from "@/components/kite/templates";
import { kiteDemoContext } from "@/components/kite/demo";

/** Kite's home page, drawn from its templates with the reference build's data. */
export default function KitePage() {
  const ctx = kiteDemoContext();
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={HOME} ctx={ctx} />
    </>
  );
}
