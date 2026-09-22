"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AddIcon } from "@/components/admin/nav-icons";
import { ExternalLinkIcon } from "@/components/ui/synora-marks";
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

/** One copy of a theme in this shop's library. */
export type ThemeCopy = {
  id: string;
  themeKey: string;
  name: string;
  preview?: string;
  /** The version this copy is at. */
  version: string;
  /** What the platform ships. Ahead of `version` means an update is waiting. */
  latest: string;
  /** "Sep 5 at 10:35 pm". */
  addedAt: string;
  previewUrl: string;
};

/** A theme in the store. Offered whether or not the shop already has copies. */
export type StoreTheme = {
  key: string;
  name: string;
  description: string;
  preview?: string;
  latest: string;
  /** How many copies this shop already holds. */
  owned: number;
  previewUrl: string;
};

/**
 * Three sections: what is live, what this shop owns, and what exists.
 *
 * **A shop owns copies, not themes.** Add makes a copy every time, so the
 * library can hold KITE at v1.1.1 and KITE at v1.0.4 at once — each with its
 * own edits, each activatable, the older one offering Update. That is the point
 * of a library: a design being worked on, beside the one serving customers,
 * with neither standing in the other's way.
 *
 * Everything here is addressed by copy id. Two copies of KITE are both KITE, so
 * a theme key cannot say which design a button means — and a key that saved to
 * "the theme" would write a merchant's draft colours onto the storefront, which
 * is the failure the library exists to prevent.
 *
 * The order is the order a merchant thinks about them, and it matters more than
 * it sounds. Before the library existed this screen had one list and one
 * button, and that button changed the live storefront — so browsing six designs
 * was one press away from putting an untried one in front of customers.
 */
