"use client";

import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";

/**
 * The admin's last resort when a page throws.
 *
 * Deliberately generic. It is tempting to inspect the error and explain it, but
 * in production Next.js replaces the message, stack and name of a server error
 * with an opaque digest before it ever reaches the browser — so any branch on
 * `error.message` here would be dead code that only ever worked in development.
 *
 * Refusals are therefore handled where they happen: a page that a viewer may
 * not open renders <AccessDenied> itself rather than throwing into this.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-12">
      <Card className="p-6 text-center">
        <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-bg text-amber">
          <AlertTriangle className="h-5 w-5" />
        </span>

        <h1 className="font-serif text-2xl font-semibold text-ink">This page didn&rsquo;t load</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          Trying again usually fixes it. If it keeps happening, send us the reference below and
          we&rsquo;ll find it in the logs.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" onClick={reset}>
            <RotateCw className="h-4 w-4" />
            Try again
          </Button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-subtle"
          >
            Back to dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-ink-faint">Reference: {error.digest}</p>
        )}
      </Card>
    </div>
  );
}
