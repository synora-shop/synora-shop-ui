"use client";

import { useEffect, useId, useRef } from "react";
import { useAdminEditors } from "@/lib/admin-editor-store";
import { useUnsavedChanges } from "@/components/ui/use-unsaved-changes";

/**
 * Puts a form's Discard and Save into the action bar, and guards its work.
 *
 * One call gets a form both halves of the documented standard: the buttons
 * appear at the top of the screen where every other screen keeps them, and
 * unsaved changes stop the merchant leaving by any of the three routes out —
 * closing the tab, clicking a link, or pressing back.
 *
 * The handlers are held in a ref and the registration depends only on `dirty`
 * and `saving`. Without that, a form that rebuilds its callbacks each render —
 * which is most of them — would re-register on every keystroke.
 */
export function useEditor({
  dirty,
  saving = false,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving?: boolean;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
}) {
  // Unique per component instance, so three forms on one screen are three
  // entries rather than three writes to the same one.
  const id = useId();
  const register = useAdminEditors((s) => s.register);
  const unregister = useAdminEditors((s) => s.unregister);
  const confirmLeave = useAdminEditors((s) => s.confirmLeave);

  const handlers = useRef({ onSave, onDiscard });
  useEffect(() => {
    handlers.current = { onSave, onDiscard };
  });

  useEffect(() => {
    register(id, {
      dirty,
      saving,
      save: () => handlers.current.onSave(),
      discard: () => handlers.current.onDiscard(),
    });
  }, [id, dirty, saving, register]);

  // Leaving the screen must take the buttons with it, or the bar would offer
  // to save a form that is no longer on the page.
  useEffect(() => () => unregister(id), [id, unregister]);

  useUnsavedChanges(dirty, async () => (confirmLeave ? confirmLeave() : true));
}
