import type { Metadata } from "next";
import { getOrCreateAboutPage } from "@/lib/data/pages";
import { PageSections } from "@/components/storefront/page-sections";
import { isPreview } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Our Story" };

export default async function AboutPage(props: PageProps<"/about">) {
  const page = await getOrCreateAboutPage();

  return <PageSections sections={page.sections} preview={isPreview(await props.searchParams)} />;
}
