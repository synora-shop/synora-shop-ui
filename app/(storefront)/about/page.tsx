import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOrCreateAboutPage } from "@/lib/data/pages";
import { PageSections } from "@/components/storefront/page-sections";
import { isPreview } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Our Story" };

export default async function AboutPage(props: PageProps<"/about">) {
  const page = await getOrCreateAboutPage();

  // The merchant can move this page. When they have, this address is the old
  // one: forward to where it lives now rather than serving it from two places,
  // which would have search engines indexing both and neither ranking.
  if (page.slug !== "about") redirect(`/p/${page.slug}`);

  return <PageSections sections={page.sections} preview={isPreview(await props.searchParams)} />;
}
