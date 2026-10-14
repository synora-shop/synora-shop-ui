import { Upload } from "lucide-react";
import { AnnouncementEditor, Box, Choice, Field, Row, Toggle } from "@/components/new-admin/bits";
import { PageHeader, Pill } from "@/components/new-admin/ui";
import { OpenSections, type OpenSection } from "@/components/new-admin/open-sections";

export const metadata = { title: "Store-wide look" };

/**
 * Store-wide look (preview): the settings that change every page of the store
 * at once, whichever theme is live. The real admin's Store-wide edits, fonts
 * and chat buttons, on one open page.
 */
const SECTIONS: OpenSection[] = [
  { id: "announcement", label: "Announcement bar", tone: "iris", icon: "bell", blurb: "One line across the top of every page", body: <AnnouncementEditor /> },
  {
    id: "badges", label: "Badges", tone: "lavender", icon: "discounts", blurb: "The small labels on product pictures",
    body: (
      <Box>
        <Row label="Sale badge on discounted products" value="Shows the percentage off" right={<Toggle on label="Sale badge" />} />
        <Row label="New arrival badge" value="Says “New” for 14 days after a product goes on sale" right={<Toggle on label="New badge" />} />
        <Row label="Low stock badge" value="Says “Only 3 left” when a size drops under 5" right={<Toggle on label="Low stock badge" />} />
      </Box>
    ),
  },
  {
    id: "stock", label: "Stock on show", tone: "mint", icon: "boxes", blurb: "What customers see about what is left",
    body: (
      <>
        <Box><Row label="Show how many are left" value="On the product page" right={<Toggle label="Show inventory" />} /></Box>
        <Box title="Sold-out products">
          <Choice name="Sold-out products" start={0} options={[{ label: "Show them, marked sold out", hint: "Customers can still see the design and ask about it" }, { label: "Hide them from listings", hint: "They stay reachable by their address" }]} />
        </Box>
      </>
    ),
  },
  {
    id: "shop-page", label: "The shop page", tone: "sky", icon: "products", blurb: "How the full catalogue is laid out",
    body: (
      <Box>
        <Row label="Columns on a computer" value="Phones always show two" right={<span className="flex rounded-[10px] bg-[#f0f0f0] p-0.5 text-[13px] font-semibold">{[2, 3, 4].map((n) => <span key={n} className={`rounded-lg px-3 py-1 ${n === 4 ? "bg-white shadow-sm" : "text-[#0a0a0a]/45"}`}>{n}</span>)}</span>} />
        <Row label="Filter bar" value="Size, colour, price and collection" right={<Toggle on label="Filter bar" />} />
        <Row label="Default order" value="Newest first" />
      </Box>
    ),
  },
  {
    id: "type", label: "Type", tone: "iris", icon: "content", blurb: "Headings, and fonts of your own",
    body: (
      <>
        <Box title="Heading style"><Choice name="Heading style" start={1} options={[{ label: "As written" }, { label: "Title Case", hint: "Summer Lawn Collection" }, { label: "UPPERCASE", hint: "SUMMER LAWN COLLECTION" }]} /></Box>
        <Box title="Your fonts">
          <Row label="Jameel Noori Nastaleeq" value="Urdu · used for Urdu product names" right={<Pill tone="good">In use</Pill>} />
          <Row label={<span className="inline-flex items-center gap-1.5 font-semibold"><Upload className="h-4 w-4" /> Upload a font</span>} value="WOFF2, TTF or OTF. Urdu and Arabic fonts work." />
        </Box>
      </>
    ),
  },
  {
    id: "chat", label: "Chat buttons", tone: "mint", icon: "users", blurb: "Buttons that float on every page",
    body: (
      <Box>
        <Row label="WhatsApp" value="0300 1234567 · bottom right · “Assalam o Alaikum, I have a question”" right={<Toggle on label="WhatsApp" />} />
        <Row label="Instagram" value="@zohralawn" right={<Toggle label="Instagram" />} />
        <Row label="Call" value="On phones only" right={<Toggle label="Call" />} />
      </Box>
    ),
  },
  {
    id: "footer", label: "Footer", tone: "lavender", icon: "policy", blurb: "The last line of every page",
    body: <Box><Field label="Copyright line" value="© 2026 Zohra Lawn. Made in Lahore." /></Box>,
  },
];

export default function LookPage() {
  return (
    <>
      <PageHeader icon="preferences" tone="sky" title="Store-wide look" sub="Changes every page at once, whichever theme is live." />
      <OpenSections title="On this page" sections={SECTIONS} />
    </>
  );
}
