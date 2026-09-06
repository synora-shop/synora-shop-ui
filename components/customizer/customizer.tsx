"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Monitor,
  Copy,
  FilePlus2,
  Plus,
  Redo2,
  RotateCcw,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  saveSections,
  createPageFromTemplate,
  duplicatePage,
  type DraftSection,
} from "@/app/(fullscreen)/admin/customize/actions";
import { PAGE_TEMPLATES } from "@/lib/page-templates";
import { SectionSettings } from "./section-settings";
import { type SaveState } from "@/components/ui/save-button";
import { StickySaveBar, type Problem } from "@/components/ui/sticky-save-bar";
import { useUnsavedChanges } from "@/components/ui/use-unsaved-changes";
import { useDraftRecovery, timeAgo } from "@/components/ui/use-draft-recovery";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { validateUrl } from "@/lib/url-validation";
import {
  SECTION_SCHEMAS,
  defaultSectionData,
  sectionLabel,
  type SectionSchema,
} from "@/lib/section-schema";
import {
  PREVIEW_MESSAGE,
  PREVIEW_READY,
  PREVIEW_SELECT,
  PREVIEW_EDIT,
  PREVIEW_EDIT_REGION,
  type PreviewMessage,
} from "@/lib/customizer-protocol";
import { previewUrl } from "@/lib/preview-mode";
import type { RenderableSection } from "@/components/storefront/sections/render";

export type CustomizerPage = { id: string; slug: string; title: string; previewPath: string };

