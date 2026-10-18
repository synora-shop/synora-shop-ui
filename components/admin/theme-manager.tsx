"use client";

import { useState, useTransition } from "react";
import { ArrowUpCircle, Eye, Loader2, MoreHorizontal, Paintbrush, Plus, Trash2 } from "lucide-react";
import { chooseTheme, installTheme, removeTheme, updateTheme } from "@/app/admin/theme/actions-theme-choice";
import { StorefrontStill } from "@/components/admin/storefront-still";
import { AddIcon } from "@/components/admin/nav-icons";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

/**
 * Themes, as the new admin draws them (15 October), and as Synora's themes
 * work: a shop owns copies, not themes.
 *
 * Three parts, kept apart on purpose: what is live (the shop itself, in a
 * black frame, with its copy's version and an update when there is one); the
 * library of copies the shop holds, each to publish, customise, preview or
 * remove; and the Theme Store, where Add gives another copy and never makes
 * anything live in one press.
 *
 * The pictures are the shop itself, never shipped screenshots: those were
 * taken once, of storefronts that have changed since, and showed neither this
 * shop nor the design as it is now.
 */
export type ThemeCopy = {
  id: string;
  themeKey: string;
  name: string;
  version: string;
  latest: string;
  addedAt: string;
  previewUrl: string;
};

export type StoreTheme = {
  key: string;
  name: string;
  description: string;
  latest: string;
  previewUrl: string;
  /** The coloured plate this theme sits on, as two gradient stops. */
  plate: { from: string; to: string };
};

