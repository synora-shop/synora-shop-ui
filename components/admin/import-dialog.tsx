"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, FileUp, Upload } from "lucide-react";
import type { ImportPlan, ImportResult } from "@/lib/csv/plan";
import { Button, buttonClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Loading records from a file.
 *
 * The panel could export a Shopify CSV and not read one back, which meant a
 * merchant could leave with their catalogue and not arrive with it. The same
 * was true of their customer list.
 *
 * Two steps, always. Choosing a file says what would happen — how many would
 * be made, how many overwritten, and every line that cannot be read — and
 * writes nothing. Only the second button writes. There is no undo for "the
 * whole catalogue, slightly wrong".
 *
 * One dialog for both, taking the two server actions and the words. Products
 * and customers arrive in different files with different columns, and a
 * merchant is asked exactly the same question about each.
 */
/** How many rows pressing Import would actually write. */
function writable(plan: ImportPlan): number {
  return plan.rows.filter((r) => r.action !== "skip").length;
}

export function ImportDialog({
  noun,
  plural,
  blurb,
  matchedBy,
  overwriteWarning,
  plan: planFile,
  apply: applyFile,
}: {
  /** Singular, lower case: "product", "customer". */
  noun: string;
  plural: string;
  /** What the file is, said in one sentence under the title. */
  blurb: string;
  /** What two records are matched on, for the empty state. */
  matchedBy: string;
  /** What overwriting costs, said before the button that does it. */
  overwriteWarning: string;
  plan: (csv: string) => Promise<ImportPlan | { error: string }>;
  apply: (csv: string) => Promise<ImportResult | { error: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [writing, startWriting] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const toast = useToast();

  function reset() {
    setName(null);
    setCsv(null);
    setPlan(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function choose(file: File | undefined) {
    if (!file) return;
    reset();
    setName(file.name);
    setReading(true);
    try {
      const text = await file.text();
      setCsv(text);
      const result = await planFile(text);
      if ("error" in result) setError(result.error);
      else setPlan(result);
    } catch {
      setError("That file could not be read. Save it as CSV and try again.");
    } finally {
      setReading(false);
    }
  }

  function write() {
    if (!csv) return;
    startWriting(async () => {
      const result = await applyFile(csv);
      if ("error" in result) {
        toast.error(result.error, { blocking: true });
        return;
      }
      const parts = [
        result.created > 0 ? `${result.created} added` : null,
        result.updated > 0 ? `${result.updated} updated` : null,
      ].filter(Boolean);
      if (result.failed.length > 0) {
        toast.error(
          `${result.failed.length} ${result.failed.length === 1 ? noun : plural} could not be saved: ${result.failed
            .map((f) => f.key)
            .join(", ")}`,
          { blocking: true }
        );
      } else {
        toast.success(parts.length ? parts.join(", ") + "." : "Nothing needed changing.");
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "sm")}>
        <Upload className="h-4 w-4" />
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 py-[8vh]">
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Import ${plural}`}
            className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-control-line bg-control shadow-lg"
          >
            <div className="border-b border-control-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Import {plural}</h2>
              <p className="mt-0.5 text-xs leading-snug text-ink-soft">{blurb}</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/40",
                  name && "border-solid"
                )}
              >
                <FileUp className="h-5 w-5 text-ink-faint" />
                <span className="text-sm font-medium text-ink">
                  {name ?? "Choose a CSV file"}
                </span>
                <span className="text-xs text-ink-soft">
                  {reading ? "Reading…" : "Nothing is saved until you press Import."}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => choose(e.target.files?.[0])}
                />
              </label>

              {error && (
                <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose/30 bg-rose-bg px-3 py-2 text-sm text-ink">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose" />
                  {error}
                </p>
              )}

              {plan && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-pill bg-green-bg px-2.5 py-1 text-xs font-medium text-green">
                      <Check className="h-3.5 w-3.5" />
                      {plan.creating} to add
                    </span>
                    {plan.updating > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                        {plan.updating} to overwrite
                      </span>
                    )}
                    {(plan.skipping ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-subtle px-2.5 py-1 text-xs font-medium text-ink-soft">
                        {plan.skipping} already here
                      </span>
                    )}
                    {plan.problems.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-bg px-2.5 py-1 text-xs font-medium text-amber">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {plan.problems.length} line
                        {plan.problems.length === 1 ? "" : "s"} skipped
                      </span>
                    )}
                  </div>

                  {plan.unknownColumns.length > 0 && (
                    <p className="text-xs leading-snug text-ink-soft">
                      Columns this panel does not use are kept as they are and written back out on
                      the next export: {plan.unknownColumns.join(", ")}.
                    </p>
                  )}

                  {plan.problems.length > 0 && (
                    <ul className="space-y-1 rounded-lg border border-amber/30 bg-amber-bg/50 px-3 py-2">
                      {plan.problems.slice(0, 8).map((problem, i) => (
                        <li key={i} className="text-xs leading-snug text-ink">
                          <span className="font-mono text-ink-soft">Line {problem.line}</span> —{" "}
                          {problem.message}
                        </li>
                      ))}
                      {plan.problems.length > 8 && (
                        <li className="text-xs text-ink-soft">
                          and {plan.problems.length - 8} more.
                        </li>
                      )}
                    </ul>
                  )}

                  {plan.rows.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                        {plan.rows.map((row) => (
                          <li
                            key={row.key}
                            className="flex items-center gap-3 bg-surface px-3 py-2"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-ink">{row.title}</span>
                              <span className="block truncate font-mono text-[11px] text-ink-faint">
                                {row.key}
                              </span>
                            </span>
                            <span className="flex-shrink-0 text-[11px] text-ink-faint">
                              {row.detail}
                            </span>
                            <span
                              className={cn(
                                "flex-shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-medium",
                                row.action === "create"
                                  ? "bg-green-bg text-green"
                                  : row.action === "update"
                                    ? "bg-brand-100 text-brand-700"
                                    : "bg-subtle text-ink-soft"
                              )}
                            >
                              {row.action === "create"
                                ? "New"
                                : row.action === "update"
                                  ? "Overwrite"
                                  : "Already here"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-control-line px-4 py-3">
              <p className="text-xs text-ink-soft">
                {plan
                  ? overwriteWarning
                  : `Matched by ${matchedBy}. Exported files from here import back unchanged.`}
              </p>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!plan || writable(plan) === 0 || writing}
                  onClick={write}
                >
                  {writing
                    ? "Importing…"
                    : plan
                      ? `Import ${writable(plan)} ${writable(plan) === 1 ? noun : plural}`
                      : "Import"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
