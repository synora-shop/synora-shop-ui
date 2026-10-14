/**
 * The help desk's vocabulary (14 October), shared by /help, the Synora
 * console and the emails. Pure data: safe to import from the browser.
 *
 * Two kinds of request travel the same road. A ticket is a problem and ends
 * resolved or closed; a suggestion is an idea and ends shipped or declined.
 * The database keeps one status list (prisma HelpStatus); this file says which
 * statuses belong to which kind and what each is called to the person waiting.
 */

export type HelpKindName = "TICKET" | "SUGGESTION";
export type HelpStatusName =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING"
  | "RESOLVED"
  | "CLOSED"
  | "UNDER_REVIEW"
  | "PLANNED"
  | "SHIPPED"
  | "DECLINED";

export const KIND_LABEL: Record<HelpKindName, string> = { TICKET: "Ticket", SUGGESTION: "Suggestion" };

/** In the order a request moves through them. */
export const STATUSES: Record<HelpKindName, HelpStatusName[]> = {
  TICKET: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],
  SUGGESTION: ["OPEN", "UNDER_REVIEW", "PLANNED", "SHIPPED", "DECLINED"],
};

const LABEL: Record<HelpKindName, Partial<Record<HelpStatusName, string>>> = {
  TICKET: { OPEN: "Open", IN_PROGRESS: "Being worked on", WAITING: "Waiting on you", RESOLVED: "Resolved", CLOSED: "Closed" },
  SUGGESTION: { OPEN: "Received", UNDER_REVIEW: "Being considered", PLANNED: "Planned", SHIPPED: "Shipped", DECLINED: "Not planned" },
};

export function statusLabel(kind: HelpKindName, status: HelpStatusName): string {
  return LABEL[kind][status] ?? status.replace("_", " ").toLowerCase();
}

/** One sentence the sender reads under the status: what it means for them. */
const MEANING: Record<HelpKindName, Partial<Record<HelpStatusName, string>>> = {
  TICKET: {
    OPEN: "We have it, and someone will pick it up soon.",
    IN_PROGRESS: "Someone on the Synora team is working on it.",
    WAITING: "We have asked you something. Reply below to keep it moving.",
    RESOLVED: "We think this is fixed. Reply if it is not.",
    CLOSED: "This is finished.",
  },
  SUGGESTION: {
    OPEN: "We have it, and the team reads every one.",
    UNDER_REVIEW: "The team is weighing it up.",
    PLANNED: "It is on the list to build.",
    SHIPPED: "It is live. Thank you for the idea.",
    DECLINED: "Not something we will build for now. The reply says why.",
  },
};

export function statusMeaning(kind: HelpKindName, status: HelpStatusName): string {
  return MEANING[kind][status] ?? "";
}

/** Finished: nothing more will happen unless someone writes again. */
export function isClosed(status: HelpStatusName): boolean {
  return status === "RESOLVED" || status === "CLOSED" || status === "SHIPPED" || status === "DECLINED";
}

/** Pill colours, in Synora's palette; state colours only for the ends. */
export const STATUS_TONE: Record<HelpStatusName, string> = {
  OPEN: "bg-[#ecebff] text-[#4b4bea]",
  IN_PROGRESS: "bg-[#c8e7ff] text-[#0d0d50]",
  WAITING: "bg-[#fff1d6] text-[#7a4b00]",
  RESOLVED: "bg-[#b8efd6] text-[#0f5c3e]",
  CLOSED: "bg-[#eeeef3] text-[#0d0d50]/60",
  UNDER_REVIEW: "bg-[#c8e7ff] text-[#0d0d50]",
  PLANNED: "bg-[#b7b9ff] text-[#0d0d50]",
  SHIPPED: "bg-[#b8efd6] text-[#0f5c3e]",
  DECLINED: "bg-[#eeeef3] text-[#0d0d50]/60",
};

/** What a request can be about. Matches the documentation's topics. */
export const TOPICS = ["Getting started", "Products", "Orders", "Payments", "Domains", "Your team", "Discounts", "Something else"] as const;

export const LIMITS = { subject: 120, body: 5000, reply: 5000 } as const;

/** "#1042" */
export const ref = (n: number) => `#${n}`;
