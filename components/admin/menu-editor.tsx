"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import {
  addMenuItem,
  deleteMenuItem,
  saveMenuStructure,
  toggleMenuItemVisibility,
  updateMenuItem,
  type MenuTarget,
} from "@/app/admin/menus/actions";
import { FIXED_MENU_ROUTES } from "@/lib/menu-routes";
import { useConfirm, type ConfirmOptions } from "@/components/ui/confirm-dialog";
import { SwipeRow } from "@/components/ui/swipe-row";
import { NestableList } from "@/components/ui/nestable-list";
import { reparent } from "@/lib/drag-nesting";
import { SaveButton, type SaveState } from "@/components/ui/save-button";

export type PageOption = {
  id: string;
  title: string;
  category: { name: string } | null;
};

/** What shows in the picker/label for a Page — always the live category name when it's a
 * collection page, never the Page's own (unused) title. */
function pageOptionLabel(page: PageOption) {
  return page.category?.name ?? page.title;
}

export type MenuItemRow = {
  id: string;
  label: string;
  href: string;
  pageId: string | null;
  page: PageOption | null;
  groupLabel: string | null;
  isVisible: boolean;
  parentId: string | null;
  order: number;
};

/** Encodes a MenuTarget as a single <select> value: "page:<id>" or "fixed:<href>". */
function targetValue(item: { pageId: string | null; href: string }) {
  return item.pageId ? `page:${item.pageId}` : `fixed:${item.href}`;
}

/**
 * The name to show for a menu item, from whatever its <select> currently holds.
 *
 * There were three ways of working this out — the option in the dropdown, the
 * saved item's page title, and the raw stored label — and they disagreed the
 * moment someone changed the dropdown without saving. That's how a row reading
 * "Homepage" could ask you to confirm deleting "Lawn".
 *
 * Deriving it from the same value the <select> is bound to means what you read
 * is always what you're acting on, saved or not.
 */
function labelForTargetValue(value: string, pages: PageOption[]): string {
  if (value.startsWith("page:")) {
    const id = value.slice("page:".length);
    const page = pages.find((p) => p.id === id);
    // pageOptionLabel, the same function the dropdown renders with — anything
    // else here recreates the divergence this exists to remove.
    return page ? pageOptionLabel(page) : "Deleted page";
  }
  if (value.startsWith("fixed:")) {
    const href = value.slice("fixed:".length);
    return FIXED_MENU_ROUTES.find((r) => r.href === href)?.label ?? href;
  }
  return value;
}

function parseTargetValue(value: string, pages: PageOption[]): MenuTarget | null {
  if (value.startsWith("page:")) {
    const id = value.slice("page:".length);
    return pages.some((p) => p.id === id) ? { pageId: id } : null;
  }
  if (value.startsWith("fixed:")) {
    const href = value.slice("fixed:".length);
    const route = FIXED_MENU_ROUTES.find((r) => r.href === href);
    return route ? { href: route.href, label: route.label } : null;
  }
  return null;
}

