"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, Mail, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  FieldError,
  Fieldset,
} from "@/components/ui/primitives";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { SingleImageField } from "@/components/admin/single-image-field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useEditor } from "@/components/admin/use-editor";
import {
  DEFAULT_WORDS,
  HEADING_MAX,
  MESSAGE_MAX,
  type HoldingPage,
  headingProblem,
  messageProblem,
} from "@/lib/holding-page";
import {
  markSignupsNotified,
  removeSignup,
  saveHoldingPage,
  setMaintenanceMode,
} from "@/app/admin/maintenance-actions";

export type Signup = {
  id: string;
  email: string;
  createdAt: string;
  notified: boolean;
};

/**
 * The holding page: whether it is showing, what it says, and who is waiting.
 *
 * Three things on one screen because they are one decision. The switch used to
 * be in Preferences with no way to see what it did, and the words were in the
 * storefront's source with no way to change them.
 *
 * The preview is the point of the layout. A merchant writing a notice their
 * customers will read while the shop is shut should be able to see it, and
 * "empty means ours" is invisible in a form — you type nothing and cannot tell
 * whether nothing is what will be shown.
 */
export function MaintenanceEditor({
  initial,
  maintenanceMode,
  storePaused,
  storeName,
  themeLogoUrl,
  signups,
}: {
  initial: HoldingPage;
  maintenanceMode: boolean;
  /** The shop's own status. Pausing shows this same page. */
  storePaused: boolean;
  storeName: string;
  themeLogoUrl: string;
  signups: Signup[];
}) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [fields, setFields] = useState<HoldingPage>(initial);
  const [saved, setSaved] = useState<HoldingPage>(initial);
  const [saving, setSaving] = useState(false);
  const [on, setOn] = useState(maintenanceMode);
  const [switching, setSwitching] = useState(false);

  const dirty =
    fields.heading !== saved.heading ||
    fields.message !== saved.message ||
    fields.logoUrl !== saved.logoUrl ||
    fields.showLogo !== saved.showLogo ||
    fields.signups !== saved.signups;

  const headingIssue = headingProblem(fields.heading);
  const messageIssue = messageProblem(fields.message);

  function set<K extends keyof HoldingPage>(key: K, value: HoldingPage[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (headingIssue || messageIssue) {
      toast.error(headingIssue ?? messageIssue ?? "");
      return;
    }
    setSaving(true);
    try {
      const result = await saveHoldingPage(fields);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSaved(fields);
      toast.success(result.message ?? "Saved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  useEditor({ dirty, saving, onSave: save, onDiscard: () => setFields(saved) });

  /**
   * The store is shut either way, and the two reasons are not interchangeable.
   *
   * Pausing is the shop's own status and is what the store-type switch
   * requires; maintenance mode is this screen's toggle. Both show this page, so
   * a merchant who has paused must not be told their store is visible just
   * because the toggle here is off — that sentence would be a lie they would
   * act on.
   */
  const shut = on || storePaused;

  async function toggle(next: boolean) {
    if (next) {
      const ok = await confirm({
        title: "Hide your store from customers?",
        description:
          "Visitors will see your holding page instead of your shop. You and your staff still get in, so you can keep working. Nothing is deleted and orders already placed are untouched.",
        confirmLabel: "Hide my store",
      });
      if (!ok) return;
    }

    setSwitching(true);
    try {
      const result = await setMaintenanceMode(next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOn(next);
      toast.success(result.message ?? "Saved.");
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  /**
   * The addresses, as a file.
   *
   * Built in the browser from rows already on screen rather than fetched: they
   * are here, the merchant asked for them, and a download endpoint would be
   * one more public surface guarding one more list of people's email
   * addresses.
   */
  function exportSignups() {
    const rows = [
      ["Email", "Asked at", "Told"],
      ...signups.map((s) => [s.email, s.createdAt, s.notified ? "yes" : "no"]),
    ];
    const csv = rows
      // Quoted and doubled — an address is not supposed to contain a quote or
      // a comma, and "not supposed to" is not the same as "cannot".
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-waiting-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function forget(signup: Signup) {
    const ok = await confirm({
      title: `Remove ${signup.email}?`,
      description:
        "They will not be told when you reopen, and the address is deleted rather than hidden.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;

    const result = await removeSignup(signup.id);
    if (!result.ok) toast.error(result.error);
    else {
      toast.success(result.message ?? "Removed.");
      router.refresh();
    }
  }

  const waiting = signups.filter((s) => !s.notified).length;

  // What the storefront will actually render, resolved the same way it is
  // there: per field, so a written heading survives an empty message.
  const shown = {
    heading: fields.heading.trim() || DEFAULT_WORDS.maintenance.heading,
    message: fields.message.trim() || DEFAULT_WORDS.maintenance.message,
    logo: fields.showLogo ? fields.logoUrl.trim() || themeLogoUrl.trim() : "",
  };

  return (
    <div className="space-y-2.5">
      {dialog}

      {/* ------------------------------------------------------------ switch */}
      <Fieldset
        title="Coming soon / maintenance"
        description="Customers see your holding page instead of your store. You and your staff still get in, so you can keep working on it."
        className={shut ? "border-amber/40 bg-amber-bg" : undefined}
      >
        <ToggleSwitch
          inline
          label="Hide my store from customers"
          checked={on}
          disabled={switching}
          onChange={toggle}
        />

        {storePaused && (
          <p className="notice-in flex items-start gap-1.5 text-xs leading-snug font-medium text-amber">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {/* Said whether or not the toggle is on. A merchant who paused in
                Themes and comes here to write the page must not read "your
                store is visible" underneath a store that is not. */}
            Your store is paused, so customers are seeing this page already —
            whatever this switch says. Reopen it under Your App → Themes.
          </p>
        )}

        {on && !storePaused && (
          <p className="notice-in flex items-start gap-1.5 text-xs leading-snug font-medium text-amber">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Your store is hidden from customers until you turn this off.
          </p>
        )}
      </Fieldset>

      {/* ------------------------------------------------------------- words */}
      <Fieldset
        title="What customers see"
        description="Shown whenever your store is shut — whether you hid it with the switch above or paused it under Themes. Leave a box empty and we'll use our wording."
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="holding-heading" className="mb-1.5 block text-sm font-medium text-ink">
              Heading
            </label>
            <input
              id="holding-heading"
              className="input"
              value={fields.heading}
              maxLength={HEADING_MAX}
              placeholder={DEFAULT_WORDS.maintenance.heading}
              onChange={(e) => set("heading", e.target.value)}
            />
            {headingIssue && <FieldError size="xs" className="mt-1">{headingIssue}</FieldError>}
          </div>

          <div>
            <label htmlFor="holding-message" className="mb-1.5 block text-sm font-medium text-ink">
              Message
            </label>
            <textarea
              id="holding-message"
              rows={4}
              className="input"
              value={fields.message}
              maxLength={MESSAGE_MAX}
              placeholder={DEFAULT_WORDS.maintenance.message}
              onChange={(e) => set("message", e.target.value)}
            />
            <p className="mt-1 flex items-center justify-between text-[11px] text-ink-faint">
              <span>Line breaks are kept.</span>
              <span className="font-mono tabular-nums">
                {fields.message.length}/{MESSAGE_MAX}
              </span>
            </p>
            {messageIssue && <FieldError size="xs" className="mt-1">{messageIssue}</FieldError>}
          </div>
        </div>
      </Fieldset>

      {/* -------------------------------------------------------------- logo */}
      <Fieldset
        title="Your logo"
        description="Shown above the message, so the page looks like your store rather than a system notice. Leave the picture empty to use your theme's logo."
      >
        <div className="space-y-3">
          <ToggleSwitch
            inline
            label="Show a logo"
            checked={fields.showLogo}
            onChange={(v) => set("showLogo", v)}
          />
          {fields.showLogo && (
            <SingleImageField
              value={fields.logoUrl}
              onChange={(url) => set("logoUrl", url)}
              folder="logos"
              label="A different logo for this page"
              hint={
                themeLogoUrl
                  ? "Optional — your theme's logo is used if you leave this empty."
                  : "Your theme has no logo yet, so nothing is shown unless you add one here."
              }
              aspect="aspect-[3/1]"
            />
          )}
        </div>
      </Fieldset>

      {/* ----------------------------------------------------------- preview */}
      <Fieldset
        title="Preview"
        description="What a customer sees. It updates as you type, before you save."
      >
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          {shown.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown.logo} alt="" className="h-10 w-auto max-w-[180px] object-contain" />
          ) : null}
          <p className="font-serif text-xl font-semibold text-balance text-ink">{shown.heading}</p>
          <p className="max-w-sm text-xs leading-relaxed whitespace-pre-line text-ink-soft">
            {shown.message}
          </p>
          {fields.signups && (
            <div className="mt-2 flex w-full max-w-xs gap-2">
              <span className="flex-1 rounded-lg border border-border bg-control px-2.5 py-2 text-left text-xs text-ink-faint">
                you@example.com
              </span>
              <span className="rounded-pill bg-brand-600 px-3 py-2 text-xs font-medium text-white">
                Tell me
              </span>
            </div>
          )}
        </Card>
      </Fieldset>

      {/* ----------------------------------------------------------- signups */}
      <Fieldset
        title="Tell people when you reopen"
        description="Offer visitors a box to leave their email address. They are kept separately from your customers — these are people who have not bought anything, and they should not appear as if they had."
      >
        <div className="space-y-3">
          <ToggleSwitch
            inline
            label="Ask for an email address"
            checked={fields.signups}
            onChange={(v) => set("signups", v)}
          />

          {signups.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={waiting > 0 ? "brand" : "neutral"}>
                  <Mail className="h-3 w-3" />
                  {signups.length} waiting
                </Badge>
                {waiting !== signups.length && (
                  <span className="text-xs text-ink-soft">
                    {signups.length - waiting} already told
                  </span>
                )}
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="ghost" onClick={exportSignups}>
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                  {waiting > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const result = await markSignupsNotified();
                        if (!result.ok) toast.error(result.error);
                        else {
                          toast.success(result.message ?? "Marked.");
                          router.refresh();
                        }
                      }}
                    >
                      Mark all as told
                    </Button>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-border rounded-lg border border-border">
                {signups.map((signup) => (
                  <li
                    key={signup.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-subtle"
                  >
                    <span className="min-w-0 flex-1 truncate text-ink">{signup.email}</span>
                    {signup.notified && (
                      <Badge tone="neutral">told</Badge>
                    )}
                    <time
                      dateTime={signup.createdAt}
                      className="flex-shrink-0 font-mono text-[11px] tabular-nums text-ink-faint"
                    >
                      {new Date(signup.createdAt).toLocaleDateString()}
                    </time>
                    <button
                      type="button"
                      onClick={() => forget(signup)}
                      aria-label={`Remove ${signup.email}`}
                      className="flex-shrink-0 rounded-full border border-rose/30 p-1.5 text-rose transition-colors hover:bg-rose hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {fields.signups && signups.length === 0 && (
            <p className="text-xs text-ink-soft">
              Nobody has left an address yet. They will appear here.
            </p>
          )}
        </div>
      </Fieldset>
    </div>
  );
}
