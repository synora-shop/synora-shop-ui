"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { anyDirty, anySaving, useAdminEditors } from "@/lib/admin-editor-store";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/primitives";

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
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel p-2 shadow-panel">
        {dirty ? (
          <p className="flex items-center gap-1.5 px-1 text-xs font-medium text-amber">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            Unsaved changes
          </p>
        ) : (
          <p className="px-1 text-xs text-control-soft">All changes saved</p>
        )}

        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <Button variant="secondary" size="sm" onClick={discardAll} disabled={saving}>
              Discard
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={saveAll} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </>
  );
}
