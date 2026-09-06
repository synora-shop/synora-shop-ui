import { SearchX } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";

/**
 * What a list says when it has nothing to show.
 *
 * Two different situations that were being answered with the same sentence.
 *
 * A list with nothing in it *yet* is an invitation: the merchant has not made
 * their first product, and what they need is the button that makes one.
 *
 * A list emptied by a search or a filter is a dead end: there is plenty here,
 * just not this. What they need is the way back — and without it the screen
 * looks broken, because the rows they know exist have vanished with no
 * explanation on screen.
 *
 * Telling a merchant "No products here" in both cases answers neither.
 */
export function ListEmpty({
  filtered,
  basePath,
  thing,
  icon,
  action,
}: {
  /** True when a search or filter is what emptied it. */
  filtered: boolean;
  /** Where to go to drop every filter — the list's own address. */
  basePath: string;
  /** Plural, lower case: "products", "orders", "files". */
  thing: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** What to offer when the list is genuinely empty — usually "Add …". */
  action?: React.ReactNode;
}) {
  if (filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No ${thing} match this`}
        description="There may be more here — this search or filter is hiding them."
        action={
          <ButtonLink href={basePath} variant="secondary" size="sm">
            Clear search and filters
          </ButtonLink>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={icon}
      title={`No ${thing} yet`}
      description={`Whatever you add will appear here.`}
      action={action}
    />
  );
}
