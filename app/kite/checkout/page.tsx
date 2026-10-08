import { KiteTemplateView } from "@/components/kite/template";
import { FOOTER_GROUP, HEADER_GROUP, CHECKOUT } from "@/components/kite/templates";
import { KITE_DEMO_BAG, kiteDemoContext } from "@/components/kite/demo";

/** Checkout, for the file's two pieces. Placing the order only pretends. Not in the file: Kite's own parts (decided 8 October). */
export default function KiteCheckoutPage() {
  const ctx = kiteDemoContext({ cart: KITE_DEMO_BAG });
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={CHECKOUT} ctx={ctx} />
      <KiteTemplateView template={FOOTER_GROUP} ctx={ctx} />
    </>
  );
}
