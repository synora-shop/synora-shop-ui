"use client";

import { useEffect, useRef, useState } from "react";
import { RenderSection, type RenderableSection, type SectionContext } from "./sections/render";
import { PreviewInspector } from "./preview-inspector";
import {
  PREVIEW_MESSAGE,
  PREVIEW_READY,
  PREVIEW_SELECT,
  type PreviewMessage,
} from "@/lib/customizer-protocol";

/**
 * The storefront's live-preview mode, used only inside the customizer.
 *
 * It renders the very same section components the live site does, but holds
 * the section list in client state so the customizer can stream draft edits in
 * over postMessage and have them appear as you type — without persisting
 * anything or reloading the frame.
 *
 * If no messages ever arrive it just renders its saved sections, so a preview
 * URL opened on its own still shows the page.
 */
export function PreviewSections({
  sections,
  ctx,
}: {
  sections: RenderableSection[];
  ctx: SectionContext;
}) {
  const [draft, setDraft] = useState<RenderableSection[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const lastSeq = useRef(-1);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Same-origin only: the customizer and the previewed storefront are both
      // served from this app, so anything from elsewhere is not ours.
      if (event.origin !== window.location.origin) return;
      const msg = event.data as PreviewMessage | undefined;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === PREVIEW_MESSAGE) {
        setDraft(msg.sections);
        setSelectedId(msg.selectedId ?? null);

        // Bring whatever just changed into view. Scrolling happens on the next
        // frame so the updated section has rendered and its real position is
        // known; without that the page jumps to where it used to be.
        const changed = msg.changed;
        if (changed && changed.seq !== lastSeq.current) {
          lastSeq.current = changed.seq;
          requestAnimationFrame(() => {
            const el = document.querySelector(`[data-section-id="${CSS.escape(changed.sectionId)}"]`);
            if (!el) return;
            const box = el.getBoundingClientRect();
            const offscreen = box.top < 0 || box.bottom > window.innerHeight;
            // Only scroll when it isn't already visible — yanking the page
            // while someone is typing into a section they can already see is
            // worse than doing nothing.
            if (offscreen) el.scrollIntoView({ behavior: "smooth", block: "center" });
            setFlashId(changed.sectionId);
            setTimeout(() => setFlashId(null), 900);
          });
        }
      }
    }

    window.addEventListener("message", onMessage);
    // Tell the customizer the frame is mounted and ready for draft updates —
    // it holds off sending until this arrives to avoid a lost first message.
    window.parent?.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Clicking a section in the preview selects it in the settings panel, the
  // same way Shopify's customizer does.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const el = (event.target as HTMLElement)?.closest?.("[data-section-id]");
      const id = el?.getAttribute("data-section-id");
      if (!id) return;
      window.parent?.postMessage({ type: PREVIEW_SELECT, sectionId: id }, window.location.origin);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const list = (draft ?? sections).filter((s) => s.isVisible !== false);

  return (
    <>
      {/* Right-click to edit. Mounted only here, so it exists inside the
          customizer's preview and nowhere a customer can reach. */}
      <PreviewInspector sections={list} />
      {list.map((section) => (
        <div
          key={section.id}
          className={[
            selectedId === section.id ? "relative outline outline-2 -outline-offset-2 outline-brand-500" : "",
            // Brief highlight so a change is visible even when the section was
            // already on screen and no scrolling happened.
            flashId === section.id ? "relative animate-[shp-flash_900ms_ease-out]" : "",
          ].filter(Boolean).join(" ") || undefined}
        >
          <RenderSection section={section} ctx={ctx} />
        </div>
      ))}
    </>
  );
}
