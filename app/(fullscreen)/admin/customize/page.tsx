import { redirect } from "next/navigation";
import { canonicalUrl, currentShop, currentShopId, db } from "@/lib/data/shop";
import { revisionOf } from "@/lib/revision";
import { liveCopyOf } from "@/lib/themes/live";
import { kitFor } from "@/lib/themes/kits";
import { requiredTypes, templateFor } from "@/lib/themes/kit-templates";
import type { TemplateName } from "@/lib/themes/kit";
import { resolveSchemaData, type SectionSchema } from "@/lib/section-schema";
import { getOrCreateHomePage } from "@/lib/data/pages";
import { Customizer, type CustomizerPage } from "@/components/customizer/customizer";
import {
  PickerOptionsProvider,
  type PickerOptions,
} from "@/components/customizer/picker-options";

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

/**
 * The pages of a theme that brings its own sections, in the order a merchant
 * thinks about a shop, and where each is previewed. Only the ones the
 * storefront already draws from the kit are listed: a template the shop
 * cannot see yet would be edited blind.
 */
const KIT_PAGES: { name: TemplateName; title: string; path: (productSlug: string | null) => string }[] = [
  { name: "header", title: "Header", path: () => "/" },
  { name: "index", title: "Home page", path: () => "/" },
  { name: "collection", title: "Collection", path: () => "/shop" },
  { name: "product", title: "Product", path: (slug) => (slug ? `/product/${slug}` : "/shop") },
  { name: "search", title: "Search results", path: () => "/shop?q=a" },
  { name: "wishlist", title: "Wishlist", path: () => "/wishlist" },
  { name: "cart", title: "Cart", path: () => "/cart" },
  { name: "checkout", title: "Checkout", path: () => "/checkout" },
  { name: "sign-in", title: "Sign in", path: () => "/account/login" },
  { name: "account", title: "Account", path: () => "/account" },
  // The kit's sample order: the merchant has none of their own to open.
  { name: "order", title: "Order", path: () => "/order-confirmation/sample" },
  { name: "footer", title: "Footer", path: () => "/" },
];

export default async function CustomizePageRoute(props: PageProps<"/admin/customize">) {
  const sp = await props.searchParams;
  const requestedId = typeof sp.page === "string" ? sp.page : undefined;

  // A theme copy with its own sections is edited template by template — see
  // lib/themes/kits.ts. Which copy: the one named by ?copy=, else the live one.
  const kitEditor = await loadKitEditor(typeof sp.copy === "string" ? sp.copy : undefined, requestedId);
  if (kitEditor) return kitEditor;

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

  // What a section setting can point at. Fetched here, once, rather than by
  // each field: the panel renders every field of every section on the page,
  // so a per-field query would be one round trip per setting.
  //
  // Capped, and the cap is deliberate. These become <option> elements in a
  // dropdown, and a shop with nine thousand products would otherwise ship all
  // nine thousand into the editor's HTML on every load. A shop past the cap
  // needs a search field rather than a longer list — see docs/QUEUE.md.
  const PICKER_LIMIT = 200;
  const client = await db();
  const [pickCollections, pickProducts, pickMenus] = await Promise.all([
    client.category.findMany({
      orderBy: { name: "asc" },
      take: PICKER_LIMIT,
      select: { id: true, name: true },
    }),
    client.product.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      take: PICKER_LIMIT,
      select: { id: true, title: true },
    }),
    // Menus are per business type, and a section can only point at one that
    // belongs to the storefront being edited.
    client.menu.findMany({
      orderBy: { name: "asc" },
      take: PICKER_LIMIT,
      select: { id: true, name: true },
    }),
  ]);
  const pickers: PickerOptions = {
    collection: pickCollections.map((c) => ({ value: c.id, label: c.name })),
    product: pickProducts.map((p) => ({ value: p.id, label: p.title })),
    menu: pickMenus.map((m) => ({ value: m.id, label: m.name })),
  };

  const [sections, storeUrl] = await Promise.all([
    client.section.findMany({
      where: { pageId: page.id },
      orderBy: { order: "asc" },
      select: { id: true, type: true, data: true, isVisible: true },
    }),
    currentShopId().then(canonicalUrl),
  ]);
  // What a save checks it is still replacing — see lib/revision.ts. The same
  // shape saveSections fingerprints.
  const revision = revisionOf(sections.map((r) => ({ id: r.id, type: r.type, data: r.data, isVisible: r.isVisible })));

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
    <PickerOptionsProvider options={pickers}>
      <Customizer
        key={page.id}
        pages={pages}
        page={page}
        initialSections={sections}
        revision={revision}
        storeUrl={storeUrl}
      />
    </PickerOptionsProvider>
  );
}

