import { Plus, X } from "lucide-react";
import { Box, Field, Row, Toggle } from "@/components/new-admin/bits";
import { PageHeader, Pill } from "@/components/new-admin/ui";
import { OpenSections, type OpenSection } from "@/components/new-admin/open-sections";

export const metadata = { title: "Preferences" };

/**
 * Online Store preferences (preview): who can see the store, and how it
 * behaves for them. The real Visibility, Maintenance and Links screens, plus
 * tracking codes, on one open page.
 */
const SECTIONS: OpenSection[] = [
  {
    id: "access", label: "Store access", tone: "iris", icon: "security", blurb: "Open, private, or closed for a while",
    body: (
      <>
        <Box>
          <Row label="Private mode" value="Only people with the password can enter. For before launch." right={<Toggle label="Private mode" />} />
          <Row label="Closed for a while" value="Customers see your holding page instead of the store" right={<Toggle label="Closed" />} />
        </Box>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Box title="Holding page">
            <Field label="Heading" value="Back on 1 November" />
            <Field label="Message" area value="We are photographing the Winter collection. Leave your email and we will tell you the moment we open." />
            <Row label="Let people ask to be told" value="38 people are waiting" right={<Toggle on label="Waiting list" />} />
          </Box>
          <Box title="As customers see it">
            <div className="flex min-h-[15rem] flex-col items-center justify-center gap-2 bg-[#0a0a0a] px-6 py-8 text-center text-white">
              <p className="text-[11px] font-bold tracking-[0.2em] text-white/50">ZOHRA LAWN</p>
              <p className="text-[22px] font-semibold">Back on 1 November</p>
              <p className="max-w-xs text-[13px] text-white/65">We are photographing the Winter collection. Leave your email and we will tell you the moment we open.</p>
              <span className="mt-2 flex w-full max-w-xs overflow-hidden rounded-full bg-white/10 text-[12.5px]"><span className="flex-1 px-4 py-2 text-left text-white/45">Your email</span><span className="bg-white px-4 py-2 font-semibold text-[#0a0a0a]">Tell me</span></span>
            </div>
          </Box>
        </div>
      </>
    ),
  },
  {
    id: "countries", label: "Countries", tone: "sky", icon: "domains", blurb: "Hide the store from places you do not serve",
    body: (
      <Box>
        <div className="flex flex-wrap items-center gap-2 px-5 py-4">
          {["India", "Afghanistan"].map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f0] px-3 py-1 text-[13px] font-medium">{c} <X className="h-3.5 w-3.5 text-[#0a0a0a]/40" /></span>)}
          <span className="rounded-full px-3 py-1 text-[13px] text-[#0a0a0a]/45 ring-1 ring-dashed ring-[#0a0a0a]/20">Add a country</span>
        </div>
        <Row label="What they see" value="A plain page: this store does not deliver to your country" right={<span />} />
      </Box>
    ),
  },
  {
    id: "search", label: "Search engines", tone: "mint", icon: "analytics", blurb: "Whether Google can list your store",
    body: (
      <Box>
        <Row label="Let search engines list my store" value="Off while you are in private mode, whatever this says" right={<Toggle on label="Search engines" />} />
        <Field label="Home page title" value="Zohra Lawn · Embroidered lawn and pret, made in Lahore" hint="52 of 70 characters" />
        <Field label="Description" area value="Three-piece lawn suits, chikankari kurtas and Eid formals. Cash on delivery across Pakistan." hint="103 of 320 characters" />
      </Box>
    ),
  },
  {
    id: "spam", label: "Spam protection", tone: "lavender", icon: "shield", blurb: "Keep bots out of your forms",
    body: (
      <Box>
        <Row label="Protect my public forms" value="Contact, enquiries and the waiting list" right={<Toggle on label="Protect forms" />} />
        <Row label="Slow down repeated sign-in attempts" right={<Pill tone="off">Always on</Pill>} />
      </Box>
    ),
  },
  {
    id: "redirects", label: "Links and redirects", tone: "iris", icon: "domains", blurb: "Send old addresses to new ones, so no shared link breaks",
    body: (
      <Box>
        <Row label="/eid-2025" value="goes to /collections/eid-edit · used 214 times" right={<Pill tone="off">Permanent</Pill>} />
        <Row label="/lawn" value="goes to /collections/summer-lawn · used 1,032 times" right={<Pill tone="off">Permanent</Pill>} />
        <Row label={<span className="inline-flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" /> Add a redirect</span>} />
      </Box>
    ),
  },
  {
    id: "tracking", label: "Tracking codes", tone: "sky", icon: "analytics", blurb: "Measure your ads with the tools you already use",
    body: (
      <Box>
        <Field label="Google Analytics" value="G-7XK2PL91QZ" />
        <Field label="Meta (Facebook and Instagram) pixel" value="Not added" />
        <Field label="TikTok pixel" value="Not added" />
      </Box>
    ),
  },
];

export default function PreferencesPage() {
  return (
    <>
      <PageHeader icon="preferences" tone="sky" title="Preferences" sub="Who can see your store, and how it behaves for them." />
      <OpenSections title="On this page" sections={SECTIONS} />
    </>
  );
}
