import { Plus, X } from "lucide-react";
import { Field, Page, Panel, Row, Rows, Status, link } from "@/components/next-admin/ui";
import { Toggle } from "@/components/next-admin/bits";
import { Act } from "@/components/next-admin/act";
import { Sections, type Section } from "@/components/next-admin/sections";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Preferences" };

/** Who can see the store, and how it behaves for them (third design). */
const SECTIONS: Section[] = [
  {
    id: "access", label: "Store access", blurb: "Open, private, or closed for a while",
    body: (
      <>
        <Rows>
          <Row label="Private mode" value="Only people with the password can enter. For before launch." right={<Toggle label="Private mode" />} />
          <Row label="Closed for a while" value="Customers see your holding page instead of the store" right={<Toggle label="Closed" />} />
        </Rows>
        <div className="grid gap-2.5 xl:grid-cols-3">
          <Panel title="Holding page">
            <div className="flex flex-col gap-3">
              <Field label="Heading" value="Back on 1 November" />
              <Field label="Message" area value="We are photographing the Winter collection. Leave your email and we will tell you the moment we open." />
              <label className="flex items-center justify-between gap-3 text-[13px]">Let people ask to be told <Toggle on label="Waiting list" /></label>
            </div>
          </Panel>
          <Rows title="Waiting to hear · 38" action={<button type="button" className={link}>Mark all as told</button>}>
            {["maryam.h@gmail.com", "sadia.k@gmail.com", "0321 4455667"].map((w) => <Row key={w} label={w} value="Asked 3 days ago" right={<button type="button" className="text-[12px] text-[#71717a] hover:text-[#b91c1c]">Remove</button>} />)}
          </Rows>
          <Panel title="As customers see it" flush>
            <div className="flex min-h-[13rem] flex-col items-center justify-center gap-1.5 bg-[#18181b] px-5 py-6 text-center text-white">
              <p className="text-[10.5px] font-bold tracking-[0.2em] text-white/50">ZOHRA LAWN</p>
              <p className="text-[18px] font-semibold">Back on 1 November</p>
              <p className="max-w-xs text-[12px] text-white/65">We are photographing the Winter collection. Leave your email and we will tell you the moment we open.</p>
              <span className="mt-2 flex w-full max-w-xs overflow-hidden rounded-full bg-white/10 text-[12px]"><span className="flex-1 px-3 py-1.5 text-left text-white/45">Your email</span><span className="bg-white px-3 py-1.5 font-semibold text-[#18181b]">Tell me</span></span>
            </div>
          </Panel>
        </div>
      </>
    ),
  },
  {
    id: "countries", label: "Countries", blurb: "Hide the store from places you do not serve",
    body: (
      <Rows>
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5">
          {["India", "Afghanistan"].map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-[4px] bg-[#f4f4f5] px-2 py-0.5 text-[12.5px]">{c} <X className="h-3 w-3 text-[#a1a1aa]" /></span>)}
          <button type="button" className="rounded-[4px] border border-dashed border-[#d4d4d8] px-2 py-0.5 text-[12.5px] text-[#71717a]">Add a country</button>
        </div>
        <Row label="What they see" value="A plain page: this store does not deliver to your country" right={<span />} />
      </Rows>
    ),
  },
  {
    id: "search", label: "Search engines", blurb: "Whether Google can list your store",
    body: (
      <>
        <Rows><Row label="Let search engines list my store" value="Off while you are in private mode, whatever this says" right={<Toggle on label="Search engines" />} /></Rows>
        <Panel>
          <div className="grid gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[6px] ring-1 ring-[#e4e4e7]">
              <div className="grid aspect-[1.91/1] place-items-center bg-[#18181b] text-[12px] font-bold tracking-[0.2em] text-white">ZOHRA LAWN</div>
              <div className="px-2.5 py-2"><p className="text-[10.5px] uppercase text-[#a1a1aa]">zohralawn.pk</p><p className="truncate text-[12.5px] font-medium">Zohra Lawn · Embroidered lawn and pret</p></div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[12.5px] text-[#71717a]">How your store looks when a link is shared on WhatsApp, Facebook and Instagram. A 1200 × 628 picture changes it. <button type="button" className={link}>Change picture</button></p>
              <Field label="Home page title" value="Zohra Lawn · Embroidered lawn and pret, made in Lahore" hint="52 of 70 characters" />
              <Field label="Description" area value="Three-piece lawn suits, chikankari kurtas and Eid formals. Cash on delivery across Pakistan." hint="103 of 320 characters" />
            </div>
          </div>
        </Panel>
      </>
    ),
  },
  {
    id: "spam", label: "Spam protection", blurb: "Keep bots out of your forms",
    body: (
      <Rows>
        <Row label="Protect my public forms" value="Contact, enquiries and the waiting list" right={<Toggle on label="Protect forms" />} />
        <Row label="Protect sign-in and sign-up" value="Customer sign-in, new accounts and code requests" right={<Toggle on label="Protect sign-in" />} />
        <Row label="Slow down repeated sign-in attempts" right={<Status tone="off">Always on</Status>} />
      </Rows>
    ),
  },
  {
    id: "redirects", label: "Links and redirects", blurb: "Send old addresses to new ones, so no shared link breaks",
    body: (
      <Rows action={<button type="button" className={`inline-flex items-center gap-1 ${link}`}><Plus className="h-3.5 w-3.5" /> Add a redirect</button>} title="2 redirects">
        <Row label={<span className="font-mono text-[12.5px]">/eid-2025</span>} value="goes to /collections/eid-edit · used 214 times" right={<Status tone="off">Permanent</Status>} />
        <Row label={<span className="font-mono text-[12.5px]">/lawn</span>} value="goes to /collections/summer-lawn · used 1,032 times" right={<Status tone="off">Permanent</Status>} />
      </Rows>
    ),
  },
  {
    id: "tracking", label: "Tracking codes", blurb: "Measure your ads with the tools you already use",
    body: (
      <Panel>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Google Analytics" value="G-7XK2PL91QZ" mono />
          <Field label="Meta (Facebook and Instagram) pixel" value="" />
          <Field label="TikTok pixel" value="" />
        </div>
      </Panel>
    ),
  },
];

export default function PreferencesPage() {
  return (
    <Page title="Preferences" crumbs={[{ label: "Online Store", href: `${A}/online-store` }]} sub="Who can see your store, and how it behaves for them." actions={<Act kind="primary" msg="Preferences saved">Save</Act>}>
      <Sections sections={SECTIONS} />
    </Page>
  );
}
