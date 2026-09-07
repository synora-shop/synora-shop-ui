"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { chooseTheme } from "@/app/admin/theme/actions-theme-choice";
import { useToast } from "@/components/ui/toast";
import { Badge, Button, ButtonLink, CardTitle, SectionDivider, buttonClass } from "@/components/ui/primitives";
import { StorefrontStill } from "@/components/admin/storefront-still";
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
    <div className="space-y-2.5">
      {/* 1. The store as it stands. */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            <CardTitle>Your store right now</CardTitle>
            <p className="truncate text-xs text-ink-soft">{storeUrl}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("secondary", "sm")}
            >
              Open store
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
            {/* 4. The main way in. */}
            <ButtonLink href="/admin/customize" variant="primary" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Customize
            </ButtonLink>
          </div>
        </div>
        <StorefrontStill url={storeUrl} height={380} />
      </section>

      {/* 2 and 3. What else it could wear, and switching to it. */}
      <section className="space-y-2.5">
        <SectionDivider
          title="Available themes"
          description="Each one is shown running on your own products, not on a stock screenshot. Switching keeps your colours, fonts and content — only the layout changes."
        />

        <ul className="grid gap-3 sm:grid-cols-2">
          {themes.map((theme) => {
            const active = theme.key === current;
            const busy = changing === theme.key;
            return (
              <li
                key={theme.key}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border bg-surface",
                  active ? "border-green ring-1 ring-green" : "border-border"
                )}
              >
                {/* A theme is a look. Choosing between two paragraphs of prose
                    is choosing blind, so each card shows the merchant's own
                    shop wearing it. */}
                <StorefrontStill url={theme.previewUrl} height={200} className="border-b border-border" />

                <div className="flex flex-1 flex-col p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle as="h3">{theme.name}</CardTitle>
                      <p className="mt-0.5 text-xs text-ink-soft">{theme.description}</p>
                    </div>
                    {active && (
                      // Green because it reports a state, not because it is
                      // important. The accent colour is the store's, and using it
                      // for "this one is on" leaves nothing to tell a merchant
                      // apart from a button they could press.
                      <Badge tone="good" className="flex-shrink-0">
                        <Check className="h-3 w-3" />
                        In use
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={theme.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClass("secondary", "sm")}
                    >
                      View full
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                    {!active && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => activate(theme.key)}
                        disabled={pending}
                      >
                        {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                        {busy ? "Activating…" : "Activate"}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
