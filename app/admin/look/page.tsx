import { GlobalEditsForm } from "@/components/admin/global-edits-form";
import { PageHeader } from "@/components/ui/primitives";
import { getStoreSettings } from "@/lib/data/settings";
import { toGlobalEdits } from "@/lib/global-edits";

export const dynamic = "force-dynamic";

/**
 * Store-wide look: the edits that apply across the whole storefront at once,
 * whichever theme is live (announcement bar, badges, stock, the shop page,
 * headings, the footer). Moved here from Settings on 15 October, with the new
 * admin: it is how the store looks, not how it is arranged.
 */
export default async function StoreWideLookPage() {
  const settings = await getStoreSettings();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Store-wide look"
        description="Site-wide edits. Each applies live across the whole storefront, including products and pages you add later."
      />
      <GlobalEditsForm settings={toGlobalEdits(settings)} />
    </div>
  );
}
