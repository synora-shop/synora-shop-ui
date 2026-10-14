import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Box, Field, Row, SectionIndex, Toggle } from "@/components/new-admin/bits";
import { ICONS, PageHeader, Pill, TONE } from "@/components/new-admin/ui";
import { SHOP, type Tone } from "@/lib/new-admin/sample";

export const metadata = { title: "Preferences" };

/**
 * Online Store preferences (preview): how the store behaves, every section
 * open on one page, the index following you down. The search preview shows
 * the page as Google would list it, from what is typed beside it.
 */
const SECTIONS: { id: string; label: string; tone: Tone; icon: string; blurb: string; body: ReactNode }[] = [
  {
    id: "access",
    label: "Store access",
    tone: "iris",
    icon: "security",
    blurb: "Who can see your store right now",
    body: (
      <Box>
        <Row label="Private mode" value="Only people with the password can enter. For before launch." right={<Toggle label="Private mode" />} />
        <Row label="Closed for a while" value="A holding page saying when you are back, with a way to be told" right={<Toggle label="Closed" />} />
      </Box>
    ),
  },
  {
    id: "seo",
    label: "Search and sharing",
    tone: "mint",
    icon: "domains",
    blurb: "How your store looks on Google, WhatsApp and Instagram",
    body: (
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Box title="As typed">
          <Field label="Home page title" value="Zohra Lawn · Embroidered lawn and pret, made in Lahore" hint="52 of 70 characters" />
          <Field label="Description" value="Three-piece lawn suits, chikankari kurtas and Eid formals. Cash on delivery across Pakistan." hint="103 of 320 characters" area />
        </Box>
        <Box title="As Google shows it">
          <div className="p-5">
            <p className="text-[12.5px] text-[#0a0a0a]/55">zohralawn.pk</p>
            <p className="mt-0.5 text-[17px] leading-snug text-[#1a0dab]">Zohra Lawn · Embroidered lawn and pret, made in Lahore</p>
            <p className="mt-1 text-[13.5px] leading-snug text-[#0a0a0a]/65">Three-piece lawn suits, chikankari kurtas and Eid formals. Cash on delivery across Pakistan.</p>
          </div>
          <div className="flex items-center gap-3 p-5">
            <span className="grid h-16 w-28 shrink-0 place-items-center rounded-lg bg-[#0a0a0a] text-[12px] font-semibold text-white">Share image</span>
            <span className="text-[13px] text-[#0a0a0a]/55">Shown when your link is shared on WhatsApp, Facebook or Instagram. 1200 by 628.</span>
          </div>
        </Box>
      </div>
    ),
  },
  {
    id: "chat",
    label: "Chat buttons",
    tone: "sky",
    icon: "users",
    blurb: "Buttons that float on every page of your store",
    body: (
      <Box>
        <Row label="WhatsApp" value="0300 1234567 · bottom right" right={<Toggle on label="WhatsApp button" />} />
        <Row label="Instagram" value="@zohralawn" right={<Toggle label="Instagram button" />} />
        <Row label="Call" value="Show a call button on phones" right={<Toggle label="Call button" />} />
      </Box>
    ),
  },
  {
    id: "redirects",
    label: "Links and redirects",
    tone: "lavender",
    icon: "domains",
    blurb: "Send old addresses to new ones, so no link you shared breaks",
    body: (
      <Box>
        <Row label="/eid-2025" value="goes to /collections/eid-edit" right={<Pill tone="off">301</Pill>} />
        <Row label="/lawn" value="goes to /collections/summer-lawn" right={<Pill tone="off">301</Pill>} />
        <Row label={<span className="inline-flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" /> Add a redirect</span>} />
      </Box>
    ),
  },
  {
    id: "spam",
    label: "Spam protection",
    tone: "mint",
    icon: "shield",
    blurb: "Keep bots out of your forms",
    body: (
      <Box>
        <Row label="Contact and enquiry forms" value="A quiet check that visitors are people" right={<Toggle on label="Form protection" />} />
        <Row label="Sign-in and sign-up" value="Slow down repeated attempts" right={<Toggle on label="Sign-in protection" />} />
      </Box>
    ),
  },
  {
    id: "tracking",
    label: "Tracking codes",
    tone: "iris",
    icon: "analytics",
    blurb: "Measure your ads and visitors with the tools you already use",
    body: (
      <Box>
        <Field label="Google Analytics" value="G-7XK2PL91QZ" />
        <Field label="Meta (Facebook and Instagram) pixel" value="Not added" />
        <Field label="TikTok pixel" value="Not added" />
      </Box>
    ),
  },
];

export default function OnlineStorePreferences() {
  return (
    <>
      <PageHeader icon="preferences" tone="sky" title="Preferences" sub={`How ${SHOP.name} behaves for visitors.`} />
      <div className="grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
        <SectionIndex title="On this page" items={SECTIONS.map(({ id, label, tone, icon }) => ({ id, label, tone, icon }))} />
        <div className="flex min-w-0 flex-col gap-10">
          {SECTIONS.map((s) => {
            const Icon = ICONS[s.icon];
            return (
              <section key={s.id} id={s.id} className="scroll-mt-6">
                <div className="mb-3.5 flex items-start gap-3.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${TONE[s.tone].chip}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{s.label}</h2>
                    <p className="text-[13.5px] text-[#0a0a0a]/55">{s.blurb}</p>
                  </div>
                </div>
                {s.body}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
