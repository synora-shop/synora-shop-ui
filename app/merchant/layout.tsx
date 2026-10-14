import Link from "next/link";
import { ArrowLeft, Check, CreditCard, ShoppingBag } from "lucide-react";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { formatMoney } from "@/lib/money";

/**
 * The shell for merchant account flows: signing up, signing in, confirming an
 * address, resetting a password, accepting an invitation.
 *
 * Separate from both the storefront and the admin panel on purpose. These pages
 * belong to the platform, not to any one shop — several of them run before a
 * shop exists, and one of them (invitations) is followed on a domain the person
 * has never visited. So no shop chrome, no navigation, nothing to click but the
 * thing the page is for.
 *
 * Redrawn 15 October to match the front page: the form in a white column, and
 * beside it on a wide screen the front page's colour panel saying what the
 * account is for. Only the look changed — every form is the one it was.
 *
 * The form pieces it holds (Field, FormMessage, the .input box) are shared with
 * the admin panel, so the new look reaches them only inside `.auth-shell`
 * (app/globals.css) — the panel's own forms are untouched.
 */
const pkr = (n: number) => formatMoney(n, "PKR");

export default function MerchantLayout({ children }: LayoutProps<"/merchant">) {
  return (
    <div className="auth-shell grid min-h-dvh bg-white font-sans text-[#0d0d50] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* The form. */}
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden px-5 sm:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_100%_at_20%_0%,rgba(183,185,255,0.35),rgba(255,255,255,0)_70%),radial-gradient(60%_90%_at_90%_0%,rgba(200,231,255,0.45),rgba(255,255,255,0)_70%)] lg:hidden" />
        <header className="flex items-center justify-between py-6 sm:py-8">
          <Link
            href="/"
            className="rounded text-[#0d0d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666ff] focus-visible:ring-offset-4"
          >
            <SynoraAppMark />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[#0d0d50]/60 transition-colors hover:bg-[#0d0d50]/[0.05] hover:text-[#0d0d50]">
            <ArrowLeft className="h-4 w-4" /> Back to the site
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        <p className="py-6 text-center text-xs text-[#0d0d50]/40">Made for Pakistan · © {new Date().getFullYear()} Synora Digitals</p>
      </div>

      {/* What the account is for — wide screens only. */}
      <aside aria-hidden className="relative hidden p-3 lg:sticky lg:top-0 lg:block lg:h-dvh lg:self-start">
        <div className="relative isolate flex h-full flex-col justify-between overflow-hidden rounded-[2.25rem] p-12 xl:p-16" style={{ background: "linear-gradient(140deg, #6666ff 0%, #7375ff 45%, #9fa1ff 70%, #c8e7ff 88%, #b8efd6 100%)" }}>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(70%_70%_at_50%_45%,#000,transparent)]" />

          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-medium text-white">
              <span className="rounded-full bg-[#b8efd6] px-1.5 text-[10px] font-bold text-[#0d0d50]">PK</span> Made for Pakistan
            </p>
            <p className="mt-6 max-w-md text-[3.2rem] font-semibold leading-[1] tracking-[-0.045em] text-white xl:text-[3.8rem]">Your shop, made for Pakistan.</p>
          </div>

          {/* Two pieces of a shop's day, floating. */}
          <div className="relative h-[220px]">
            <div className="lp-piece absolute left-0 top-2 w-[260px] rounded-[22px] bg-white p-4 shadow-[0_24px_60px_-22px_rgba(13,13,80,0.45)]" style={{ ["--r" as string]: "-5deg", ["--d" as string]: "7s" }}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6666ff] text-white">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">New order #1043</p>
                  <p className="text-[12px] text-[#0d0d50]/60">{pkr(8900)} · Lahore</p>
                </div>
              </div>
            </div>
            <div className="lp-piece absolute right-4 top-24 w-[240px] rounded-[22px] bg-[#b8efd6] p-4 shadow-[0_24px_60px_-22px_rgba(13,13,80,0.45)]" style={{ ["--r" as string]: "4deg", ["--d" as string]: "8s", ["--delay" as string]: "0.8s" }}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/70">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">Paid with JazzCash</p>
                  <p className="text-[12px] text-[#0d0d50]/65">{pkr(8900)} received</p>
                </div>
              </div>
            </div>
          </div>

          <ul className="flex flex-col gap-3 text-[15px] font-medium text-white">
            {["Cash on delivery, JazzCash and Easypaisa", "Your own domain, whenever you are ready", "Nothing sold back to you as an add-on"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/25">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
