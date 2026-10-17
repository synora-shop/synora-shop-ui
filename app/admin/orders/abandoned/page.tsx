import { PageHeader } from "@/components/ui/primitives";
import { Figures } from "@/components/admin/kit";
import { AbandonedList } from "@/components/admin/abandoned-list";
import { db } from "@/lib/data/shop";
import { getCurrency } from "@/lib/data/settings";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { STEP_LABEL, abandonedWindow, cartSummary, maskPhone, type DraftLineView } from "@/lib/abandoned";

export const dynamic = "force-dynamic";

/**
 * Abandoned checkouts (new admin, 15 October).
 *
 * Everyone who reached checkout, gave a way to reach them, and stopped: saved
 * by the storefront's checkouts as they were filled in (lib/checkout-draft.ts),
 * marked recovered when an order followed. A checkout counts as abandoned once
 * it has been quiet for half an hour, so somebody still typing is not on the
 * list. The four figures are the design's: how many this week, what they were
 * worth, how many came back after a reminder, and the step most of them
 * stopped at.
 */
export default async function AbandonedCheckoutsPage() {
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const scoped = await db();
  const { quietSince, weekAgo } = abandonedWindow();

  const [rows, week, reminded, cameBack] = await Promise.all([
    scoped.checkoutDraft.findMany({
      where: { recoveredOrderId: null, updatedAt: { lt: quietSince } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    scoped.checkoutDraft.findMany({
      where: { recoveredOrderId: null, updatedAt: { lt: quietSince, gte: weekAgo } },
      select: { subtotal: true, step: true },
    }),
    scoped.checkoutDraft.count({ where: { remindedAt: { not: null } } }),
    scoped.checkoutDraft.count({ where: { remindedAt: { not: null }, recoveredOrderId: { not: null } } }),
  ]);

  const steps = week.reduce<Record<string, number>>((m, d) => ({ ...m, [d.step]: (m[d.step] ?? 0) + 1 }), {});
  const top = Object.entries(steps).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="space-y-4">
      <PageHeader title="Abandoned checkouts" description="People who reached checkout and stopped. A friendly reminder brings many back." />
      <Figures
        items={[
          { label: "Left this week", value: String(week.length) },
          { label: "Worth", value: money(week.reduce((n, d) => n + d.subtotal, 0)) },
          {
            label: "Came back after a reminder",
            value: String(cameBack),
            delta: reminded > 0 ? `${Math.round((cameBack / reminded) * 100)}%` : null,
          },
          { label: "Most left at", value: top ? STEP_LABEL[top] ?? top : "Nobody yet" },
        ]}
      />
      <AbandonedList
        rows={rows.map((d) => {
          const lines = (d.lines as DraftLineView[]) ?? [];
          return {
            id: d.id,
            who: d.name || "Guest",
            contact: d.phone ? maskPhone(d.phone) : d.email,
            cart: cartSummary(lines),
            when: formatRelativeTime(d.updatedAt),
            total: money(d.subtotal),
            reminded: d.remindedAt ? formatRelativeTime(d.remindedAt) : null,
            channel: d.email ? "email" : "whatsapp",
          };
        })}
      />
    </div>
  );
}
