import { ChevronRight } from "lucide-react";
import { PageHeader, Pill } from "@/components/new-admin/ui";

export const metadata = { title: "Policies" };

const POLICIES: [string, boolean][] = [["Return and refund policy", true], ["Privacy policy", true], ["Terms of service", true], ["Shipping policy", true], ["Contact information", true], ["Legal notice", false]];

export default function PoliciesPage() {
  return (
    <>
      <PageHeader icon="app" title="Policies" sub="Linked from your checkout and footer. Customers read these before they trust you." />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">
        <ul className="divide-y divide-[#0d0d50]/[0.06]">
          {POLICIES.map(([t, done]) => (
            <li key={t} className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafc]">
              <span className="flex-1 text-[14.5px] font-medium">{t}</span>
              {done ? <Pill tone="good">Written</Pill> : <Pill tone="wait">Not written yet</Pill>}
              <ChevronRight className="h-4 w-4 text-[#0d0d50]/30" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
