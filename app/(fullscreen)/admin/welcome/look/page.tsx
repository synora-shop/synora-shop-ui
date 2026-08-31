import { currentShop } from "@/lib/data/shop";
import { finishWelcome } from "@/app/(fullscreen)/admin/welcome/actions";
import { registryBusinessType } from "@/lib/themes/business-type";
import { themesFor } from "@/lib/themes/registry";

export const dynamic = "force-dynamic";

/**
 * Step three shows what they are getting rather than asking for a logo upload.
 *
 * An upload is the worst possible last step: it is the one thing a merchant
 * probably does not have to hand on their first evening, and failing it would
 * end the flow on a task rather than on their shop. The logo lives in settings,
 * where it will still be there tomorrow.
 */
export default async function LookPage() {
  const shop = await currentShop();
  const type = registryBusinessType(shop?.businessType);
  const themes = themesFor(type);

  return (
    <div className="rise rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Step 3 of 3</p>
      <h1 className="rise rise-1 mt-4 text-3xl font-semibold sm:text-4xl">
        You are all set
      </h1>
      <p className="rise rise-2 mt-3 text-sm text-white/70">
        {/* The name is stated, never claimed as something just decided. A
            merchant who pressed "Name it later" a moment ago and is then told
            their store is called something has been contradicted by the step
            that follows their own click. */}
        {shop?.name ? `Your store is ${shop.name}. ` : ""}
        {themes.length} designs are waiting, and everything in them can be changed.
        Add your logo whenever you have one.
      </p>

      <div className="rise rise-3 mt-8 grid gap-3 sm:grid-cols-2">
        {themes.map((theme) => (
          <div
            key={theme.key}
            className="rounded-2xl border border-white/15 bg-white/5 p-5"
          >
            <p className="font-medium">{theme.name}</p>
            <p className="mt-1 text-sm text-white/60">{theme.description}</p>
          </div>
        ))}
      </div>

      <form action={finishWelcome} className="rise rise-4 mt-8">
        <button className="lift rounded-full bg-white px-8 py-3 text-sm font-medium text-[#0b0b12] transition-transform hover:scale-[1.02]">
          Open my dashboard
        </button>
      </form>
    </div>
  );
}
