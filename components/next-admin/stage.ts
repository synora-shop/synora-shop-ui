import type { Order, Stage } from "@/lib/new-admin/sample";
import type { Tone } from "@/components/next-admin/ui";

/** Each stage's dot. Pending waits on you, so it is the one in amber. */
export const STAGE_TONE: Record<Stage, Tone> = {
  Pending: "wait", Confirmed: "info", Packed: "info", Shipped: "info", Delivered: "good", Cancelled: "off",
};

/** Whether the money is in. */
export const payState = (o: Order): { tone: Tone; label: string } =>
  o.paid ? { tone: "good", label: "Paid" } : o.stage === "Cancelled" ? { tone: "off", label: "Not paid" } : { tone: "wait", label: o.payment === "Cash on delivery" ? "To collect" : "Awaiting payment" };
