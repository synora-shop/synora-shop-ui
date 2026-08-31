"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GLOBAL_REGIONS,
  matchField,
  regionFor,
  type GlobalRegion,
} from "@/lib/preview-inspect";
import { getSectionSchema, STYLE_FIELDS } from "@/lib/section-schema";
import {
  PREVIEW_EDIT,
  PREVIEW_EDIT_REGION,
  type PreviewMessage,
} from "@/lib/customizer-protocol";
import type { RenderableSection } from "./sections/render";

/**
 * Right-click (or long-press) anything in the preview to go and edit it.
 *
 * The problem this solves is the one every theme editor has: you can see the
 * thing you want to change, but the control for it is somewhere in a panel of
 * forty, and knowing which requires knowing how the page was built. Pointing at
 * it is the obvious gesture, so this makes the obvious gesture work.
 *
 * It only mounts inside the customizer's iframe. On the real storefront the
 * component is never rendered, so a customer's right-click behaves exactly as
 * their browser intends.
 */

const LONG_PRESS_MS = 500;
/** Movement above this cancels a long press — it was a scroll, not a hold. */
const LONG_PRESS_SLOP_PX = 10;

type Target =
  | { kind: "section"; sectionId: string; sectionLabel: string; field: { key: string; label: string } | null }
  | { kind: "region"; region: GlobalRegion };

