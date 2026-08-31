"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ExternalLink, Globe, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useServerRows } from "@/components/ui/use-server-rows";
import {
  createRegion,
  deleteRegion,
  setDefaultRegion,
  updateRegion,
  type RegionDetails,
} from "@/app/admin/regions/actions";

export type RegionRowView = {
  id: string;
  handle: string;
  isDefault: boolean;
  details: RegionDetails;
};

export type MenuOption = { id: string; name: string };
export function RegionManager({
  regions: serverRegions,
  menus,
  overlaps,
  detectedCountry,
  storeUrl,
}: {
  regions: RegionRowView[];
  menus: MenuOption[];
  overlaps: string[];
  /** What the edge reports for whoever is looking at this page. */
  detectedCountry: string | null;
  storeUrl: string;
}) {
  const router = useRouter();
  const [regions, setRegions] = useServerRows(serverRegions);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    const result = await createRegion(name);
    setBusy(false);
    if (result.error) return setError(result.error);
    setNewName("");
    setCreating(false);
    if (result.id) setOpenId(result.id);
    router.refresh();
  }

  async function handleDelete(region: RegionRowView) {
    const ok = await confirm({
      title: `Delete "${region.details.name}"?`,
      description: region.isDefault
        ? "It is the fallback for visitors matching no other region, the oldest remaining region takes that over."
        : "Visitors it covered will fall back to your default region.",
      confirmLabel: "Delete region",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteRegion(region.id);
    if (result.error) return setError(result.error);
    setRegions((rows) => rows.filter((r) => r.id !== region.id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {dialog}
      {error && <p className="text-sm text-rose">{error}</p>}

      <div className="rounded-lg border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-brand-500" />
          <span className="text-ink-soft">You are browsing from</span>
          <span className="font-mono font-medium">{detectedCountry ?? "unknown"}</span>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Read from the connection at the edge, not from anything the browser sends, so it
          can&apos;t be faked. Only the two-letter country is used, no address is stored.
          {detectedCountry === null &&
            " Nothing detected here, which is normal in local development."}
        </p>
      </div>

      {overlaps.length > 0 && (
        <p className="rounded-lg border border-amber bg-amber-bg px-4 py-2 text-sm text-ink-soft">
          <strong className="text-ink">{overlaps.join(", ")}</strong>{" "}
          {overlaps.length === 1 ? "is" : "are"} listed in more than one region. The first
          region wins, so the later one will never be used for{" "}
          {overlaps.length === 1 ? "it" : "them"}.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">Your regions</h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New region
          </button>
        )}
      </div>

      {creating && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-4">
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
            placeholder="Region name, e.g. Gulf"
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

      {regions.length === 0 && !creating && (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-ink-soft">
          No regions yet, your store looks the same everywhere. Create one to change what
          visitors from certain countries see.
        </p>
      )}

      <div className="space-y-3">
        {regions.map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            menus={menus}
            storeUrl={storeUrl}
            open={openId === region.id}
            onToggle={() => setOpenId((id) => (id === region.id ? null : region.id))}
            onSaved={(details) =>
              setRegions((rows) => rows.map((r) => (r.id === region.id ? { ...r, details } : r)))
            }
            onMadeDefault={() =>
              setRegions((rows) => rows.map((r) => ({ ...r, isDefault: r.id === region.id })))
            }
            onDelete={() => handleDelete(region)}
            onError={setError}
          />
        ))}
      </div>
    </div>
  );
}

function RegionCard({
  region,
  menus,
  storeUrl,
  open,
  onToggle,
  onSaved,
  onMadeDefault,
  onDelete,
  onError,
}: {
  region: RegionRowView;
  menus: MenuOption[];
  storeUrl: string;
  open: boolean;
  onToggle: () => void;
  onSaved: (details: RegionDetails) => void;
  onMadeDefault: () => void;
  onDelete: () => void;
  onError: (msg: string) => void;
}) {
  const [details, setDetails] = useState<RegionDetails>(region.details);
  const [saved, setSaved] = useState<RegionDetails>(region.details);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(details) !== JSON.stringify(saved);
  const set = <K extends keyof RegionDetails>(key: K, value: RegionDetails[K]) =>
    setDetails((d) => ({ ...d, [key]: value }));

  async function handleSave() {
    setSaving(true);
    const result = await updateRegion(region.id, details);
    setSaving(false);
    if (result.error) return onError(result.error);
    setSaved(details);
    onSaved(details);
  }

  const codes = details.countries
    .split(/[\s,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

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
          <span className="truncate text-sm font-medium">{saved.name}</span>
          <span className="font-mono text-xs text-ink-faint">
            {codes.length > 0 ? codes.slice(0, 6).join(" ") : "no countries"}
            {codes.length > 6 && ` +${codes.length - 6}`}
          </span>
          {region.isDefault && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              Default
            </span>
          )}
          {!saved.isActive && (
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-soft">
              Off
            </span>
          )}
        </button>

        <a
          href={`${storeUrl}/?__region=${region.handle}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-ink-soft transition-colors hover:bg-subtle"
        >
          Preview <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${saved.name}`}
          className="rounded p-1.5 text-ink-soft transition-colors hover:bg-rose hover:text-white active:bg-rose"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-ink-soft">Name</label>
              <input
                value={details.name}
                onChange={(e) => set("name", e.target.value)}
                className="input mt-1 w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-soft">Countries</label>
              <input
                value={details.countries}
                onChange={(e) => set("countries", e.target.value)}
                placeholder="PK AE SA, two-letter codes"
                className="input mt-1 w-full font-mono text-sm"
              />
              <p className="mt-0.5 text-xs text-ink-faint">
                Anything that isn&apos;t a two-letter code is dropped when you save.
              </p>
            </div>
          </div>


          <div className="grid gap-3 sm:grid-cols-2">
            <MenuPicker
              label="Header menu"
              menus={menus}
              value={details.headerMenuId}
              onChange={(v) => set("headerMenuId", v)}
            />
            <MenuPicker
              label="Footer menu"
              menus={menus}
              value={details.footerMenuId}
              onChange={(v) => set("footerMenuId", v)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="text-xs font-semibold uppercase text-ink-soft">
                Announcement bar
              </label>
              <input
                value={details.announcementText ?? ""}
                onChange={(e) => set("announcementText", e.target.value)}
                placeholder="Leave empty to use the store's own"
                className="input mt-1 w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-soft">Colour</label>
              <input
                value={details.announcementBgColor ?? ""}
                onChange={(e) => set("announcementBgColor", e.target.value)}
                placeholder="#1a1a1a"
                className="input mt-1 w-28 font-mono text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={details.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            Live, visitors from these countries see this region
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40"
            >
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
            {!region.isDefault && (
              <button
                type="button"
                onClick={async () => {
                  const result = await setDefaultRegion(region.id);
                  if (result.error) return onError(result.error);
                  onMadeDefault();
                }}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-xs transition-colors",
                  "hover:bg-subtle active:bg-subtle"
                )}
              >
                Make default
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuPicker({
  label,
  menus,
  value,
  onChange,
}: {
  label: string;
  menus: MenuOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-ink-soft">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="input mt-1 w-full text-sm"
      >
        <option value="">, same as the rest of the store,</option>
        {menus.map((menu) => (
          <option key={menu.id} value={menu.id}>
            {menu.name}
          </option>
        ))}
      </select>
    </div>
  );
}
