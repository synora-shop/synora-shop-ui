// The postMessage contract between the customizer (parent window) and the
// storefront preview running in its iframe.
//
// Kept in one file, imported by both sides, so the two can't drift out of sync.
// Every message is same-origin only — both windows are served by this app.
//
// The two sides are fetched separately, so a customizer left open across a
// deploy can hold the old names while its iframe reloads on the new ones, and
// the preview stops updating until the page is reloaded. That is the whole cost
// of changing these strings: nothing is persisted under them and nothing
// outside this app sends them.

import type { RenderableSection } from "@/components/storefront/sections/render";

/** Customizer -> preview: here is the current draft. */
export const PREVIEW_MESSAGE = "shp:preview";
/** Preview -> customizer: the frame has mounted and is listening. */
export const PREVIEW_READY = "shp:preview-ready";
/** Preview -> customizer: the user clicked this section in the page. */
export const PREVIEW_SELECT = "shp:preview-select";
/**
 * Preview -> customizer: the user right-clicked (or long-pressed) something and
 * chose to edit it. Carries a field key when the inspector could identify one,
 * so the customizer can open the section *and* focus the exact input.
 */
export const PREVIEW_EDIT = "shp:preview-edit";
/** Preview -> customizer: they picked a page region that isn't a section. */
export const PREVIEW_EDIT_REGION = "shp:preview-edit-region";

export type PreviewDraftMessage = {
  type: typeof PREVIEW_MESSAGE;
  sections: RenderableSection[];
  /** Highlighted section, so the preview can outline what's being edited. */
  selectedId?: string | null;
  /**
   * The section that just changed, so the preview can scroll it into view and
   * flash it. Carries a counter rather than only an id: editing the same
   * section twice in a row must still register as a new event, which a bare id
   * comparison would miss.
   */
  changed?: { sectionId: string; seq: number } | null;
};

export type PreviewReadyMessage = { type: typeof PREVIEW_READY };

export type PreviewSelectMessage = { type: typeof PREVIEW_SELECT; sectionId: string };

export type PreviewEditMessage = {
  type: typeof PREVIEW_EDIT;
  sectionId: string;
  /** Null when the click couldn't be traced to one setting. */
  fieldKey: string | null;
};

export type PreviewEditRegionMessage = {
  type: typeof PREVIEW_EDIT_REGION;
  /** A key of GLOBAL_REGIONS in lib/preview-inspect.ts. */
  region: string;
  href: string;
};

export type PreviewMessage =
  | PreviewDraftMessage
  | PreviewReadyMessage
  | PreviewSelectMessage
  | PreviewEditMessage
  | PreviewEditRegionMessage;
