"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteText, resetSiteText } from "@/app/admin/site-text/actions";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { FieldError } from "@/components/ui/primitives";

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
  const inputId = useId();
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
    <div className="flex flex-col gap-2 border-b border-border py-2 last:border-0 sm:flex-row sm:items-center sm:gap-3">
      {/* The label used to point at nothing: no htmlFor, and not wrapping the
          box either, so a screen reader read it and then landed nowhere. */}
      <label htmlFor={inputId} className="w-48 shrink-0 text-sm font-medium text-ink">
        {label}
      </label>
      {/* Capped, because a box the width of the screen for the words "Buy Now"
          is harder to read, not easier — but capped at 4xl rather than 2xl.
          At 2xl the field stopped roughly 290px short of the rule underneath
          it, so every row read as cut off rather than as a deliberately narrow
          column. The remaining gap is ordinary padding, and it is where the
          save button appears when a row is edited. */}
      <input
        id={inputId}
        value={current}
        onChange={(e) => {
          setCurrent(e.target.value);
          setSaveState("idle");
        }}
        className="input flex-1 sm:max-w-4xl"
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
      {error && <FieldError size="xs">{error}</FieldError>}
    </div>
  );
}
