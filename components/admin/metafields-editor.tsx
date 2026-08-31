"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button, Badge, EmptyState } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { removeMetafield, upsertMetafield } from "@/app/admin/metafields/actions";
import {
  METAFIELD_TYPES,
  TYPE_LABELS,
  nameProblem,
  valueProblem,
  type MetafieldType,
  type OwnerType,
} from "@/lib/metafields";

export type MetafieldRow = {
  id: string;
  namespace: string;
  key: string;
  type: string;
  value: string;
};

/**
 * The custom fields on one thing.
 *
 * Shows the Liquid path beside every field, because that is the only reason a
 * merchant is on this screen: they are adding a field so a theme can print it,
 * and without the path they have to guess how to reach it. Guessing is how you
 * get a field that is stored correctly and never appears.
 */
export function MetafieldsEditor({
  ownerType,
  ownerId,
  initial,
}: {
  ownerType: OwnerType;
  ownerId: string;
  initial: MetafieldRow[];
}) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const [namespace, setNamespace] = useState("custom");
  const [key, setKey] = useState("");
  const [type, setType] = useState<MetafieldType>("single_line_text_field");
  const [value, setValue] = useState("");

  const liquidObject = ownerType === "collection" ? "collection" : ownerType;

  function reset() {
    setAdding(false);
    setNamespace("custom");
    setKey("");
    setType("single_line_text_field");
    setValue("");
  }

  async function save() {
    // Checked here as well as on the server so a typo is answered immediately
    // rather than after a round trip. The server still decides.
    const named = nameProblem(namespace.trim(), key.trim());
    if (named) return toast.error(named);
    const bad = valueProblem(type, value);
    if (bad) return toast.error(bad);

    setBusy(true);
    const result = await upsertMetafield({ ownerType, ownerId, namespace, key, type, value });
    setBusy(false);

    if (!result.ok) return toast.error(result.error);

    setRows((current) => {
      const without = current.filter(
        (r) => !(r.namespace === namespace.trim() && r.key === key.trim())
      );
      return [
        ...without,
        { id: `${namespace.trim()}.${key.trim()}`, namespace: namespace.trim(), key: key.trim(), type, value },
      ].sort((a, b) => `${a.namespace}.${a.key}`.localeCompare(`${b.namespace}.${b.key}`));
    });
    toast.success("Field saved.");
    reset();
  }

  async function remove(row: MetafieldRow) {
    setBusy(true);
    const result = await removeMetafield(row.id);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    setRows((current) => current.filter((r) => r.id !== row.id));
    toast.success("Field removed.");
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && !adding && (
        <EmptyState
          title="No custom fields"
          description="Add one to carry something the product model has no place for. A care label, a size chart, a badge. Your theme can then read it."
          action={
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" /> Add a field
            </Button>
          }
        />
      )}

      {rows.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm">
                    {row.namespace}.{row.key}
                  </p>
                  <Badge>{TYPE_LABELS[row.type as MetafieldType] ?? row.type}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-ink-soft">{row.value || ","}</p>
                {/* The whole point of the field: how a theme reaches it. */}
                <p className="mt-1 font-mono text-[11px] text-ink-faint">
                  {`{{ ${liquidObject}.metafields.${row.namespace}.${row.key} }}`}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(row)}
                aria-label={`Remove ${row.namespace}.${row.key}`}
                className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-rose-bg hover:text-rose disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">Namespace</span>
              <input
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className="input mt-1 font-mono"
                placeholder="custom"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">Key</span>
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input mt-1 font-mono"
                placeholder="material"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MetafieldType)}
              className="input mt-1"
            >
              {METAFIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Value</span>
            {type === "multi_line_text_field" || type === "json" ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
                className="input mt-1 font-mono"
              />
            ) : (
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input mt-1"
                type={type === "date" ? "date" : "text"}
              />
            )}
          </label>

          {key.trim() && namespace.trim() && (
            <p className="font-mono text-[11px] text-ink-faint">
              Your theme reads it as{" "}
              {`{{ ${liquidObject}.metafields.${namespace.trim()}.${key.trim()} }}`}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={save} disabled={busy}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save field
            </Button>
            <Button size="sm" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        rows.length > 0 && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add a field
          </Button>
        )
      )}
    </div>
  );
}
