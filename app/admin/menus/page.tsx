import { getMenus, MENU_SLOTS } from "@/lib/data/menus";
import { getStoreSettings } from "@/lib/data/settings";
import { getAllPages } from "@/lib/data/pages";
import { MenuManager, type SlotRow } from "@/components/admin/menu-manager";

export const dynamic = "force-dynamic";

const SLOT_COPY: Record<(typeof MENU_SLOTS)[number], { label: string; hint: string }> = {
  header: { label: "Header", hint: "Across the top of every page. Nested items become dropdowns." },
  footer: { label: "Footer", hint: "At the bottom. Links sharing a column name are grouped under it." },
};

export default async function AdminMenusPage() {
  const [menus, settings, pages] = await Promise.all([
    getMenus(),
    getStoreSettings(),
    getAllPages(),
  ]);

  const assigned: Record<string, string | null> = {
    header: settings.headerMenuId ?? null,
    footer: settings.footerMenuId ?? null,
  };
  const slots: SlotRow[] = MENU_SLOTS.map((slot) => ({
    slot,
    ...SLOT_COPY[slot],
    menuId: assigned[slot],
  }));

  const pageOptions = pages
    // An unpublished custom page shouldn't be offered, but a collection page always can be.
    .filter((p) => p.isPublished || p.categoryId)
    .map((p) => ({ id: p.id, title: p.title, category: p.category ? { name: p.category.name } : null }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Menus</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Build as many menus as you like, then choose which one shows in the header and the
          footer. Drag to reorder. Pick from the pages and collections that already exist,
          renaming one updates every menu that links to it automatically.
        </p>
      </div>

      <MenuManager menus={menus} slots={slots} pages={pageOptions} />
    </div>
  );
}
