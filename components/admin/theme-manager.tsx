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
  previewUrl: string;
  /** The coloured plate this theme sits on, as two gradient stops. */
  plate: { from: string; to: string };
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
  storeUrl,
}: {
  copies: ThemeCopy[];
  store: StoreTheme[];
  liveId: string | null;
  liveKey: string;
  storeHost: string;
  /**
   * The shop's own live address.
   *
   * Section 1 uses this rather than the live theme's own `previewUrl`, and the
   * distinction is the whole of what "Preview" means in three places. Section 1
   * is the live site, so it is the address itself — no `?__theme=` override,
   * which would render the same page while implying it was a preview. Section 2
   * is a copy the shop owns, so it is the shop with that copy on. Section 3 is
   * a theme nobody owns yet, so it is our demo. See docs/PANEL.md §2.
   *
   * It also closes a real hole: on a shop running a theme it holds no copy of,
   * `liveTheme` falls back to the *store card*, whose previewUrl is now a demo
   * on our servers — so "your storefront" would have linked to someone else's
   * shop window.
   */
  storeUrl: string;
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
            <div className="w-full max-w-[calc(892.5*var(--u))] overflow-hidden rounded-[var(--radius-section)] border border-section-line bg-panel">
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
                <StorefrontStill url={storeUrl} height={450} />
              )}
            </div>

            {/* The shop's own address on the left, the design on the right.
                Both answer "what am I looking at" — one names the place, the
                other names the design, down to which copy of it. */}
            <div className="mt-[var(--gap-lg)] flex w-full max-w-[calc(892.5*var(--u))] flex-wrap items-baseline justify-between gap-3">
              <a
                href={storeUrl}
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
                  <div className="h-[calc(108*var(--u))] w-[calc(171*var(--u))] flex-shrink-0 overflow-hidden rounded-[var(--radius-thumb)] border border-section-line bg-panel">
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

                  {/* A separator above every row but the first — above the
                      live one too, because the drawing puts the green plate
                      between two lines rather than in place of one. There was
                      no separator at all: the condition excluded the live row,
                      and with two themes in a library the live one is half of
                      them.
                      
                      On this column, so it starts where the content starts and
                      never runs under the thumbnail. On the full-height
                      wrapper, so it lands in the gap rather than on the plate.
                      Never above the first: a line at the edge of a list reads
                      as the edge of the container, which is already drawn.
                      
                      #2e2e2e at a quarter of a pixel, which no browser will
                      draw — so the quarter is carried by the alpha, the way
                      every other hairline in the panel is. */}
                  <div
                    className={cn(
                      "flex h-full min-w-0 flex-1 items-center",
                      i > 0 && "border-t border-section-line"
                    )}
                  >
                    <div
                      className={cn(
                        // 95 tall inside the 144 row, 20 of padding, as marked.
                        "flex h-[calc(95*var(--u))] w-full min-w-0 items-center gap-x-[var(--gap-lg)] rounded-[var(--radius-plate)] px-[calc(20*var(--u))]",
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
                          className="flex h-[var(--row-button-h)] w-[var(--row-button-h)] items-center justify-center rounded-full text-control-soft transition-colors hover:bg-panel hover:text-control-ink"
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
                                  <Trash2 className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                                  Remove this copy
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
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
                // 730.6 x 533.7, and the plate is the card. The picture sits
                // on it inset by 10, with a 75 band beneath carrying the name
                // and the two buttons — every number read off the artboard.
                //
                // The plate is a gradient from Synora's own accent palette,
                // not from the theme's colours: the store is a Synora screen
                // showing what is on offer. The plate says "this is a theme";
                // the picture on it says which one.
                className="flex aspect-[730.6/533.7] flex-col rounded-[var(--radius-card)] px-[var(--pad-container)] pt-[var(--pad-container)] shadow-card"
                style={{
                  backgroundImage: `linear-gradient(180deg, ${theme.plate.from} 0%, ${theme.plate.to} 100%)`,
                }}
              >
                <div className="min-h-0 flex-1">
                  {/* 10 in from a 46 corner is a 36 corner — which is what the
                      drawing has, so the subtraction is the design's rather
                      than a rule imposed on it.
                      
                      Nothing sits on the picture. There was a disc in this
                      corner opening the theme full size, and Preview below
                      already does exactly that — two controls for one job, one
                      of them unlabelled. */}
                  <div className="h-full overflow-hidden rounded-[var(--radius-card-inner)] bg-panel">
                    {theme.preview ? (
                      <Image
                        src={theme.preview}
                        alt={`${theme.name} storefront`}
                        width={1420}
                        height={896}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <StorefrontStill url={theme.previewUrl} height={448} />
                    )}
                  </div>
                </div>

                {/* 75 tall, running to the card's bottom edge — there is no
                    padding beneath it, which is what makes 10 + 448.6 + 75
                    come to the card's own 533.7.
                    
                    41.5 in from the band, on top of the card's 10, puts the
                    name 51.5 from the card's edge: measured off the drawing,
                    where it sits clear of the 46 corner rather than tucked
                    into it. It was 10, which is inside the curve. */}
                <div className="flex h-[calc(75*var(--u))] flex-shrink-0 items-center justify-between gap-3 px-[calc(41.5*var(--u))]">
                  <p className="text-[length:var(--text-normal)] font-semibold uppercase tracking-wide text-control-ink">
                    {theme.name}{" "}
                    <span className="text-[length:var(--text-small)] font-normal normal-case tracking-normal text-control-ink/60">
                      (v{theme.latest})
                    </span>
                  </p>
                  <div className="flex items-center gap-[calc(10*var(--u))]">
                    <button
                      type="button"
                      onClick={() => run(theme.key, () => installTheme(theme.key))}
                      disabled={busy(theme.key)}
                      className="flex h-[calc(35*var(--u))] items-center gap-1.5 rounded-[var(--radius-control)] bg-ink px-[calc(16*var(--u))] text-[length:var(--text-secondary)] font-medium text-white disabled:opacity-60"
                    >
                      {busy(theme.key) ? (
                        <Loader2 className="h-[var(--icon-box)] w-[var(--icon-box)] animate-spin" />
                      ) : (
                        <AddIcon className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                      )}
                      Add
                    </button>
                    <a
                      href={theme.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-[calc(35*var(--u))] items-center rounded-[var(--radius-control)] bg-panel px-[calc(16*var(--u))] text-[length:var(--text-secondary)] text-control-ink"
                    >
                      Preview
                    </a>
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
    "flex h-[var(--row-button-h)] items-center gap-1.5 rounded-[var(--radius-row-button)] border border-control-line bg-panel px-[calc(18*var(--u))] text-[length:var(--text-secondary)] text-control-ink transition-colors hover:border-brand-500 hover:text-brand-500 disabled:opacity-60",
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
      {busy ? <Loader2 className="h-[var(--icon-box)] w-[var(--icon-box)] animate-spin" /> : null}
      {children}
    </button>
  );
}
