"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { saveStickyButtons, uploadButtonIcon, type StickyButtonInput } from "@/app/admin/buttons/actions";
import { BUILTIN_ICONS, type BuiltinIconKey } from "@/components/storefront/sticky-buttons";
import { type SaveState } from "@/components/ui/save-button";
import { StickySaveBar, type Problem } from "@/components/ui/sticky-save-bar";
import { useUnsavedChanges } from "@/components/ui/use-unsaved-changes";
import { useToast } from "@/components/ui/toast";
import { validateUrl } from "@/lib/url-validation";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  STICKY_KINDS,
  STICKY_SCOPES,
  STICKY_KIND_META,
  STICKY_SCOPE_LABELS,
  stickyButtonHref,
  type StickyKind,
  type StickyScope,
} from "@/lib/sticky-buttons";

type Draft = StickyButtonInput & { key: string };

let counter = 0;
const nextKey = () => `b${++counter}`;

function newButton(kind: StickyKind = "WHATSAPP"): Draft {
  const meta = STICKY_KIND_META[kind];
  return {
    key: nextKey(),
    kind,
    label: meta.label,
    value: "",
    message: "",
    scope: "ALL",
    iconKind: "BUILTIN",
    iconValue: "",
    color: meta.color,
    isVisible: true,
  };
}

