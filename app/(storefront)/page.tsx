import { getOrCreateHomePage } from "@/lib/data/pages";
import { PageSections } from "@/components/storefront/page-sections";
import { isPreview } from "@/lib/preview-mode";
import { guardStorefront } from "@/lib/maintenance";

// Always reflect the latest catalog/admin edits rather than a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function HomePage(props: PageProps<"/">) {

  await guardStorefront();
  const page = await getOrCreateHomePage();

  return <PageSections sections={page.sections} preview={isPreview(await props.searchParams)} />;
}
