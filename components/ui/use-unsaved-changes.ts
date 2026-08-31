"use client";

import { useEffect, useRef } from "react";

/**
 * Stops unsaved work from being lost, by all three routes it can escape:
 *
 *   1. Closing or refreshing the tab   — the browser's own confirm dialog.
 *   2. Clicking a link inside the app  — intercepted before Next's router sees
 *      it, because App Router gives no cancellable navigation event to hook.
 *   3. The back button                 — a sentinel history entry is pushed
 *      while dirty, so a back press lands on it and can be re-pushed instead of
 *      leaving the editor.
 *
 * Browsers deliberately ignore custom text on the close/refresh dialog, so that
 * one always reads in the browser's own words — nothing to do about it. The
 * other two use the app's own confirm dialog and can say something useful.
 */
export function useUnsavedChanges(
  dirty: boolean,
  confirmLeave: () => Promise<boolean>,
  options: { enabled?: boolean } = {}
) {
  const enabled = options.enabled ?? true;
  // Kept in refs so the listeners below never need re-binding on every keystroke.
  const dirtyRef = useRef(dirty);
  const confirmRef = useRef(confirmLeave);

  // Synced after each render rather than during it — the listeners read these
  // long after render, so they only need to be current by the time an event
  // fires, and writing refs mid-render is a React anti-pattern.
  useEffect(() => {
    dirtyRef.current = dirty && enabled;
    confirmRef.current = confirmLeave;
  });

  // 1. Tab close / refresh.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // 2. In-app link clicks.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!dirtyRef.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      // Opening in a new tab leaves this editor untouched, so it needs no guard.
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      event.stopPropagation();
      void confirmRef.current().then((leave) => {
        if (leave) {
          dirtyRef.current = false;
          window.location.href = url.toString();
        }
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // 3. Back button. A sentinel entry is pushed the moment work becomes dirty;
  //    pressing back consumes it, and we re-push unless the user confirms.
  useEffect(() => {
    if (!dirty || !enabled) return;

    const SENTINEL = { unsavedChangesGuard: true };
    window.history.pushState(SENTINEL, "");

    function onPopState() {
      if (!dirtyRef.current) return;
      // Undo the back press first, so the editor stays put while we ask.
      window.history.pushState(SENTINEL, "");
      void confirmRef.current().then((leave) => {
        if (leave) {
          dirtyRef.current = false;
          // Two entries back: the sentinel we just re-pushed, and the original.
          window.history.go(-2);
        }
      });
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirty, enabled]);
}
