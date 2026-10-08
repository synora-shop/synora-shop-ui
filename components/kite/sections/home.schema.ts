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

export const kiteCuratedSchema: SectionSchema = {
  type: "KITE_CURATED",
  label: "Curated by",
  description: "A collage of seven photographs around a curator's name in script.",
  category: "Media",
  fields: [
    { key: "before", kind: "text", label: "Before the line", info: "Left of the short rule, in Khand.", default: "NEW RELEASES" },
    { key: "after", kind: "text", label: "After the line", info: "Right of the short rule.", default: "CURATED BY" },
    { key: "name", kind: "text", label: "Name", info: "The large script line.", default: "Martin Schleifer" },
    { key: "linkLabel", kind: "text", label: "Link words", info: "Underlined, under the name.", default: "SHOP COLLECTION" },
    { key: "link", kind: "url", label: "Link", info: "Where those words go.", default: "route:collection" },
    ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({
      key: `image${i}`,
      kind: "image" as const,
      label: `Photograph ${i}`,
      info: "Its place in the collage is the design's; the photograph is yours.",
      default: KITE_IMG[`curated${i}` as keyof typeof KITE_IMG],
    })),
  ],
};

const STORY =
  "Temporarily used to fill a space where actual content will eventually appear. It serves as a visual placeholder to help designers and developers visualize the layout of a website, document, or other design project before the final content is added";
const REST = "temporarily used to fill a space where actual content will eventually appear. It serves as a visual placeholder to help designers and developers visualize the layout of a website, document, or other design project before the final content is added...";

export const kiteNewsletterSchema: SectionSchema = {
  type: "KITE_NEWSLETTER",
  label: "Newsletter",
  description: "A featured story beside a large photograph, then a row of stories to swipe.",
  category: "Content",
  fields: [
    ...head("XVII", "NEWSLETTER"),
    { key: "image", kind: "image", label: "Photograph", info: "Beside the featured story, on the desktop.", default: KITE_IMG.storyMain },
    { key: "number", kind: "text", label: "Number", info: "Over the featured story's title.", default: "№001" },
    { key: "storyTitle", kind: "text", label: "Story title", info: "Set in the serif, in capitals.", default: "MIDNIGHT cHRONICLES" },
    { key: "lead", kind: "text", label: "First words", info: "Before the short rule in the first line.", default: "A placeholder text" },
    { key: "text", kind: "textarea", label: "After the rule", info: "The rest of the paragraph.", default: `is a block of nonsensical or meaningless text that is ${REST}` },
    { key: "textPhone", kind: "textarea", label: "After the rule, on phones", info: "The file shortens the first line on phones. Leave empty to use the line above.", default: `is a block of nonsensical. ${REST}` },
    { key: "linkLabel", kind: "text", label: "Link words", info: "Underlined, under the paragraph.", default: "READ MORE" },
    { key: "link", kind: "url", label: "Link", info: "Where the featured story is.", default: "" },
  ],
  blocks: {
    key: "stories",
    label: "Story",
    titleField: "left",
    max: 12,
    fields: [
      { key: "image", kind: "image", label: "Photograph", info: "264 by 200.", default: "" },
      { key: "number", kind: "text", label: "Number", info: "Over the headline.", default: "" },
      { key: "left", kind: "text", label: "Headline, before the rule", info: "In Khand.", default: "" },
      { key: "right", kind: "text", label: "Headline, after the rule", info: "", default: "" },
      { key: "text", kind: "textarea", label: "Words", info: "Under the headline.", default: "" },
      { key: "link", kind: "url", label: "Link", info: "Where the story is.", default: "" },
    ],
  },
};

export const KITE_NEWSLETTER_DEFAULT = {
  stories: [
    { image: KITE_IMG.story2, number: "№002", left: "NEW YORK", right: "FASHION WEEK", text: `${STORY}. Placeholder text helps maintain the structure and appearance of the layout while the content is being developed. Here’s an extra line to create some length difference...` },
    { image: KITE_IMG.story3, number: "№003", left: "HEADLINE", right: "HEADLINE", text: `${STORY}....` },
    { image: KITE_IMG.story4, number: "№004", left: "HEADLINE", right: "HEADLINE", text: `${STORY}. Placeholder text helps maintain the structure...` },
    { image: KITE_IMG.story5, number: "№005", left: "HEADLINE", right: "FASHION WEEK", text: `${STORY}. Placeholder text helps maintain...` },
  ],
};

