/**
 * What an import would do, in the one shape every import dialog draws.
 *
 * Products and customers arrive in different files with different columns, but
 * a merchant is asked the same question about both: what will be added, what
 * will be overwritten, and what in this file cannot be read. One shape means
 * one dialog rather than two that drift.
 *
 * Client-safe: pure types.
 */

export type ImportRow = {
  /** Stable identity — a handle, an email. Shown in a mono line under the name. */
  key: string;
  /** What the thing is called. */
  title: string;
  /** A short fact or two about it, right-aligned. */
  detail: string;
  /**
   * What would happen to it.
   *
   * "skip" is not a failure — it is the honest answer for a record that must
   * not be rewritten. An order is a record of something that happened, so an
   * order already here is left exactly as it is, and saying "overwrite" about
   * it would be a lie the merchant only discovers afterwards.
   */
  action: "create" | "update" | "skip";
};

export type ImportPlan = {
  rows: ImportRow[];
  creating: number;
  updating: number;
  /** Rows that are already here and will be left alone. */
  skipping?: number;
  problems: { line: number; message: string }[];
  /** Columns the file carries that the format does not define. */
  unknownColumns: string[];
};

export type ImportResult = {
  created: number;
  updated: number;
  failed: { key: string; message: string }[];
};
