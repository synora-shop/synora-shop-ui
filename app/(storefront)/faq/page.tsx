import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOrCreateFaqPage } from "@/lib/data/pages";
import { PageSections } from "@/components/storefront/page-sections";
import { isPreview } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FAQs" };

export default async function FaqPage(props: PageProps<"/faq">) {
  const page = await getOrCreateFaqPage();

  // The merchant can move this page. When they have, this address is the old
  // one: forward to where it lives now rather than serving it from two places,
  // which would have search engines indexing both and neither ranking.
  if (page.slug !== "faq") redirect(`/p/${page.slug}`);

  return <PageSections sections={page.sections} preview={isPreview(await props.searchParams)} />;
}
