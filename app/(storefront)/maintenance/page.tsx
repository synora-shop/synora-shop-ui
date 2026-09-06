import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { storefrontClosure, type ClosedReason } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // A shut store must not be indexed in this state. Without this, a shop that
  // pauses for a week can find its search results replaced by this notice.
  robots: { index: false, follow: false },
};

/**
 * What a visitor is told, per reason.
 *
 * Each says what happened and what to do next. "We'll be right back" is right
 * for ten minutes of maintenance and wrong for a store that has closed for
 * good — someone waiting on a delivery from a closed store needs to know to
 * get in touch, not to check back later.
 */
const MESSAGES: Record<ClosedReason, { title: string; body: string }> = {
  maintenance: {
    title: "We'll be right back",
    body: "This store is having some quick updates. Please check back shortly, thank you for your patience.",
  },
  paused: {
    title: "We're not taking orders right now",
    body: "This store has paused sales for a little while. Everything will be here when it reopens.",
  },
  closed: {
    title: "This store has closed",
    body: "It's no longer taking orders. If you're waiting on an order, contact the store directly and they'll be able to help.",
  },
  suspended: {
    title: "This store is unavailable",
    body: "It isn't accepting orders at the moment. Please try again later.",
  },
  blocked: {
    title: "Not available here",
    body: "This store does not currently serve customers in your country.",
  },
};

export default async function MaintenancePage() {
  const reason = await storefrontClosure();
  // Nothing holding it shut — send visitors who land here back to a working
  // store rather than showing a notice about a problem that has gone away.
  if (!reason) redirect("/");

  const { title, body } = MESSAGES[reason];

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-serif text-3xl font-semibold text-balance text-ink">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">{body}</p>
    </Container>
  );
}
