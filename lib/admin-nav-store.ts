"use client";

import { create } from "zustand";

const COLLAPSED_KEY = "shp-admin-nav-collapsed";

/**
 * The admin navigation's two pieces of state.
 *
 * `open` is the small-screen drawer. It lives in a store rather than in a
 * component because the button that opens it and the drawer itself are
 * siblings under a *server* layout, so there is no shared client parent to
 * hold it. Before this, the sidebar carried its own toggle in a second fixed
 * bar, which the topbar — sticky at the same offset and a layer above —
 * painted straight over. The button rendered, and could not be reached.
 *
 * `collapsed` is the desktop icon rail, and it is deliberately a *choice*.
 * It was briefly automatic, collapsing itself between 1024px and 1280px, and
 * that was wrong: a laptop window sits in that band most of the time, so the
 * labels vanished during ordinary work with nothing to bring them back. A
 * navigation that hides its own words on a width the user did not pick is not
 * responsive, it is unpredictable.
 *
 * Not persisted through zustand's middleware, because the value has to be read
 * *after* mount — see useHydrateNav. Reading localStorage while rendering makes
 * the server and the client disagree about the first paint.
 */
type AdminNavState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;

  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
};

export const useAdminNav = create<AdminNavState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),

  // Expanded until told otherwise. The default has to be the readable one:
  // somebody who has never touched the control should see words.
  collapsed: false,
  setCollapsed: (collapsed) => {
    set({ collapsed });
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // Private browsing and blocked site data both throw here. Forgetting the
      // preference is a small loss; failing to render the admin is not.
    }
  },
  toggleCollapsed: () => set((s) => {
    const collapsed = !s.collapsed;
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* see above */
    }
    return { collapsed };
  }),
}));

/** Reads the remembered choice once, after mount. */
export function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
