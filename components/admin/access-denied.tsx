import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import type { MemberRole } from "@/lib/auth-guard";

/**
 * "You can see this page exists, but you can't use it."
 *
 * Rendered by the page itself rather than thrown, because a thrown error
 * reaches the browser as an opaque digest in production and a refusal would
 * look identical to a crash. It also says which level is needed and which one
 * you have — without that, the only way to find out is to ask someone.
 */
export function AccessDenied({
  needs,
  have,
  what,
}: {
  needs: MemberRole;
  have: MemberRole;
  /** What the page is for, in a noun phrase: "manage who works here". */
  what: string;
}) {
  return (
    <div className="mx-auto max-w-lg py-12">
      <Card className="p-6 text-center">
        <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          You don&rsquo;t have access to this
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          It takes {needs.toLowerCase()} access to {what}. You have {have.toLowerCase()} access,
          ask an admin of this store if you need more.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-subtle"
        >
          Back to dashboard
        </Link>
      </Card>
    </div>
  );
}
