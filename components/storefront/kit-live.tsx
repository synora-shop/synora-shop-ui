"use client";

import { useEffect, useRef, useState } from "react";
import type { KitContext, KitSectionDef } from "@/lib/themes/kit";
import { resolveKitSection } from "@/lib/themes/kit";
import { PREVIEW_MESSAGE, PREVIEW_READY, PREVIEW_SELECT, type PreviewMessage } from "@/lib/customizer-protocol";
import type { RenderableSection } from "@/components/storefront/sections/render";
import { PreviewGuard } from "@/components/storefront/preview-guard";

/**
 * One template of a kit page, live in the customizer's preview: the server's
 * drawing until the customizer sends a draft of *this* template, then the
 * draft, redrawn on every keystroke — the kit's counterpart to
 * PreviewSections.
 *
 * Mounted only when the page is drawn for the preview (`?__preview=1`). The
 * header, the page and the footer each mount one, and each takes only the
 * draft named for its own template, so editing the header redraws the header
 * and nothing else.
 *
 * The kit's components are loaded on the first draft, not before: the server
 * drawing needs none of them in the browser.
 */
export function KitLive({
  kitKey,
  name,
  ctx,
  children,
}: {
  kitKey: string;
  name: string;
  ctx: KitContext;
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<RenderableSection[] | null>(null);
  const [sections, setSections] = useState<Record<string, KitSectionDef> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const lastSeq = useRef(-1);

  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const msg = event.data as PreviewMessage | undefined;
      if (!msg || typeof msg !== "object" || msg.type !== PREVIEW_MESSAGE || msg.template !== name) return;
      if (!sections) {
        const { CLIENT_KITS } = await import("@/lib/themes/kits.client");
        setSections(CLIENT_KITS[kitKey] ?? {});
      }
      setDraft(msg.sections);
      setSelectedId(msg.selectedId ?? null);
      const changed = msg.changed;
      if (changed && changed.seq !== lastSeq.current) {
        lastSeq.current = changed.seq;
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-kit-section="${CSS.escape(changed.sectionId)}"]`);
          if (!el) return;
          const box = el.getBoundingClientRect();
          if (box.top < 0 || box.bottom > window.innerHeight) el.scrollIntoView({ behavior: "smooth", block: "center" });
          setFlashId(changed.sectionId);
          setTimeout(() => setFlashId(null), 900);
        });
      }
    }
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [kitKey, name, sections]);

  // A click on a section selects it in the editor, as on Shopify.
  function onClickCapture(e: React.MouseEvent) {
    const el = (e.target as HTMLElement)?.closest?.("[data-kit-section]");
    const id = el?.getAttribute("data-kit-section");
    if (id) window.parent?.postMessage({ type: PREVIEW_SELECT, sectionId: id }, window.location.origin);
  }

  if (!draft || !sections) {
    return (
      <div onClickCapture={onClickCapture}>
        {name !== "header" && name !== "footer" ? <PreviewGuard /> : null}
        {children}
      </div>
    );
  }

  return (
    <div onClickCapture={onClickCapture}>
      {name !== "header" && name !== "footer" ? <PreviewGuard /> : null}
      {draft
        .filter((s) => s.isVisible !== false)
        .map((s) => {
          const def = sections[s.type];
          if (!def) return null;
          const Render = def.Render;
          return (
            <div
              key={s.id}
              data-kit-section={s.id}
              className={[
                selectedId === s.id ? "relative outline outline-2 -outline-offset-2 outline-brand-500" : "",
                flashId === s.id ? "relative animate-[shp-flash_900ms_ease-out]" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined}
            >
              <Render data={resolveKitSection(def, s.data as Record<string, unknown>)} ctx={ctx} />
            </div>
          );
        })}
    </div>
  );
}
