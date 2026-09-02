/**
 * What each kind of business is for, in a merchant's words.
 *
 * Two screens need this and they need it to agree: the ⓘ beside the top bar,
 * which explains the choice, and the dialog that makes it. Written once here so
 * the explanation and the thing being explained cannot drift apart.
 *
 * "Which one am I?" is the question a merchant actually asks, and a name alone
 * does not answer it — a real estate agency is not obviously a "service" until
 * someone says so. So each entry names real businesses rather than describing a
 * category in the abstract.
 *
 * Client-safe: pure data, no imports.
 */

export type TypeGuide = {
  /** Registry spelling — matches lib/themes/registry.ts and the chrome colours. */
  key: string;
  label: string;
  /** One line, for the dialog list. */
  summary: string;
  /** The kinds of business that belong here, named plainly. */
  examples: string[];
  /** What the panel gives you, so the difference between types is concrete. */
  gives: string[];
};

export const TYPE_GUIDE: TypeGuide[] = [
  {
    key: "ecommerce",
    label: "E-commerce",
    summary: "You sell things people put in a basket and pay for.",
    examples: ["Clothing and shoes", "Electronics", "Beauty and skincare", "Anything shipped in a box"],
    gives: ["Products and categories", "Orders and customers", "Discount codes", "Stock levels"],
  },
  {
    key: "restaurant",
    label: "Restaurant",
    summary: "You serve food, and people come to you or you deliver to them.",
    examples: ["Restaurants and cafés", "Takeaways", "Bakeries", "Cloud kitchens"],
    gives: ["Dishes and courses", "Orders", "Opening hours", "Locations and a map"],
  },
  {
    key: "blog",
    label: "Blog",
    summary: "You publish writing, and nothing is for sale.",
    examples: ["Personal writing", "News and magazines", "Company journals", "Portfolios"],
    gives: ["Posts", "Pages", "Enquiries from readers"],
  },
];

export function guideFor(key: string | null | undefined): TypeGuide | undefined {
  return TYPE_GUIDE.find((t) => t.key === key);
}
