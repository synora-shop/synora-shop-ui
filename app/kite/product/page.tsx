import { KiteTemplateView } from "@/components/kite/template";
import { HEADER_GROUP, PRODUCT } from "@/components/kite/templates";
import { KITE_DEMO_BAG, KITE_DEMO_PRODUCT, KITE_DEMO_STYLE_WITH, kiteDemoContext } from "@/components/kite/demo";

/**
 * Kite's product page in the reference build — "Product Page" in the file,
 * which draws a header and the product and no footer. Its bag carries a
 * count of 2, as the file's does.
 */
export default function KiteProductPage() {
  const ctx = kiteDemoContext({ product: KITE_DEMO_PRODUCT, products: KITE_DEMO_STYLE_WITH, cart: KITE_DEMO_BAG });
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={PRODUCT} ctx={ctx} />
    </>
  );
}
