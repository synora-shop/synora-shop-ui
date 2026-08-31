import type { Metadata } from "next";
import { auth } from "@/auth";
import { inviteSummary } from "@/lib/data/invite";
import { ROLE_DESCRIPTION } from "@/lib/roles";
import { AcceptInvite } from "@/components/merchant/accept-invite";
import {
  FormFooter,
  FormHeading,
  FormLink,
  FormMessage,
} from "@/components/merchant/form-shell";

export const metadata: Metadata = {
  title: "Join a store",
  robots: { index: false, follow: false },
};

const DEAD_INVITE: Record<string, string> = {
  unknown: "That invitation link isn't valid. Ask whoever invited you to send another.",
  revoked: "That invitation was withdrawn.",
  used: "That invitation has already been used. Try signing in.",
  expired: "That invitation has expired. Ask for a new one.",
};

export default async function InvitePage(props: PageProps<"/merchant/invite">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  const [invite, session] = await Promise.all([inviteSummary(token), auth()]);

  if (!invite.ok) {
    return (
      <>
        <FormHeading title="Join a store" />
        <FormMessage tone="error">{DEAD_INVITE[invite.reason]}</FormMessage>
        <FormFooter>
          <FormLink href="/merchant/login">Sign in</FormLink>
        </FormFooter>
      </>
    );
  }

  const summary = (
    <div className="mb-6 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-ink">
        <span className="font-medium">{invite.email}</span> has been invited to work on{" "}
        <span className="font-medium">{invite.shopName}</span>.
      </p>
      <p className="mt-2 text-xs leading-snug text-ink-soft">
        Access level: {invite.role.toLowerCase()}, {ROLE_DESCRIPTION[invite.role]}
      </p>
    </div>
  );

  // Signing in is required before accepting, and the account has to be the one
  // the invitation was addressed to. Both are enforced in acceptInvite; this
  // just avoids sending someone into a button that is going to refuse them.
  const signedInAs = session?.user?.email?.toLowerCase();

  if (!signedInAs) {
    const next = `/merchant/invite?token=${encodeURIComponent(token)}`;
    return (
      <>
        <FormHeading title={`Join ${invite.shopName}`} />
        {summary}
        <FormMessage tone="success">
          Sign in as {invite.email} to accept. If you don&rsquo;t have an account yet, create one with
          that address first.
        </FormMessage>
        <div className="mt-4 space-y-2">
          <FormLink href={`/merchant/login?callbackUrl=${encodeURIComponent(next)}`}>
            Sign in
          </FormLink>
          <span className="px-2 text-ink-faint">·</span>
          <FormLink href="/merchant/signup">Create an account</FormLink>
        </div>
      </>
    );
  }

  if (signedInAs !== invite.email.toLowerCase()) {
    return (
      <>
        <FormHeading title={`Join ${invite.shopName}`} />
        {summary}
        <FormMessage tone="error">
          You&rsquo;re signed in as {signedInAs}. This invitation was sent to {invite.email}, sign in
          with that address to accept it.
        </FormMessage>
      </>
    );
  }

  return (
    <>
      <FormHeading title={`Join ${invite.shopName}`} />
      {summary}
      <AcceptInvite token={token} shopName={invite.shopName} />
    </>
  );
}
