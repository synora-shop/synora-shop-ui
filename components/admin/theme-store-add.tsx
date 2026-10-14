"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { installTheme } from "@/app/admin/theme/actions-theme-choice";

/**
 * Arriving from the Theme Store's "Add to my store" (14 October): the theme
 * they picked, waiting for one click. Nothing is added by opening the link
 * (a link must not change anything); the button adds a copy to the library,
 * not live, exactly as Add does further down this page.
 */
export function ThemeStoreAdd({ themeKey, name, already }: { themeKey: string; name: string; already: number }) {
  const router = useRouter();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div role="status" className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-control-line bg-container px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
      <p>
        {done ??
          (already > 0
            ? `You already have ${name}. Add another copy to try changes without touching the first?`
            : `Add ${name} from the Theme Store to your themes? It won't go live until you publish it.`)}
        {error && <span className="ml-1 text-rose">{error}</span>}
      </p>
      {!done && (
        <Button
          variant="primary"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await installTheme(themeKey);
              if (!r.ok) return setError(r.error);
              setDone(`${r.message ?? `${name} was added.`} Preview or publish it below.`);
              router.refresh();
            })
          }
        >
          {pending ? "Adding…" : already > 0 ? "Add another copy" : `Add ${name}`}
        </Button>
      )}
    </div>
  );
}
