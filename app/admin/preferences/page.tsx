import { getStoreSettings } from "@/lib/data/settings";
import { toVisibility } from "@/lib/visibility";
import { VisibilityForm } from "@/components/admin/visibility-form";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

/**
 * Preferences — visibility.
 *
 * The first thing under Preferences because it is the first question about a
 * shop: is anybody able to see it? All four of these used to be somewhere else
 * or nowhere at all — two of them sat at the bottom of Global Edits between a
 * badge colour and a WhatsApp button.
 */
export default async function PreferencesPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Visibility"
        description="Who can see your store, who can find it, and who can write to you."
      />
      <VisibilityForm initial={toVisibility(settings)} />
    </div>
  );
}
