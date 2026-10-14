"use client";

import { create } from "zustand";

/**
 * The admin navigation's shared client state.
 *
 * `open` is the small-screen drawer. It lives in a store rather than in a
 * component because the button that opens it and the drawer itself are siblings
 * under a *server* layout, so there is no shared client parent to hold it.
 *
 * The desktop rail can fold to icons (new admin, 15 October). That preference
 * lives in localStorage, not here: see components/admin/admin-sidebar.tsx.
 *
 * `crumb` is the one breadcrumb the URL cannot supply. The heading bar builds
 * "Products > Orders" from the path, but "Order #1042" is a fact only the page
 * knows, so a page pushes it here — see components/admin/page-crumb.tsx.
 */
type AdminNavState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;

  crumb: string | null;
  setCrumb: (crumb: string | null) => void;

  /** The command bar (⌘K). Opened from the rail's search field or the keyboard. */
  searching: boolean;
  setSearching: (searching: boolean) => void;
};

export const useAdminNav = create<AdminNavState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),

  crumb: null,
  setCrumb: (crumb) => set({ crumb }),

  searching: false,
  setSearching: (searching) => set({ searching }),
}));
