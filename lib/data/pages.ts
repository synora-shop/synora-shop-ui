import type { Prisma } from "@/lib/generated/prisma/client";
import { db, currentShopId } from "@/lib/data/shop";

// Default homepage sections — reproduces the previously-hardcoded homepage
// exactly, so the very first render after this migration looks identical.
// Created lazily on first read (see getOrCreateHomePage) rather than via a
// separate seed step, matching this repo's "DEFAULTS fallback" convention
// used by getStoreSettings — except here we persist it so it's editable.
const DEFAULT_HOME_SECTIONS: Omit<Prisma.SectionCreateWithoutPageInput, "shop">[] = [
  {
    type: "HERO_SLIDESHOW",
    order: 0,
    data: {
      slides: [
        {
          image: "",
          eyebrow: "New Season",
          headline: "Everyday elegance, made for you",
          subheading:
            "Lawn, formal and unstitched collections designed in Pakistan for the modern woman.",
          ctaLabel: "Shop the Collection",
          ctaHref: "/shop",
        },
      ],
    },
  },
  { type: "CATEGORY_GRID", order: 1, data: { heading: "Shop by Category" } },
  { type: "FEATURED_PRODUCTS", order: 2, data: { heading: "Best Sellers" } },
  {
    type: "STORY",
    order: 3,
    data: {
      heading: "Our story",
      // Placeholder copy for a brand-new store. Written to be obviously
      // replaceable and to demonstrate the section's shape — a merchant should
      // read this and know exactly what belongs here, without it ever having
      // looked like it was written for someone else's shop.
      body: "This is where you tell people who you are. A couple of sentences on what you make, who you make it for, and why you started is usually enough. You can edit this text, and everything else on this page, in the customizer.",
      ctaLabel: "Read our story",
      ctaHref: "/about",
    },
  },
];

// About/FAQ default sections — same "reproduce the old hardcoded page
// exactly" cutover strategy as the homepage. Minor style differences vs.
// the old static pages (centered vs. left-aligned) are an accepted
// trade-off of moving them onto the shared section renderers.
const DEFAULT_ABOUT_SECTIONS: Omit<Prisma.SectionCreateWithoutPageInput, "shop">[] = [
  {
    type: "TEXT_BLOCK",
    order: 0,
    data: {
      heading: "Our story",
      body: "Tell your story here. Most shoppers who reach this page are already interested, they want to know who is behind the shop, how it started, and what you care about.\n\nA good About page is short, specific and written in your own voice. Say what you make, name the people or places behind it, and skip anything that could be said by any other shop.\n\nEdit this page in the customizer, or delete it if you'd rather not have one.",
    },
  },
];

const DEFAULT_FAQ_SECTIONS: Omit<Prisma.SectionCreateWithoutPageInput, "shop">[] = [
  {
    type: "FAQ_LIST",
    order: 0,
    data: {
      heading: "Frequently Asked Questions",
      items: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept Cash on Delivery (COD), Bank Transfer, JazzCash and EasyPaisa. Choose your preferred method at checkout.",
        },
        {
          question: "How long does delivery take?",
          answer: "Orders within Pakistan typically arrive within 3-7 business days depending on your city.",
        },
        {
          question: "Can I return or exchange an item?",
          answer: "Yes, reach out to us on WhatsApp within 3 days of delivery to arrange a return or exchange.",
        },
        {
          question: "How do I track my order?",
          answer: "Sign in to your account and visit Order History, or message us on WhatsApp with your Order ID.",
        },
      ],
    },
  },
];

const pageWithSections = {
  include: { sections: { orderBy: { order: "asc" as const } } },
} satisfies Prisma.PageDefaultArgs;

export type PageWithSections = Prisma.PageGetPayload<typeof pageWithSections>;

async function getOrCreatePage(
  slug: string,
  title: string,
  defaultSections: Omit<Prisma.SectionCreateWithoutPageInput, "shop">[],
  isSystem: boolean
): Promise<PageWithSections> {
  const existing = await (await db()).page.findFirst({ where: { slug }, ...pageWithSections });
  if (existing) return existing;

  // Sections are created nested, so they need the shop named explicitly — the
  // scoping extension stamps the page but cannot reach inside a nested create.
  const sid = await currentShopId();

  try {
    return await (await db()).page.create({
      data: {
        shopId: sid,
        slug,
        title,
        isSystem,
        sections: { create: defaultSections.map((x) => ({ ...x, shopId: sid })) },
      },
      ...pageWithSections,
    });
  } catch {
    // Lost a create race against a concurrent first request — the row exists now.
    const page = await (await db()).page.findFirst({ where: { slug }, ...pageWithSections });
    if (!page) throw new Error(`Failed to load page "${slug}"`);
    return page;
  }
}

export async function getOrCreateHomePage(): Promise<PageWithSections> {
  return getOrCreatePage("home", "Homepage", DEFAULT_HOME_SECTIONS, true);
}

export async function getOrCreateAboutPage(): Promise<PageWithSections> {
  return getOrCreatePage("about", "Our Story", DEFAULT_ABOUT_SECTIONS, true);
}

export async function getOrCreateFaqPage(): Promise<PageWithSections> {
  return getOrCreatePage("faq", "FAQs", DEFAULT_FAQ_SECTIONS, true);
}

export async function getPageBySlug(slug: string): Promise<PageWithSections | null> {
  return (await db()).page.findFirst({ where: { slug }, ...pageWithSections });
}

export async function getPageById(id: string): Promise<PageWithSections | null> {
  return (await db()).page.findUnique({ where: { id }, ...pageWithSections });
}

export async function getAllPages() {
  return (await db()).page.findMany({
    orderBy: { createdAt: "asc" },
    include: { category: true },
  });
}

// Client-safe constants (DEFAULT_SECTION_DATA, SECTION_TYPE_LABELS) live in
// lib/section-types.ts, not here — this file imports the Prisma client.
