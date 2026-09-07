import { PageHeader } from "@/components/ui/primitives";
import { PaymentsForm } from "@/components/admin/payments-form";
import { getStoreSettings } from "@/lib/data/settings";
import { toEnabledMethods } from "@/lib/payment-methods";

export const dynamic = "force-dynamic";

/**
 * Settings — Payments.
 *
 * How a merchant takes money from their customers. Not to be confused with
 * Billing, which is what they pay us; they are opposite directions and used to
 * be neither, since this screen did not exist and the payment fields were three
 * boxes at the bottom of General that did nothing.
 */
export default async function PaymentsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Payments"
        description="How your customers pay you. What you pay us is Billing, which is a different screen and the other direction."
      />
      <PaymentsForm
        initial={{
          enabledPaymentMethods: toEnabledMethods(settings.enabledPaymentMethods),
          bankAccountDetails: settings.bankAccountDetails ?? "",
          jazzcashAccountDetails: settings.jazzcashAccountDetails ?? "",
          easypaisaAccountDetails: settings.easypaisaAccountDetails ?? "",
        }}
      />
    </div>
  );
}
