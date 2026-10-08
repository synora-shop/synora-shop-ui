import { KiteTemplateView } from "@/components/kite/template";
import { FOOTER_GROUP, HEADER_GROUP, CART } from "@/components/kite/templates";
import { KITE_DEMO_BAG, kiteDemoContext } from "@/components/kite/demo";

/** The bag, holding the file's two pieces. Not in the file: Kite's own parts (decided 8 October). */
export default function KiteCartPage() {
  const ctx = kiteDemoContext({ cart: KITE_DEMO_BAG });
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={CART} ctx={ctx} />
      <KiteTemplateView template={FOOTER_GROUP} ctx={ctx} />
    </>
  );
}
