import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

/**
 * The shell for merchant account flows: signing up, signing in, confirming an
 * address, resetting a password, accepting an invitation.
 *
 * Separate from both the storefront and the admin panel on purpose. These pages
 * belong to the platform, not to any one shop — several of them run before a
 * shop exists, and one of them (invitations) is followed on a domain the person
 * has never visited. So no shop chrome, no navigation, nothing to click but the
 * thing the page is for.
 */
export default function MerchantLayout({ children }: LayoutProps<"/merchant">) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas font-sans text-ink">
      <header className="flex justify-center px-6 pt-10 sm:pt-16">
        <Link
          href="/"
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4"
        >
          <Wordmark size="md" />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
