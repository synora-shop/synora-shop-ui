"use client";

import { useState, useTransition } from "react";
import { Crown, Mail, Trash2, UserPlus, X } from "lucide-react";
import {
  changeRole,
  inviteStaff,
  removeStaff,
  revokeInvite,
  transferOwnership,
} from "@/app/admin/staff/actions";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTION,
  roleLabel,
  type MemberRole,
} from "@/lib/roles";
import { canChangeRole, canGrant, canRemove } from "@/lib/staff-rules";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export type StaffMember = {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
  emailVerified: boolean;
  acceptedAt: string | null;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: string;
};

const ROLE_TONE = {
  OWNER: "brand",
  ADMIN: "good",
  STAFF: "neutral",
  VIEWER: "neutral",
} as const;

export function StaffManager({
  members,
  invites,
  me,
}: {
  members: StaffMember[];
  invites: PendingInvite[];
  me: { userId: string; role: MemberRole };
}) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [inviting, setInviting] = useState(false);

  const isOwner = me.role === "OWNER";
  const actor = { userId: me.userId, role: me.role };

  /**
   * Only the levels this person can actually hand out.
   *
   * The same rules run on the server and will refuse anything else, but a
   * dropdown that offers a choice and then rejects it is a worse way to learn
   * a rule than a dropdown that never offered it. An admin, for instance, sees
   * Staff and Viewer but not Admin.
   */
  const grantable = ASSIGNABLE_ROLES.filter((role) => canGrant(actor, role) === null);

  /**
   * Every action here goes through one place so a refusal always reaches the
   * user. These actions return `{ ok: false, error }` rather than throwing, and
   * an early version of this component ignored the falsy branch — the button
   * looked like it worked and nothing happened.
   */
  const run = (
    action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error, { blocking: true });
    });
  };

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const role = String(data.get("role") ?? "STAFF") as MemberRole;

    run(async () => {
      const result = await inviteStaff(email, role);
      if (result.ok) {
        form.reset();
        setInviting(false);
      }
      return result;
    });
  }

  return (
    <div className="space-y-6">
      {dialog}

      {/* ------------------------------------------------------------ invite */}
      <Card className="p-4">
        {inviting ? (
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                name="email"
                type="email"
                required
                autoFocus
                placeholder="their@email.com"
                className="input min-w-0 flex-1"
              />
              <select name="role" defaultValue="STAFF" className="input sm:w-40">
                {grantable.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Sending…" : "Send invitation"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setInviting(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs leading-snug text-ink-soft">
              They&rsquo;ll get a link that works for seven days. It only works for the address you
              send it to.
            </p>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Add someone to this store</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                They keep their own sign-in. You choose what they can reach.
              </p>
            </div>
            <Button variant="primary" onClick={() => setInviting(true)}>
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          </div>
        )}
      </Card>

      {/* ----------------------------------------------------------- members */}
      <div>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
          People ({members.length})
        </h2>
        <Card className="divide-y divide-border">
          {members.map((member) => {
            const isMe = member.userId === me.userId;
            // The same shape the server rules take, so the controls shown here
            // and the acts the server will allow cannot drift apart.
            const target = { userId: member.userId, role: member.role };
            return (
              <div
                key={member.membershipId}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                    <span className="truncate">{member.name || member.email}</span>
                    <Badge tone={ROLE_TONE[member.role]}>
                      {member.role === "OWNER" && <Crown className="h-3 w-3" />}
                      {member.role.toLowerCase()}
                    </Badge>
                    {isMe && <Badge>you</Badge>}
                    {!member.emailVerified && <Badge tone="warn">email unconfirmed</Badge>}
                    {!member.acceptedAt && <Badge tone="neutral">not joined yet</Badge>}
                  </p>
                  {member.name && (
                    <p className="mt-0.5 truncate text-xs text-ink-soft">{member.email}</p>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {/* The owner's row has no role picker: changing it here would
                      be the one edit that can leave a shop unadministrable. */}
                  {canChangeRole(actor, target, member.role) === null && (
                    <select
                      value={member.role}
                      disabled={pending}
                      onChange={(e) =>
                        run(() => changeRole(member.membershipId, e.target.value as MemberRole))
                      }
                      className="input h-8 w-auto py-0 text-xs"
                      aria-label={`Access level for ${member.email}`}
                    >
                      {grantable.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  )}

                  {isOwner && member.role !== "OWNER" && member.acceptedAt && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Make ${member.email} the owner?`,
                          description:
                            "They get full control of this store, including billing and closing it. You become an admin. Only they can hand it back.",
                          confirmLabel: "Transfer ownership",
                          danger: true,
                        });
                        if (ok) run(() => transferOwnership(member.membershipId));
                      }}
                    >
                      <Crown className="h-3.5 w-3.5" />
                      Make owner
                    </Button>
                  )}

                  {canRemove(actor, target) === null && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      aria-label={`Remove ${member.email}`}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Remove ${member.email}?`,
                          description:
                            "They lose access to this store straight away. Their own account stays.",
                          confirmLabel: "Remove",
                          danger: true,
                        });
                        if (ok) run(() => removeStaff(member.membershipId));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* ----------------------------------------------------------- invites */}
      {invites.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Waiting to join ({invites.length})
          </h2>
          <Card className="divide-y divide-border">
            {invites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center gap-3 p-4">
                <Mail className="h-4 w-4 flex-shrink-0 text-ink-faint" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{invite.email}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Invited as {invite.role.toLowerCase()} · link expires{" "}
                    {new Date(invite.expiresAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label={`Withdraw the invitation to ${invite.email}`}
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Withdraw the invitation to ${invite.email}?`,
                      description: "Their link stops working immediately.",
                      confirmLabel: "Withdraw",
                      danger: true,
                    });
                    if (ok) run(() => revokeInvite(invite.id));
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Withdraw
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- roles */}
      <Card className="p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint">
          What each level means
        </h2>
        <dl className="mt-3 space-y-2">
          {(["OWNER", ...ASSIGNABLE_ROLES] as MemberRole[]).map((role) => (
            <div key={role} className="flex gap-3 text-xs">
              <dt className="w-16 flex-shrink-0 font-medium text-ink">
                {roleLabel(role)}
              </dt>
              <dd className="text-ink-soft">{ROLE_DESCRIPTION[role]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
