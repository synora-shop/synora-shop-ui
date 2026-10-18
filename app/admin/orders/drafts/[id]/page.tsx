import { PageHeader } from "@/components/ui/primitives";
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
  if (draft.status === "COMPLETED") {
    const order = draft.orderId ? await (await db()).order.findFirst({ where: { id: draft.orderId }, select: { id: true } }) : null;
    if (order) redirect(`/admin/orders/${order.id}`);
    // Its order was deleted for good: nothing to edit or send any more.
    return (
      <div className="space-y-4">
        <PageHeader title={`#D${draft.number}`} crumbs={[{ label: "Draft orders", href: "/admin/orders/drafts" }]} />
        <div className="space-y-3 rounded-[16px] bg-white p-8 text-center ring-1 ring-[#0a0a0a]/[0.07]">
          <p className="text-[16px] font-semibold">Draft D{draft.number} became order #{draft.orderId}, which was later deleted for good.</p>
          <p className="text-[14px] text-[#0a0a0a]/55">To sell the same again, create a new draft.</p>
        </div>
      </div>
    );
  }

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
