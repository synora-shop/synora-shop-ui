import Link from "next/link";

export const dynamic = "force-dynamic";

/** Step one. No form, nothing to decide, just a door. */
export default function WelcomePage() {
  return (
    <div className="rise rounded-3xl border border-white/15 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-2xl sm:p-14">
      <p className="rise rise-1 text-xs uppercase tracking-[0.3em] text-white/50">Welcome</p>

      <h1 className="rise rise-2 mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
        Let us set up your store
      </h1>

      <p className="rise rise-3 mx-auto mt-5 max-w-md text-base leading-relaxed text-white/70">
        Three short questions. You can skip any of them, change your mind later, and
        nothing here is permanent.
      </p>

      <Link
        href="/admin/welcome/type"
        className="rise rise-4 lift mt-10 inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-medium text-[#0b0b12] transition-transform hover:scale-[1.02]"
      >
        Get started
      </Link>
    </div>
  );
}