export function ThemeManager({
  copies,
  store,
  liveId,
  liveKey,
  storeHost,
}: {
  copies: ThemeCopy[];
  store: StoreTheme[];
  liveId: string | null;
  liveKey: string;
  storeHost: string;
}) {
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  // The live copy, or — for a shop running a theme it holds no copy of — the
  // theme alone. Both are real states and the section has to render either.
  const live = copies.find((c) => c.id === liveId) ?? null;
  const liveTheme = live ?? store.find((t) => t.key === liveKey) ?? null;

  function run(id: string, action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setBusyKey(id);
    setMenuKey(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error ?? "That didn't work.", { blocking: true });
      setBusyKey(null);
    });
  }

  const busy = (id: string) => pending && busyKey === id;

  return (
    <>
      {dialog}

      {/* ----------------------------------------------------------------- */}
      {/* 1 — what customers are looking at right now                        */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Active Theme">
        {liveTheme ? (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[calc(720*var(--u))] overflow-hidden rounded-[var(--radius-container)] border border-section-line bg-panel">
              {liveTheme.preview ? (
                <Image
                  src={liveTheme.preview}
                  alt={`${liveTheme.name} on your storefront`}
                  width={1440}
                  height={900}
                  className="h-auto w-full"
                  priority
                />
              ) : (
                // No shipped picture, so the shop itself stands in — a live
                // frame of the merchant's own storefront wearing this design.
                // The only preview that answers "what would MY shop look like".
                <StorefrontStill url={liveTheme.previewUrl} height={450} />
              )}
            </div>

            {/* The shop's own address on the left, the design on the right.
                Both answer "what am I looking at" — one names the place, the
                other names the design, down to which copy of it. */}
            <div className="mt-[var(--gap-lg)] flex w-full max-w-[calc(720*var(--u))] flex-wrap items-baseline justify-between gap-3">
              <a
                href={liveTheme.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[length:calc(24*var(--u))] font-semibold text-control-ink transition-colors hover:text-brand-500"
              >
                {storeHost}
              </a>
              <p className="text-[length:var(--text-secondary)] text-control-ink">
                {liveTheme.name} &ndash; v{live?.version ?? liveTheme.latest}
                {live && (
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
      {/* 2 — every copy this shop holds                                     */}
      {/* ----------------------------------------------------------------- */}
      <Section title="All Themes">
        {copies.length === 0 ? (
          <p className="text-[length:var(--text-secondary)] text-control-soft">
            You have not added a theme yet. There are some below.
          </p>
        ) : (
          <ul>
            {copies.map((copy, i) => {
              const isLive = copy.id === liveId;
              const outOfDate = copy.version !== copy.latest;
              return (
                <li
                  key={copy.id}
                  // 144 tall with a 108 thumbnail centred in it, which is what
                  // puts 37 between one preview and the next. The rows had no
                  // height of their own, so the thumbnails stacked nearly
                  // touching and the list read as one smeared block.
                  className="flex h-[calc(144*var(--u))] items-center gap-[var(--gap-lg)]"
                >
                  <div className="h-[calc(108*var(--u))] w-[calc(171*var(--u))] flex-shrink-0 overflow-hidden rounded-[var(--radius-inner)] border border-section-line bg-panel">
                    {copy.preview && (
                      <Image
                        src={copy.preview}
                        alt=""
                        width={342}
                        height={216}
                        className="h-full w-full object-cover object-top"
                      />
                    )}
                  </div>

                  {/* The live row is a plate, and it is the row rather than a
                      badge on it: which design is live is the one thing this
                      list is asked, so the whole row answers it.
                      
                      The rule sits on this block rather than the <li>, so it
                      starts where the content starts and not under the
                      thumbnail — which is how the guide draws it. Never above
                      the first: a line at the edge of a list reads as the edge
                      of the container, and that is already drawn. */}
                  <div
                    className={cn(
                      // 95 tall inside the 144 row, 20 of padding, as marked.
                      "flex h-[calc(95*var(--u))] min-w-0 flex-1 items-center gap-x-[var(--gap-lg)] rounded-[var(--radius-control)] px-[calc(20*var(--u))]",
                      i > 0 && !isLive && "border-t border-section-line",
                      isLive && "bg-[#d2ffd6]"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[length:var(--text-normal)] font-semibold text-control-ink">
                        {copy.name}{" "}
                        <span className="font-normal text-control-soft">(v{copy.version})</span>
                      </p>
                      <p className="mt-1 truncate text-[length:var(--text-secondary)] text-control-soft">
                        Added: {copy.addedAt}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-[calc(10*var(--u))]">
                      {outOfDate && (
                        <RowButton
                          onClick={() => run(copy.id, () => updateTheme(copy.id))}
                          busy={busy(copy.id)}
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
                          onClick={() => run(copy.id, () => chooseTheme(copy.id))}
                          busy={busy(copy.id)}
                        >
                          Activate
                        </RowButton>
                      )}

                      <RowButton href={`/admin/customize/theme?theme=${copy.id}`}>
                        <Pencil className="h-[calc(16*var(--u))] w-[calc(16*var(--u))]" />
                        Edit Theme
                      </RowButton>

                      {/* Everything that is not one of the two things a
                          merchant does here. Removing lives behind it because
                          it is the only one that cannot be undone. */}
                      <div className="relative">
                        <button
                          type="button"
                          aria-label={`More for ${copy.name} v${copy.version}`}
                          aria-expanded={menuKey === copy.id}
                          onClick={() => setMenuKey((k) => (k === copy.id ? null : copy.id))}
                          className="flex h-[calc(35*var(--u))] w-[calc(35*var(--u))] items-center justify-center rounded-full text-control-soft transition-colors hover:bg-panel hover:text-control-ink"
                        >
                          <MoreHorizontal className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                        </button>
                        {menuKey === copy.id && (
                          <>
                            <button
                              type="button"
                              aria-label="Close menu"
                              onClick={() => setMenuKey(null)}
                              className="fixed inset-0 z-40 cursor-default"
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-[var(--radius-container)] border border-control-line bg-panel shadow-lg">
                              <a
                                href={copy.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setMenuKey(null)}
                                className="flex items-center gap-2 px-3 py-2 text-[length:var(--text-secondary)] transition-colors hover:bg-control"
                              >
                                <ExternalLinkIcon className="h-[var(--icon-box)] w-[var(--icon-box)] text-control-soft" />
                                Preview on your shop
                              </a>
                              {!isLive && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setMenuKey(null);
                                    const ok = await confirm({
                                      title: `Remove this copy of ${copy.name}?`,
                                      description:
                                        "Your changes to this copy go with it. Your other copies are untouched.",
                                      confirmLabel: "Remove",
                                      danger: true,
                                    });
                                    if (ok) run(copy.id, () => removeTheme(copy.id));
                                  }}
                                  className="flex w-full items-center gap-2 border-t border-control-line px-3 py-2 text-[length:var(--text-secondary)] transition-colors hover:bg-rose-bg hover:text-rose"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove this copy
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
            No themes are made for this kind of store yet.
          </p>
        ) : (
          <ul className="grid gap-[var(--gap-lg)] lg:grid-cols-2">
            {store.map((theme) => (
              <li
                key={theme.key}
                className="flex flex-col overflow-hidden rounded-[var(--radius-container)] border border-section-line bg-panel"
              >
                <div className="relative flex-1 p-[calc(10*var(--u))]">
                  {/* 10 in from a 16 corner is a 6 corner. Two curves of different
                      centres a hair apart is the uneven border you see at every
                      seam once you have noticed it once. */}
                  <div className="overflow-hidden rounded-[var(--radius-inner)] bg-control">
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
                    <ExternalLinkIcon className="h-[calc(15*var(--u))] w-[calc(15*var(--u))]" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-[calc(20*var(--u))] pb-[calc(20*var(--u))]">
                  <p className="text-[length:var(--text-normal)] font-semibold text-control-ink">
                    {theme.name}{" "}
                    <span className="font-normal text-control-soft">(v{theme.latest})</span>
                    {/* Said quietly, and said. Add makes another copy, so a
                        merchant pressing it on something they already have has
                        not made a mistake — but they should know before the
                        toast tells them afterwards. */}
                    {theme.owned > 0 && (
                      <span className="ml-2 font-normal text-control-soft">
                        · {theme.owned} in your themes
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-[calc(10*var(--u))]">
                    <button
                      type="button"
                      onClick={() => run(theme.key, () => installTheme(theme.key))}
                      disabled={busy(theme.key)}
                      className="flex h-[calc(35*var(--u))] items-center gap-1.5 rounded-[var(--radius-control)] bg-ink px-[calc(16*var(--u))] text-[length:var(--text-secondary)] font-medium text-white transition-transform hover:-translate-y-px disabled:opacity-60"
                    >
                      {busy(theme.key) ? (
                        <Loader2 className="h-[var(--icon-box)] w-[var(--icon-box)] animate-spin" />
                      ) : (
                        <AddIcon className="h-[var(--icon-box)] w-[var(--icon-box)]" />
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
    "flex h-[calc(35*var(--u))] items-center gap-1.5 rounded-[var(--radius-control)] border border-control-line bg-panel px-[calc(14*var(--u))] text-[length:var(--text-secondary)] text-control-ink transition-colors hover:border-brand-500 hover:text-brand-500 disabled:opacity-60",
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