export function PreviewInspector({ sections }: { sections: RenderableSection[] }) {
  const [menu, setMenu] = useState<{ x: number; y: number; target: Target } | null>(null);
  const [hover, setHover] = useState<{ rect: DOMRect; label: string } | null>(null);
  /** What the outline is currently drawn around, so it is only remeasured on a change. */
  const lastOutlined = useRef<Element | null>(null);
  const pressTimer = useRef<number | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  /** Works out what an element represents, walking up to its owning section. */
  const identify = useCallback(
    (el: Element | null): Target | null => {
      if (!el) return null;

      // Region markers are read from the ancestors rather than the element, so
      // any child of the header answers "header" without each one being tagged.
      const markers: string[] = [];
      for (let node: Element | null = el; node; node = node.parentElement) {
        const marker = node.getAttribute?.("data-shp-region");
        if (marker) markers.push(marker);
      }

      const sectionEl = el.closest("[data-section-id]");
      if (!sectionEl) {
        const region = regionFor(markers);
        return region ? { kind: "region", region } : null;
      }

      const sectionId = sectionEl.getAttribute("data-section-id") ?? "";
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return null;

      const schema = getSectionSchema(section.type);
      const fields = [...(schema?.fields ?? []), ...STYLE_FIELDS];
      const data = (section.data ?? {}) as Record<string, unknown>;
      const text = el.textContent ?? "";
      const field = matchField(text, data, fields);

      return {
        kind: "section",
        sectionId,
        sectionLabel: schema?.label ?? "Section",
        field: field ? { key: field.key, label: field.label } : null,
      };
    },
    [sections]
  );

  const openMenu = useCallback(
    (x: number, y: number, el: Element | null) => {
      const target = identify(el);
      if (!target) return;
      // Kept inside the viewport: a menu opened near the right edge would
      // otherwise render off-screen inside an already-narrow iframe.
      setMenu({
        x: Math.min(x, window.innerWidth - 240),
        y: Math.min(y, window.innerHeight - 180),
        target,
      });
    },
    [identify]
  );

  useEffect(() => {
    function onContextMenu(event: MouseEvent) {
      const el = event.target as Element | null;
      const target = identify(el);
      // Nothing editable under the cursor: let the browser's own menu open, so
      // "copy" and "inspect" still work where we have nothing better to offer.
      if (!target) return;
      event.preventDefault();
      openMenu(event.clientX, event.clientY, el);
    }

    function onPointerMove(event: PointerEvent) {
      if (menu) return;
      const el = event.target as Element | null;
      const target = identify(el);
      if (!target) {
        lastOutlined.current = null;
        return setHover(null);
      }

      const box =
        target.kind === "section"
          ? (el?.closest("[data-section-id]") as Element | null)
          : (el as Element | null);
      if (!box) {
        lastOutlined.current = null;
        return setHover(null);
      }

      // The outline follows the matched element when a field was identified,
      // and the whole section when it wasn't, so the highlight always shows
      // exactly what the menu is about to edit.
      const outlined = target.kind === "section" && target.field ? el! : box;

      // Only when the element under the pointer actually changes.
      //
      // This ran on every pointermove: a getBoundingClientRect, which forces
      // layout, and a setState carrying a freshly built rect object, which is
      // never equal to the last one, so React re-rendered the overlay dozens
      // of times a second while the cursor sat still inside one section. That
      // is what made moving the mouse across the preview feel like the page
      // was struggling.
      if (outlined === lastOutlined.current) return;
      lastOutlined.current = outlined;

      setHover({
        rect: outlined.getBoundingClientRect(),
        label:
          target.kind === "region"
            ? GLOBAL_REGIONS[target.region].label
            : target.field
              ? `${target.sectionLabel} · ${target.field.label}`
              : target.sectionLabel,
      });
    }

    // The rect is measured against the viewport and the overlay is positioned
    // against it, so once the page moves the outline is drawn around where the
    // element used to be. Dropping it is right: the pointer has not chosen
    // anything new, and the next move re-measures.
    function onScroll() {
      lastOutlined.current = null;
      setHover(null);
    }

    // Touch has no right-click, so a hold does the same job. The timer is
    // cancelled by movement, because a hold that drifts is a scroll.
    function onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse") return;
      pressOrigin.current = { x: event.clientX, y: event.clientY };
      const el = event.target as Element | null;
      pressTimer.current = window.setTimeout(() => {
        openMenu(event.clientX, event.clientY, el);
      }, LONG_PRESS_MS);
    }
    function cancelPress(event?: PointerEvent) {
      if (event && pressOrigin.current) {
        const dx = Math.abs(event.clientX - pressOrigin.current.x);
        const dy = Math.abs(event.clientY - pressOrigin.current.y);
        if (dx < LONG_PRESS_SLOP_PX && dy < LONG_PRESS_SLOP_PX) return;
      }
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }

    // Named, every one of them. Three of these were registered as inline
    // arrows, which cannot be removed because removeEventListener matches on
    // identity and a new arrow is a new function. This effect re-runs whenever
    // the menu opens or closes, so each right click left another pointerup,
    // pointercancel and scroll listener attached to the document, for the life
    // of the page.
    const onPressEnd = () => cancelPress();
    const onScrollAny = () => {
      cancelPress();
      onScroll();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", cancelPress);
    document.addEventListener("pointerup", onPressEnd);
    document.addEventListener("pointercancel", onPressEnd);
    document.addEventListener("scroll", onScrollAny, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", cancelPress);
      document.removeEventListener("pointerup", onPressEnd);
      document.removeEventListener("pointercancel", onPressEnd);
      document.removeEventListener("scroll", onScrollAny, true);
      document.removeEventListener("keydown", onKeyDown);
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
    };
  }, [identify, openMenu, menu]);

  function send(message: PreviewMessage) {
    window.parent.postMessage(message, window.location.origin);
    setMenu(null);
  }

  return (
    <>
      {hover && !menu && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: hover.rect.left - 2,
            top: hover.rect.top - 2,
            width: hover.rect.width + 4,
            height: hover.rect.height + 4,
            border: "1.5px solid var(--color-brand-500, #4b45e0)",
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 2147483000,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -20,
              left: -1.5,
              background: "var(--color-brand-600, #2f29c9)",
              color: "#fff",
              font: "500 10px/1.6 ui-sans-serif, system-ui, sans-serif",
              padding: "0 6px",
              borderRadius: 3,
              whiteSpace: "nowrap",
            }}
          >
            {hover.label}
          </span>
        </div>
      )}

      {menu && (
        <>
          <div
            onClick={() => setMenu(null)}
            style={{ position: "fixed", inset: 0, zIndex: 2147483001 }}
          />
          <div
            role="menu"
            style={{
              position: "fixed",
              left: menu.x,
              top: menu.y,
              zIndex: 2147483002,
              minWidth: 220,
              background: "#fff",
              border: "1px solid #dbe6e9",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(14,30,34,0.16)",
              overflow: "hidden",
              font: "14px/1.5 ui-sans-serif, system-ui, sans-serif",
              color: "#0e1e22",
            }}
          >
            {menu.target.kind === "section" ? (
              <>
                {menu.target.field && (
                  <MenuItem
                    primary
                    label={`Edit ${menu.target.field.label.toLowerCase()}`}
                    hint="Opens this setting and puts the cursor in it"
                    onClick={() =>
                      send({
                        type: PREVIEW_EDIT,
                        sectionId: (menu.target as { sectionId: string }).sectionId,
                        fieldKey: (menu.target as { field: { key: string } }).field.key,
                      })
                    }
                  />
                )}
                <MenuItem
                  label={`Edit ${menu.target.sectionLabel}`}
                  hint="All of this section's settings"
                  onClick={() =>
                    send({
                      type: PREVIEW_EDIT,
                      sectionId: (menu.target as { sectionId: string }).sectionId,
                      fieldKey: null,
                    })
                  }
                />
              </>
            ) : (
              <MenuItem
                primary
                label={`Edit ${GLOBAL_REGIONS[menu.target.region].label.toLowerCase()}`}
                hint={GLOBAL_REGIONS[menu.target.region].description}
                onClick={() =>
                  send({
                    type: PREVIEW_EDIT_REGION,
                    region: (menu.target as { region: GlobalRegion }).region,
                    href: GLOBAL_REGIONS[(menu.target as { region: GlobalRegion }).region].href,
                  })
                }
              />
            )}
          </div>
        </>
      )}
    </>
  );
}

function MenuItem({
  label,
  hint,
  onClick,
  primary,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "8px 12px",
        textAlign: "left",
        background: "transparent",
        border: 0,
        borderTop: primary ? undefined : "1px solid #eef4f5",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7f9")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ display: "block", fontWeight: primary ? 600 : 500 }}>{label}</span>
      <span style={{ display: "block", fontSize: 11, color: "#46595f", marginTop: 1 }}>{hint}</span>
    </button>
  );
}
