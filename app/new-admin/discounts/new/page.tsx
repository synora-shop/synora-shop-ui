import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/new-admin/ui";
import { DiscountEditor } from "@/components/new-admin/discount-editor";

export const metadata = { title: "Discount" };

export default async function NewDiscountPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <>
      <Link href="/new-admin/discounts" className="-mb-2 inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-[#0a0a0a]/55 hover:text-[#0a0a0a]"><ArrowLeft className="h-4 w-4" /> Discounts</Link>
      <PageHeader icon="discounts" tone="lavender" title={code ? code : "New discount"} sub="Choose what it gives; the card on the right says it back in plain words." />
      <DiscountEditor start={code} />
    </>
  );
}