/**
 * The customizer for a theme copy that brings its own sections, or null when
 * the copy being edited draws the platform's own storefront.
 */
async function loadKitEditor(copyId: string | undefined, requested: string | undefined) {
  const client = await db();
  const shop = await currentShop();
  if (!shop) return null;
  const [settings, installed] = await Promise.all([
    client.themeSettings.findFirst({
      where: { businessType: shop.businessType },
      select: { themeKey: true, installedThemeId: true },
    }),
    // Every copy's identity, but not its templates: those are the largest
    // column in the table and only the one being edited is needed.
    client.installedTheme.findMany({
      orderBy: { installedAt: "asc" },
      select: { id: true, themeKey: true, version: true },
    }),
  ]);
  const chosen = (copyId && installed.find((c) => c.id === copyId)) || liveCopyOf(installed, settings);
  if (!chosen) return null;
  const kit = kitFor(chosen.themeKey, chosen.version);
  if (!kit) return null;

  const [stored, storeUrl, firstProduct, menus, pickCollections, pickProducts] = await Promise.all([
    client.installedTheme.findUnique({ where: { id: chosen.id }, select: { templates: true } }),
    canonicalUrl(shop.id),
    client.product.findFirst({
      where: { isActive: true, status: "PUBLISHED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { slug: true },
    }),
    client.menu.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true, handle: true } }),
    client.category.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
    client.product.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, take: 200, select: { id: true, title: true } }),
  ]);

  const pages: CustomizerPage[] = KIT_PAGES.map((p) => ({
    id: p.name,
    slug: p.name,
    title: p.title,
    previewPath: p.path(firstProduct?.slug ?? null),
  }));
  const page = pages.find((p) => p.id === requested) ?? pages.find((p) => p.id === "index")!;
  const name = page.id as TemplateName;

  // A kit's defaults name menus by handle ("main-menu"), which is the same in
  // every shop; the menu picker lists them by id. Translated here, so the
  // picker shows the menu the page is really drawing.
  const byHandle = new Map(menus.map((m) => [m.handle, m.id]));
  const schemas = Object.fromEntries(Object.entries(kit.sections).map(([type, def]) => [type, def.schema]));
  const toIds = (schema: SectionSchema | undefined, data: Record<string, unknown>) => {
    if (!schema) return data;
    const out = { ...data };
    for (const f of schema.fields) if (f.kind === "menu" && typeof out[f.key] === "string") out[f.key] = byHandle.get(out[f.key] as string) ?? out[f.key];
    if (schema.blocks && Array.isArray(out[schema.blocks.key])) {
      out[schema.blocks.key] = (out[schema.blocks.key] as Record<string, unknown>[]).map((b) => {
        const nb = { ...b };
        for (const f of schema.blocks!.fields) if (f.kind === "menu" && typeof nb[f.key] === "string") nb[f.key] = byHandle.get(nb[f.key] as string) ?? nb[f.key];
        return nb;
      });
    }
    return out;
  };

  const copy = { ...chosen, templates: stored?.templates ?? {} };
  const sections = templateFor(kit, copy.templates, name).sections.map((s) => ({
    id: s.id,
    type: s.type,
    data: toIds(schemas[s.type], resolveSchemaData(schemas[s.type], s.data)),
    isVisible: s.visible !== false,
  }));

  const pickers: PickerOptions = {
    collection: pickCollections.map((c) => ({ value: c.id, label: c.name })),
    product: pickProducts.map((p) => ({ value: p.id, label: p.title })),
    menu: menus.map((m) => ({ value: m.id, label: m.name })),
  };

  // Keyed on the copy and the template, for the reason the page-keyed one
  // below explains: every piece of editor state is per template.
  return (
    <PickerOptionsProvider options={pickers}>
      <Customizer
        key={`${copy.id}:${name}`}
        pages={pages}
        page={page}
        initialSections={sections}
        revision={revisionOf(((copy.templates ?? {}) as Record<string, unknown>)[name] ?? null)}
        storeUrl={storeUrl}
        schemas={schemas}
        kit={{ copyId: copy.id, template: name, required: requiredTypes(kit, name) }}
      />
    </PickerOptionsProvider>
  );
}
