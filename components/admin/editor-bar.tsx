"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { anyDirty, anySaving, useAdminEditors } from "@/lib/admin-editor-store";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

/**
 * Discard and Save for whatever screen is open, in the action bar.
 *
 * Mounted once, in the layout, and empty on a screen with nothing to save — so
 * a list page draws its own action bar and this stays out of the way, while a
 * form page gets one without having to build it.
 *
 * Discard appears only once there is something to discard. A permanently
 * visible Discard on an untouched form is a button whose only purpose is to
 * frighten you.
 *
 * The confirm dialog lives here rather than in the hook, because a hook cannot
 * render one — and every screen should ask the question the same way. It is
 * handed to the store on mount for useEditor to reach.
 */
const DISCARD = "rounded-[10px] px-3.5 py-1.5 text-[13px] font-semibold ring-1 ring-white/25 hover:bg-white/10 disabled:opacity-50";

export function EditorBar() {
  const editors = useAdminEditors((s) => s.editors);
  const setConfirmLeave = useAdminEditors((s) => s.setConfirmLeave);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setConfirmLeave(() =>
      confirm({
        title: "Leave without saving?",
        description: "Your changes on this screen will be lost.",
        confirmLabel: "Leave",
        cancelLabel: "Stay",
        danger: true,
      })
    );
    return () => setConfirmLeave(null);
  }, [confirm, setConfirmLeave]);

  const entries = Object.values(editors);
  const dirty = anyDirty(editors);
  const saving = anySaving(editors) || busy;

  // Nothing registered means nothing on this screen can be saved.
  if (entries.length === 0) return null;

  async function saveAll() {
    setBusy(true);
    try {
      // Everything that has changed, in one press. A merchant who edited two of
      // the three forms on Settings should not have to find two buttons.
      await Promise.all(entries.filter((e) => e.dirty).map((e) => e.save()));
    } catch {
      toast.error("Couldn't save that. Try again.", { blocking: true });
    } finally {
      setBusy(false);
    }
  }

  async function discardAll() {
    const ok = await confirm({
      title: "Discard your changes?",
      description: "This puts the screen back the way it was when you opened it.",
      confirmLabel: "Discard",
      danger: true,
    });
    if (!ok) return;
    for (const e of entries) e.discard();
  }

  return (
    <>
      {dialog}
      {/* 18 October: no bar while everything is saved. Once there is
          something to save it rises at the foot of the sheet, black, with
          Discard and Save, so unsaved work is the one thing you cannot miss
          and the heading above stays the screen's own. */}
      {dirty && (
        <div role="region" aria-label="Unsaved changes" className="sticky bottom-4 z-30 mx-auto mb-4 flex w-[min(36rem,calc(100%-2rem))] items-center gap-2.5 rounded-[14px] bg-[#0a0a0a] py-2 pl-4 pr-2 text-white shadow-[0_18px_50px_-16px_rgba(0,0,0,0.55)]">
          <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#f2a33a]" aria-hidden />
            Unsaved changes
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={discardAll} disabled={saving} className={DISCARD}>Discard</button>
            <button type="button" onClick={saveAll} disabled={saving} className="rounded-[10px] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#0a0a0a] hover:bg-white/90 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
