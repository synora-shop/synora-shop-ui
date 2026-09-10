"use client";

import { useEffect } from "react";

/**
 * Keeps the customizer's preview a preview.
 *
 * An iframe pointed at the storefront is a working browser window, and one half
 * of that is a real problem: a merchant can click a link and leave the preview
 * entirely. Clicking the shop's logo goes to `/`, and the preview is served from
 * the application host, where `/` redirects to `/admin` — so the *admin panel*
 * loaded inside the preview pane, on the Home screen, which is where logos are
 * changed. It read as "the customizer sends you to settings when you click the
 * logo". It was a plain anchor doing what anchors do.
 *
 * So nothing navigates: links are neutered, forms do not submit.
 *
 * **Scrolling is deliberately left alone**, and it was not always. This file
 * used to lock it, on the reasoning that the customizer already brings the
 * section being edited into view, so scrolling by hand was never the movement
 * that mattered. That reasoning was wrong in a way only using it reveals: the
 * auto-scroll fires when a section's *settings change*, and adding one does not
 * change any settings. A merchant added a section, it landed below the fold, and
 * the preview would not move — a page 3,039px tall in an 867px window with 2,172
 * of it unreachable. The lock removed the only way out of a gap in the
 * auto-scroll, so the two faults together made the tool unusable.
 *
 * The auto-scroll is fixed at its own end — adding, duplicating and moving a
 * section now bring it into view, the same as editing one. Scrolling stays as a
 * fallback, because a working surface should not have one way to reach things.
 *
 * What deliberately still works: everything inside a section. Slideshow arrows,
 * accordions, tabs — a merchant judging a section has to be able to operate it.
 * Only leaving is prevented, not using or looking.
 *
 * Mounted from PreviewSections, so it exists inside the customizer's iframe and
 * nowhere a customer can reach.
 */
export function PreviewGuard() {
  useEffect(() => {
    const body = document.body;

    // Marks the document as the customizer's, which globals.css reads to keep
    // an empty section visible and named. On a live storefront the same section
    // takes up no room at all.
    body.classList.add("in-preview");

    /**
     * Capture phase, and `preventDefault` without `stopPropagation`.
     *
     * Load-bearing: PreviewSections has its own capture listener that tells the
     * customizer which section was clicked. Stopping propagation here would
     * kill selecting a section by clicking it, which is the main way the panel
     * and the preview stay pointed at the same thing.
     */
    function blockNavigation(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest?.("a[href]");
      if (!link) return;
      // The inspector's own menu lives in this document too.
      if (link.closest("[data-preview-ui]")) return;
      event.preventDefault();
    }

    function blockSubmit(event: Event) {
      if ((event.target as HTMLElement | null)?.closest?.("[data-preview-ui]")) return;
      event.preventDefault();
    }

    document.addEventListener("click", blockNavigation, true);
    document.addEventListener("submit", blockSubmit, true);

    return () => {
      body.classList.remove("in-preview");
      document.removeEventListener("click", blockNavigation, true);
      document.removeEventListener("submit", blockSubmit, true);
    };
  }, []);

  return null;
}