const VISUALIZE = "Temporarily used to fill a space where actual content will eventually appear. It serves as a visual placeholder to help designers and developers visualize";

export const kiteAboutSchema: SectionSchema = {
  type: "KITE_ABOUT",
  label: "About",
  description: "Where the clothes are made, in script, beside a tall portrait with words printed on it.",
  category: "Content",
  fields: [
    ...head("XVIII", "ABOUT US"),
    { key: "before", kind: "text", label: "Before the line", info: "In Khand, left of the short rule.", default: "CRAFTED" },
    { key: "after", kind: "text", label: "After the line", info: "Right of the rule.", default: "IN" },
    { key: "place", kind: "text", label: "Place", info: "The script line.", default: "Paris, France" },
    { key: "text", kind: "textarea", label: "Words", info: "Centred under the place.", default: `${VISUALIZE}....` },
    { key: "image", kind: "image", label: "Small photograph", info: "Under the words, on the desktop.", default: KITE_IMG.aboutHands },
    { key: "linkLabel", kind: "text", label: "Link words", info: "Underlined, last.", default: "LEARN MORE" },
    { key: "link", kind: "url", label: "Link", info: "Where they go.", default: "" },
    { key: "portrait", kind: "image", label: "Portrait", info: "The tall photograph.", default: KITE_IMG.aboutPortrait },
    { key: "portraitText", kind: "textarea", label: "Words on the portrait", info: "Printed small in black at its top left. Leave empty for none.", default: `${VISUALIZE} . ${VISUALIZE} . ${VISUALIZE}.` },
    { key: "signature", kind: "text", label: "Signature", info: "In script at the portrait's foot, on the desktop.", default: "Martin Schleifer" },
  ],
};

export const kiteUpcomingSchema: SectionSchema = {
  type: "KITE_UPCOMING",
  label: "Upcoming",
  description: "An event, centred among six photographs.",
  category: "Content",
  fields: [
    ...head("XVIIII", "UPCOMING"),
    { key: "eyebrow", kind: "text", label: "Above", info: "Small, over the event.", default: "SPECIALS" },
    { key: "before", kind: "text", label: "Before the line", info: "In Khand.", default: "NEW YORK FASHION" },
    { key: "after", kind: "text", label: "After the line", info: "", default: "WEEK" },
    { key: "with", kind: "text", label: "With", info: "The script line.", default: "w/ Ralph Lauren" },
    { key: "text", kind: "textarea", label: "Words", info: "Under the double rule.", default: "Placeholder text helps maintain the structure and appearance of the layout while the content is being developed. Here’s an extra line to create some length difference." },
    { key: "linkLabel", kind: "text", label: "Link words", info: "Underlined, last.", default: "LEARN MORE" },
    { key: "link", kind: "url", label: "Link", info: "Where they go.", default: "" },
    ...[1, 2, 3, 4, 5, 6].map((i) => ({
      key: `image${i}`,
      kind: "image" as const,
      label: `Photograph ${i}`,
      info: "Its place is the design's; the photograph is yours.",
      default: KITE_IMG[`upcoming${i}` as keyof typeof KITE_IMG],
    })),
  ],
};

export const kiteJourneySchema: SectionSchema = {
  type: "KITE_JOURNEY",
  label: "Journey",
  description: "A tall photograph between two lines of type turned on their side.",
  category: "Media",
  fields: [
    { key: "heading", kind: "text", label: "Over the photograph", info: "In script.", default: "Fashion Fades, Style is Eternal" },
    { key: "image", kind: "image", label: "Photograph", info: "Tall; it runs on under the start of the footer.", default: KITE_IMG.journey },
    { key: "left", kind: "text", label: "Left, turned", info: "Read upwards, at the photograph's left.", default: "A JOURNEY" },
    { key: "right", kind: "text", label: "Right, turned", info: "Read upwards, at its right.", default: "THROUGH TIME" },
    { key: "caption", kind: "textarea", label: "Caption", info: "Small, on the photograph near its foot.", default: "Temporarily used to fill a space where actual content will eventually appear. It serves as a visual placeholder to help designers and developers visualize." },
  ],
};
