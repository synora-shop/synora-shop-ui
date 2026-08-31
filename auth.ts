import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyOtpCode, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { clearRateLimit, rateLimit } from "@/lib/rate-limit";

/** One shop a signed-in user can act in, and what they may do there. */
export type ShopMembership = {
  shopId: string;
  subdomain: string;
  role: "OWNER" | "ADMIN" | "STAFF" | "VIEWER";
};

/**
 * The shops a user belongs to.
 *
 * Only accepted memberships count — an invitation that has not been taken up
 * is not access, and treating it as such would let an invite address grant
 * entry before the person ever proved they control it.
 */
async function loadMemberships(userId: string): Promise<ShopMembership[]> {
  const rows = await prisma.membership.findMany({
    where: { userId, acceptedAt: { not: null } },
    select: { shopId: true, role: true, shop: { select: { subdomain: true } } },
  });
  return rows.map((r) => ({ shopId: r.shopId, subdomain: r.shop.subdomain, role: r.role }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account/login",
  },
  providers: [
    Credentials({
      // Merchant and staff sign-in, and the first factor of admin sign-in.
      // Passing this alone is NOT enough to reach /admin: the panel only trusts
      // a session minted by the "admin-otp" provider below. Shoppers use the
      // "customer" provider instead — they are not Users at all.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const raw = credentials?.email;
        const password = credentials?.password;
        if (typeof raw !== "string" || typeof password !== "string") return null;
        const email = raw.trim().toLowerCase();

        // Throttled by address rather than by IP: an attacker rotating through
        // proxies still cannot grind one account, and a shared office address
        // does not lock out a whole company for one person's typo.
        const limited = await rateLimit("login", email);
        if (!limited.ok) throw new Error(limited.message);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // An unconfirmed address cannot sign in. Until someone opens the link,
        // nobody has shown they can read the inbox the account was opened
        // with — so a typo, or somebody else's address, would otherwise be a
        // working account, and every recovery route for it would deliver to a
        // stranger.
        //
        // Refused the same way a wrong password is, and deliberately: saying
        // "confirm your email" would confirm the address is registered. The
        // sign-in page carries the way out instead, where it helps everyone
        // and singles out nobody.
        if (!user.emailVerifiedAt) return null;

        // Cleared on success so someone who mistyped twice and then got it
        // right is not still carrying those attempts.
        await clearRateLimit("login", email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          // Stamped into the token so a session issued before a password
          // change can be told apart from one issued after.
          issuedFor: user.sessionsValidFrom.getTime(),
        };
      },
    }),
    Credentials({
      // Shopper sign-in. A separate provider from the one above because a
      // shopper is a different kind of principal: they belong to exactly one
      // shop, and the same email at another shop is a different person as far
      // as either merchant is concerned.
      id: "customer",
      name: "Customer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        shopId: { label: "Shop", type: "text" },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        const shopId = typeof credentials?.shopId === "string" ? credentials.shopId : "";
        if (!email || !password || !shopId) return null;

        // Scoped by construction: the lookup is on (shopId, email), so a
        // password that is valid at one shop cannot open an account at another.
        const customer = await prisma.customer.findUnique({
          where: { shopId_email: { shopId, email } },
        });
        if (!customer?.passwordHash) return null;

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) return null;

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          customerId: customer.id,
          customerShopId: shopId,
        };
      },
    }),
    Credentials({
      // Second factor for admin login. Only reachable after
      // /api/admin/request-otp has already verified email + password and
      // emailed a code — this provider never checks a password itself, only a
      // valid, unexpired, unconsumed OTP belonging to an ADMIN account.
      id: "admin-otp",
      name: "Admin OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const code = typeof credentials?.otp === "string" ? credentials.otp.trim() : "";
        if (!email || !code) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // Sign-in happens before any shop is chosen, so this asks the weaker
        // question: does this person administer anything at all? Which shop
        // they may act in is decided per request, in proxy.ts and
        // lib/auth-guard.ts, from the memberships carried in the token.
        const memberships = await prisma.membership.count({
          where: { userId: user.id, acceptedAt: { not: null } },
        });
        if (memberships === 0) return null;

        const record = await prisma.adminOtp.findFirst({
          where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!record || record.attempts >= OTP_MAX_ATTEMPTS) return null;

        const valid = await verifyOtpCode(code, record.codeHash);
        if (!valid) {
          await prisma.adminOtp.update({
            where: { id: record.id },
            data: { attempts: { increment: 1 } },
          });
          return null;
        }

        // One-time use — a consumed row can never authorize a second session.
        await prisma.adminOtp.update({
          where: { id: record.id },
          data: { consumedAt: new Date() },
        });

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id;
        token.issuedFor = (user as { issuedFor?: number }).issuedFor;
        token.revalidatedAt = Date.now();
        // A shopper session carries the customer it belongs to, and the shop
        // it belongs to, so neither can be inferred from the other later.
        const asCustomer = user as { customerId?: string; customerShopId?: string };
        token.customerId = asCustomer.customerId;
        token.customerShopId = asCustomer.customerShopId;
      }
      // Memberships travel in the token so the proxy can authorise a request
      // without a database round trip on every navigation. Refreshed on
      // sign-in and whenever the session is explicitly updated, which is when
      // staff access can actually have changed.
      // A password change or an explicit revoke moves sessionsValidFrom
      // forward; a token stamped before that moment must stop working. That is
      // what makes "sign out everywhere" mean anything against a token someone
      // else already holds.
      //
      // Re-checked at most once a minute rather than on every request. This
      // callback runs on every page load, and a database round trip there would
      // be the single most expensive thing in the app — a bounded one-minute
      // window is the right trade against that.
      if (!user && token.id && !token.customerId) {
        const lastChecked = (token.revalidatedAt as number | undefined) ?? 0;
        if (Date.now() - lastChecked > 60_000) {
          const current = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { sessionsValidFrom: true },
          });
          if (!current) return null;
          if (((token.issuedFor as number | undefined) ?? 0) < current.sessionsValidFrom.getTime()) {
            return null;
          }
          token.revalidatedAt = Date.now();
        }
      }

      // A shopper has no User row and therefore no memberships; skipping the
      // lookup avoids a query that can only ever return nothing.
      if ((user || trigger === "update") && !token.customerId) {
        const id = (user?.id ?? token.id) as string | undefined;
        token.shops = id ? await loadMemberships(id) : [];
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.shops = (token.shops as ShopMembership[]) ?? [];
        session.user.customerId = token.customerId as string | undefined;
        session.user.customerShopId = token.customerShopId as string | undefined;
      }
      return session;
    },
  },
});
