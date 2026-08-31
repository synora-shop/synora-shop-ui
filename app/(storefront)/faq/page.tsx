import type { Metadata } from "next";
import { getOrCreateFaqPage } from "@/lib/data/pages";
import { PageSections } from "@/components/storefront/page-sections";
import { isPreview } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FAQs" };

export default async function FaqPage(props: PageProps<"/faq">) {
  const page = await getOrCreateFaqPage();

  return <PageSections sections={page.sections} preview={isPreview(await props.searchParams)} />;
}
