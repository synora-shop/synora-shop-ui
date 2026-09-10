import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getThemeTokens, getThemeLayout } from "@/lib/data/theme";
import { db, requireShop } from "@/lib/data/shop";
import { themeFor } from "@/lib/themes/registry";
import { resolveThemeTokens } from "@/lib/theme-tokens";
import { resolveThemeLayout } from "@/lib/theme-layout";
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
export default async function CustomizeThemePage(props: PageProps<"/admin/customize/theme">) {
  /**
   * Which theme is being edited.
   *
   * `?theme=<key>` names one; without it, the live one. The parameter is what
   * makes an unpublished theme editable — the panel is otherwise identical,
   * because a draft and a published design are the same thing to a merchant
   * until they press Publish.
   *
   * Checked against the shop's own library rather than trusted: a key nobody
   * added is not a theme this shop can edit, and quietly editing the live one
   * instead would be worse than saying so.
   */
  const sp = await props.searchParams;
  const asked = typeof sp.theme === "string" ? sp.theme : null;
  const shop = await requireShop();
  const [installed, liveRow] = await Promise.all([
    (await db()).installedTheme.findMany({ select: { themeKey: true } }),
    (await db()).themeSettings.findFirst({
      where: { businessType: shop.businessType },
      select: { themeKey: true },
    }),
  ]);
  const live = liveRow?.themeKey ?? "aurora";
  const editing = asked && installed.some((r) => r.themeKey === asked) ? asked : live;
  const theme = themeFor(editing);

  // Both halves of "what does my shop look like", merged for one panel. They
  // are stored separately and split again on save — see saveThemeTokens.
  //
  // For the live theme these come from the request's own resolution. For a
  // draft they are read directly, because nothing about this request is
  // rendering that theme.
  const edits = installed.length
    ? await (await db()).installedTheme.findFirst({ where: { themeKey: editing } })
    : null;
  const [tokens, layout] =
    editing === live
      ? await Promise.all([getThemeTokens(), getThemeLayout()])
      : [
          resolveThemeTokens({ ...theme.tokens, ...((edits?.tokens ?? {}) as object) }),
          resolveThemeLayout({ ...theme.layout, ...((edits?.layout ?? {}) as object) }),
        ];

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
        <span className="text-sm font-semibold">{theme.name}</span>
        {editing !== live && (
          <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
            Draft — not live
          </span>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl p-4">
          <ThemePanel initialTokens={{ ...tokens, ...layout }} themeKey={editing} />
        </div>
      </div>
    </div>
  );
}
