import { db } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { draftCatalogue } from "@/lib/data/draft-orders";
import { CITIES } from "@/lib/cities";
import { DraftOrderEditor } from "@/components/admin/draft-order-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New draft order" };

/** A new order by hand. From a customer's page, ?customer= starts it with their details. */
export default async function NewDraftOrder(props: { searchParams: Promise<{ customer?: string }> }) {
  const { customer: customerId } = await props.searchParams;
  const [catalogue, settings] = await Promise.all([draftCatalogue(), getStoreSettings()]);
  const customer = customerId
    ? await (await db()).customer.findFirst({
        where: { id: customerId },
        include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 1 } },
      })
    : null;
  const address = customer?.addresses[0];
  const known = new Set<string>(CITIES.map((c) => c.name));

  return (
    <DraftOrderEditor
      status="OPEN"
      catalogue={catalogue}
      cities={CITIES.map((c) => c.name)}
      initial={{
        channel: "WhatsApp",
        customerName: customer?.name ?? "",
        customerEmail: customer?.email ?? "",
        customerPhone: address?.phone ?? customer?.phone ?? "",
        shippingLine1: address?.line1 ?? "",
        shippingLine2: address?.line2 ?? "",
        shippingCity: address?.city && known.has(address.city) ? address.city : "",
        shippingPostalCode: address?.postalCode ?? "",
        lines: [],
        shippingFee: settings.shippingFee,
        discountAmount: 0,
        paymentMethod: "COD",
        paid: false,
        notes: "",
      }}
    />
  );
}
