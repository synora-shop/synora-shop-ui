"use client";

import { create } from "zustand";

/**
 * Which screens have unsaved work, so the action bar can offer Discard and Save.
 *
 * The documentation asks for both on every screen that can be changed, in the
 * action bar at the top. The form holding the state is far below that bar and
 * under a *server* layout, so there is no shared client parent to lift the
 * state into — the same reason the navigation drawer lives in a store.
 *
 * Keyed rather than single, because a screen is not always one form. Settings
 * carries three independent ones, and a merchant who has edited two of them
 * expects one Save, not a hunt for two buttons. Anything dirty is saved; the
 * bar reports the screen, not the form.
 */
export type EditorEntry = {
  dirty: boolean;
  saving: boolean;
  save: () => Promise<void> | void;
  discard: () => void;
};

type AdminEditorState = {
  editors: Record<string, EditorEntry>;
  register: (id: string, entry: EditorEntry) => void;
  unregister: (id: string) => void;

  /**
   * How a screen asks "leave without saving?".
   *
   * Provided by the bar, which is mounted in the layout and can render the
   * dialog. A hook cannot render one of its own, and every editor needs the
   * same question asked the same way.
   */
  confirmLeave: (() => Promise<boolean>) | null;
  setConfirmLeave: (f: (() => Promise<boolean>) | null) => void;
};

export const useAdminEditors = create<AdminEditorState>((set) => ({
  editors: {},
  register: (id, entry) => set((s) => ({ editors: { ...s.editors, [id]: entry } })),
  unregister: (id) =>
    set((s) => {
      if (!(id in s.editors)) return s;
      const next = { ...s.editors };
      delete next[id];
      return { editors: next };
    }),
  confirmLeave: null,
  setConfirmLeave: (f) => set({ confirmLeave: f }),
}));

/** Whether anything on this screen has been changed and not saved. */
export function anyDirty(editors: Record<string, EditorEntry>): boolean {
  return Object.values(editors).some((e) => e.dirty);
}

/** Whether a save is in flight anywhere on the screen. */
export function anySaving(editors: Record<string, EditorEntry>): boolean {
  return Object.values(editors).some((e) => e.saving);
}
