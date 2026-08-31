"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { saveThemeTokens, resetThemeTokens } from "@/app/admin/theme/actions";
import { SettingFieldInput } from "./setting-field";
import { PalettePreview } from "./palette-preview";
import { SettingGroup } from "./setting-group";
import { SettingsSearch } from "./settings-search";
import { settingAnchor } from "@/lib/settings-index";
import { type SaveState } from "@/components/ui/save-button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { THEME_GROUPS, coerceThemeValue } from "@/lib/theme-schema";
import {
  themeTokensToCss,
  resolveTextColor,
  type ThemeTokens,
} from "@/lib/theme-tokens";
import { StickySaveBar, type Problem } from "@/components/ui/sticky-save-bar";
import { useUnsavedChanges } from "@/components/ui/use-unsaved-changes";
import { useToast } from "@/components/ui/toast";
import { AA_NORMAL, contrastRatio, formatRatio } from "@/lib/contrast";
import { cn } from "@/lib/utils";
import { previewUrl } from "@/lib/preview-mode";

const DEVICES = [
  { key: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { key: "tablet", label: "Tablet", icon: Tablet, width: "820px" },
  { key: "mobile", label: "Mobile", icon: Smartphone, width: "414px" },
] as const;

type DeviceKey = (typeof DEVICES)[number]["key"];

export function ThemePanel({ initialTokens }: { initialTokens: ThemeTokens }) {
  const [tokens, setTokens] = useState<ThemeTokens>(initialTokens);
  const [saved, setSaved] = useState<ThemeTokens>(initialTokens);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  const dirty = useMemo(() => JSON.stringify(tokens) !== JSON.stringify(saved), [tokens, saved]);

  /**
   * Colour pairings that would be too faint to read.
   *
   * Checked over the whole theme rather than only on the input being edited, so
   * a combination that becomes unreadable *because of a later change* — picking
   * a dark page background after having chosen dark body text — is still caught
   * before it can be saved.
   */
  const problems = useMemo<Problem[]>(() => {
    const pairs = [
      { label: "Body text on the page background", bg: tokens.pageBackground, fg: tokens.textPrimary },
      { label: "Muted text on the page background", bg: tokens.pageBackground, fg: tokens.textMuted },
      { label: "Body text on cards", bg: tokens.surface, fg: tokens.textPrimary },
      { label: "Button text on the accent colour", bg: tokens.accent, fg: tokens.accentContrast },
      {
        label: "Header text",
        bg: tokens.headerBackground,
        fg: resolveTextColor(tokens.headerBackground, tokens.headerText),
      },
      {
        label: "Footer text",
        bg: tokens.footerBackground,
        fg: resolveTextColor(tokens.footerBackground, tokens.footerText),
      },
    ];
    return pairs
      .map((pair) => ({ ...pair, ratio: contrastRatio(pair.bg, pair.fg) }))
      .filter((pair) => pair.ratio < AA_NORMAL)
      .map((pair) => ({
        id: pair.label,
        message: `${pair.label} is only ${formatRatio(pair.ratio)}, too faint to read comfortably. ${AA_NORMAL}:1 is the minimum.`,
      }));
  }, [tokens]);

  useUnsavedChanges(dirty, () =>
    confirm({
      title: "Leave without saving?",
      description: "Your theme changes will be lost.",
      confirmLabel: "Leave and lose changes",
      cancelLabel: "Stay here",
      danger: true,
    })
  );

  function set(key: string, value: unknown) {
    setTokens((t) => ({ ...t, [key]: coerceThemeValue(key, value) }));
    setSaveState("idle");
  }

  /**
   * Live preview without a server round-trip: the same CSS the storefront
   * would emit is injected straight into the iframe's document, so colour,
   * font and radius changes land as you drag a slider. It's the identical
   * themeTokensToCss output, so what you see is what gets saved.
   */
  useEffect(() => {
    const id = setTimeout(() => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const STYLE_ID = "shp-theme-preview";
      let el = doc.getElementById(STYLE_ID);
      if (!el) {
        el = doc.createElement("style");
        el.id = STYLE_ID;
        doc.head.appendChild(el);
      }
      el.textContent = themeTokensToCss(tokens);
    }, 80);
    return () => clearTimeout(id);
  }, [tokens]);

  async function handleSave() {
    if (problems.length > 0) {
      toast.error("Some colours are too faint to read. Fix those before saving.");
      return;
    }
    setSaveState("saving");
    try {
      const result = await saveThemeTokens(tokens);
      setSaved(result);
      setTokens(result);
      setSaveState("saved");
      toast.success("Theme saved.");
    } catch (error) {
      setSaveState("error");
      toast.error(error instanceof Error ? error.message : "Couldn't save the theme.");
    }
  }

  function handleDiscard() {
    setTokens(saved);
    setSaveState("idle");
    toast.info("Theme changes discarded.");
  }

  async function handleReset() {
    const ok = await confirm({
      title: "Reset the theme to its defaults?",
      description: "Colours, fonts and shapes go back to the theme's original styling.",
      confirmLabel: "Reset theme",
      danger: true,
    });
    if (!ok) return;
    const defaults = await resetThemeTokens();
    setTokens(defaults);
    setSaved(defaults);
    setSaveState("idle");
  }

  const deviceWidth = DEVICES.find((d) => d.key === device)!.width;

  return (
    <div className="flex h-screen flex-col bg-canvas">
      {dialog}

      <header className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border bg-white px-3 py-2">
        <a
          href="/admin/customize"
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Customizer</span>
        </a>
        <h1 className="text-sm font-medium">Theme</h1>

        <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5">
          {DEVICES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDevice(d.key)}
              aria-label={d.label}
              title={d.label}
              className={cn(
                "no-tap-scale rounded-full p-1.5 transition-colors",
                device === d.key ? "bg-brand-500 text-white" : "text-ink-soft hover:bg-subtle active:bg-brand-100"
              )}
            >
              <d.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            title="Reset to defaults"
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </header>

      <StickySaveBar
        dirty={dirty}
        saveState={saveState}
        onSave={handleSave}
        onDiscard={handleDiscard}
        problems={problems}
        saveLabel="Save theme"
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full flex-shrink-0 overflow-y-auto border-b border-border bg-white p-4 lg:h-full lg:w-80 lg:border-b-0 lg:border-r">
          <SettingsSearch />

          <p className="mt-3 text-xs leading-snug text-ink-soft">
            These apply to every page of the store at once, including pages and sections you add
            later.
          </p>

          <div className="mt-4 rounded-lg border border-border bg-canvas p-3">
            <PalettePreview tokens={tokens} />
          </div>
          <div className="mt-4 space-y-1">
            {THEME_GROUPS.map((group, index) => (
              <SettingGroup
                key={group.title}
                title={group.title}
                count={group.fields.length}
                // The first group opens so the panel never looks empty; the
                // rest stay shut so the whole contents list stays visible.
                defaultOpen={index === 0}
              >
                {group.fields.map((field) => (
                  <div key={field.key} id={settingAnchor(field.key)} className="scroll-mt-4">
                    <SettingFieldInput
                      field={field}
                      value={
                        field.kind === "select"
                          ? String(tokens[field.key as keyof ThemeTokens])
                          : tokens[field.key as keyof ThemeTokens]
                      }
                      onChange={(v) => set(field.key, v)}
                      // A contrast-text field needs to know what it will sit on
                      // to work out which options are readable.
                      contrastBackground={
                        field.contrastAgainst
                          ? String(tokens[field.contrastAgainst as keyof ThemeTokens])
                          : tokens.pageBackground
                      }
                    />
                  </div>
                ))}
              </SettingGroup>
            ))}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-auto bg-subtle/40 p-0 lg:p-4">
          <div
            className="mx-auto h-full bg-white shadow-sm transition-[width] duration-200"
            style={{ width: deviceWidth, maxWidth: "100%" }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl("/")}
              title="Theme preview"
              className="h-full min-h-[70vh] w-full border-0"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
