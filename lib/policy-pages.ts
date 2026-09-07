/**
 * The three pages every shop is eventually asked for.
 *
 * Returns, privacy and terms. A merchant either writes them from a blank page
 * or copies somebody else's, and both are worse than starting from a draft
 * that names the decisions they have to make.
 *
 * They are *not* created with the store, and they arrive unpublished. A blank
 * privacy policy on a live storefront is worse than no page at all: it reads
 * as a promise nobody made. So each one is added deliberately, sits as a draft
 * until the merchant has been through it, and says so at the top of itself.
 *
 * The text is a starting point written in plain words, with every decision the
 * merchant has to make left in square brackets. It is deliberately not written
 * to look finished, and it is not legal advice — a policy that reads as though
 * a lawyer wrote it, when none did, is the dangerous kind of placeholder.
 *
 * Client-safe: pure data.
 */

export type PolicyPage = {
  /** Stable name, stored on the page so it cannot be added twice. */
  key: "returns" | "privacy" | "terms";
  title: string;
  slug: string;
  /** What it is for, in the merchant's terms, on the button that adds it. */
  summary: string;
  heading: string;
  body: string;
};

const REVIEW =
  "This is a starting point, not a finished policy. Read every line, replace anything in [square brackets], and delete whatever does not apply to you. Check it against the law where you trade before you publish it.\n\n";

export const POLICY_PAGES: PolicyPage[] = [
  {
    key: "returns",
    title: "Returns and refunds",
    slug: "returns",
    summary: "What a customer can send back, by when, and who pays the postage.",
    heading: "Returns and refunds",
    body:
      REVIEW +
      "**How long you have**\n\nYou can return anything within [14] days of it arriving, as long as it is unused and in its original packaging.\n\n" +
      "**How to start a return**\n\nEmail [your address] with your order number and what you would like to return. We will reply with where to send it.\n\n" +
      "**Who pays the postage**\n\n[We cover return postage / Return postage is yours to pay], unless the item arrived damaged or is not what you ordered, in which case we cover it.\n\n" +
      "**When you get your money back**\n\nOnce your return reaches us and we have checked it, we refund to the original payment method within [5] working days.\n\n" +
      "**What cannot be returned**\n\n[Made-to-order items, pierced jewellery, anything sealed for hygiene — list yours, and remove this line if everything can be returned.]\n\n" +
      "**If something arrives damaged**\n\nSend a photograph to [your address] within [48 hours] and we will replace it or refund you in full, including postage.",
  },
  {
    key: "privacy",
    title: "Privacy",
    slug: "privacy",
    summary: "What you collect about a customer, why, and who else sees it.",
    heading: "Privacy",
    body:
      REVIEW +
      "**What we collect**\n\nWhen you place an order we collect your name, delivery address, email address and phone number. We collect these because we cannot deliver an order without them.\n\n" +
      "**What we do not collect**\n\nWe never see or store your card details. Payment is handled by [your payment provider], who take the payment and tell us only whether it succeeded.\n\n" +
      "**Who else sees your details**\n\n[Your courier], so they can deliver your order. [Your email provider], so we can send you an order confirmation. Nobody else, and we never sell anything to anybody.\n\n" +
      "**How long we keep it**\n\nOrder records are kept for [7] years because [tax rules where you trade] require it. Everything else is deleted when you ask.\n\n" +
      "**Your choices**\n\nEmail [your address] to see what we hold about you, correct it, or have it deleted. We will reply within [30] days.\n\n" +
      "**Cookies**\n\nWe use the cookies that make a shop work — remembering your basket, and keeping you signed in. [Add any others you use, and remove this if you use none.]",
  },
  {
    key: "terms",
    title: "Terms of service",
    slug: "terms",
    summary: "The agreement between you and a customer when they buy.",
    heading: "Terms of service",
    body:
      REVIEW +
      "**Who we are**\n\n[Your registered business name], trading as [your shop name], at [your address].\n\n" +
      "**Ordering**\n\nAn order is an offer to buy. It becomes an agreement when we confirm it by email. We may decline an order — if something is out of stock, or if we cannot deliver where you are — and we will refund you in full if we do.\n\n" +
      "**Prices**\n\nPrices are in [your currency] and include [tax / exclude tax, added at checkout]. If we have priced something wrongly by an obvious mistake, we will tell you before dispatch and you can cancel.\n\n" +
      "**Delivery**\n\nWe aim to dispatch within [2] working days. Delivery times are estimates given to us by [your courier], not promises.\n\n" +
      "**Returns**\n\nSee our returns page for how to send something back.\n\n" +
      "**If something goes wrong**\n\nEmail [your address] first. Most things are settled in a message. Nothing here removes rights the law gives you as a consumer.\n\n" +
      "**Which law applies**\n\nThese terms are governed by the law of [where you trade].",
  },
];

export function policyPage(key: string): PolicyPage | undefined {
  return POLICY_PAGES.find((p) => p.key === key);
}
