import type { ReactNode } from "react";
import { SectionFilter, SectionIndex } from "@/components/new-admin/bits";
import { ICONS, TONE } from "@/components/new-admin/ui";
import type { Tone } from "@/lib/new-admin/sample";

/**
 * A long page of open sections with an index that follows you (preview):
 * Settings, Preferences and Store-wide look all read this way. No card that
 * leads elsewhere and back; each section is marked by its colour.
 */
export type OpenSection = { id: string; label: string; tone: Tone; icon: string; blurb: string; body: ReactNode; words?: string; group?: string };

export function OpenSections({ sections, title, wide = false, searchable = false }: { sections: OpenSection[]; title: string; wide?: boolean; searchable?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-3 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100dvh-5.5rem)] lg:self-start">
        {searchable && <SectionFilter />}
        <SectionIndex title={title} items={sections.map(({ id, label, tone, icon, group }) => ({ id, label, tone, icon, group }))} />
      </div>
      <div className={`flex min-w-0 flex-col gap-11 ${wide ? "" : "max-w-3xl"}`}>
        {sections.map((s, i) => {
          const Icon = ICONS[s.icon];
          const groupStart = s.group && s.group !== sections[i - 1]?.group;
          return (
            <section key={s.id} id={s.id} data-open-section={`${s.label} ${s.blurb} ${s.words ?? ""}`.toLowerCase()} className="scroll-mt-20">
              {groupStart && (
                <p className="mb-5 flex items-center gap-3 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a]/40">
                  {s.group}
                  <span className="h-px flex-1 bg-[#0a0a0a]/10" />
                </p>
              )}
              <div className="mb-3.5 flex items-start gap-3.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${TONE[s.tone].chip}`}><Icon className="h-[18px] w-[18px]" /></span>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{s.label}</h2>
                  <p className="text-[13.5px] text-[#0a0a0a]/55">{s.blurb}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">{s.body}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
