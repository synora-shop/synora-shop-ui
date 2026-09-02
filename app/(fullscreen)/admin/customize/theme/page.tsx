import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getThemeTokens } from "@/lib/data/theme";
import { ThemePanel } from "@/components/customizer/theme-panel";

/**
 * Colours, type and shape for the whole store.
 *
 * It used to sit underneath the theme picker on an admin page, with a second
 * copy of the live customizer beneath it — two editors on one screen, one of
 * them a duplicate of a thing that already exists at its own address.
 *
 * It belongs here instead: these settings apply to every page at once, and the
 * only way to judge a colour is against the store wearing it. The customizer's
 * Theme button opens this, and this goes back to the customizer.
 */
export default async function CustomizeThemePage() {
  const tokens = await getThemeTokens();

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Link
          href="/admin/customize"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Customizer
        </Link>
        <span className="text-sm font-semibold">Theme</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl p-4">
          <ThemePanel initialTokens={tokens} />
        </div>
      </div>
    </div>
  );
}
