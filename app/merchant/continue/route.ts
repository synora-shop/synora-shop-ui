import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isTeamEmail } from "@/lib/team";

/**
 * Where signing in goes when nothing asked for somewhere in particular
 * (14 October): a merchant back to the front page, now signed in, with "Go to
 * dashboard" and their avatar in the header; a Synora master admin to the
 * console. A sign-in that came from a page (callbackUrl) goes back to it
 * instead and never passes through here.
 */
export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user;
  const to = !user?.id || user.customerId ? "/merchant/login" : isTeamEmail(user.email) ? "/synora" : "/";
  return NextResponse.redirect(new URL(to, req.url));
}