function IconPicker({
  button,
  onChange,
}: {
  button: Draft;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadButtonIcon(formData);
    setUploading(false);
    if (result.error) setError(result.error);
    else if (result.url) onChange({ iconKind: "UPLOAD", iconValue: result.url });
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Icon</label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(Object.keys(BUILTIN_ICONS) as BuiltinIconKey[]).map((key) => {
          const Icon = BUILTIN_ICONS[key];
          const active = button.iconKind === "BUILTIN" && button.iconValue === key;
          return (
            <button
              key={key}
              type="button"
              aria-label={key}
              onClick={() => onChange({ iconKind: "BUILTIN", iconValue: key })}
              className={cn(
                "no-tap-scale flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-border text-ink-soft hover:bg-subtle active:bg-brand-100"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}

        <label
          className={cn(
            "flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors",
            button.iconKind === "UPLOAD"
              ? "border-brand-500 bg-brand-50 text-brand-600"
              : "border-border text-ink-soft hover:bg-subtle active:bg-brand-100"
          )}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {button.iconKind === "UPLOAD" ? "Replace" : "Upload"}
          <input
            type="file"
            accept=".svg,.png,image/svg+xml,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>

        {button.iconKind === "UPLOAD" && button.iconValue && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded icon preview */}
            <img src={button.iconValue} alt="" className="h-5 w-5 object-contain" />
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-ink-soft">SVG or PNG, up to 512 KB. SVGs are cleaned of any script before being stored.</p>
      {error && <p className="mt-1 text-xs text-rose">{error}</p>}
    </div>
  );
}

export function ButtonsManager({ initial }: { initial: StickyButtonInput[] }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [buttons, setButtons] = useState<Draft[]>(() => initial.map((b) => ({ ...b, key: nextKey() })));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initial));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const toast = useToast();
  const payload = buttons.map(({ key: _key, ...rest }) => rest);
  const dirty = JSON.stringify(payload) !== savedSnapshot;

  // Only the custom-link kind takes a raw URL; the rest build their href from a
  // phone number or handle, so validating those as links would be nonsense.
  const problems: Problem[] = buttons.flatMap((button) => {
    if (button.kind !== "LINK" || button.value.trim() === "") return [];
    const check = validateUrl(button.value, { allowEmpty: false, allowContactSchemes: true, allowInternal: false });
    if (check.ok) return [];
    return [
      {
        id: button.key,
        message: `${button.label}: ${check.error}`,
        onJump: () => setOpenKey(button.key),
        jumpLabel: "Open",
      },
    ];
  });

  useUnsavedChanges(dirty, () =>
    confirm({
      title: "Leave without saving?",
      description: "Your sticky button changes will be lost.",
      confirmLabel: "Leave and lose changes",
      cancelLabel: "Stay here",
      danger: true,
    })
  );

  function patch(key: string, changes: Partial<Draft>) {
    setButtons((list) => list.map((b) => (b.key === key ? { ...b, ...changes } : b)));
    setSaveState("idle");
  }

  function move(index: number, to: number) {
    if (to < 0 || to >= buttons.length) return;
    const next = [...buttons];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    setButtons(next);
    setSaveState("idle");
  }

  async function remove(button: Draft) {
    const ok = await confirm({
      title: `Remove the ${STICKY_KIND_META[button.kind as StickyKind]?.label ?? "button"}?`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setButtons((list) => list.filter((b) => b.key !== button.key));
    setSaveState("idle");
  }

  async function handleSave() {
    if (problems.length > 0) {
      toast.error("Fix the link problems before saving.");
      return;
    }
    setSaveState("saving");
    try {
      await saveStickyButtons(payload);
      setSavedSnapshot(JSON.stringify(payload));
      setSaveState("saved");
      toast.success("Sticky buttons saved.");
      router.refresh();
    } catch (error) {
      setSaveState("error");
      toast.error(error instanceof Error ? error.message : "Couldn't save. Please try again.");
    }
  }

  function handleDiscard() {
    setButtons((JSON.parse(savedSnapshot) as StickyButtonInput[]).map((b) => ({ ...b, key: nextKey() })));
    setOpenKey(null);
    setSaveState("idle");
    toast.info("Changes discarded.");
  }

  return (
    <div className="space-y-6">
      {dialog}

      <div className="space-y-2">
        {buttons.map((button, i) => {
          const meta = STICKY_KIND_META[button.kind as StickyKind] ?? STICKY_KIND_META.LINK;
          const open = openKey === button.key;
          return (
            <div key={button.key} className="rounded-lg border border-border bg-white">
              <div className="flex items-center gap-1 px-3 py-2">
                <span
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: button.color }}
                >
                  {button.iconKind === "UPLOAD" && button.iconValue ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded icon preview
                    <img src={button.iconValue} alt="" className="h-4 w-4 object-contain" />
                  ) : (
                    (() => {
                      const Icon = BUILTIN_ICONS[(button.iconValue as BuiltinIconKey) || "chat"] ?? BUILTIN_ICONS.chat;
                      return <Icon className="h-4 w-4" />;
                    })()
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : button.key)}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm transition-colors hover:text-brand-600 active:text-brand-700",
                    !button.isVisible && "text-ink-soft line-through"
                  )}
                >
                  {button.label}
                  <span className="ml-2 text-xs text-ink-soft">
                    {STICKY_SCOPE_LABELS[button.scope as StickyScope]}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === buttons.length - 1}
                  aria-label="Move down"
                  className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(button)}
                  aria-label="Remove button"
                  className="rounded p-1 text-ink-soft transition-colors hover:bg-rose/10 hover:text-rose active:bg-rose/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {open && (
                <div className="space-y-4 border-t border-border p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Type</label>
                      <select
                        value={button.kind}
                        onChange={(e) => {
                          const kind = e.target.value as StickyKind;
                          patch(button.key, {
                            kind,
                            label: STICKY_KIND_META[kind].label,
                            color: STICKY_KIND_META[kind].color,
                          });
                        }}
                        className="input mt-1 h-9 text-sm"
                      >
                        {STICKY_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {STICKY_KIND_META[k].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Show on
                      </label>
                      <select
                        value={button.scope}
                        onChange={(e) => patch(button.key, { scope: e.target.value })}
                        className="input mt-1 h-9 text-sm"
                      >
                        {STICKY_SCOPES.map((s) => (
                          <option key={s} value={s}>
                            {STICKY_SCOPE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        {meta.valueLabel}
                      </label>
                      <input
                        value={button.value}
                        placeholder={meta.valuePlaceholder}
                        onChange={(e) => patch(button.key, { value: e.target.value })}
                        className="input mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Tooltip / label
                      </label>
                      <input
                        value={button.label}
                        onChange={(e) => patch(button.key, { label: e.target.value })}
                        className="input mt-1 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {meta.supportsMessage && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Prefilled message
                      </label>
                      <textarea
                        value={button.message}
                        rows={2}
                        placeholder="Hi! I have a question…"
                        onChange={(e) => patch(button.key, { message: e.target.value })}
                        className="input mt-1 text-sm"
                      />
                    </div>
                  )}

                  <IconPicker button={button} onChange={(changes) => patch(button.key, changes)} />

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Button colour
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={button.color}
                        onChange={(e) => patch(button.key, { color: e.target.value })}
                        className="h-9 w-12 flex-shrink-0 rounded border border-border"
                      />
                      <input
                        value={button.color}
                        onChange={(e) => patch(button.key, { color: e.target.value })}
                        className="input h-9 text-sm"
                      />
                    </div>
                  </div>

                  <ToggleSwitch
                    label="Visible"
                    checked={button.isVisible}
                    onChange={(v) => patch(button.key, { isVisible: v })}
                  />

                  {button.value.trim() && (
                    <p className="truncate rounded bg-subtle px-3 py-2 text-[11px] text-ink-soft">
                      Opens: {stickyButtonHref(button)}
                    </p>
                  )}
                  {!button.value.trim() && (
                    <p className="flex items-center gap-1.5 text-xs text-amber">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Add a {meta.valueLabel.toLowerCase()} or this button won&apos;t show on the site.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {buttons.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-ink-soft">
            No buttons yet. Until you add one, the storefront keeps showing the original WhatsApp
            bubble using the number from Store Settings.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const created = newButton();
            setButtons((list) => [...list, created]);
            setOpenKey(created.key);
            setSaveState("idle");
          }}
          className="flex items-center gap-1 rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100"
        >
          <Plus className="h-4 w-4" /> Add button
        </button>
      </div>

      {/* Save lives in the shared sticky bar so it is reachable from anywhere
          in a long list, and reports blocking link problems alongside. */}
      <StickySaveBar
        dirty={dirty}
        saveState={saveState}
        onSave={handleSave}
        onDiscard={handleDiscard}
        problems={problems}
        saveLabel="Save buttons"
      />
    </div>
  );
}
