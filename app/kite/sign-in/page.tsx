import { KiteTemplateView } from "@/components/kite/template";
import { FOOTER_GROUP, HEADER_GROUP, SIGN_IN } from "@/components/kite/templates";
import { kiteDemoContext } from "@/components/kite/demo";

/** Sign in. The reference build emails nobody: any six digits sign in. Not in the file: Kite's own parts (decided 8 October). */
export default function KiteSignInPage() {
  const ctx = kiteDemoContext();
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={SIGN_IN} ctx={ctx} />
      <KiteTemplateView template={FOOTER_GROUP} ctx={ctx} />
    </>
  );
}
