"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Globe,
  Loader2,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import {
  checkDomain,
  connectDomain,
  disconnectDomain,
  makePrimary,
} from "@/app/admin/domains/actions";
import { domainProblem, type DnsRecord } from "@/lib/domains";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export type DomainRow = {
  id: string;
  hostname: string;
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED";
  isPlatform: boolean;
  isPrimary: boolean;
  lastError: string | null;
  lastCheckedAt: string | null;
  records: DnsRecord[];
};

const STATUS: Record<
  DomainRow["status"],
  { label: string; tone: "good" | "warn" | "bad" | "neutral"; icon: typeof Check }
> = {
  ACTIVE: { label: "live", tone: "good", icon: Check },
  VERIFIED: { label: "issuing certificate", tone: "warn", icon: Loader2 },
  PENDING: { label: "waiting for DNS", tone: "warn", icon: Clock },
  FAILED: { label: "not working", tone: "bad", icon: AlertTriangle },
};

export function DomainManager({
  domains,
  canIssueCertificates,
}: {
  domains: DomainRow[];
  canIssueCertificates: boolean;
}) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Live feedback while typing, from the same function the server enforces —
  // so the form never accepts something the server is about to refuse.
  const draftProblem = draft.trim() ? domainProblem(draft) : null;

  const run = (
    action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error, { blocking: true });
    });
  };

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied.");
    } catch {
      // Clipboard access is refused in some browsers and over plain http. The
      // value is on screen and selectable, so this is a nudge, not a failure.
      toast.info("Couldn't copy, select the value and copy it manually.");
    }
  }

  return (
    <div className="space-y-6">
      {dialog}

      {!canIssueCertificates && (
        <Card className="border-amber/30 bg-amber-bg p-4">
          <p className="text-sm font-medium text-ink">Custom domains aren&rsquo;t fully set up yet</p>
          <p className="mt-1 text-xs leading-snug text-ink-soft">
            Domains here will verify, but no certificate will be issued, so they won&rsquo;t serve
            traffic. This is a platform setting, not something you can fix from your store.
          </p>
        </Card>
      )}

      {/* ---------------------------------------------------------------- add */}
      <Card className="p-4">
        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draftProblem) return;
              run(async () => {
                const result = await connectDomain(draft);
                if (result.ok) {
                  setDraft("");
                  setAdding(false);
                }
                return result;
              });
            }}
            className="space-y-3"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Your domain</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                required
                placeholder="example.com"
                aria-invalid={draftProblem ? true : undefined}
                className="input"
              />
            </label>
            {draftProblem ? (
              <p className="text-xs text-rose">{draftProblem}</p>
            ) : (
              <p className="text-xs leading-snug text-ink-soft">
                Enter it without <span className="font-mono">https://</span>. You&rsquo;ll get two
                records to add at whoever you bought the domain from.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" disabled={pending || !!draftProblem}>
                {pending ? "Adding…" : "Add domain"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Use your own domain</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Already own one? Point it here and your store will answer on it.
              </p>
            </div>
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Add domain
            </Button>
          </div>
        )}
      </Card>

      {/* ------------------------------------------------------------- domains */}
      <Card className="divide-y divide-border">
        {domains.map((domain) => {
          const status = STATUS[domain.status];
          const StatusIcon = status.icon;
          const showRecords = expanded === domain.id;

          return (
            <div key={domain.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Globe className="h-4 w-4 flex-shrink-0 text-ink-faint" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://${domain.hostname}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium text-ink hover:text-brand-600"
                    >
                      {domain.hostname}
                    </a>
                    {domain.isPrimary && (
                      <Badge tone="brand">
                        <Star className="h-3 w-3" />
                        main address
                      </Badge>
                    )}
                    {domain.isPlatform && <Badge>free address</Badge>}
                    <Badge tone={status.tone}>
                      <StatusIcon
                        className={`h-3 w-3 ${domain.status === "VERIFIED" ? "animate-spin" : ""}`}
                      />
                      {status.label}
                    </Badge>
                  </p>
                  {domain.lastError && (
                    <p className="mt-1 text-xs leading-snug text-rose">{domain.lastError}</p>
                  )}
                </div>

                <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                  {!domain.isPlatform && domain.status !== "ACTIVE" && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setExpanded(domain.id);
                        run(() => checkDomain(domain.id));
                      }}
                    >
                      {pending ? "Checking…" : "Check now"}
                    </Button>
                  )}

                  {!domain.isPlatform && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpanded(showRecords ? null : domain.id)}
                    >
                      {showRecords ? "Hide records" : "Show records"}
                    </Button>
                  )}

                  {!domain.isPrimary && domain.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Make ${domain.hostname} your main address?`,
                          description:
                            "Your other addresses will redirect to it, and search engines will be told this is the real one. Links people have already shared keep working.",
                          confirmLabel: "Make it my main address",
                        });
                        if (ok) run(() => makePrimary(domain.id));
                      }}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Make main
                    </Button>
                  )}

                  {!domain.isPlatform && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      aria-label={`Remove ${domain.hostname}`}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Remove ${domain.hostname}?`,
                          description: domain.isPrimary
                            ? "This is your main address. Your store will go back to using its free address, and links to this domain will stop working."
                            : "Your store will stop answering on this domain. You can add it again later.",
                          confirmLabel: "Remove",
                          danger: true,
                        });
                        if (ok) run(() => disconnectDomain(domain.id));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {showRecords && (
                <div className="mt-4 rounded-lg border border-border bg-subtle p-3">
                  <p className="text-xs leading-snug text-ink-soft">
                    Add these at whoever you bought {domain.hostname} from. Changes usually take a
                    few minutes, occasionally up to an hour.
                  </p>
                  <div className="mt-3 space-y-3">
                    {domain.records.map((record) => (
                      <div key={`${record.type}-${record.name}`} className="text-xs">
                        <p className="font-medium text-ink">
                          {record.type} record, {record.purpose}
                        </p>
                        <dl className="mt-1.5 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1">
                          <dt className="text-ink-faint">Name</dt>
                          <dd className="overflow-x-auto whitespace-nowrap font-mono text-ink">
                            {record.name}
                          </dd>
                          <button
                            type="button"
                            onClick={() => copy(record.name)}
                            aria-label={`Copy the name for the ${record.type} record`}
                            className="rounded p-1 text-ink-faint transition-colors hover:bg-black/5 hover:text-ink"
                          >
                            <Copy className="h-3 w-3" />
                          </button>

                          <dt className="text-ink-faint">Value</dt>
                          <dd className="overflow-x-auto whitespace-nowrap font-mono text-ink">
                            {record.value}
                          </dd>
                          <button
                            type="button"
                            onClick={() => copy(record.value)}
                            aria-label={`Copy the value for the ${record.type} record`}
                            className="rounded p-1 text-ink-faint transition-colors hover:bg-black/5 hover:text-ink"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </dl>
                      </div>
                    ))}
                  </div>
                  {domain.lastCheckedAt && (
                    <p className="mt-3 text-[11px] text-ink-faint">
                      Last checked {new Date(domain.lastCheckedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
