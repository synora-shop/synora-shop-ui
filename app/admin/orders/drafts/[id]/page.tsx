import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/data/shop";
import { draftCatalogue } from "@/lib/data/draft-orders";
import { CITIES } from "@/lib/cities";
import { readDraftLines, type DraftStatus } from "@/lib/draft-orders";
import { DraftOrderEditor } from "@/components/admin/draft-order-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Draft order" };

export default async function DraftOrderPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const draft = await (await db()).draftOrder.findFirst({ where: { id } });
  if (!draft) notFound();
  // Once it is an order, the order is the page.
  if (draft.status === "COMPLETED" && draft.orderId) redirect(`/admin/orders/${draft.orderId}`);

  return (
    <DraftOrderEditor
      key={draft.updatedAt.toISOString()}
      id={draft.id}
      number={draft.number}
      status={draft.status as DraftStatus}
      catalogue={await draftCatalogue()}
      cities={CITIES.map((c) => c.name)}
      initial={{
        channel: draft.channel,
        customerName: draft.customerName,
        customerEmail: draft.customerEmail,
        customerPhone: draft.customerPhone,
        shippingLine1: draft.shippingLine1,
        shippingLine2: draft.shippingLine2,
        shippingCity: draft.shippingCity,
        shippingPostalCode: draft.shippingPostalCode,
        lines: readDraftLines(draft.lines),
        shippingFee: draft.shippingFee,
        discountAmount: draft.discountAmount,
        paymentMethod: draft.paymentMethod,
        paid: draft.paid,
        notes: draft.notes,
      }}
    />
  );
}
