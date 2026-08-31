import { redirect } from "next/navigation";
import { canonicalUrl, currentShopId, db } from "@/lib/data/shop";
import { getOrCreateHomePage } from "@/lib/data/pages";
import { Customizer, type CustomizerPage } from "@/components/customizer/customizer";

export const dynamic = "force-dynamic";

/**
 * Where the preview iframe should point for a given page.
 *
 * Collection pages are excluded from the editor entirely (they render the
 * catalog, not sections), so only the section-rendered routes appear here.
 */
function previewPathFor(slug: string): string {
  const dedicated: Record<string, string> = { home: "/", about: "/about", faq: "/faq" };
  return dedicated[slug] ?? `/p/${slug}`;
}

export default async function CustomizePageRoute(props: PageProps<"/admin/customize">) {
  const sp = await props.searchParams;
  const requestedId = typeof sp.page === "string" ? sp.page : undefined;

  // Section-rendered pages only: a collection page has no sections to lay out,
  // it's driven by its category (see the Page model comment in schema.prisma).
  const sectionPages = () =>
    (db()).then((t) =>
      t.page.findMany({
        where: { categoryId: null, routePath: null },
        orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
        select: { id: true, slug: true, title: true },
      })
    );

  let rows = await sectionPages();

  if (rows.length === 0) {
    // A brand new shop has no pages yet. Creating the home page here costs one
    // write and lands the merchant in the editor they asked for; the
    // alternative — sending them to the storefront, which creates it lazily on
    // first render — drops them on a shopfront with no explanation.
    await getOrCreateHomePage();
    rows = await sectionPages();
    // Still nothing means the write failed rather than that there was nothing
    // to write, and the storefront is the only honest place left to send them.
    if (rows.length === 0) redirect("/");
  }

  const pages: CustomizerPage[] = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.slug === "home" ? "Home page" : p.title,
    previewPath: previewPathFor(p.slug),
  }));

  const page = pages.find((p) => p.id === requestedId) ?? pages[0];

  const sections = await (await db()).section.findMany({
    where: { pageId: page.id },
    orderBy: { order: "asc" },
    select: { id: true, type: true, data: true, isVisible: true },
  });

  // Keyed on the page, and it is not cosmetic. Every piece of state in the
  // customizer is per page: the section list, the undo stack, the saved
  // snapshot, the selection, the recovered draft. All of it is seeded from
  // props with useState, which reads them once, on mount.
  //
  // Switching pages is a router.push to the same route, so React kept the
  // component and its state while `page` updated underneath it. The panel went
  // on showing the previous page's sections, the preview loaded the new one,
  // `dirty` compared against the wrong snapshot and so stayed false, and Save
  // wrote the previous page's sections onto the page now named by page.id.
  // Silent, and destructive.
  return (
    <Customizer
      key={page.id}
      pages={pages}
      page={page}
      initialSections={sections}
      storeUrl={await canonicalUrl(await currentShopId())}
    />
  );
}
