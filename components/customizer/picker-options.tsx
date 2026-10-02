"use client";

import { createContext, useContext } from "react";

/**
 * The things a section setting can point at.
 *
 * Almost nothing on a storefront is typed in. A section shows a *product*, a
 * *category*, a *page*, a *menu* the merchant built, or plain text, a picture
 * and a link. The schema already says which of those a field wants — `kind:
 * "collection"` on Category spotlight, for instance — and the customizer had
 * no way to offer the list, so those fields rendered nothing at all and the
 * section silently fell back to whichever row came first.
 *
 * The lists ride a context rather than three layers of props, the same way the
 * storefront passes its currency: the panel that renders a field is three
 * components below the one that has the data, and every component in between
 * would otherwise carry a prop it has no use for.
 *
 * Empty is a real answer, not a loading state. A shop with no menus yet should
 * be told that in the field, with the name of the screen that makes one —
 * never offered an empty dropdown that looks broken.
 */
export type PickerOption = {
  /** What gets stored. An id, so renaming the thing does not break the link. */
  value: string;
  label: string;
};

export type PickerOptions = {
  collection: PickerOption[];
  product: PickerOption[];
};

const EMPTY: PickerOptions = { collection: [], product: [] };

const PickerOptionsContext = createContext<PickerOptions>(EMPTY);

export function PickerOptionsProvider({
  options,
  children,
}: {
  options: PickerOptions;
  children: React.ReactNode;
}) {
  return <PickerOptionsContext.Provider value={options}>{children}</PickerOptionsContext.Provider>;
}

export function usePickerOptions(): PickerOptions {
  return useContext(PickerOptionsContext);
}

/** Which kinds are answered by a list rather than by typing. */
export const PICKER_KINDS = ["collection", "product"] as const;
export type PickerKind = (typeof PICKER_KINDS)[number];

/** Where a merchant goes to make one, when they have none. */
export const PICKER_EMPTY_HINT: Record<PickerKind, string> = {
  collection: "No categories yet — add one under Products → Categories.",
  product: "No products yet — add one under Products.",
};
