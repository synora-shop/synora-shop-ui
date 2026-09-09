"use client";

import { useEffect } from "react";

/**
 * Keeps the customizer's preview a preview.
 *
 * An iframe pointed at the storefront is a working browser window, and that is
 * the problem: a merchant can scroll it away from what they are editing, and
 * they can click a link and leave the preview entirely. Both happened.
 *
 * The link one was the worse of the two, and it looked like something else.
 * Clicking the shop's logo goes to `/`, and the preview is served from the
 * application host, where `/` redirects to `/admin` — so the *admin panel*
 * loaded inside the preview pane, on the Home screen, which is where logos are
 * changed. It read as "the customizer sends you to settings when you click the
 * logo". It was a plain anchor doing what anchors do.
 *
 * So, inside the preview only:
 *
 *   Nothing navigates. Links are neutered, forms do not submit. A preview that
 *   can be browsed away from is a browser with a settings panel bolted on.
 *
 *   Nothing scrolls by hand. The customizer already brings the section being
 *   edited into view, which is the movement that is *about* something. Setting
 *   overflow hidden stops a person scrolling while leaving `scrollIntoView`
 *   working, because programmatic scrolling is unaffected by it.
 *
 * What deliberately still works: everything inside a section. Slideshow arrows,
 * accordions, tabs — a merchant judging a section has to be able to operate it.
 * Only leaving is prevented, not using.
 *
 * Mounted from PreviewSections, so it exists inside the customizer's iframe and
 * nowhere a customer can reach.
 */
export function PreviewGuard() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

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
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
      body.classList.remove("in-preview");
      document.removeEventListener("click", blockNavigation, true);
      document.removeEventListener("submit", blockSubmit, true);
    };
  }, []);

  return null;
}