const DEVICES = [
  { key: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { key: "tablet", label: "Tablet", icon: Tablet, width: "820px" },
  { key: "mobile", label: "Mobile", icon: Smartphone, width: "414px" },
] as const;

type DeviceKey = (typeof DEVICES)[number]["key"];

/** Undo/redo stack over the section list. */
type History = { past: RenderableSection[][]; present: RenderableSection[]; future: RenderableSection[][] };

let tempIdCounter = 0;
const nextTempId = () => `new:${++tempIdCounter}`;

export function Customizer({
  pages,
  page,
  initialSections,
  storeUrl,
}: {
  pages: CustomizerPage[];
  page: CustomizerPage;
  initialSections: RenderableSection[];
  /**
   * The shop's own address.
   *
   * "View site" used a relative path, and a merchant with one store works on
   * the application host, so it opened the storefront *there*: a page only
   * they can see, at an address that means nothing to anyone else. The
   * preview frame is deliberately still relative, because the two windows
   * talk over postMessage and that is same origin only.
   */
  storeUrl: string;
}) {
  const [history, setHistory] = useState<History>({ past: [], present: initialSections, future: [] });
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialSections));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /**
   * The setting to focus once the panel opens.
   *
   * Carries a sequence number for the same reason `changed` does: asking to
   * focus the same field twice in a row is a real, repeatable request, and a
   * bare key comparison would swallow the second one.
   */
  const [focusField, setFocusField] = useState<{ key: string; seq: number } | null>(null);
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [adding, setAdding] = useState(false);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newPageTemplate, setNewPageTemplate] = useState(PAGE_TEMPLATES[1]?.key ?? "blank");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [creating, setCreating] = useState(false);
  // Which section last changed, and a counter so editing the same one twice
  // still reads as a new event on the preview side.
  const [changed, setChanged] = useState<{ sectionId: string; seq: number } | null>(null);
  const seqRef = useRef(0);
  /**
   * Set when a navigation is refused because of unsaved work.
   *
   * Drives the shake on the tab you are on and the pulse on Save. Carries a
   * counter rather than a boolean: refusing twice in a row is an ordinary
   * thing to do, and a boolean that is already true restarts no animation.
   */
  const [refused, setRefused] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewReady = useRef(false);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const router = useRouter();

  const sections = history.present;
  const dirty = useMemo(() => JSON.stringify(sections) !== savedSnapshot, [sections, savedSnapshot]);
  const selected = sections.find((s) => s.id === selectedId) ?? null;

  /**
   * Everything currently standing between this draft and a save.
   *
   * Derived from the draft rather than tracked as you type, so it can't drift
   * out of sync with what's actually in the sections — walk the schemas, check
   * every link field, report what's wrong.
   */
  const problems = useMemo<Problem[]>(() => {
    const found: Problem[] = [];
    for (const section of sections) {
      const schema = SECTION_SCHEMAS[section.type];
      if (!schema) continue;
      const data = (section.data ?? {}) as Record<string, unknown>;

      const checkUrl = (field: { key: string; label: string }, raw: unknown, where: string) => {
        const check = validateUrl(String(raw ?? ""), { allowContactSchemes: true });
        if (!check.ok) {
          found.push({
            id: `${section.id}:${where}:${field.key}`,
            message: `${sectionLabel(section.type)}, ${field.label}: ${check.error}`,
            onJump: () => setSelectedId(section.id),
            jumpLabel: "Open",
          });
        }
      };

      for (const field of schema.fields) {
        if (field.kind === "url") checkUrl(field, data[field.key], "field");
      }
      if (schema.blocks) {
        const blocks = Array.isArray(data[schema.blocks.key]) ? (data[schema.blocks.key] as Record<string, unknown>[]) : [];
        blocks.forEach((block, i) => {
          for (const field of schema.blocks!.fields) {
            if (field.kind === "url") {
              checkUrl({ ...field, label: `${schema.blocks!.label} ${i + 1} · ${field.label}` }, block[field.key], `block${i}`);
            }
          }
        });
      }
    }
    return found;
  }, [sections]);

  /** Every mutation goes through here so undo/redo covers all of them. */
  const commit = useCallback((next: RenderableSection[]) => {
    setHistory((h) => ({ past: [...h.past, h.present].slice(-50), present: next, future: [] }));
    setSaveState("idle");
  }, []);

  const undo = useCallback(() => {
    setHistory((h) =>
      h.past.length === 0
        ? h
        : { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] }
    );
  }, []);

  const redo = useCallback(() => {
    setHistory((h) =>
      h.future.length === 0
        ? h
        : { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) }
    );
  }, []);

  // ---- preview bridge ----------------------------------------------------
  const pushToPreview = useCallback(() => {
    if (!previewReady.current) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_MESSAGE, sections, selectedId, changed } satisfies PreviewMessage,
      window.location.origin
    );
  }, [sections, selectedId, changed]);

  // Debounced so typing streams smoothly rather than posting per keystroke.
  useEffect(() => {
    const id = setTimeout(pushToPreview, 90);
    return () => clearTimeout(id);
  }, [pushToPreview]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const msg = event.data as PreviewMessage | undefined;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === PREVIEW_READY) {
        previewReady.current = true;
        pushToPreview();
      }
      if (msg.type === PREVIEW_SELECT) setSelectedId(msg.sectionId);

      // Right-click "edit this" in the preview. Opening the section is the
      // easy half; the useful half is landing on the exact input, which the
      // settings panel does once it knows which field to focus.
      if (msg.type === PREVIEW_EDIT) {
        setSelectedId(msg.sectionId);
        setFocusField(msg.fieldKey ? { key: msg.fieldKey, seq: Date.now() } : null);
      }

      // A page region that isn't a section — the header, the footer, the logo.
      // These live in another panel entirely, so this is a navigation, and the
      // unsaved-changes guard applies exactly as it would to a manual click.
      if (msg.type === PREVIEW_EDIT_REGION) {
        router.push(msg.href);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pushToPreview, router]);

  // Keyboard undo/redo, matching the rest of the app's expectations.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      // Don't hijack undo inside a text field the user is typing in.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // ---- section operations ------------------------------------------------
  function updateSection(id: string, data: Record<string, unknown>) {
    commit(sections.map((s) => (s.id === id ? { ...s, data } : s)));
    setChanged({ sectionId: id, seq: ++seqRef.current });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  }

  function toggleVisible(id: string) {
    commit(sections.map((s) => (s.id === id ? { ...s, isVisible: s.isVisible === false } : s)));
  }

  async function removeSection(id: string, type: string) {
    const ok = await confirm({
      title: `Remove the ${sectionLabel(type)} section?`,
      description: "It stays removed only once you save.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    commit(sections.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function addSection(schema: SectionSchema) {
    const created: RenderableSection = {
      id: nextTempId(),
      type: schema.type,
      data: defaultSectionData(schema.type),
      isVisible: true,
    };
    commit([...sections, created]);
    setSelectedId(created.id);
    setAdding(false);
  }

  function duplicateSection(id: string) {
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const source = sections[index];
    // Deep-copied so editing the copy can never reach back into the original.
    const copy: RenderableSection = {
      id: nextTempId(),
      type: source.type,
      data: JSON.parse(JSON.stringify(source.data ?? {})),
      isVisible: source.isVisible,
    };
    const next = [...sections];
    next.splice(index + 1, 0, copy);
    commit(next);
    setSelectedId(copy.id);
    toast.success(`${sectionLabel(source.type)} duplicated.`);
  }

  async function handleCreatePage() {
    if (dirty && !(await confirmLeave())) return;
    setCreating(true);
    const result = await createPageFromTemplate(newPageTemplate, newPageTitle);
    setCreating(false);
    if (result.error) {
      toast.error(result.error, { blocking: true });
      return;
    }
    router.push(`/admin/customize?page=${result.id}`);
  }

  async function handleDuplicatePage() {
    if (dirty && !(await confirmLeave())) return;
    const result = await duplicatePage(page.id);
    if (result.error) {
      toast.error(result.error, { blocking: true });
      return;
    }
    router.push(`/admin/customize?page=${result.id}`);
  }

  async function handleSave() {
    if (problems.length > 0) {
      toast.error(`Fix ${problems.length === 1 ? "1 problem" : `${problems.length} problems`} before saving.`);
      return;
    }
    setSaveState("saving");
    try {
      const payload: DraftSection[] = sections.map((s) => ({
        id: s.id,
        type: s.type,
        data: s.data,
        isVisible: s.isVisible !== false,
      }));
      const saved = await saveSections(page.id, payload);
      const normalised: RenderableSection[] = saved.map((s) => ({
        id: s.id,
        type: s.type,
        data: s.data,
        isVisible: s.isVisible,
      }));
      // Replace temp "new:" ids with the real ones, without a reload.
      setHistory({ past: [], present: normalised, future: [] });
      setSavedSnapshot(JSON.stringify(normalised));
      setSaveState("saved");
      toast.success(`${page.title} saved.`);
    } catch (error) {
      setSaveState("error");
      toast.error(error instanceof Error ? error.message : "Couldn't save. Please try again.");
    }
  }

  /** Shared by every route out of the editor: the back button, a link, a page switch. */
  const confirmLeave = useCallback(
    () =>
      confirm({
        title: "Leave without saving?",
        description: `${page.title} has unsaved changes. They'll be lost if you leave now.`,
        confirmLabel: "Leave and lose changes",
        cancelLabel: "Stay here",
        danger: true,
      }),
    [confirm, page.title]
  );

  useUnsavedChanges(dirty, confirmLeave);

  const { recovered, dismiss: dismissRecovered } = useDraftRecovery<RenderableSection[]>({
    key: `customizer:${page.id}`,
    value: sections,
    dirty,
  });

  function restoreDraft() {
    if (!recovered) return;
    commit(recovered.data);
    dismissRecovered();
    toast.success("Unsaved work restored. Save when you are happy with it.");
  }

  async function switchPage(targetId: string) {
    const target = pages.find((p) => p.id === targetId);
    if (!target || target.id === page.id) return;
    if (dirty) {
      // Point at what is in the way before asking anything. The tab you are on
      // shakes and Save pulses, so the reason the click did not take is on
      // screen rather than in a sentence.
      setRefused((n) => n + 1);
      if (!(await confirmLeave())) return;
    }
    router.push(`/admin/customize?page=${target.id}`);
  }

  async function handleDiscard() {
    const ok = await confirm({
      title: "Discard unsaved changes?",
      description: "The page goes back to how it was at your last save.",
      confirmLabel: "Discard",
      danger: true,
    });
    if (!ok) return;
    const restored = JSON.parse(savedSnapshot) as RenderableSection[];
    setHistory({ past: [], present: restored, future: [] });
    setSelectedId(null);
    setSaveState("idle");
  }

  const grouped = useMemo(() => {
    const byCategory = new Map<string, SectionSchema[]>();
    for (const schema of Object.values(SECTION_SCHEMAS)) {
      if (!byCategory.has(schema.category)) byCategory.set(schema.category, []);
      byCategory.get(schema.category)!.push(schema);
    }
    return [...byCategory.entries()];
  }, []);

  const deviceWidth = DEVICES.find((d) => d.key === device)!.width;

  return (
    // The (fullscreen) layout owns the window height; this fills what it is
    // given. It used to claim h-screen for itself, which was accurate only
    // because it was wrong twice over: rendered under the admin layout it was
    // a full screen's worth of editor *below* a sidebar and a topbar, so the
    // preview ran off the bottom of the page.
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      {dialog}

      {/* ---- top bar ---- */}
      <header className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border bg-white px-3 py-2">
        <a
          href="/admin"
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </a>

        {/* Save sits before the page bar, at the top left, because it is the
            control the bar sends you to. Its state is the sentence: nothing to
            save, unsaved work, saving, saved. */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saveState === "saving"}
          key={`save-${refused}`}
          className={cn(
            "flex-shrink-0 rounded-pill px-4 py-1.5 text-xs font-semibold transition-all duration-150 ease-out",
            dirty
              ? "bg-brand-600 text-white shadow-brand hover:-translate-y-px hover:bg-brand-700 active:translate-y-0"
              : "border border-border bg-surface text-ink-faint",
            refused > 0 && dirty && "pulse-brand"
          )}
        >
          {saveState === "saving" ? "Saving" : dirty ? "Save" : "Saved"}
        </button>

        {/* The pages, as a bar rather than a dropdown. A dropdown hides how
            many pages there are and takes two clicks to move between two of
            them, which is the single most common move in here. */}
        <nav
          aria-label="Pages"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-pill bg-subtle p-1"
        >
          {pages.map((p) => {
            const current = p.id === page.id;
            return (
              <button
                key={`${p.id}:${current ? refused : 0}`}
                type="button"
                onClick={() => switchPage(p.id)}
                aria-current={current ? "page" : undefined}
                title={current && dirty ? `${p.title} has unsaved changes` : p.title}
                className={cn(
                  "relative flex-shrink-0 rounded-pill px-3 py-1 text-xs font-medium transition-all duration-150 ease-out",
                  current
                    ? "bg-surface text-ink shadow-sm"
                    : "text-ink-soft hover:bg-surface/60 hover:text-ink",
                  current && refused > 0 && "shake"
                )}
              >
                {p.title}
                {/* A dot, not a word: the tab is narrow and the state is
                    binary. It is also what makes the shake legible, because
                    there is something on the tab to point at. */}
                {current && dirty && (
                  <span
                    aria-label="unsaved changes"
                    className="ml-1.5 inline-block h-1.5 w-1.5 rounded-pill bg-brand-600 align-middle"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setNewPageOpen(true)}
          title="Create a new page from a template"
          aria-label="New page"
          className="flex-shrink-0 rounded-md p-1.5 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100"
        >
          <FilePlus2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDuplicatePage}
          title="Duplicate this page"
          aria-label="Duplicate page"
          className="rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
        >
          <Copy className="h-4 w-4" />
        </button>

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

        <a
          href="/admin/customize/theme"
          title="Colours, fonts and shapes for the whole store"
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
        >
          Theme
        </a>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={history.past.length === 0}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            className="rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={history.future.length === 0}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            className="rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          {/* Opens in a new tab on purpose: the editor keeps its unsaved work,
              and the guard leaves new-tab links alone for exactly this reason. */}
          <a
            href={`${storeUrl.replace(/\/$/, "")}${page.previewPath}`}
            target="_blank"
            rel="noreferrer"
            title="Open this page on your live site"
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
          >
            View site <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </header>

      {/* ---- body ---- */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left panel */}
        {/* overflow-hidden here, and the scrolling moved inside. The whole
            panel used to scroll, which meant the settings header had to be
            sticky to stay put and its border smeared over the rows passing
            under it, and the Add section button drifted off the bottom on any
            page with a few sections. A column with a fixed head and foot needs
            neither trick. */}
        <aside className="flex w-full flex-shrink-0 flex-col overflow-hidden border-b border-border bg-surface lg:h-full lg:w-80 lg:border-b-0 lg:border-r">
          {selected ? (
            <>
              <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Sections
                </button>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {sectionLabel(selected.type)}
                </span>
                <button
                  type="button"
                  onClick={() => duplicateSection(selected.id)}
                  aria-label="Duplicate section"
                  title="Duplicate this section"
                  className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(selected.id, selected.type)}
                  aria-label="Remove section"
                  className="rounded p-1 text-ink-soft transition-colors hover:bg-rose/10 hover:text-rose active:bg-rose/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SectionSettings
                  section={selected}
                  onChange={(data) => updateSection(selected.id, data)}
                  focusField={focusField}
                />
              </div>
            </>
          ) : (
            <>
              <p className="flex-shrink-0 px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Sections on this page
              </p>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                {sections.map((section, i) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(section.id)}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm transition-colors hover:text-brand-600 active:text-brand-700",
                        section.isVisible === false && "text-ink-soft line-through"
                      )}
                    >
                      {sectionLabel(section.type)}
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
                      disabled={i === sections.length - 1}
                      aria-label="Move down"
                      className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVisible(section.id)}
                      aria-label={section.isVisible === false ? "Show section" : "Hide section"}
                      className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100"
                    >
                      {section.isVisible === false ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
                {sections.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-ink-soft">
                    No sections yet, add one below.
                  </p>
                )}
              </div>

              {/* Pinned, not appended. Adding a section is the reason most
                  visits to this panel happen, and it was the one control you
                  had to scroll to reach. */}
              <div className="flex-shrink-0 border-t border-border p-3">
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-pill border border-brand-500 px-3 py-2 text-xs font-semibold text-brand-600 transition-all duration-150 ease-out hover:-translate-y-px hover:bg-brand-50 hover:shadow-sm active:translate-y-0 active:bg-brand-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Add section
                </button>
              </div>
            </>
          )}
        </aside>

        {/* preview */}
        <main className="min-h-0 flex-1 overflow-auto bg-subtle/40 p-0 lg:p-4">
          <div
            className="mx-auto h-full bg-white shadow-sm transition-[width] duration-200"
            style={{ width: deviceWidth, maxWidth: "100%" }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl(page.previewPath)}
              title="Storefront preview"
              className="h-full min-h-[70vh] w-full border-0"
            />
          </div>
        </main>
      </div>

      <StickySaveBar
        dirty={dirty}
        saveState={saveState}
        onSave={handleSave}
        onDiscard={handleDiscard}
        problems={problems}
        saveLabel={`Save ${page.title}`}
      />

      {/* Offered, never applied automatically — silently replacing what's on
          screen with a stale draft is its own kind of data loss. */}
      {recovered && (
        <div className="flex flex-wrap items-center gap-2 border-b border-amber bg-amber-bg px-3 py-2 text-sm">
          <RotateCcw className="h-4 w-4 flex-shrink-0 text-amber" />
          <span className="min-w-0 flex-1 text-ink-soft">
            Unsaved work from {timeAgo(recovered.savedAt)} was found for this page.
          </span>
          <button
            type="button"
            onClick={restoreDraft}
            className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            Restore it
          </button>
          <button
            type="button"
            onClick={dismissRecovered}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-white active:bg-brand-100"
          >
            Discard
          </button>
        </div>
      )}

      {/* ---- new page from a template ---- */}
      {newPageOpen && (
        <div
          role="presentation"
          onClick={() => setNewPageOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-white p-5 shadow-xl sm:rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">New page</h2>
              <button
                type="button"
                onClick={() => setNewPageOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Page name
              </label>
              <input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="Size guide"
                autoFocus
                className="input mt-1 h-9 text-sm"
              />
              <p className="mt-1 text-[11px] text-ink-soft">
                Its web address is made from this, and can be changed later.
              </p>
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Start from
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {PAGE_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => setNewPageTemplate(template.key)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    newPageTemplate === template.key
                      ? "border-brand-500 bg-brand-50"
                      : "border-border hover:border-brand-300 hover:bg-subtle active:bg-brand-100"
                  )}
                >
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="mt-0.5 text-xs leading-snug text-ink-soft">{template.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreatePage}
                disabled={creating || newPageTitle.trim() === ""}
                className="rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create page"}
              </button>
              <button
                type="button"
                onClick={() => setNewPageOpen(false)}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- add-section picker ---- */}
      {adding && (
        <div
          role="presentation"
          onClick={() => setAdding(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-white p-5 shadow-xl sm:rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Add a section</h2>
              <button
                type="button"
                onClick={() => setAdding(false)}
                aria-label="Close"
                className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-5">
              {grouped.map(([category, schemas]) => (
                <div key={category}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{category}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {schemas.map((schema) => (
                      <button
                        key={schema.type}
                        type="button"
                        onClick={() => addSection(schema)}
                        className="rounded-lg border border-border p-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-50 active:bg-brand-100"
                      >
                        <p className="text-sm font-medium">{schema.label}</p>
                        {schema.description && (
                          <p className="mt-0.5 text-xs leading-snug text-ink-soft">{schema.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
