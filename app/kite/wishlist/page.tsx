import { KiteTemplateView } from "@/components/kite/template";
import { FOOTER_GROUP, HEADER_GROUP, WISHLIST } from "@/components/kite/templates";
import { kiteDemoContext } from "@/components/kite/demo";

/** Saved items — what Add to favourites keeps, in this browser. Not in the file: Kite's own parts (decided 8 October). */
export default function KiteWishlistPage() {
  const ctx = kiteDemoContext();
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={WISHLIST} ctx={ctx} />
      <KiteTemplateView template={FOOTER_GROUP} ctx={ctx} />
    </>
  );
}
