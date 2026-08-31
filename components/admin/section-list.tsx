"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sectionLabel } from "@/lib/section-schema";
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  addSection,
  deleteSection,
  reorderSections,
  toggleSectionVisibility,
} from "@/app/admin/pages/actions";
import { SECTION_TYPE_LABELS } from "@/lib/section-types";
import { SectionForm } from "@/components/admin/section-form";
import type { SectionType } from "@/lib/generated/prisma/client";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SwipeRow } from "@/components/ui/swipe-row";
import { ReorderButtons } from "@/components/ui/reorder-buttons";

type SectionRow = { id: string; type: SectionType; isVisible: boolean; data: unknown };

const SECTION_TYPES = Object.keys(SECTION_TYPE_LABELS) as SectionType[];

export function SectionList({ pageId, sections: initial }: { pageId: string; sections: SectionRow[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addType, setAddType] = useState<SectionType>(SECTION_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // HTML5 drag can only start from an element marked `draggable`, and marking
  // the whole row means a press anywhere — on a button, on the title — begins
  // one. Enabling it only while the pointer is on the grip makes the grip the
  // handle it already looked like.
  const [dragArmed, setDragArmed] = useState(false);
  // Separate from the ref: the ref is what handleDrop reads, but styling has to
  // come from state or React never re-renders to show it.
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const { confirm, dialog } = useConfirm();

  async function persistOrder(previous: SectionRow[], next: SectionRow[]) {
    setSections(next);
    setError(null);
    try {
      await reorderSections(
        pageId,
        next.map((s) => s.id)
      );
      router.refresh();
    } catch {
      setSections(previous);
      setError("Failed to reorder, please try again.");
    }
  }

  function handleDrop(index: number) {
    const from = dragIndex.current;
    setDragOverIndex(null);
    dragIndex.current = null;
    if (from === null || from === index) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    persistOrder(sections, next);
  }

  function handleMove(from: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(sections, next);
  }

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      await addSection(pageId, addType);
      router.refresh();
    } catch {
      setError("Failed to add section, please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string, type: string) {
    // Named, not "this section": a page has several, and a prompt that doesn't
    // say which one leaves you guessing at exactly the wrong moment.
    const ok = await confirm({
      title: `Delete the ${sectionLabel(type).toLowerCase()} section?`,
      description: "Its content goes with it. This can't be undone.",
      confirmLabel: "Delete section",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    const previous = sections;
    setSections((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteSection(id);
      router.refresh();
    } catch {
      setSections(previous);
      setError("Failed to delete, please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleVisibility(id: string) {
    setError(null);
    const previous = sections;
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s)));
    try {
      await toggleSectionVisibility(id);
      router.refresh();
    } catch {
      setSections(previous);
      setError("Failed to update visibility, please try again.");
    }
  }

  return (
    <div className="space-y-3">
      {dialog}
      {error && <p className="text-sm text-rose">{error}</p>}
      {sections.map((section, i) => (
        <div
          key={section.id}
          draggable={dragArmed}
          onDragStart={() => {
            dragIndex.current = i;
            setDraggingIndex(i);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(i);
          }}
          onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => {
            dragIndex.current = null;
            setDraggingIndex(null);
            setDragOverIndex(null);
            setDragArmed(false);
          }}
          className={`rounded-lg border bg-white transition-shadow ${
            dragOverIndex === i ? "border-brand-500 ring-2 ring-brand-300" : "border-border"
          } ${draggingIndex === i ? "opacity-60 shadow-lg" : ""}`}
        >
          <SwipeRow
            actions={[
              { key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(section.id, section.type) },
            ]}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span
                onPointerDown={() => setDragArmed(true)}
                onPointerUp={() => setDragArmed(false)}
                aria-hidden
                className="hidden shrink-0 cursor-grab text-ink-soft active:cursor-grabbing lg:block"
              >
                <GripVertical className="h-4 w-4" />
              </span>
              <ReorderButtons index={i} count={sections.length} onMove={handleMove} />
              <button
                type="button"
                onClick={() => setExpanded((cur) => (cur === section.id ? null : section.id))}
                className="flex-1 rounded text-left text-sm font-medium transition-colors hover:text-brand-600 active:text-brand-700"
              >
                {SECTION_TYPE_LABELS[section.type] ?? section.type}
                {!section.isVisible && (
                  <span className="ml-2 rounded bg-subtle px-1.5 py-0.5 text-[10px] uppercase text-ink-soft">
                    Hidden
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleToggleVisibility(section.id)}
                aria-label={section.isVisible ? "Hide section" : "Show section"}
                className="rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-ink"
              >
                {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </SwipeRow>

          {expanded === section.id && (
            <div className="border-t border-border p-4">
              <SectionForm
                sectionId={section.id}
                type={section.type}
                data={section.data}
                onSaved={() => router.refresh()}
              />
            </div>
          )}
        </div>
      ))}

      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-ink-soft">
          No sections yet, add one below.
        </p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <select
          value={addType}
          onChange={(e) => setAddType(e.target.value as SectionType)}
          className="input h-9 w-56 text-sm transition-colors hover:border-brand-300"
        >
          {SECTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {SECTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={busy}
          className="flex items-center gap-1 rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>
    </div>
  );
}
