import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_DOMAIN } from "@/lib/shop-context";
import { roleLabel } from "@/lib/roles";
import { openStore } from "./actions";
import { FormHeading, FormMessage } from "@/components/merchant/form-shell";
import { CreateStoreForm } from "@/components/merchant/create-store-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your stores",
  robots: { index: false, follow: false },
};

/**
 * Where signing in lands.
 *
 * Most merchants have one store and should never see this page — they get sent
 * straight to its dashboard. It exists for the ones who have several, and for
 * the moment after someone accepts an invitation to a second.
 */
export default async function StoresPage(props: PageProps<"/merchant/stores">) {
  const sp = await props.searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/merchant/login?callbackUrl=/merchant/stores");

  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { shop: { select: { id: true, name: true, subdomain: true, status: true } } },
    orderBy: { invitedAt: "asc" },
  });

  // No store: make one here. Sign-up cannot, because sign-up makes an account
  // and this person has one (a Synora master admin testing the merchant side,
  // or a merchant whose store was closed). Since 14 October.
  if (memberships.length === 0) {
    return (
      <>
        <FormHeading title="Create your store" description="You're signed in, but you don't have a store yet. Name it and you'll be in your dashboard." />
        <CreateStoreForm platformDomain={PLATFORM_DOMAIN} />
      </>
    );
  }

  // One store is not a choice. Straight through, without writing a cookie —
  // a server component may not set one, and the dashboard resolves a sole
  // membership by itself.
  if (memberships.length === 1) redirect("/admin");

  return (
    <>
      <FormHeading title="Your stores" description="Pick the one you want to work on." />
      {sp.error === "access" && (
        <FormMessage tone="error" className="mb-4">
          You don&rsquo;t have access to that store.
        </FormMessage>
      )}
      <div className="space-y-2">
        {memberships.map((m) => (
          <form key={m.shopId} action={openStore.bind(null, m.shopId)}>
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-white">
                <Store className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{m.shop.name}</span>
                <span className="block truncate text-xs text-ink-soft">
                  {m.shop.subdomain}.{PLATFORM_DOMAIN} · {roleLabel(m.role).toLowerCase()}
                  {m.shop.status === "PAUSED" && " · paused"}
                  {m.shop.status === "CLOSED" && " · closed"}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-faint group-hover:text-brand-600" />
            </button>
          </form>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/merchant/signup" className="font-medium text-brand-600 underline-scribble">
          Open another store
        </Link>
      </p>
    </>
  );
}