const btn = "inline-flex items-center gap-1.5 rounded-[10px] font-semibold transition-colors disabled:opacity-60";

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
  storeUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const live = copies.find((c) => c.id === liveId) ?? null;
  const liveTheme = live ?? store.find((t) => t.key === liveKey) ?? null;
  const library = copies.filter((c) => c.id !== liveId);

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
  const spin = (id: string) => (busy(id) ? <Loader2 className="h-4 w-4 animate-spin" /> : null);

  return (
    <>
      {dialog}

      {/* 1. What customers are looking at right now. */}
      <section aria-label="Live on your store" className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07] lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="bg-[#0a0a0a] p-3">
          <div className="overflow-hidden rounded-xl bg-white">
            <StorefrontStill url={liveId ? `${storeUrl}?__theme=${liveId}` : storeUrl} height={380} />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
          {liveTheme ? (
            <>
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#ddf5e9] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#11643f]">
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> Live on {storeHost}
              </span>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em]">{liveTheme.name}</h2>
              <p className="text-[14px] text-[#0a0a0a]/55">
                {liveTheme.name} · version {live?.version ?? liveTheme.latest}
                {live && <> · added {live.addedAt}</>}
              </p>
              {live && live.version !== live.latest && (
                <button type="button" disabled={busy(live.id)} onClick={() => run(live.id, () => updateTheme(live.id))} className={cn(btn, "self-start bg-[#ecebff] px-3 py-2 text-[13px] text-[#4b4bea]")}>
                  {spin(live.id) ?? <ArrowUpCircle className="h-4 w-4" />} Update to {live.latest}, keeping your edits
                </button>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {/* Without a copy named, the customiser opens the live theme. */}
                <a href={live ? `/admin/customize/theme?theme=${live.id}` : "/admin/customize/theme"} className={cn(btn, "h-10 bg-[#0a0a0a] px-4 text-[13.5px] text-white")}>
                  <Paintbrush className="h-4 w-4" /> Customise
                </a>
                <a href={storeUrl} target="_blank" rel="noreferrer" className={cn(btn, "h-10 px-4 text-[13.5px] ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]")}>
                  <Eye className="h-4 w-4" /> View
                </a>
                <a href="/admin/look" className={cn(btn, "h-10 px-4 text-[13.5px] ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]")}>
                  Colours and type
                </a>
              </div>
            </>
          ) : (
            <p className="text-[14px] text-[#0a0a0a]/55">No theme is active yet. Add one from the Theme Store below.</p>
          )}
        </div>
      </section>

      {/* 2. Every other copy this shop holds. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold">
          Your library <span className="text-[#0a0a0a]/40">{library.length}</span>
        </h2>
        <span className="text-[13px] text-[#0a0a0a]/50">Try changes on a copy. Customers only ever see the live one.</span>
      </div>
      {copies.length === 0 && <p className="text-[14px] text-[#0a0a0a]/55">You have not added a theme yet. There are some below.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {library.map((copy) => {
          const outOfDate = copy.version !== copy.latest;
          return (
            <article key={copy.id} className="relative flex gap-4 rounded-2xl bg-white p-3.5 ring-1 ring-[#0a0a0a]/[0.07]">
              <div className="h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-[#f0f0f0] ring-1 ring-[#0a0a0a]/[0.06]">
                {/* This shop wearing this copy, its edits included, live. */}
                <StorefrontStill url={copy.previewUrl} height={96} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <p className="truncate text-[15px] font-semibold">{copy.name}</p>
                <p className="text-[12.5px] text-[#0a0a0a]/50">
                  {copy.name} {copy.version} · added {copy.addedAt}
                </p>
                {outOfDate && <span className="text-[12.5px] font-semibold text-[#4b4bea]">Update to {copy.latest} available</span>}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <button type="button" disabled={busy(copy.id)} onClick={() => run(copy.id, () => chooseTheme(copy.id))} className={cn(btn, "bg-[#0a0a0a] px-3 py-1.5 text-[12.5px] text-white")}>
                    {spin(copy.id)} Publish
                  </button>
                  <a href={`/admin/customize/theme?theme=${copy.id}`} className={cn(btn, "px-3 py-1.5 text-[12.5px] ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]")}>
                    Customise
                  </a>
                </div>
              </div>
              <button type="button" aria-label={`More for ${copy.name} v${copy.version}`} aria-expanded={menuKey === copy.id} onClick={() => setMenuKey((k) => (k === copy.id ? null : copy.id))} className="grid h-8 w-8 place-items-center self-start rounded-lg hover:bg-[#f0f0f0]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuKey === copy.id && (
                <>
                  <button type="button" aria-label="Close menu" onClick={() => setMenuKey(null)} className="fixed inset-0 z-10 cursor-default" />
                  <div className="absolute right-3 top-12 z-20 w-52 overflow-hidden rounded-xl bg-white p-1 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
                    <a href={copy.previewUrl} target="_blank" rel="noreferrer" onClick={() => setMenuKey(null)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] hover:bg-[#f5f5f5]">
                      <Eye className="h-4 w-4" /> Preview on your shop
                    </a>
                    {outOfDate && (
                      <button type="button" onClick={() => run(copy.id, () => updateTheme(copy.id))} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] hover:bg-[#f5f5f5]">
                        <ArrowUpCircle className="h-4 w-4" /> Update to {copy.latest}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuKey(null);
                        const ok = await confirm({
                          title: `Remove this copy of ${copy.name}?`,
                          description: "Your changes to this copy go with it. Your other copies are untouched.",
                          confirmLabel: "Remove",
                          danger: true,
                        });
                        if (ok) run(copy.id, () => removeTheme(copy.id));
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-[#a3330c] hover:bg-[#ffe9e2]"
                    >
                      <Trash2 className="h-4 w-4" /> Remove this copy
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
        <a href="#theme-store" className="flex min-h-[8rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#0a0a0a]/12 text-center hover:border-[#0a0a0a]/30">
          <Plus className="h-5 w-5 text-[#0a0a0a]/45" />
          <span className="text-[14px] font-semibold">Add a theme</span>
          <span className="text-[12.5px] text-[#0a0a0a]/50">From the Theme Store, all included</span>
        </a>
      </div>

      {/* 3. Every theme there is. Add gives another copy; it never goes live from here. */}
      {/* The one dark block on the screen (18 October, from the preview): a
          deep iris ink rather than the rail's black, so the store of themes
          reads as a place of its own, apart from your library above it. */}
      <section id="theme-store" aria-label="Theme Store" className="scroll-mt-24 rounded-[16px] bg-[#16163a] p-5 text-white sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b7b9ff]">Theme Store</p>
        <p className="mt-1 text-[20px] font-semibold tracking-[-0.01em]">Every theme is included.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {store.map((theme) => (
            <div key={theme.key} className="flex items-center gap-4 rounded-[14px] bg-white/[0.07] p-3">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg p-1" style={{ background: `linear-gradient(135deg, ${theme.plate.from}, ${theme.plate.to})` }}>
                <div className="h-full overflow-hidden rounded-md bg-white">
                  <StorefrontStill url={theme.previewUrl} height={56} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{theme.name}</p>
                <p className="truncate text-[12.5px] text-white/60">{theme.description}</p>
                <a href={theme.previewUrl} target="_blank" rel="noreferrer" className="text-[12.5px] font-semibold text-[#b7b9ff] hover:text-white">Preview</a>
              </div>
              <button type="button" disabled={busy(theme.key)} onClick={() => run(theme.key, () => installTheme(theme.key))} className={cn(btn, "bg-white px-3 py-1.5 text-[12.5px] text-[#0a0a0a] hover:bg-white/90")}>
                {spin(theme.key) ?? <AddIcon className="h-3.5 w-3.5" />} Add
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
