import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Where signing in goes when nothing asked for somewhere in particular
 * (14 October): back to the front page, now signed in, with "Dashboard" and
 * the avatar in the header (and, for a Synora master admin, the gold "Master
 * dashboard" beside them: the same layout as everyone, by Abdul's decision).
 * A sign-in that came from a page (callbackUrl) goes back to it instead and
 * never passes through here.
 */
export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user;
  const to = !user?.id || user.customerId ? "/merchant/login" : "/";
  return NextResponse.redirect(new URL(to, req.url));
}
