"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Plus, Trash2, Wand2 } from "lucide-react";
import { saveRedirect, deleteRedirect, toggleRedirect } from "@/app/admin/redirects/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import type { BrokenLink } from "@/lib/data/broken-links";
import { cn } from "@/lib/utils";

type RedirectRow = {
  id: string;
  fromPath: string;
  toPath: string;
  note: string;
  isActive: boolean;
  hits: number;
};

function RedirectForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: Partial<RedirectRow>;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const [fromPath, setFromPath] = useState(initial?.fromPath ?? "");
  const [toPath, setToPath] = useState(initial?.toPath ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [state, setState] = useState<SaveState>("idle");

  async function submit() {
    setState("saving");
    const result = await saveRedirect({ fromPath, toPath, note, isActive: true }, initial?.id);
    if (result.error) {
      setState("error");
      toast.error(result.error, { blocking: true });
      return;
    }
    setState("saved");
    toast.success(`${fromPath} now sends visitors to ${toPath}.`);
    onDone();
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Old address
          </label>
          <input
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
            placeholder="/collections/sale"
            className="input mt-1 h-9 text-sm"
          />
          <p className="mt-1 text-[11px] leading-snug text-ink-soft">
            The link that currently leads nowhere.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Send visitors to
          </label>
          <input
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
            placeholder="/shop"
            className="input mt-1 h-9 text-sm"
          />
          <p className="mt-1 text-[11px] leading-snug text-ink-soft">
            A page on this site, or a full https:// address.
          </p>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Note (optional)
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Sale collection retired, Feb 2026"
          className="input mt-1 h-9 text-sm"
        />
        <p className="mt-1 text-[11px] leading-snug text-ink-soft">
          Why this exists, useful when you come back to it in a year.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <SaveButton state={state} onClick={submit} idleLabel={initial?.id ? "Update" : "Add redirect"} size="sm" />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function RedirectsManager({
  redirects,
  brokenLinks,
}: {
  redirects: RedirectRow[];
  brokenLinks: BrokenLink[];
}) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<Partial<RedirectRow> | undefined>();

  async function remove(row: RedirectRow) {
    const ok = await confirm({
      title: `Delete the redirect for ${row.fromPath}?`,
      description: "That address will start showing a Not Found page again.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await deleteRedirect(row.id);
    toast.success("Redirect deleted.");
    router.refresh();
  }

  function fixBrokenLink(link: BrokenLink) {
    setPrefill({ fromPath: link.href, toPath: "/shop", note: link.reason });
    setAdding(true);
  }

  return (
    <div className="space-y-8">
      {dialog}

      {brokenLinks.length > 0 && (
        <section className="rounded-lg border border-amber bg-amber-bg p-4">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber" />
            {brokenLinks.length === 1 ? "1 broken link found" : `${brokenLinks.length} broken links found`}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            These are in your menus right now, and customers clicking them get a Not Found page.
          </p>
          <div className="mt-3 space-y-2">
            {brokenLinks.map((link) => (
              <div
                key={link.href}
                className="flex flex-wrap items-center gap-2 rounded border border-border bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs">{link.href}</p>
                  <p className="text-[11px] text-ink-soft">
                    {link.reason} Shown in your menu as {link.labels.map((l) => `“${l}”`).join(", ")}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fixBrokenLink(link)}
                  className="flex flex-shrink-0 items-center gap-1 rounded-full border border-brand-500 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100"
                >
                  <Wand2 className="h-3 w-3" /> Redirect it
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-ink-soft">
            You can also simply remove these entries in Menus, a redirect is the better choice if
            the address has been shared or indexed by Google.
          </p>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold">Redirects</h2>
          {!adding && (
            <button
              type="button"
              onClick={() => {
                setPrefill(undefined);
                setAdding(true);
              }}
              className="flex items-center gap-1 rounded-full border border-brand-500 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100"
            >
              <Plus className="h-3.5 w-3.5" /> New redirect
            </button>
          )}
        </div>

        {adding && (
          <div className="mt-3">
            <RedirectForm
              initial={prefill}
              onDone={() => {
                setAdding(false);
                setPrefill(undefined);
                router.refresh();
              }}
              onCancel={() => {
                setAdding(false);
                setPrefill(undefined);
              }}
            />
          </div>
        )}

        {redirects.length === 0 && !adding ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-ink-soft">
            No redirects yet. One gets created automatically whenever you change a page&rsquo;s
            address.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-white">
            {redirects.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("flex flex-wrap items-center gap-1.5 font-mono text-xs", !row.isActive && "opacity-50")}>
                    <span className="truncate">{row.fromPath}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-ink-faint" />
                    <span className="truncate text-brand-600">{row.toPath}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {row.note && <span>{row.note} · </span>}
                    {row.hits === 0 ? "Not used yet" : row.hits === 1 ? "Used once" : `Used ${row.hits} times`}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <ToggleSwitch
                    label=""
                    checked={row.isActive}
                    onChange={async () => {
                      await toggleRedirect(row.id);
                      router.refresh();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    aria-label={`Delete redirect for ${row.fromPath}`}
                    className="rounded p-1.5 text-ink-soft transition-colors hover:bg-rose/10 hover:text-rose active:bg-rose/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
