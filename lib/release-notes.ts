/**
 * Patch notes (14 October): published by the Synora team from the console
 * (/synora/patch-notes), read by /release-notes. Pure shapes only, safe in
 * the browser; the database read is lib/release-notes-data.ts.
 */
export type ChangeKind = "New" | "Improved" | "Fixed";
export const CHANGE_KINDS: ChangeKind[] = ["New", "Improved", "Fixed"];
export type Change = { kind: ChangeKind; text: string };
export type Note = { id: string; title: string; date: string; dateLabel: string; changes: Change[] };

/** Whatever is stored, as the shape the pages draw; anything odd is dropped. */
export function readChanges(raw: unknown): Change[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((c) => {
    const kind = (c as Change)?.kind;
    const text = typeof (c as Change)?.text === "string" ? (c as Change).text.trim() : "";
    return CHANGE_KINDS.includes(kind) && text ? [{ kind, text }] : [];
  });
}

export const dateLabel = (d: Date) => d.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
