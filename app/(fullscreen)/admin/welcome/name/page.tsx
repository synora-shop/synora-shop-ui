import Link from "next/link";
import { currentShop } from "@/lib/data/shop";
import { nameStore } from "@/app/(fullscreen)/admin/welcome/actions";

export const dynamic = "force-dynamic";

export default async function NameStorePage() {
  const shop = await currentShop();

  return (
    <div className="rise rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Step 2 of 3</p>
      <h1 className="rise rise-1 mt-4 text-3xl font-semibold sm:text-4xl">What is it called?</h1>
      <p className="rise rise-2 mt-3 text-sm text-white/70">
        This is the name your customers see. You can change it any time from settings.
      </p>

      <form action={nameStore} className="rise rise-3 mt-8">
        <input
          name="name"
          autoFocus
          defaultValue={shop?.name ?? ""}
          maxLength={60}
          placeholder="Your store name"
          aria-label="Store name"
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-lg text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
        />

        <div className="mt-6 flex items-center gap-4">
          <button className="lift rounded-full bg-white px-7 py-2.5 text-sm font-medium text-[#0b0b12] transition-transform hover:scale-[1.02]">
            Continue
          </button>
          <Link href="/admin/welcome/look" className="text-sm text-white/50 hover:text-white/80">
            Name it later
          </Link>
        </div>
      </form>
    </div>
  );
}