function TargetSelect({
  value,
  onChange,
  pages,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  pages: PageOption[];
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <optgroup label="Pages">
        {pages.map((p) => (
          <option key={p.id} value={`page:${p.id}`}>
            {pageOptionLabel(p)}
          </option>
        ))}
      </optgroup>
      <optgroup label="Other">
        {FIXED_MENU_ROUTES.map((r) => (
          <option key={r.href} value={`fixed:${r.href}`}>
            {r.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function Row({
  item,
  pages,
  showGroup,
  onSaved,
  onError,
  confirm,
}: {
  item: MenuItemRow;
  pages: PageOption[];
  showGroup: boolean;
  onSaved: () => void;
  onError: (msg: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
  const router = useRouter();
  const initialTarget = targetValue(item);
  const [target, setTarget] = useState(initialTarget);
  const [groupLabel, setGroupLabel] = useState(item.groupLabel ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const dirty = target !== initialTarget || groupLabel !== (item.groupLabel ?? "");
  // Derived from the pending selection, not the saved row, so the name in the
  // delete prompt is always the name on screen.
  const currentLabel = labelForTargetValue(target, pages);

  async function handleSave() {
    const parsed = parseTargetValue(target, pages);
    if (!parsed) {
      onError("That target no longer exists, pick another one.");
      return;
    }
    setSaveState("saving");
    try {
      await updateMenuItem(item.id, parsed, showGroup ? groupLabel : undefined);
      onSaved();
      setSaveState("saved");
    } catch {
      onError("Failed to save, please try again.");
      setSaveState("error");
    }
  }

  async function handleToggle() {
    try {
      await toggleMenuItemVisibility(item.id);
      router.refresh();
    } catch {
      onError("Failed to update visibility, please try again.");
    }
  }

  async function handleDelete() {
    if (
      !(await confirm({
        title: `Delete "${currentLabel}"?`,
        description: dirty
          ? "This item has unsaved changes. Deleting it discards them too."
          : "It will be removed from this menu. Any sub-items under it go with it.",
        confirmLabel: "Delete item",
        danger: true,
      }))
    ) {
      return;
    }
    try {
      await deleteMenuItem(item.id);
      router.refresh();
    } catch {
      onError("Failed to delete, please try again.");
    }
  }

  return (
    <SwipeRow actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: handleDelete }]}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <TargetSelect
          value={target}
          onChange={(v) => {
            setTarget(v);
            setSaveState("idle");
          }}
          pages={pages}
          className="input h-8 flex-1 text-sm"
        />
        {showGroup && (
          <input
            value={groupLabel}
            onChange={(e) => {
              setGroupLabel(e.target.value);
              setSaveState("idle");
            }}
            placeholder="Column"
            className="input h-8 w-28 text-sm"
          />
        )}
        {(dirty || saveState === "saved" || saveState === "error") && (
          <SaveButton
            state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState}
            onClick={handleSave}
            size="sm"
          />
        )}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={item.isVisible ? "Hide item" : "Show item"}
          className="rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-ink"
        >
          {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
    </SwipeRow>
  );
}

export function MenuEditor({
  menuId,
  items: initial,
  pages,
  showGroup,
}: {
  menuId: string;
  items: MenuItemRow[];
  pages: PageOption[];
  showGroup: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  // `initial` is a fresh array from the server on every router.refresh() — resync so a
  // saved/deleted/added row's effect actually lands here instead of only in the DB. Rows
  // mid-edit keep their own local state untouched (their key doesn't change, so React
  // preserves the component instance and its unsaved input across this resync).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this *is* the sync, not a derived-state smell; a `key` remount would also wipe unrelated local UI state (newTarget/newGroup) that this effect must leave alone
    setItems(initial);
  }, [initial]);
  const firstOption = pages.length > 0 ? `page:${pages[0].id}` : `fixed:${FIXED_MENU_ROUTES[0].href}`;
  const [newTarget, setNewTarget] = useState(firstOption);
  const [newGroup, setNewGroup] = useState("");
  const [adding, setAdding] = useState(false);
  const { confirm, dialog } = useConfirm();

  function refresh() {
    router.refresh();
  }

  async function handleAdd() {
    const parsed = parseTargetValue(newTarget, pages);
    if (!parsed) return;
    setAdding(true);
    setError(null);
    try {
      await addMenuItem(menuId, parsed, newGroup.trim() || undefined);
      setNewGroup("");
      router.refresh();
    } catch {
      setError("Failed to add item, please try again.");
    } finally {
      setAdding(false);
    }
  }

  /**
   * A drag finished. The flat list is turned back into parent links and saved
   * in one go — order and nesting change together, so persisting them
   * separately would leave a window where the menu is inconsistent.
   */
  async function handleStructureChange(next: { id: string; depth: number }[]) {
    const rows = reparent(next);
    setItems(
      rows
        .map((r) => {
          const item = items.find((x) => x.id === r.id);
          return item ? { ...item, parentId: r.parentId, order: r.order } : null;
        })
        .filter(Boolean) as typeof items
    );
    try {
      await saveMenuStructure(menuId, rows.map((r) => ({ id: r.id, parentId: r.parentId })));
      refresh();
    } catch {
      setError("Couldn't save the new order, please try again.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      {dialog}
      {error && <p className="px-3 pt-3 text-sm text-rose">{error}</p>}
      <div className="p-3">
        <NestableList
          items={items.map((item) => ({
            id: item.id,
            depth: item.parentId ? 1 : 0,
            label: labelForTargetValue(targetValue(item), pages),
          }))}
          onChange={handleStructureChange}
          renderItem={(node) => {
            const item = items.find((x) => x.id === node.id);
            if (!item) return null;
            return (
              <Row
                item={item}
                pages={pages}
                showGroup={showGroup}
                onSaved={refresh}
                onError={(msg) => setError(msg)}
                confirm={confirm}
              />
            );
          }}
        />
        {items.length === 0 && <p className="p-4 text-sm text-ink-soft">No items yet.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
        <TargetSelect value={newTarget} onChange={setNewTarget} pages={pages} className="input h-8 flex-1 text-sm" />
        {showGroup && (
          <input
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            placeholder="Column (e.g. Shop)"
            className="input h-8 w-28 text-sm"
          />
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-1 rounded-full border border-brand-500 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}
