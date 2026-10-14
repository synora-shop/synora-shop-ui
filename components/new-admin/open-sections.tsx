import type { ReactNode } from "react";
import { SectionFilter, SectionIndex } from "@/components/new-admin/bits";
import { ICONS, TONE } from "@/components/new-admin/ui";
import type { Tone } from "@/lib/new-admin/sample";

/**
 * A long page of open sections with an index that follows you (preview):
 * Settings, Preferences and Store-wide look all read this way. No card that
 * leads elsewhere and back; each section is marked by its colour.
 */
export type OpenSection = { id: string; label: string; tone: Tone; icon: string; blurb: string; body: ReactNode; words?: string };

export function OpenSections({ sections, title, wide = false, searchable = false }: { sections: OpenSection[]; title: string; wide?: boolean; searchable?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        {searchable && <SectionFilter />}
        <SectionIndex title={title} items={sections.map(({ id, label, tone, icon }) => ({ id, label, tone, icon }))} />
      </div>
      <div className={`flex min-w-0 flex-col gap-11 ${wide ? "" : "max-w-3xl"}`}>
        {sections.map((s) => {
          const Icon = ICONS[s.icon];
          return (
            <section key={s.id} id={s.id} data-open-section={`${s.label} ${s.blurb} ${s.words ?? ""}`.toLowerCase()} className="scroll-mt-20">
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
