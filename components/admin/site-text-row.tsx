"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteText, resetSiteText } from "@/app/admin/site-text/actions";
import { SaveButton, type SaveState } from "@/components/ui/save-button";

export function SiteTextRow({
  itemKey,
  label,
  group,
  value,
  defaultValue,
  isOverridden,
}: {
  itemKey: string;
  label: string;
  group: string;
  value: string;
  defaultValue: string;
  isOverridden: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = current !== value;

  async function handleSave() {
    setSaveState("saving");
    setError(null);
    try {
      await updateSiteText(itemKey, current, group);
      router.refresh();
      setSaveState("saved");
    } catch {
      setError("Failed to save.");
      setSaveState("error");
    }
  }

  async function handleReset() {
    setSaveState("saving");
    setError(null);
    try {
      await resetSiteText(itemKey);
      setCurrent(defaultValue);
      router.refresh();
      setSaveState("saved");
    } catch {
      setError("Failed to reset.");
      setSaveState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center">
      <label className="w-56 shrink-0 text-xs text-ink-soft">{label}</label>
      <input
        value={current}
        onChange={(e) => {
          setCurrent(e.target.value);
          setSaveState("idle");
        }}
        className="input h-9 flex-1 text-sm"
      />
      {(dirty || saveState === "saved" || saveState === "error") && (
        <SaveButton state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState} onClick={handleSave} size="sm" />
      )}
      {isOverridden && !dirty && saveState !== "saved" && (
        <button
          type="button"
          onClick={handleReset}
          disabled={saveState === "saving"}
          className="text-xs text-ink-soft underline-scribble transition-colors hover:text-ink active:text-brand-600 disabled:opacity-50"
        >
          Reset to default
        </button>
      )}
      {error && <span className="text-xs text-rose">{error}</span>}
    </div>
  );
}
