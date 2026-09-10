"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { chooseTheme, installTheme, removeTheme } from "@/app/admin/theme/actions-theme-choice";
import { Badge, Button, ButtonLink, CardTitle, SectionDivider, buttonClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { StorefrontStill } from "@/components/admin/storefront-still";
import { cn } from "@/lib/utils";

export type GalleryTheme = {
  key: string;
  name: string;
  description: string;
  /** Where this theme can be seen running, full size. */
  previewUrl: string;
  /** A photograph of it, shipped with the theme. */
  preview?: string;
  /** Whether this shop has added it. */
  installed: boolean;
  /** When, for the themes that are. */
  installedAt?: string;
};

/**
 * The store as it looks now, the themes it owns, and the ones it could add.
 *
 * Three zones, in the order a merchant thinks about them, and the order matters
 * more than it sounds. Before this the screen had one list and one button, and
 * that button changed the live storefront — so browsing six designs was one
 * click away from putting an untried one in front of customers.
 *
 * Now adding and publishing are separate acts. **Your themes** is a library:
 * things this shop owns, that can be previewed and customised for as long as
 * you like without a single customer seeing them. **Discover** is a catalogue.
 * Nothing in the catalogue can go live in one press.
 *
 * The live previews are still stills, not windows — they do not scroll and
 * cannot be clicked. Scrolling around inside a small frame is the worst of both,
 * and a merchant who wants to move around has a button that opens the real
 * thing at its real address.
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
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const live = themes.find((t) => t.key === current);
  const library = themes.filter((t) => t.installed && t.key !== current);
  const discover = themes.filter((t) => !t.installed);

  function run(key: string, work: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    if (pending) return;
    setBusyKey(key);
    startTransition(async () => {
      const result = await work();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error ?? "That didn't work.");
      setBusyKey(null);
    });
  }

  async function unpublishSafeRemove(theme: GalleryTheme) {
    const sure = await confirm({
      title: `Remove ${theme.name}?`,
      description:
        "It goes back to Discover, and any colours or layout you changed on it are kept — adding it again brings them back. Your live store is not affected.",
      confirmLabel: "Remove it",
      danger: true,
    });
    if (!sure) return;
    run(theme.key, () => removeTheme(theme.key));
  }

  return (
    <div className="space-y-10">
      {dialog}

      {/* ------------------------------------------------- 1. what is live -- */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {/* A div, not a p. CardTitle renders an h2, and an h2 inside a p
                is invalid HTML — the browser reparents it, so the server tree
                and the client tree stop matching and React throws a hydration
                error on every load of this screen. */}
            <div className="flex items-center gap-2">
              <CardTitle>{live?.name ?? "Your store"}</CardTitle>
              <Badge tone="good">
                <Check className="h-3 w-3" />
                Live
              </Badge>
            </div>
            <p className="mt-1 truncate text-xs text-ink-soft">{storeUrl}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <a href={storeUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
              Open store
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
            <ButtonLink href="/admin/customize" variant="primary" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Customize
            </ButtonLink>
          </div>
        </div>
        <StorefrontStill url={storeUrl} height={400} />
      </section>

      {/* ---------------------------------------------- 2. what it owns -- */}
      <section className="space-y-4">
        <SectionDivider
          title="Your themes"
          description="Added to this store but not published. Customise one for as long as you like — nobody sees it until you publish it."
        />

        {library.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-ink-soft">
            Nothing here yet. Add a theme from below to try it without changing your store.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {library.map((theme) => {
              const busy = busyKey === theme.key;
              return (
                <li key={theme.key} className="flex flex-wrap items-center gap-4 p-4">
                  <ThemeThumb theme={theme} className="h-16 w-28 flex-shrink-0" />

                  <div className="min-w-0 flex-1">
                    <CardTitle as="h3">{theme.name}</CardTitle>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {theme.installedAt ? `Added ${theme.installedAt}` : theme.description}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    <a
                      href={theme.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClass("secondary", "sm")}
                    >
                      Preview
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => run(theme.key, () => chooseTheme(theme.key))}
                      disabled={pending}
                    >
                      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                      {busy ? "Publishing…" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${theme.name}`}
                      onClick={() => unpublishSafeRemove(theme)}
                      disabled={pending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------- 3. what exists -- */}
      {discover.length > 0 && (
        <section className="space-y-4">
          <SectionDivider
            title="Discover themes"
            description="Adding one puts it in your themes above. It does not change your store — publishing is a separate step."
          />

          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {discover.map((theme) => {
              const busy = busyKey === theme.key;
              return (
                <li key={theme.key} className="flex flex-col gap-3">
                  <a
                    href={theme.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="lift group block overflow-hidden rounded-xl border border-border bg-surface"
                  >
                    <ThemeThumb theme={theme} className="aspect-[4/3] w-full" />
                  </a>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle as="h3">{theme.name}</CardTitle>
                      <p className="mt-0.5 text-xs leading-snug text-ink-soft">{theme.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => run(theme.key, () => installTheme(theme.key))}
                      disabled={pending}
                      className="flex-shrink-0"
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      {busy ? "Adding…" : "Add"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * A theme's picture.
 *
 * The shipped photograph when there is one, and a live frame of the merchant's
 * own storefront when there is not — which is what every theme had before these
 * existed, and is still right for the ones that have no picture yet.
 */
function ThemeThumb({ theme, className }: { theme: GalleryTheme; className?: string }) {
  if (theme.preview) {
    return (
      <div className={cn("overflow-hidden rounded-lg bg-subtle", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static file of known path, sized by its box */}
        <img
          src={theme.preview}
          alt={`${theme.name} theme`}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }
  return <StorefrontStill url={theme.previewUrl} height={200} className={cn("rounded-lg", className)} />;
}
