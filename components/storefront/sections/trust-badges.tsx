import { BadgeCheck, CreditCard, Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { COLS_CLASS } from "./grid-classes";

const ICONS = {
  truck: Truck,
  returns: RotateCcw,
  shield: ShieldCheck,
  badge: BadgeCheck,
  support: Headphones,
  card: CreditCard,
} as const;

type Badge = { icon?: string; title?: string; text?: string };

/**
 * Short promises with a mark beside each.
 *
 * A fixed set of icons rather than an upload. Six line drawings that match each
 * other say "this shop is careful"; six logos a merchant found on the internet
 * say the opposite, and there is no way to make the second look like the first.
 */
export function TrustBadges({
  heading,
  badges,
  columns = 4,
}: {
  heading?: string;
  badges?: Badge[];
  columns?: number;
}) {
  const shown = (badges ?? []).filter((b) => b.title?.trim());
  if (shown.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="mb-8 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className={`grid grid-cols-2 gap-x-6 gap-y-8 ${COLS_CLASS[columns] ?? COLS_CLASS[4]}`}>
        {shown.map((badge, i) => {
          const Icon = ICONS[(badge.icon ?? "truck") as keyof typeof ICONS] ?? Truck;
          return (
            <div key={i} className="flex flex-col items-center gap-2 text-center">
              <Icon className="h-6 w-6 text-brand-600" aria-hidden />
              <p className="text-sm font-medium text-ink">{badge.title}</p>
              {badge.text && <p className="text-xs leading-snug text-ink-soft">{badge.text}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
