"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SettingFieldInput } from "./setting-field";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { settingAnchor } from "@/lib/settings-index";
import {
  DEFAULT_SECTION_STYLE,
  STYLE_FIELDS,
  STYLE_KEY,
  defaultBlockData,
  getSectionSchema,
  isFieldDisabled,
  type BlockSchema,
  type SettingField,
} from "@/lib/section-schema";
import type { RenderableSection } from "@/components/storefront/sections/render";

type Data = Record<string, unknown>;

function Collapsible({
  title,
  children,
  defaultOpen = true,
  onReset,
  resetLabel = "Reset this group to its defaults?",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Shows a per-group revert control when provided. */
  onReset?: () => void;
  resetLabel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { confirm, dialog } = useConfirm();

  return (
    <div className="border-t border-border pt-3">
      {dialog}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:text-brand-600"
        >
          {title}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {onReset && open && (
          <button
            type="button"
            title="Reset to defaults"
            aria-label={`Reset ${title} to defaults`}
            onClick={async () => {
              if (await confirm({ title: resetLabel, confirmLabel: "Reset", danger: true })) onReset();
            }}
            className="rounded p-1 text-ink-faint transition-colors hover:bg-subtle hover:text-ink-soft active:bg-brand-100"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
      {open && <div className="mt-3 space-y-4">{children}</div>}
    </div>
  );
}

/** The repeatable-items editor (slides, FAQ questions, …). */
function BlocksEditor({
  schema,
  blocks,
  onChange,
}: {
  schema: BlockSchema;
  blocks: Data[];
  onChange: (blocks: Data[]) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { confirm, dialog } = useConfirm();

  function update(index: number, key: string, value: unknown) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, [key]: value } : b)));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setOpenIndex(to);
  }

  async function remove(index: number) {
    const ok = await confirm({
      title: `Remove this ${schema.label.toLowerCase()}?`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    onChange(blocks.filter((_, i) => i !== index));
    setOpenIndex(null);
  }

  const atMax = schema.max != null && blocks.length >= schema.max;

  return (
    <div className="space-y-2">
      {dialog}
      {blocks.map((block, i) => {
        const title = schema.titleField ? String(block[schema.titleField] ?? "") : "";
        return (
          <div key={i} className="rounded-lg border border-border bg-white">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm transition-colors hover:text-brand-600 active:text-brand-700"
              >
                {title || `${schema.label} ${i + 1}`}
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
                disabled={i === blocks.length - 1}
                aria-label="Move down"
                className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${schema.label}`}
                className="rounded p-1 text-ink-soft transition-colors hover:bg-rose/10 hover:text-rose active:bg-rose/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {openIndex === i && (
              <div className="space-y-4 border-t border-border p-3">
                {schema.fields.map((field) => (
                  <SettingFieldInput
                    key={field.key}
                    field={field}
                    value={block[field.key]}
                    onChange={(v) => update(i, field.key, v)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        disabled={atMax}
        onClick={() => {
          onChange([...blocks, defaultBlockData(schema)]);
          setOpenIndex(blocks.length);
        }}
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-brand-500 px-3 py-2 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        {atMax ? `Maximum ${schema.max} reached` : `Add ${schema.label.toLowerCase()}`}
      </button>
    </div>
  );
}

export function SectionSettings({
  section,
  onChange,
  focusField,
}: {
  section: RenderableSection;
  onChange: (data: Data) => void;
  /**
   * A setting to scroll to and focus, set when the customer right-clicked that
   * exact element in the preview. The sequence number makes a repeat request
   * for the same field register as a new one.
   */
  focusField?: { key: string; seq: number } | null;
}) {
  const schema = getSectionSchema(section.type);
  const data = (section.data ?? {}) as Data;
  const toast = useToast();

  // Focusing happens after paint: the panel may have only just switched to this
  // section, and the input doesn't exist until it has rendered.
  useEffect(() => {
    if (!focusField) return;
    const id = requestAnimationFrame(() => {
      const host = document.getElementById(settingAnchor(focusField.key));
      if (!host) return;
      host.scrollIntoView({ behavior: "smooth", block: "center" });
      const control = host.querySelector<HTMLElement>("input, textarea, select");
      control?.focus();
      // Cursor at the end rather than selecting everything: they came here to
      // adjust wording they can see, and a select-all means the next keypress
      // wipes it.
      //
      // Only where the platform allows it. The selection API applies to text,
      // search, url, tel and password inputs and *throws* on the others, so
      // asking for it on a number or range setting, both of which this panel
      // renders, raised a DOMException and left the caret wherever it landed.
      const SELECTABLE = new Set(["text", "search", "url", "tel", "password", ""]);
      const selectable =
        control instanceof HTMLTextAreaElement ||
        (control instanceof HTMLInputElement && SELECTABLE.has(control.type));
      if (selectable) {
        const field = control as HTMLInputElement | HTMLTextAreaElement;
        const end = field.value.length;
        field.setSelectionRange?.(end, end);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [focusField]);

  if (!schema) {
    return <p className="p-4 text-sm text-ink-soft">This section type isn&apos;t installed in the current theme.</p>;
  }

  const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });
  const style = (data[STYLE_KEY] ?? {}) as Data;
  const setStyle = (key: string, value: unknown) =>
    onChange({ ...data, [STYLE_KEY]: { ...style, [key]: value } });

  /** Restores a set of fields to their schema defaults, leaving the rest alone. */
  function resetFields(fields: SettingField[]) {
    const next = { ...data };
    for (const field of fields) next[field.key] = field.default;
    onChange(next);
    toast.success("Reset to defaults.");
  }

  return (
    <div className="space-y-4 p-4">
      {schema.description && <p className="text-xs leading-snug text-ink-soft">{schema.description}</p>}
      <p className="rounded bg-subtle px-2 py-1.5 text-[11px] leading-snug text-ink-soft">
        Affects this section only, on this page.
      </p>

      {schema.fields.length > 0 && (
        <div className="space-y-4">
          {schema.fields.map((field) => {
            const { disabled, message } = isFieldDisabled(field, data);
            return (
              <div key={field.key} id={settingAnchor(field.key)} className="scroll-mt-4">
                <SettingFieldInput
                  field={field}
                  value={data[field.key]}
                  onChange={(v) => set(field.key, v)}
                  disabled={disabled}
                  disabledReason={message}
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => resetFields(schema.fields)}
            className="flex items-center gap-1 text-[11px] text-ink-faint transition-colors hover:text-brand-600 active:text-brand-700"
          >
            <RotateCcw className="h-3 w-3" /> Reset this section&rsquo;s content
          </button>
        </div>
      )}

      {schema.blocks && (
        <Collapsible title={`${schema.blocks.label}s`}>
          <BlocksEditor
            schema={schema.blocks}
            blocks={(data[schema.blocks.key] as Data[]) ?? []}
            onChange={(blocks) => set(schema.blocks!.key, blocks)}
          />
        </Collapsible>
      )}

      <Collapsible
        title="Spacing & background"
        defaultOpen={false}
        onReset={() => {
          onChange({ ...data, [STYLE_KEY]: { ...DEFAULT_SECTION_STYLE } });
          toast.success("Spacing and background reset.");
        }}
        resetLabel="Reset spacing and background to defaults?"
      >
        {STYLE_FIELDS.map((field) => {
          const { disabled, message } = isFieldDisabled(field, style);
          return (
            <SettingFieldInput
              key={field.key}
              field={field}
              value={style[field.key]}
              onChange={(v) => setStyle(field.key, v)}
              disabled={disabled}
              disabledReason={message}
            />
          );
        })}
      </Collapsible>
    </div>
  );
}
