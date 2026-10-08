import type { SectionSchema } from "@/lib/section-schema";
import { KITE_IMG } from "@/components/kite/assets";

/**
 * Kite's home sections, as the live customizer offers them. Every default is
 * the file's own — its words, its photographs — kept as they are (decided
 * 8 October: the texts stay until they are replaced on purpose).
 */
export const kiteCitiesSchema: SectionSchema = {
  type: "KITE_CITIES",
  label: "Cities",
  description: "Two full-height photographs side by side, a place and its city over each.",
  category: "Media",
  fields: [],
  blocks: {
    key: "cities",
    label: "City",
    titleField: "title",
    max: 2,
    fields: [
      { key: "image", kind: "image", label: "Photograph", info: "Fills its half of the screen.", default: "" },
      {
        key: "imagePosition",
        kind: "select",
        label: "Keep in view",
        info: "Which part of the photograph stays on screen when it is cropped.",
        default: "center",
        options: [
          { value: "center", label: "The middle" },
          { value: "top", label: "The top" },
        ],
      },
      { key: "eyebrow", kind: "text", label: "Above the city", info: "Set in capitals.", default: "" },
      { key: "title", kind: "text", label: "City", info: "The large serif line.", default: "" },
      { key: "link", kind: "url", label: "Link", info: "Where the photograph goes. Leave empty for none.", default: "" },
      { key: "phoneShade", kind: "range", label: "Darken on phones", info: "A black veil over the photograph on phones, so the words stay readable.", default: 0, min: 0, max: 60, step: 5 },
    ],
  },
};

export const KITE_CITIES_DEFAULT = {
  cities: [
    { image: KITE_IMG.newYork, imagePosition: "center", eyebrow: "East Village", title: "New York", link: "", phoneShade: 0 },
    { image: KITE_IMG.losAngeles, imagePosition: "top", eyebrow: "Koreatown", title: "Los Angeles", link: "", phoneShade: 20 },
  ],
};

const PLACEHOLDER =
  "A placeholder text is a block of nonsensical or meaningless text that is temporarily used to fill a space where actual content will eventually appear.";

/** The bar every numbered screen opens with — shared fields. */
const head = (numeral: string, title: string): SectionSchema["fields"] => [
  { key: "numeral", kind: "text", label: "Numeral", info: "At the left of the bar that opens the section. Leave both empty for no bar.", default: numeral },
  { key: "title", kind: "text", label: "Title", info: "At the right of that bar.", default: title },
];

export const kiteLimitedSchema: SectionSchema = {
  type: "KITE_LIMITED",
  label: "Limited collection",
  description: "Two pieces, staggered, over the shop's name set enormous and faint.",
  category: "Commerce",
  fields: [
    ...head("XVI", "LIMITED COLLECTION"),
    { key: "text", kind: "textarea", label: "Words at the left", info: "A short paragraph beside the pieces.", default: PLACEHOLDER },
    { key: "backdrop", kind: "text", label: "Word behind", info: "Set enormous and faint behind the pieces. Leave empty for none.", default: "Trümung" },
    { key: "collection", kind: "collection", label: "Pieces from", info: "The first two products of this collection. Leave empty for the shop's newest.", default: "" },
    { key: "addLabel", kind: "text", label: "Add to cart", info: "The words beside the arrow.", default: "Add to cart" },
  ],
};
