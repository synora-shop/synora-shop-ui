"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, ExternalLink, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  chooseTheme,
  installTheme,
  removeTheme,
  updateTheme,
} from "@/app/admin/theme/actions-theme-choice";
import { Section } from "@/components/admin/panel";
import { StorefrontStill } from "@/components/admin/storefront-still";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export type ManagedTheme = {
  key: string;
  name: string;
  description: string;
  /** What this shop has, for a theme it owns. */
  version?: string;
  /** What the platform ships. Ahead of `version` means an update is waiting. */
  latest: string;
  /** Where this theme can be seen running, full size. */
  previewUrl: string;
  /** A photograph of it, shipped with the theme. */
  preview?: string;
  installed: boolean;
  /** "Sep 5 at 10:35 pm", for the themes that are. */
  addedAt?: string;
};

/**
 * Three sections: what is live, what this shop owns, and what exists.
 *
 * The order is the order a merchant thinks about them, and it matters more
 * than it sounds. Before the library existed this screen had one list and one
 * button, and that button changed the live storefront — so browsing six designs
 * was one press away from putting an untried one in front of customers.
 *
 * Adding and activating are separate acts, and nothing in the store can go live
 * in one press.
 */
export function ThemeManager({
  themes,
  current,
  storeHost,
}: {
  themes: ManagedTheme[];
  current: string;
  storeHost: string;
}) {
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const live = themes.find((t) => t.key === current);
  const owned = themes.filter((t) => t.installed);
  const store = themes.filter((t) => !t.installed);

  function run(key: string, action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setBusyKey(key);
    setMenuKey(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error ?? "That didn't work.", { blocking: true });
      setBusyKey(null);
    });
  }

  const busy = (key: string) => pending && busyKey === key;

  return (
    <>
      {dialog}

      {/* ----------------------------------------------------------------- */}
      {/* 1 — what customers are looking at right now                        */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Active Theme">
        {live ? (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[calc(720*var(--u))] overflow-hidden rounded-xl border border-section-line bg-panel">
              {live.preview ? (
                <Image
                  src={live.preview}
                  alt={`${live.name} on your storefront`}
                  width={1440}
                  height={900}
                  className="h-auto w-full"
                  priority
                />
              ) : (
                // No shipped picture, so the shop itself stands in — a live
                // frame of the merchant's own storefront wearing this theme.
                // Better than a placeholder by some distance: it is the only
                // preview that answers "what would MY shop look like", which
                // is the question being asked.
                <StorefrontStill url={live.previewUrl} height={450} />
              )}
            </div>

            {/* The shop's own address on the left, the theme on the right.
                Both are answers to "what am I looking at" — one names the
                place, the other names the design. */}
            <div className="mt-[var(--gap-lg)] flex w-full max-w-[calc(720*var(--u))] flex-wrap items-baseline justify-between gap-3">
              <a
                href={live.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[length:calc(24*var(--u))] font-semibold text-control-ink transition-colors hover:text-brand-500"
              >
                {storeHost}
              </a>
              <p className="text-[length:var(--text-secondary)] text-control-ink">
                {live.name} &ndash; v{live.version ?? live.latest}
                {live.addedAt && (
                  <span className="text-control-soft">{"  "}(Added: {live.addedAt})</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[length:var(--text-secondary)] text-control-soft">
            No theme is active yet.
          </p>
        )}
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 2 — everything this shop owns                                      */}
      {/* ----------------------------------------------------------------- */}
      <Section title="All Themes">
        {owned.length === 0 ? (
          <p className="text-[length:var(--text-secondary)] text-control-soft">
            You have not added a theme yet. There are some below.
          </p>
        ) : (
          <ul>
            {owned.map((theme, i) => {
              const isLive = theme.key === current;
              const outOfDate = theme.version !== undefined && theme.version !== theme.latest;
              return (
                <li
                  key={theme.key}
                  className={cn(
                    "flex items-center gap-[var(--gap-lg)]",
                    // A rule between rows, never above the first or below the
                    // last: a line at the edge of a list reads as the edge of
                    // the container, which is already drawn.
                    i > 0 && "border-t border-section-line"
                  )}
                >
                  <div className="h-[calc(108*var(--u))] w-[calc(171*var(--u))] flex-shrink-0 overflow-hidden rounded-lg border border-section-line bg-panel">
                    {theme.preview && (
                      <Image
                        src={theme.preview}
                        alt=""
                        width={342}
                        height={216}
                        className="h-full w-full object-cover object-top"
                      />
                    )}
                  </div>

                  {/* The live row is a plate, and it is the row rather than a
                      badge on it: which theme is live is the one thing this
                      list is asked, so it is answered by the whole row. */}
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-wrap items-center gap-x-[var(--gap-lg)] gap-y-2 rounded-lg px-[calc(20*var(--u))] py-[calc(20*var(--u))]",
                      isLive && "bg-[#d2ffd6]"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[length:var(--text-normal)] font-semibold text-control-ink">
                        {theme.name}{" "}
                        <span className="font-normal text-control-soft">(v{theme.version})</span>
                      </p>
                      {theme.addedAt && (
                        <p className="mt-1 truncate text-[length:var(--text-secondary)] text-control-soft">
                          Added: {theme.addedAt}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-[calc(10*var(--u))]">
                      {outOfDate && (
                        <RowButton
                          onClick={() => run(theme.key, () => updateTheme(theme.key))}
                          busy={busy(theme.key)}
                          className="border-transparent bg-selected text-brand-500"
                        >
                          Update
                        </RowButton>
                      )}

                      {isLive ? (
                        <span className="flex items-center gap-2 text-[length:var(--text-secondary)] font-medium text-[#037f1d]">
                          <Check className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                          Active
                        </span>
                      ) : (
                        <RowButton
                          onClick={() => run(theme.key, () => chooseTheme(theme.key))}
                          busy={busy(theme.key)}
                        >
                          Activate
                        </RowButton>
                      )}

                      <RowButton href={`/admin/customize/theme?theme=${theme.key}`}>
                        <Pencil className="h-[calc(16*var(--u))] w-[calc(16*var(--u))]" />
                        Edit Theme
                      </RowButton>

                      {/* Everything that is not one of the two things a
                          merchant does here. Removing lives behind it because
                          it is the only one that cannot be undone. */}
                      <div className="relative">
                        <button
                          type="button"
                          aria-label={`More for ${theme.name}`}
                          aria-expanded={menuKey === theme.key}
                          onClick={() => setMenuKey((k) => (k === theme.key ? null : theme.key))}
                          className="flex h-[calc(35*var(--u))] w-[calc(35*var(--u))] items-center justify-center rounded-full text-control-soft transition-colors hover:bg-panel hover:text-control-ink"
                        >
                          <MoreHorizontal className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                        </button>
                        {menuKey === theme.key && (
                          <>
                            <button
                              type="button"
                              aria-label="Close menu"
                              onClick={() => setMenuKey(null)}
                              className="fixed inset-0 z-40 cursor-default"
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-control-line bg-panel shadow-lg">
                              <a
                                href={theme.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setMenuKey(null)}
                                className="flex items-center gap-2 px-3 py-2 text-[length:var(--text-secondary)] transition-colors hover:bg-control"
                              >
                                <ExternalLink className="h-4 w-4 text-control-soft" />
                                Preview on your shop
                              </a>
                              {!isLive && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setMenuKey(null);
                                    const ok = await confirm({
                                      title: `Remove ${theme.name}?`,
                                      description:
                                        "Your changes to this theme are removed with it. Adding it again starts from the theme's own design.",
                                      confirmLabel: "Remove",
                                      danger: true,
                                    });
                                    if (ok) run(theme.key, () => removeTheme(theme.key));
                                  }}
                                  className="flex w-full items-center gap-2 border-t border-control-line px-3 py-2 text-[length:var(--text-secondary)] transition-colors hover:bg-rose-bg hover:text-rose"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove from your themes
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 3 — what exists                                                    */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Theme Store">
        {store.length === 0 ? (
          <p className="text-[length:var(--text-secondary)] text-control-soft">
            You have every theme made for this kind of store. More are being designed.
          </p>
        ) : (
          <ul className="grid gap-[var(--gap-lg)] lg:grid-cols-2">
            {store.map((theme) => (
              <li
                key={theme.key}
                className="flex flex-col overflow-hidden rounded-2xl border border-section-line bg-panel"
              >
                <div className="relative flex-1 p-[calc(10*var(--u))]">
                  <div className="overflow-hidden rounded-xl bg-control">
                    {theme.preview ? (
                      <Image
                        src={theme.preview}
                        alt={`${theme.name} storefront`}
                        width={1420}
                        height={896}
                        className="h-auto w-full"
                      />
                    ) : (
                      <StorefrontStill url={theme.previewUrl} height={448} />
                    )}
                  </div>
                  <a
                    href={theme.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${theme.name} full size`}
                    className="absolute right-[calc(20*var(--u))] top-[calc(20*var(--u))] flex h-[calc(30*var(--u))] w-[calc(30*var(--u))] items-center justify-center rounded-full bg-panel/90 text-control-ink shadow-panel transition-transform hover:-translate-y-px"
                  >
                    <ExternalLink className="h-[calc(15*var(--u))] w-[calc(15*var(--u))]" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-[calc(20*var(--u))] pb-[calc(20*var(--u))]">
                  <p className="text-[length:var(--text-normal)] font-semibold text-control-ink">
                    {theme.name}{" "}
                    <span className="font-normal text-control-soft">(v{theme.latest})</span>
                  </p>
                  <div className="flex items-center gap-[calc(10*var(--u))]">
                    <button
                      type="button"
                      onClick={() => run(theme.key, () => installTheme(theme.key))}
                      disabled={busy(theme.key)}
                      className="flex h-[calc(35*var(--u))] items-center gap-1.5 rounded-lg bg-ink px-[calc(16*var(--u))] text-[length:var(--text-secondary)] font-medium text-white transition-transform hover:-translate-y-px disabled:opacity-60"
                    >
                      {busy(theme.key) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add
                    </button>
                    <RowButton href={theme.previewUrl} external>
                      Preview
                    </RowButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

/**
 * One action on a row or a card: 35px, outlined, its own container.
 *
 * The action bar has no container and neither does a row — each button carries
 * its own, which is what the global design document specifies and why they are
 * all the same shape whatever they sit on.
 */
function RowButton({
  children,
  onClick,
  href,
  external,
  busy,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  busy?: boolean;
  className?: string;
}) {
  const shape = cn(
    "flex h-[calc(35*var(--u))] items-center gap-1.5 rounded-lg border border-control-line bg-panel px-[calc(14*var(--u))] text-[length:var(--text-secondary)] text-control-ink transition-colors hover:border-brand-500 hover:text-brand-500 disabled:opacity-60",
    className
  );

  if (href) {
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className={shape}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={busy} className={shape}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
