"use client";

import { create } from "zustand";

/**
 * The admin navigation's shared client state.
 *
 * `open` is the small-screen drawer. It lives in a store rather than in a
 * component because the button that opens it and the drawer itself are siblings
 * under a *server* layout, so there is no shared client parent to hold it.
 *
 * There is no longer a desktop "collapsed" rail. It existed because the sidebar
 * held seven groups and twenty links and could not be afforded at every width;
 * six flat items fit at 15rem on any laptop, and a control that hides the words
 * on a navigation this short costs more than it saves.
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
};

export const useAdminNav = create<AdminNavState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),

  crumb: null,
  setCrumb: (crumb) => set({ crumb }),
}));
