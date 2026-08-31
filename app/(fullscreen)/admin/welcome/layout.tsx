import { finishWelcome } from "@/app/(fullscreen)/admin/welcome/actions";

/**
 * The welcome flow's own frame.
 *
 * Deliberately not the admin shell. A merchant seeing this has never used the
 * product, and a sidebar of twenty five links they cannot yet make sense of is
 * the worst possible first screen. One thing at a time, on its own.
 *
 * It lives under (fullscreen) for the reason that group exists: a nested layout
 * in Next adds to its parent, it cannot remove one. Filed under app/admin/ it
 * inherited the admin layout, whose "not onboarded yet" redirect then pointed
 * straight back here — a loop that took the whole admin down until it moved.
 *
 * The look is glass over a lit ground: a soft colour field behind, panels that
 * let it through. It is built from a blurred backdrop and translucent white
 * rather than images, so it costs nothing to load and adapts to whatever the
 * shop's own accent turns out to be.
 */
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full flex-1 overflow-y-auto bg-[#0b0b12] text-white">
      {/* The lit ground. Three soft fields rather than a gradient, so the
          colour moves across the screen instead of banding down it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="drift absolute -left-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.55),transparent_65%)] blur-3xl" />
        <div className="drift-slow absolute -right-32 top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.40),transparent_65%)] blur-3xl" />
        <div className="drift-slower absolute bottom-[-14rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.35),transparent_65%)] blur-3xl" />
      </div>

      <div className="relative flex min-h-full flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="text-sm font-medium tracking-wide text-white/70">
            Shop by Synora Digitals
          </span>

          {/* The only way out, and always available. There was a second one in
              the footer — a plain link to the dashboard — which never marked
              setup finished, so it could only ever bounce back to here. Two
              controls that look like the same act must be the same act. */}
          <form action={finishWelcome}>
            <button className="rounded-full px-4 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              Skip setup
            </button>
          </form>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-2xl">{children}</div>
        </main>

      </div>
    </div>
  );
}
