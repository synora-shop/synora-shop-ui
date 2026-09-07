"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, ScrollText } from "lucide-react";
import { addPolicyPage } from "@/app/admin/pages/actions";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { POLICY_PAGES } from "@/lib/policy-pages";

/**
 * The three pages every shop is eventually asked for.
 *
 * Offered rather than created with the store, because each one arrives as a
 * draft the merchant has to read. A privacy policy nobody has read, published
 * on a live storefront, is a promise nobody made.
 */
export function PolicyPages({
  existing,
}: {
  /** Which of the three this shop already has, by key, and where they live. */
  existing: Record<string, { id: string; isPublished: boolean }>;
}) {
  const [adding, setAdding] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function add(key: string) {
    setAdding(key);
    startTransition(async () => {
      const result = await addPolicyPage(key);
      setAdding(null);
      if ("error" in result) {
        toast.error(result.error, { blocking: true });
        return;
      }
      toast.success("Added as a draft. Read it through before you publish it.");
      router.refresh();
    });
  }

  return (
    <ul className="grid gap-2.5 sm:grid-cols-3">
      {POLICY_PAGES.map((policy) => {
        const have = existing[policy.key];
        return (
          <li
            key={policy.key}
            className="flex flex-col rounded-xl border border-border bg-surface p-3.5"
          >
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <ScrollText className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" aria-hidden />
              {policy.title}
            </p>
            <p className="mt-1 flex-1 text-xs leading-snug text-ink-soft">{policy.summary}</p>
            <div className="mt-2.5">
              {have ? (
                <Link
                  href={`/admin/pages/${have.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  <Check className="h-3.5 w-3.5 text-green" />
                  {have.isPublished ? "Added" : "Draft — read it, then publish"}
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => add(policy.key)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {adding === policy.key ? "Adding…" : "Add"}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
