import { Upload } from "lucide-react";
import { Field, Page, Panel, Row, Rows, Status } from "@/components/next-admin/ui";
import { Choice, Seg, Toggle } from "@/components/next-admin/bits";
import { Act } from "@/components/next-admin/act";
import { AnnouncementEditor, Sections, type Section } from "@/components/next-admin/sections";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Store-wide look" };

/** Settings that change every page at once, whichever theme is live (third design). */
const SECTIONS: Section[] = [
  { id: "announcement", label: "Announcement bar", blurb: "One line across the top of every page", body: <AnnouncementEditor /> },
  {
    id: "badges", label: "Badges", blurb: "The small labels on product pictures",
    body: (
      <Rows>
        <Row label="Sale badge on discounted products" value="Shows the percentage off" right={<Toggle on label="Sale badge" />} />
        <Row label="New arrival badge" value="Says “New” for 14 days after a product goes on sale" right={<Toggle on label="New badge" />} />
        <Row label="Low stock badge" value="Says “Only 3 left” when a size drops under 5" right={<Toggle on label="Low stock badge" />} />
      </Rows>
    ),
  },
  {
    id: "stock", label: "Stock on show", blurb: "What customers see about what is left",
    body: (
      <>
        <Rows><Row label="Show how many are left" value="On the product page" right={<Toggle label="Show inventory" />} /></Rows>
        <Panel title="Sold-out products" flush><Choice name="Sold-out products" options={[{ label: "Show them, marked sold out", hint: "Customers can still see the design and ask about it" }, { label: "Hide them from listings", hint: "They stay reachable by their address" }]} /></Panel>
      </>
    ),
  },
  {
    id: "shop-page", label: "The shop page", blurb: "How the full catalogue is laid out",
    body: (
      <Rows>
        <Row label="Columns on a computer" value="Phones always show two" right={<Seg label="Columns" items={["2", "3", "4"]} start="4" />} />
        <Row label="Filter bar" value="Size, colour, price and collection" right={<Toggle on label="Filter bar" />} />
        <Row label="Default order" value="Newest first" />
      </Rows>
    ),
  },
  {
    id: "type", label: "Type", blurb: "Headings, and fonts of your own",
    body: (
      <>
        <Panel title="Heading style" flush><Choice name="Heading style" start={1} options={[{ label: "As written" }, { label: "Title Case", hint: "Summer Lawn Collection" }, { label: "UPPERCASE", hint: "SUMMER LAWN COLLECTION" }]} /></Panel>
        <Rows title="Your fonts">
          <Row label="Jameel Noori Nastaleeq" value="Urdu · used for Urdu product names" right={<Status tone="good">In use</Status>} />
          <Row label={<span className="inline-flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload a font</span>} value="WOFF2, TTF or OTF. Urdu and Arabic fonts work." />
        </Rows>
      </>
    ),
  },
  {
    id: "chat", label: "Chat buttons", blurb: "Buttons that float on every page",
    body: (
      <Rows>
        <Row label="WhatsApp" value="0300 1234567 · bottom right · “Assalam o Alaikum, I have a question”" right={<Toggle on label="WhatsApp" />} />
        <Row label="Instagram" value="@zohralawn" right={<Toggle label="Instagram" />} />
        <Row label="Call" value="On phones only" right={<Toggle label="Call" />} />
      </Rows>
    ),
  },
  { id: "footer", label: "Footer", blurb: "The last line of every page", body: <Panel><Field label="Copyright line" value="© 2026 Zohra Lawn. Made in Lahore." /></Panel> },
];

export default function LookPage() {
  return (
    <Page title="Store-wide look" crumbs={[{ label: "Online Store", href: `${A}/online-store` }]} sub="Changes every page at once, whichever theme is live." actions={<Act kind="primary" msg="Store-wide look saved">Save</Act>}>
      <Sections sections={SECTIONS} />
    </Page>
  );
}
