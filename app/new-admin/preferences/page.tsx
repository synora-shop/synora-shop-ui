import { ChevronRight, Eye, Link2, ListPlus, MessageCircle, Type, Wrench } from "lucide-react";
import { PageHeader } from "@/components/new-admin/ui";

export const metadata = { title: "Preferences" };

/** The store's behaviour, not its look or its business details. */
const GROUPS = [
  { icon: Eye, title: "Visibility", text: "What shows on product pages: stock counts, sold-out items, reviews." },
  { icon: Wrench, title: "Maintenance", text: "Close the store for a while, with a page saying when you are back." },
  { icon: Type, title: "Fonts", text: "Upload your own font, Urdu included." },
  { icon: MessageCircle, title: "Chat buttons", text: "WhatsApp and other buttons that float on every page." },
  { icon: Link2, title: "Links and redirects", text: "Send old addresses to new ones so no link breaks." },
  { icon: ListPlus, title: "Custom fields", text: "Extra details on products and orders: fabric, care, gift message." },
];

export default function PreferencesPage() {
  return (
    <>
      <PageHeader icon="preferences" title="Preferences" sub="How your store behaves." />
      <div className="grid gap-3 sm:grid-cols-2">
        {GROUPS.map(({ icon: Icon, title, text }) => (
          <a key={title} href="#" className="flex items-start gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#0d0d50]/[0.07] hover:ring-[#0d0d50]/20">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0f0f6]"><Icon className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="mt-0.5 block text-[13.5px] leading-snug text-[#0d0d50]/60">{text}</span></span>
            <ChevronRight className="mt-2.5 h-4 w-4 text-[#0d0d50]/30" />
          </a>
        ))}
      </div>
    </>
  );
}
