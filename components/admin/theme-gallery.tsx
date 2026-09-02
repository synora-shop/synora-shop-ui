"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { chooseTheme } from "@/app/admin/theme/actions-theme-choice";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type GalleryTheme = {
  key: string;
  name: string;
  description: string;
  /** Where this theme can be seen running, full size. */
  previewUrl: string;
};

/**
 * The store as it looks now, and the themes it could wear instead.
 *
 * The preview does not scroll. It is a photograph of the front page, not a
 * second place to browse the shop — a merchant who wants to move around it has
 * a button that opens the real thing, at its real address, in its own tab.
 * Scrolling inside a small frame is the worst of both.
 */
export function ThemeGallery({
  themes,
  current,
  storeUrl,
}: {
  themes: GalleryTheme[];
  current: string;
  storeUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [changing, setChanging] = useState<string | null>(null);
  const toast = useToast();

  function activate(key: string) {
    if (key === current || pending) return;
    setChanging(key);
    startTransition(async () => {
      await chooseTheme(key);
      toast.success("Theme activated");
      setChanging(null);
    });
  }

  return (
    <div className="space-y-5">
      {/* 1. The store as it stands. */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Your store right now</h2>
            <p className="truncate text-xs text-ink-soft">{storeUrl}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-subtle"
            >
              Open store
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
            {/* 4. The main way in. */}
            <Link
              href="/admin/customize"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white shadow-brand transition-colors hover:bg-brand-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Customize
            </Link>
          </div>
        </div>
        {/* Fixed height and pointer-events off: a still, not a window. */}
        <div className="relative h-64 overflow-hidden bg-subtle sm:h-80">
          <iframe
            src={storeUrl}
            title="Your storefront"
            loading="lazy"
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-[1200px] w-[1440px] origin-top-left border-0"
            style={{ transform: "scale(0.42)" }}
          />
        </div>
      </section>

      {/* 2 and 3. What else it could wear, and switching to it. */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Available themes</h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Switching keeps your colours, fonts and content. Only the layout changes.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {themes.map((theme) => {
            const active = theme.key === current;
            const busy = changing === theme.key;
            return (
              <li
                key={theme.key}
                className={cn(
                  "flex flex-col rounded-xl border bg-surface p-3.5",
                  active ? "border-brand-500 ring-1 ring-brand-500" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{theme.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{theme.description}</p>
                  </div>
                  {active && (
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Check className="h-3 w-3" />
                      In use
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={theme.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-subtle"
                  >
                    View full
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                  {!active && (
                    <button
                      type="button"
                      onClick={() => activate(theme.key)}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                    >
                      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                      {busy ? "Activating…" : "Activate"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
