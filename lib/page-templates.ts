// Starting points for a new page.
//
// A blank page is a bad default: it gives you nothing to react to, and the
// first thing anyone does is add the same two or three sections anyway. Each
// template below is a real, filled-in page you can edit down, in the spirit of
// how the homepage already seeds itself with working content rather than
// placeholders.
//
// Client-safe: pure data, no Prisma. The section `data` here is deliberately
// partial — resolveSectionData() fills in every setting the schema defines, so
// a template never has to be updated when a section gains an option.

export type PageTemplate = {
  key: string;
  name: string;
  description: string;
  /** Suggested slug; the create action makes it unique if it's taken. */
  suggestedSlug: string;
  sections: { type: string; data: Record<string, unknown> }[];
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    key: "blank",
    name: "Blank",
    description: "One empty text block. Build it up yourself.",
    suggestedSlug: "new-page",
    sections: [{ type: "TEXT_BLOCK", data: { heading: "New page", body: "" } }],
  },
  {
    key: "about",
    name: "About",
    description: "Your story, a photo beside some text, and a closing statement.",
    suggestedSlug: "about-us",
    sections: [
      {
        type: "TEXT_BLOCK",
        data: {
          heading: "About us",
          body: "Tell customers who you are and why you started. A short paragraph does more than a long one.",
          textAlign: "center",
        },
      },
      {
        type: "IMAGE_TEXT",
        data: {
          heading: "How we make things",
          body: "Describe your fabrics, your workshop, the people who make each piece.",
          imagePosition: "left",
        },
      },
      {
        type: "STORY",
        data: {
          heading: "Made in Pakistan",
          body: "Close with what you want remembered.",
          ctaLabel: "Shop the collection",
          ctaHref: "/shop",
        },
      },
    ],
  },
  {
    key: "contact",
    name: "Contact",
    description: "How to reach you, with common questions underneath.",
    suggestedSlug: "contact-us",
    sections: [
      {
        type: "TEXT_BLOCK",
        data: {
          heading: "Get in touch",
          body: "The fastest way to reach us is WhatsApp. We usually reply within a few hours.",
          textAlign: "center",
        },
      },
      {
        type: "FAQ_LIST",
        data: {
          heading: "Before you write",
          items: [
            { question: "Where is my order?", answer: "Sign in and open Order History, or message us with your order number." },
            { question: "Do you ship outside Pakistan?", answer: "Tell customers what you do here." },
          ],
        },
      },
    ],
  },
  {
    key: "size-guide",
    name: "Size guide",
    description: "A measurements table as expandable questions, plus how to measure.",
    suggestedSlug: "size-guide",
    sections: [
      {
        type: "TEXT_BLOCK",
        data: {
          heading: "Size guide",
          body: "All measurements are in inches and refer to the garment, not the body.",
          textAlign: "center",
        },
      },
      {
        type: "IMAGE_TEXT",
        data: {
          heading: "How to measure",
          body: "Bust: around the fullest part.\nWaist: around the narrowest part.\nLength: from the shoulder seam down.",
          imagePosition: "right",
        },
      },
      {
        type: "FAQ_LIST",
        data: {
          heading: "Sizes",
          items: [
            { question: "Small", answer: "Bust 36  ·  Waist 32  ·  Length 40" },
            { question: "Medium", answer: "Bust 38  ·  Waist 34  ·  Length 41" },
            { question: "Large", answer: "Bust 40  ·  Waist 36  ·  Length 42" },
            { question: "Extra large", answer: "Bust 42  ·  Waist 38  ·  Length 43" },
          ],
        },
      },
    ],
  },
  {
    key: "lookbook",
    name: "Lookbook",
    description: "A full-width hero, then collections and featured pieces.",
    suggestedSlug: "lookbook",
    sections: [
      {
        type: "HERO_SLIDESHOW",
        data: {
          height: "medium",
          slides: [{ eyebrow: "Lookbook", headline: "This season", subheading: "", ctaLabel: "", ctaHref: "" }],
        },
      },
      { type: "CATEGORY_GRID", data: { heading: "Shop by category" } },
      { type: "FEATURED_PRODUCTS", data: { heading: "Pieces we love" } },
    ],
  },
];

export function getPageTemplate(key: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.key === key);
}
