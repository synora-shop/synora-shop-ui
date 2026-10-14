import { Globe, Package, ReceiptText, Rocket, Tag, Users, Wallet, type LucideIcon } from "lucide-react";
import { ROLE_DESCRIPTION } from "@/lib/roles";
import type { SearchItem } from "@/components/platform/help-search";

/**
 * What the documentation says (14 October), in one place: /docs draws it,
 * /help shows the known issues beside its form, and the search reads all of
 * it. Short versions, written to be true today; every step and feature named
 * is one the panel has. The full guides replace them later.
 */

export type Tone = "iris" | "lavender" | "sky" | "mint";
export const TONE: Record<Tone, string> = {
  iris: "bg-[#6666ff] text-white",
  lavender: "bg-[#b7b9ff] text-[#0d0d50]",
  sky: "bg-[#c8e7ff] text-[#0d0d50]",
  mint: "bg-[#b8efd6] text-[#0d0d50]",
};

/** A topic card's header: its colour, lightly. */
export const TINT: Record<Tone, string> = {
  iris: "bg-[#ecebff]",
  lavender: "bg-[#f1f0ff]",
  sky: "bg-[#e8f4ff]",
  mint: "bg-[#e4f7ee]",
};

export type Topic = {
  id: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  blurb: string;
  steps?: string[];
  points?: [string, string][];
};

export const DOC_TOPICS: Topic[] = [
  {
    id: "getting-started",
    icon: Rocket,
    tone: "iris",
    title: "Getting started",
    blurb: "Open your shop in four steps. No card needed.",
    steps: [
      "Create your account with your name, email, a password and your shop's name. Your free address is made from the shop's name.",
      "Open the confirmation email and tap the link. Nothing arrived after a few minutes? Check spam, or ask for a new link.",
      "Add your first product: a title, a price in rupees, photos, and sizes or colours if it comes in them.",
      "Pick a theme, choose how you take payment, and share your address.",
    ],
  },
  {
    id: "products",
    icon: Package,
    tone: "lavender",
    title: "Products",
    blurb: "Sizes, colours, stock, and selling in bulk.",
    points: [
      ["Sizes and colours", "Add the options once and every combination gets its own price and stock."],
      ["Stock", "Keep a count for each size and colour, and choose whether a product keeps selling once it runs out."],
      ["Bulk products", "Sell by quantity with price breaks, a price range, or “ask for a price”, where customers send you an enquiry instead."],
      ["Coming from Shopify", "Bring your products over from a Shopify product export file, descriptions and SEO included."],
    ],
  },
  {
    id: "orders",
    icon: ReceiptText,
    tone: "sky",
    title: "Orders",
    blurb: "What happens when somebody buys.",
    points: [
      ["A new order", "It appears in your panel straight away, and an email about it goes to your shop's notification address."],
      ["Your customer", "They get a confirmation email with a private link to their order, so they can check it without an account."],
      ["Order notes", "Anything the customer wrote at checkout shows on the order."],
    ],
  },
  {
    id: "payments",
    icon: Wallet,
    tone: "mint",
    title: "Payments",
    blurb: "Cash on delivery, wallets and cards.",
    points: [
      ["Cash on delivery", "Customers pay when the order arrives. The way most of Pakistan still buys online."],
      ["JazzCash and Easypaisa", "Customers pay from their mobile wallet at checkout."],
      ["Cards through PayFast", "Connect your PayFast account and customers can pay by card."],
      ["When an order counts as paid", "Only once the payment provider confirms it, never just because the customer came back from the payment page."],
    ],
  },
  {
    id: "domains",
    icon: Globe,
    tone: "iris",
    title: "Domains",
    blurb: "Your free address, and your own.",
    points: [
      ["Your free address", "Every shop gets one the moment it is created, like yourshop.app.synoradigitals.com."],
      ["Your own domain", "Add it in the panel, put the records it shows you at your domain company, then press Check now."],
      ["Which address is main", "Your own domain becomes your main address once it is live. The free one keeps working and sends people to it."],
    ],
  },
  {
    id: "team",
    icon: Users,
    tone: "lavender",
    title: "Your team",
    blurb: "Invite people, and choose what they can do.",
    points: [
      ["Owner", ROLE_DESCRIPTION.OWNER],
      ["Admin", ROLE_DESCRIPTION.ADMIN],
      ["Staff", ROLE_DESCRIPTION.STAFF],
      ["Viewer", ROLE_DESCRIPTION.VIEWER],
      ["Invitations", "An invitation is good for seven days. Inviting the same person again sends a fresh link."],
    ],
  },
  {
    id: "discounts",
    icon: Tag,
    tone: "sky",
    title: "Discounts",
    blurb: "Codes for Eid, sales and regulars.",
    points: [
      ["Discount codes", "Make a code like EID25 for a percentage off, an amount off, or free shipping."],
      ["Dates", "Give it a start and an end, and it switches itself on and off."],
      ["Limits", "Cap how many times a code can be used, in total or per customer."],
    ],
  },
];

/** [what is broken, what to do instead]. */
export const KNOWN_ISSUES: [string, string][] = [
  [
    "No order notes box in the Loom and Kite checkouts",
    "Ask customers to send gift messages or special instructions on WhatsApp or through your contact page until the box is added.",
  ],
];

export const ANSWERS: [string, string][] = [
  ["Do I need a card to start?", "No. You can open your shop and add products without one."],
  ["I didn't get the confirmation email.", "Check your spam folder first. Then use “Send a new link” on the confirm page; a new link replaces the old one."],
  ["Can I change my free address later?", "Yes, and you can connect your own domain whenever you are ready."],
  ["Can I move my shop from Shopify?", "Yes. Export your products from Shopify and import the file into your panel."],
];

/** Everything above, as entries for the search (components/platform/help-search.tsx). */
export function docsSearchItems(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const t of DOC_TOPICS) {
    items.push({ group: "Docs", title: t.title, text: t.blurb, href: `/docs#${t.id}` });
    for (const s of t.steps ?? []) items.push({ group: "Docs", title: t.title, text: s, href: `/docs#${t.id}` });
    for (const [term, def] of t.points ?? []) items.push({ group: "Docs", title: term, text: def, href: `/docs#${t.id}` });
  }
  for (const [q, a] of ANSWERS) items.push({ group: "Answers", title: q, text: a, href: "/docs#answers" });
  for (const [t, d] of KNOWN_ISSUES) items.push({ group: "Known issues", title: t, text: d, href: "/help#known-issues" });
  items.push(
    { group: "Help", title: "Report a problem", text: "Open a ticket with the Synora team and follow it here.", href: "/help?kind=ticket#ask" },
    { group: "Help", title: "Suggest an idea", text: "Tell us what would make your shop easier to run.", href: "/help?kind=suggestion#ask" },
    { group: "Help", title: "Your tickets and suggestions", text: "Everything you have sent, and where each one is.", href: "/help#history" }
  );
  return items;
}

/** What the search shows before anything is typed. */
export function suggestedSearchItems(): SearchItem[] {
  const all = docsSearchItems();
  const pick = (title: string) => all.find((i) => i.title === title);
  return [pick("Getting started"), pick("JazzCash and Easypaisa"), pick("Your own domain"), pick("I didn't get the confirmation email."), pick("Report a problem")].filter(
    (i): i is SearchItem => !!i
  );
}
