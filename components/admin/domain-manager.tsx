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
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { checkDomain, connectDomain, disconnectDomain, makePrimary, revertToAddress } from "@/app/admin/domain-actions";
import { domainProblem, isFormerAddress, type DnsRecord } from "@/lib/domains";
import { Badge, Button, Card, CardTitle, FieldError } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

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
  /**
   * The notice shown when a domain going live made it the main address.
   *
   * It is a notice, not a question: verifyDomain has already promoted it by the
   * time this renders, and closing this without touching anything leaves it
   * promoted. The switch is the way back out, defaulted to the state that is
   * already true — a merchant who reads nothing gets the outcome they almost
   * certainly wanted, and a merchant who did not want it has one switch to flip.
   */
  const [promoted, setPromoted] = useState<
    { domainId: string; hostname: string; previousPrimaryId: string | null } | null
  >(null);
  const [mainOn, setMainOn] = useState(true);

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
    <div className="space-y-2.5">
      {dialog}

      {promoted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="domain-live-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={(e) => {
            // Clicking the backdrop closes it, and closing changes nothing:
            // the domain is already the main address. That is the point.
            if (e.target === e.currentTarget) setPromoted(null);
          }}
        >
          <Card className="w-full max-w-md p-5 shadow-panel">
            {/* The heading is the dialog's accessible name, so it carries the
                id rather than CardTitle — which takes no id of its own. */}
            {/* Sans, not serif. The panel has one face — a serif heading here
                would read as a different product wearing the same colours, and
                check:naming holds the line. */}
            <h2 id="domain-live-title" className="text-lg font-semibold text-ink">
              {promoted.hostname} is live
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-ink-soft">
              Your store now answers on it, and it has been made your main address — the one
              search engines are told is the real one. Your other addresses redirect here, and
              links people have already shared keep working.
            </p>

            <div className="mt-4 rounded-[var(--radius-control)] border border-border p-3">
              <ToggleSwitch
                checked={mainOn}
                disabled={pending}
                label="Make this my main address"
                description={
                  mainOn
                    ? "On. Turn it off to keep the address you were using before."
                    : "Off. Your previous address is the main one again."
                }
                onChange={(next) => {
                  setMainOn(next);
                  // Applied as it is flipped rather than on the way out, so the
                  // switch is never showing something that is not true yet.
                  startTransition(async () => {
                    const target = next ? promoted.domainId : promoted.previousPrimaryId;
                    if (!target) return;
                    const result = await makePrimary(target);
                    if (!result.ok) {
                      setMainOn(!next);
                      toast.error(result.error, { blocking: true });
                    }
                  });
                }}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => setPromoted(null)} disabled={pending}>
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {!canIssueCertificates && (
        <Card className="border-amber/30 bg-amber-bg p-4">
          <CardTitle as="h3">Custom domains aren&rsquo;t fully set up yet</CardTitle>
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
              <FieldError size="xs">{draftProblem}</FieldError>
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
              <CardTitle as="h3">Use your own domain</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                Already own one? Point it here and your store will answer on it.
              </p>
            </div>
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="h-[var(--icon-box)] w-[var(--icon-box)]" />
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

          // An address this shop used to have, kept so shared links still
          // work. Not a custom domain, and it must not be offered what one
          // gets: DNS records for a hostname on our own zone are nonsense, and
          // "check now" would query our own nameservers on the merchant's
          // behalf. What it gets instead is the way back.
          const former = isFormerAddress(domain);

          return (
            <div key={domain.id} className="p-4">
              {/* Three lines, in the order the questions get asked: which
                  address is this, what is it doing, what can I do about it.
                  
                  It was one line carrying up to four badges and four buttons,
                  which wrapped differently for every row — so no two rows in
                  the list had their controls in the same place, and the one
                  that mattered was wherever the wrapping put it. */}
              <div className="flex items-start gap-3">
                <Globe className="mt-1 h-[var(--icon-box)] w-[var(--icon-box)] flex-shrink-0 text-ink-faint" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://${domain.hostname}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[15px] font-medium text-ink hover:text-brand-600"
                    >
                      {domain.hostname}
                    </a>
                    {/* Two badges at most, and only for the two things that
                        change: whether it is the main one, and whether it is
                        working. What *kind* of address it is does not change,
                        so it reads as a sentence below instead of a chip. */}
                    {domain.isPrimary && (
                      <Badge tone="brand">
                        <Star className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                        main address
                      </Badge>
                    )}
                    <Badge tone={status.tone}>
                      <StatusIcon
                        className={`h-3 w-3 ${domain.status === "VERIFIED" ? "animate-spin" : ""}`}
                      />
                      {status.label}
                    </Badge>
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {domain.isPlatform
                      ? "Your free address. It always works and can't be removed."
                      : former
                        ? "An address you used before. It still forwards here."
                        : "Your own domain."}
                    {domain.lastCheckedAt &&
                      ` Last checked ${new Date(domain.lastCheckedAt).toLocaleString()}.`}
                  </p>
                  {domain.lastError && (
                    <FieldError size="xs" className="mt-1.5">{domain.lastError}</FieldError>
                  )}
                </div>

                {/* Removal sits apart from the rest, alone on the right. It was
                    the last of four buttons in a wrapping row, which put it
                    under the pointer heading for "Make main" often enough to
                    matter. */}
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
                    <Trash2 className="h-[var(--icon-box)] w-[var(--icon-box)].5" />
                  </Button>
                )}
              </div>

              {/* Every row's actions start in the same place, indented under
                  the hostname rather than floated after whatever the badges
                  left over. */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pl-7">
                  {/* Live domains too. A domain that has stopped working shows
                      its error here, and the merchant who has just fixed it
                      should not have to wait for the hourly checker. */}
                  {!domain.isPlatform && !former && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setExpanded(domain.id);
                        startTransition(async () => {
                          const result = await checkDomain(domain.id);
                          if (!result.ok) {
                            toast.error(result.error, { blocking: true });
                            return;
                          }
                          toast.success(result.message ?? "Done.");
                          if (result.promoted) {
                            setMainOn(true);
                            setPromoted({
                              domainId: domain.id,
                              hostname: domain.hostname,
                              previousPrimaryId: result.promoted.previousPrimaryId,
                            });
                          }
                        });
                      }}
                    >
                      {pending ? "Checking…" : "Check now"}
                    </Button>
                  )}

                  {!domain.isPlatform && !former && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpanded(showRecords ? null : domain.id)}
                    >
                      {showRecords ? "Hide records" : "Show records"}
                    </Button>
                  )}

                  {/* The way back. Renaming the shop moved the address forwards
                      and there was no way to change your mind — the old one sat
                      in this list, still redirecting, with nothing to press. */}
                  {former && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Go back to ${domain.hostname}?`,
                          description: `Your store returns to this address, and ${
                            domains.find((d) => d.isPlatform)?.hostname ?? "the current one"
                          } is kept working and forwards here — the same way this one has been. Nothing shared on either address stops working.`,
                          confirmLabel: "Use this address again",
                        });
                        if (ok) run(() => revertToAddress(domain.id));
                      }}
                    >
                      <RotateCcw className="h-[var(--icon-box)] w-[var(--icon-box)].5" />
                      Use this again
                    </Button>
                  )}

                  {!domain.isPrimary && !former && domain.status === "ACTIVE" && (
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
                      <Star className="h-[var(--icon-box)] w-[var(--icon-box)].5" />
                      Make main
                    </Button>
                  )}

                </div>

              {showRecords && (
                <div className="mt-3 ml-7 rounded-[var(--radius-container)] border border-border p-4">
                  <p className="text-xs leading-snug text-ink-soft">
                    Add these at whoever you bought {domain.hostname} from. Changes usually take a
                    few minutes, occasionally up to an hour.
                  </p>

                  {/* Each value in a recessed field with its own copy button.
                      
                      It was a three-column grid of label, value and icon, twice
                      per record — so a record read as six loose cells and the
                      thing you actually need to select was the one part with no
                      edge around it. A field is the shape a merchant already
                      knows how to copy out of. */}
                  <div className="mt-3 space-y-4">
                    {domain.records.map((record) => (
                      <div key={`${record.type}-${record.name}`}>
                        <p className="text-xs font-medium text-ink">
                          {record.type} record
                          <span className="font-normal text-ink-faint"> — {record.purpose}</span>
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {[
                            { label: "Name", value: record.name },
                            { label: "Value", value: record.value },
                          ].map((field) => (
                            <div key={field.label} className="flex items-center gap-2">
                              <span className="w-11 flex-shrink-0 text-xs text-ink-faint">
                                {field.label}
                              </span>
                              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-[var(--radius-control)] bg-control px-2.5 py-1.5 font-mono text-xs text-ink">
                                {field.value}
                              </code>
                              <button
                                type="button"
                                onClick={() => copy(field.value)}
                                aria-label={`Copy the ${field.label.toLowerCase()} for the ${record.type} record`}
                                className="flex-shrink-0 rounded-[var(--radius-control)] p-1.5 text-ink-faint transition-colors hover:bg-control hover:text-ink"
                              >
                                <Copy className="h-[var(--icon-box)] w-[var(--icon-box)].5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
