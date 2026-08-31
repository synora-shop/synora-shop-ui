import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPageBySlug } from "@/lib/data/pages";
import { findRedirect } from "@/lib/data/redirects";
import { PageSections } from "@/components/storefront/page-sections";
import { isPreview } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/p/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPageBySlug(slug);
  if (!page) return {};
  return { title: page.seoTitle || page.title, description: page.seoDescription || undefined };
}

export default async function CustomPage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const page = await getPageBySlug(slug);
  if (!page || !page.isPublished) {
    // A page whose slug changed keeps working through its redirect.
    const target = await findRedirect(`/p/${slug}`);
    if (target) redirect(target);
    notFound();
  }


  return <PageSections sections={page.sections} preview={isPreview(await props.searchParams)} />;
}
