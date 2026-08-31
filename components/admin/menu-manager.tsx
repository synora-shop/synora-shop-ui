"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useServerRows } from "@/components/ui/use-server-rows";
import { MenuEditor, type MenuItemRow, type PageOption } from "@/components/admin/menu-editor";
import { assignMenu, createMenu, deleteMenu, renameMenu } from "@/app/admin/menus/actions";

export type MenuRow = {
  id: string;
  name: string;
  handle: string;
  items: MenuItemRow[];
};

export type SlotRow = {
  slot: "header" | "footer";
  label: string;
  hint: string;
  menuId: string | null;
};

/**
 * Menus, and where each one is shown.
 *
 * There used to be exactly two lists, fixed by a column on every item, so the
 * same links could not appear in both places and a third menu could not exist.
 * A menu is now a named thing the merchant creates; the header and footer are
 * slots that point at one.
 */
export function MenuManager({
  menus: serverMenus,
  slots: serverSlots,
  pages,
}: {
  menus: MenuRow[];
  slots: SlotRow[];
  pages: PageOption[];
}) {
  const router = useRouter();
  const [menus, setMenus] = useServerRows(serverMenus);
  const [slots, setSlots] = useServerRows(serverSlots);
  const [openId, setOpenId] = useState<string | null>(serverMenus[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  /** Which slots a menu currently fills — shown on the menu so it is obvious. */
  const slotsUsing = (menuId: string) => slots.filter((s) => s.menuId === menuId);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    const result = await createMenu(name);
    setBusy(false);
    if (result.error) return setError(result.error);
    setNewName("");
    setCreating(false);
    if (result.id) setOpenId(result.id);
    router.refresh();
  }

  async function handleAssign(slot: SlotRow["slot"], menuId: string | null) {
    setError(null);
    setSlots((rows) => rows.map((s) => (s.slot === slot ? { ...s, menuId } : s)));
    const result = await assignMenu(slot, menuId);
    if (result.error) {
      setError(result.error);
      router.refresh();
      return;
    }
    router.refresh();
  }

  async function handleDelete(menu: MenuRow) {
    const used = slotsUsing(menu.id);
    const ok = await confirm({
      title: `Delete "${menu.name}"?`,
      description:
        used.length > 0
          ? `It is showing in the ${used.map((s) => s.label.toLowerCase()).join(" and ")}. That will fall back to your first menu until you assign another.`
          : `Its ${menu.items.length} link(s) go with it. This can't be undone.`,
      confirmLabel: "Delete menu",
      danger: true,
    });
    if (!ok) return;

    const result = await deleteMenu(menu.id);
    if (result.error) return setError(result.error);
    setMenus((rows) => rows.filter((m) => m.id !== menu.id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {dialog}
      {error && <p className="text-sm text-rose">{error}</p>}

      <section>
        <h2 className="font-serif text-lg font-semibold">Where menus appear</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Pick which menu fills each part of your storefront. One menu can fill both.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => (
            <div key={slot.slot} className="rounded-lg border border-border bg-white p-4">
              <label
                htmlFor={`slot-${slot.slot}`}
                className="text-xs font-semibold uppercase tracking-wide text-ink-soft"
              >
                {slot.label}
              </label>
              <select
                id={`slot-${slot.slot}`}
                value={slot.menuId ?? ""}
                onChange={(e) => handleAssign(slot.slot, e.target.value || null)}
                className="input mt-1 w-full text-sm"
              >
                <option value="">, use my first menu,</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-faint">{slot.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold">Your menus</h2>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New menu
            </button>
          )}
        </div>

        {creating && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-4">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setCreating(false);
                  setNewName("");
                }
              }}
              placeholder="Menu name, e.g. Legal"
              className="input h-9 flex-1 text-sm"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy || !newName.trim()}
              className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40"
            >
              {busy ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
                setError(null);
              }}
              className="text-xs text-ink-soft underline-scribble transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="mt-3 space-y-3">
          {menus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              pages={pages}
              open={openId === menu.id}
              onToggle={() => setOpenId((id) => (id === menu.id ? null : menu.id))}
              usedIn={slotsUsing(menu.id).map((s) => s.label)}
              onRenamed={(name) =>
                setMenus((rows) => rows.map((m) => (m.id === menu.id ? { ...m, name } : m)))
              }
              onDelete={() => handleDelete(menu)}
              onError={setError}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function MenuCard({
  menu,
  pages,
  open,
  onToggle,
  usedIn,
  onRenamed,
  onDelete,
  onError,
}: {
  menu: MenuRow;
  pages: PageOption[];
  open: boolean;
  onToggle: () => void;
  usedIn: string[];
  onRenamed: (name: string) => void;
  onDelete: () => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(menu.name);
  const [saving, setSaving] = useState(false);
  const dirty = name.trim() !== menu.name && name.trim().length > 0;

  async function handleRename() {
    setSaving(true);
    const trimmed = name.trim();
    const result = await renameMenu(menu.id, trimmed);
    setSaving(false);
    if (result.error) {
      onError(result.error);
      setName(menu.name);
      return;
    }
    onRenamed(trimmed);
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-ink-soft" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-soft" />
          )}
          {editing ? (
            <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dirty) handleRename();
                  if (e.key === "Escape") {
                    setName(menu.name);
                    setEditing(false);
                  }
                }}
                className="input h-8 w-48 text-sm"
              />
              {dirty && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleRename}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  aria-label="Save name"
                  className={cn(
                    "rounded p-1 text-brand-600 transition-colors hover:bg-brand-50",
                    saving && "opacity-50"
                  )}
                >
                  <Check className="h-4 w-4" />
                </span>
              )}
              <span
                role="button"
                tabIndex={0}
                onClick={() => {
                  setName(menu.name);
                  setEditing(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
                aria-label="Cancel"
                className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle"
              >
                <X className="h-4 w-4" />
              </span>
            </span>
          ) : (
            <span className="truncate text-sm font-medium">{menu.name}</span>
          )}
          <span className="text-xs text-ink-faint">
            {menu.items.length} link{menu.items.length === 1 ? "" : "s"}
          </span>
          {usedIn.map((label) => (
            <span
              key={label}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
            >
              {label}
            </span>
          ))}
        </button>

        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded px-2 py-1 text-xs text-ink-soft transition-colors hover:bg-subtle active:bg-subtle"
          >
            Rename
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${menu.name}`}
          className="rounded p-1.5 text-ink-soft transition-colors hover:bg-rose hover:text-white active:bg-rose"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-3">
          {/* Column names group the links when this menu is shown in the footer
              and are ignored in the header, so the field is always offered —
              which menu is where can change at any time. */}
          <MenuEditor menuId={menu.id} items={menu.items} pages={pages} showGroup />
        </div>
      )}
    </div>
  );
}
