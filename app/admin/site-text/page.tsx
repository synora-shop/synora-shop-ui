import { db } from "@/lib/data/shop";
import { SITE_TEXT_DEFAULTS } from "@/lib/site-text";
import { SiteTextRow } from "@/components/admin/site-text-row";

export const dynamic = "force-dynamic";

export default async function AdminSiteTextPage() {
  // Only the keys this shop has actually overridden; the rest fall back to
  // SITE_TEXT_DEFAULTS below.
  const overrides = await (await db()).siteText.findMany();
  const overrideMap = new Map(overrides.map((o) => [o.key, o.value]));

  const groups = new Map<string, { key: string; label: string; group: string }[]>();
  for (const [key, { group }] of Object.entries(SITE_TEXT_DEFAULTS)) {
    const label = key.split(".").slice(1).join(" ") || key;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ key, label, group });
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Site Text</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Button labels and small pieces of copy used across the site. Editing more of these
        rolls out over time, this is the first batch.
      </p>

      <div className="mt-6 space-y-8">
        {Array.from(groups.entries()).map(([group, keys]) => (
          <div key={group} className="rounded-lg border border-border bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">{group}</h2>
            <div className="mt-2">
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
