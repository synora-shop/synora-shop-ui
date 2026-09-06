import { db } from "@/lib/data/shop";
import { SITE_TEXT_DEFAULTS, siteTextLabel } from "@/lib/site-text";
import { SiteTextRow } from "@/components/admin/site-text-row";
import { SectionDivider } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminSiteTextPage() {
  // Only the keys this shop has actually overridden; the rest fall back to
  // SITE_TEXT_DEFAULTS below.
  const overrides = await (await db()).siteText.findMany();
  const overrideMap = new Map(overrides.map((o) => [o.key, o.value]));

  const groups = new Map<string, { key: string; label: string; group: string }[]>();
  for (const [key, { group }] of Object.entries(SITE_TEXT_DEFAULTS)) {
    const label = siteTextLabel(key);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ key, label, group });
  }

  return (
    <div>
      <p className="text-sm text-ink-soft">
        Button labels and small pieces of copy used across the site. Editing more of these
        rolls out over time, this is the first batch.
      </p>

      <div className="mt-6 space-y-8">
        {Array.from(groups.entries()).map(([group, keys]) => (
          <div key={group}>
            <SectionDivider title={group} />
            <div className="mt-2 rounded-xl border border-border bg-surface p-4">
              {keys.map(({ key, label }) => {
                const defaultValue = SITE_TEXT_DEFAULTS[key].value;
                const isOverridden = overrideMap.has(key);
                return (
                  <SiteTextRow
                    key={key}
                    itemKey={key}
                    label={label}
                    group={group}
                    value={overrideMap.get(key) ?? defaultValue}
                    defaultValue={defaultValue}
                    isOverridden={isOverridden}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
