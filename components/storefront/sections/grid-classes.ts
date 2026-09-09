/**
 * Column and shape classes, written out rather than built from a string.
 *
 * Tailwind only ships the classes it can find in the source, so
 * `` `sm:grid-cols-${n}` `` produces a class that exists in the HTML and in no
 * stylesheet — the section renders as one column and nothing in the build
 * complains. Shared by every section that offers a "per row" setting, so the
 * mistake has one place it could be made rather than a dozen.
 */
export const COLS_CLASS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
};

export const SHAPE_CLASS: Record<string, string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};
