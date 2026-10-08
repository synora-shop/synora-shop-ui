import { KiteTemplateView } from "@/components/kite/template";
import { FOOTER_GROUP, HEADER_GROUP, ORDER } from "@/components/kite/templates";
import { KITE_DEMO_ORDER, KITE_DEMO_BAG, kiteDemoContext } from "@/components/kite/demo";

/** One of Sarah's orders. Not in the file: Kite's own parts (decided 8 October). */
export default function KiteOrderPage() {
  const ctx = kiteDemoContext({ order: KITE_DEMO_ORDER, cart: KITE_DEMO_BAG });
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={ORDER} ctx={ctx} />
      <KiteTemplateView template={FOOTER_GROUP} ctx={ctx} />
    </>
  );
}
