import { DiscountEditor } from "@/components/next-admin/discount-editor";

export const metadata = { title: "Discount" };

export default async function NewDiscountPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return <DiscountEditor start={code} />;
}
