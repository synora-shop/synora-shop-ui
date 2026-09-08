import { PageHeader, Fieldset } from "@/components/ui/primitives";
import { PaymentsForm } from "@/components/admin/payments-form";
import { GatewayCard } from "@/components/admin/gateway-card";
import { getStoreSettings } from "@/lib/data/settings";
import { toEnabledMethods } from "@/lib/payment-methods";
import { currentShopId } from "@/lib/data/shop";
import { allGatewayRows, describeGateway } from "@/lib/payments/gateways";
import { paymentCryptoReady } from "@/lib/payments/crypto";
import { GATEWAY_PROVIDERS } from "@/lib/payments/providers";
import { resolveStoreDefaults } from "@/lib/store-defaults";

export const dynamic = "force-dynamic";

/**
 * Settings — Payments.
 *
 * How a merchant takes money from their customers. Not to be confused with
 * Billing, which is what they pay us; they are opposite directions and used to
 * be neither, since this screen did not exist and the payment fields were three
 * boxes at the bottom of General that did nothing.
 *
 * Two halves, in the order a merchant should meet them. A gateway is what most
 * shops want and the only way to be paid before the parcel leaves; the manual
 * methods below it are a customer promising to send money and a merchant
 * checking their phone.
 *
 * Nothing on this page can read a stored credential back. The state below is
 * built by `describeGateway`, which has no field that could carry one.
 */
export default async function PaymentsPage() {
  const settings = await getStoreSettings();
  const shopId = await currentShopId();
  const currency = resolveStoreDefaults(settings).currency;
  const rows = await allGatewayRows(shopId);
  const storageReady = paymentCryptoReady();

  const gateways = GATEWAY_PROVIDERS.map((meta) => {
    const view = describeGateway(meta.value, rows.find((r) => r.provider === meta.value) ?? null, currency);
    return {
      provider: view.provider,
      label: view.label,
      blurb: view.blurb,
      signupUrl: view.signupUrl,
      connected: view.connected,
      isActive: view.isActive,
      mode: view.mode,
      canGoLive: view.canGoLive,
      // Serialised for the client boundary; only ever displayed.
      connectedAt: view.connectedAt?.toISOString() ?? null,
      credentialsUpdatedAt: view.credentialsUpdatedAt?.toISOString() ?? null,
      sandboxVerifiedAt: view.sandboxVerifiedAt?.toISOString() ?? null,
      lastError: view.lastError,
      blockedReason: view.blockedReason,
      storageReady,
    };
  });

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Payments"
        description="How your customers pay you. What you pay us is Billing, which is a different screen and the other direction."
      />

      <Fieldset
        title="Card and wallet payments"
        description="Your own account with a payment provider. The money settles into your bank, not ours — we never hold it and never take a cut of it."
      >
        <div className="space-y-3">
          {gateways.map((g) => (
            <GatewayCard key={g.provider} state={g} />
          ))}
        </div>
      </Fieldset>

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
