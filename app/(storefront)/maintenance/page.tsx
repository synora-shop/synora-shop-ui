import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { storefrontClosure } from "@/lib/maintenance";
import { getStoreSettings } from "@/lib/data/settings";
import { resolveHolding, toHoldingPage } from "@/lib/holding-page";
import { toBrandMarks, pickLogo } from "@/lib/brand-marks";
import { ReopenSignupForm } from "@/components/storefront/reopen-signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // A shut store must not be indexed in this state. Without this, a shop that
  // pauses for a week can find its search results replaced by this notice.
  robots: { index: false, follow: false },
};

/**
 * What a customer sees when the store is not open to them.
 *
 * The words come from lib/holding-page.ts, which decides per field whether
 * they are the merchant's or ours. Two of the five reasons are the merchant's
 * to write; the rest are not, and the page does not hint that they might be.
 */
export default async function MaintenancePage() {
  const reason = await storefrontClosure();
  // Nothing holding it shut — send visitors who land here back to a working
  // store rather than showing a notice about a problem that has gone away.
  if (!reason) redirect("/");

  const settings = await getStoreSettings();
  // The shop's own mark stands in when the merchant has not given this page one
  // of its own. Marks live on the shop now, not the theme — lib/brand-marks.ts.
  const page = resolveHolding(reason, toHoldingPage(settings), pickLogo(toBrandMarks(settings)));

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      {page.logoUrl && (
        // Fixed height rather than intrinsic size: a merchant's logo can be
        // any dimensions, and a holding page that reflows when the image
        // lands is the first thing a customer sees of this shop.
        //
        // Plain <img>, not next/image: this page is force-dynamic and shown to
        // people who are being told to go away, so an optimisation round trip
        // buys nothing and one more thing can fail.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.logoUrl}
          alt=""
          className="mb-8 h-12 w-auto max-w-[220px] object-contain"
        />
      )}

      <h1 className="font-serif text-3xl font-semibold text-balance text-ink">{page.heading}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed whitespace-pre-line text-ink-soft">
        {page.message}
      </p>

      {page.offerSignup && <ReopenSignupForm />}
    </Container>
  );
}
