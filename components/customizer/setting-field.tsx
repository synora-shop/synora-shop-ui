"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { InfoPopover } from "@/components/ui/info-popover";
import { LogoUpload } from "@/components/customizer/logo-upload";
import { FaviconUpload } from "@/components/customizer/favicon-upload";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { validateUrl } from "@/lib/url-validation";
import {
  AA_NORMAL,
  autoTextColor,
  contrastLevel,
  contrastRatio,
  formatRatio,
  readableTextOptions,
} from "@/lib/contrast";
import { AUTO } from "@/lib/theme-tokens";
import { cn } from "@/lib/utils";
import type { SettingField } from "@/lib/section-schema";

/**
 * Renders one setting from its schema entry.
 *
 * This is the whole reason the section registry is declarative: the customizer
 * has no per-section-type UI code, so a section added later — including one
 * from an uploaded theme — gets a working settings panel, help text, override
 * handling and link validation with no editor changes at all.
 */
export function SettingFieldInput({
  field,
  value,
  onChange,
  disabled,
  disabledReason,
  onValidity,
  contrastBackground = "#ffffff",
}: {
  field: SettingField;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Set when another setting is overriding this one. */
  disabled?: boolean;
  disabledReason?: string;
  /** Reports whether this field currently blocks saving. */
  onValidity?: (key: string, error: string | null) => void;
  /** For contrast-text fields: the colour this text will sit on. */
  contrastBackground?: string;
}) {
  const [urlError, setUrlError] = useState<string | null>(null);

  const label = (
    <div className="flex items-center gap-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {field.label}
      </label>
      {/* Floats above the panel rather than expanding inline: reading what a
          control does shouldn't move the control you're about to use. */}
      <InfoPopover text={field.info} label={`What does ${field.label} do?`} />
      {field.affects && (
        <span className="ml-auto text-[10px] uppercase tracking-wide text-ink-faint">
          {field.affects}
        </span>
      )}
    </div>
  );

  const help = null;

  // A setting another one is overriding: shown, explained, and inert — rather
  // than silently doing nothing when you change it.
  if (disabled) {
    return (
      <div className="opacity-60">
        {label}
        <p className="mt-1 flex items-start gap-1.5 rounded border border-dashed border-border px-2 py-1.5 text-[11px] leading-snug text-ink-soft">
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          {disabledReason ?? "Another setting is controlling this."}
        </p>
        {help}
      </div>
    );
  }

  function commitUrl(raw: string) {
    const check = validateUrl(raw, { allowContactSchemes: true });
    if (!check.ok) {
      setUrlError(check.error);
      onValidity?.(field.key, check.error);
      onChange(raw); // keep what they typed so it can be corrected in place
      return;
    }
    setUrlError(null);
    onValidity?.(field.key, null);
    // Normalised means we upgraded a bare domain to https — save the fixed one.
    onChange(check.normalised ?? raw);
  }

  switch (field.kind) {
    case "url":
      return (
        <div>
          {label}
          <input
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => {
              onChange(e.target.value);
              if (urlError) setUrlError(null);
            }}
            onBlur={(e) => commitUrl(e.target.value)}
            className={cn("input mt-1 h-9 text-sm", urlError && "border-rose")}
          />
          {urlError && <p className="mt-1 text-[11px] leading-snug text-rose">{urlError}</p>}
          {help}
        </div>
      );

    case "text":
      return (
        <div>
          {label}
          <input
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-1 h-9 text-sm"
          />
          {help}
        </div>
      );

    case "textarea":
    case "richtext":
      return (
        <div>
          {label}
          <textarea
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            rows={field.kind === "richtext" ? 5 : 3}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-1 text-sm"
          />
          {help}
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            type="number"
            value={(value as number) ?? 0}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="input mt-1 h-9 text-sm"
          />
          {help}
        </div>
      );

    case "range": {
      const current = (value as number) ?? (field.default as number) ?? 0;
      return (
        <div>
          <div className="flex items-baseline justify-between gap-2">
            {label}
            <span className="text-xs tabular-nums text-ink-soft">
              {current}
              {field.unit ?? ""}
            </span>
          </div>
          <input
            type="range"
            value={current}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mt-2 w-full accent-brand-500"
          />
          {help}
        </div>
      );
    }

    case "color":
      return (
        <div>
          {label}
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={(value as string) || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              aria-label={field.label}
              className="h-9 w-12 flex-shrink-0 rounded border border-border"
            />
            <input
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              className="input h-9 text-sm"
            />
          </div>
          {help}
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-1 h-9 text-sm"
          >
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );

    case "contrast-text": {
      // Only options that actually pass are offered, so an unreadable pairing
      // can't be chosen — rather than being chosen and then rejected on save.
      const current = (value as string) ?? AUTO;
      const options = readableTextOptions(contrastBackground);
      const resolved = current === AUTO ? autoTextColor(contrastBackground) : current;
      const ratio = contrastRatio(contrastBackground, resolved);
      const level = contrastLevel(ratio);
      const failing = level === "Fail" || level === "AA Large";

      return (
        <div>
          {label}
          <select
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-1 h-9 text-sm"
          >
            <option value={AUTO}>Automatic, always readable</option>
            {options.map((option) => (
              <option key={option.color} value={option.color}>
                {option.color} · {formatRatio(option.ratio)}
              </option>
            ))}
          </select>

          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="flex h-7 flex-1 items-center justify-center rounded border border-border text-xs"
              style={{ backgroundColor: contrastBackground, color: resolved }}
            >
              Sample text
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
                failing ? "bg-rose-bg text-rose" : "bg-green-bg text-green"
              )}
              title={`Contrast ratio between text and background (WCAG AA needs ${AA_NORMAL}:1)`}
            >
              {formatRatio(ratio)} {level}
            </span>
          </div>
          {failing && (
            <p className="mt-1 text-[11px] leading-snug text-rose">
              Too low to read comfortably. Pick a different background, or leave this on automatic.
            </p>
          )}
          {help}
        </div>
      );
    }

    case "checkbox":
      return (
        <div>
          <ToggleSwitch
            label={field.label}
            description={field.info}
            checked={Boolean(value)}
            onChange={onChange}
          />
        </div>
      );

    case "image":
      return (
        <div>
          {label}
          {/* ImageDropzone is multi-image; a single image field keeps the last one. */}
          <ImageDropzone
            label=""
            folder="sections"
            images={value ? [value as string] : []}
            onChange={(images) => onChange(images[images.length - 1] ?? "")}
          />
          {help}
        </div>
      );

    case "logo":
      return (
        <div>
          {label}
          <LogoUpload value={String(value ?? "")} onChange={onChange} />
          {help}
        </div>
      );

    case "favicon":
      return (
        <div>
          {label}
          <FaviconUpload value={String(value ?? "")} onChange={onChange} />
          {help}
        </div>
      );

    default:
      return null;
  }
}
