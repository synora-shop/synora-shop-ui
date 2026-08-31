// Backwards-compatible shims over the section schema registry.
//
// The registry in lib/section-schema.ts is now the single source of truth for
// what settings a section has, what they default to, and what it's called.
// These two exports predate it and are kept so existing callers (the old admin
// section list and the add-section action) keep working — both are derived,
// never hand-maintained, so they can't drift from the schemas.

import { SECTION_SCHEMAS, defaultSectionData } from "@/lib/section-schema";

/** Starting content for each section type, keyed by type. */
export const DEFAULT_SECTION_DATA: Record<string, unknown> = Object.fromEntries(
  Object.keys(SECTION_SCHEMAS).map((type) => [type, defaultSectionData(type)])
);

export const SECTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_SCHEMAS).map(([type, schema]) => [type, schema.label])
);
