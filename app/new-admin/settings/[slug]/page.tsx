import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronRight, Monitor, Smartphone } from "lucide-react";
import { ICONS, Pill, pkr } from "@/components/new-admin/ui";
import { SETTINGS, SHOP } from "@/lib/new-admin/sample";

export function generateStaticParams() {
  return SETTINGS.map((s) => ({ slug: s.slug }));
}

/**
 * Settings (preview): the eight Abdul listed, each its own page, with the
 * list beside it the whole time. Each page is titled cards of rows: what a
 * thing is set to, and a way into it.
 */
function Group({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {sub && <p className="mt-0.5 text-[13.5px] text-[#0d0d50]/55">{sub}</p>}
      <div className="mt-3 divide-y divide-[#0d0d50]/[0.06] overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">{children}</div>
    </section>
  );
}
function Row({ label, value, right }: { label: string; value?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafc]">
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-medium">{label}</p>
        {value && <div className="mt-0.5 text-[13.5px] text-[#0d0d50]/60">{value}</div>}
      </div>
      {right ?? <ChevronRight className="h-4 w-4 text-[#0d0d50]/30" />}
    </div>
  );
}
const Toggle = ({ on }: { on: boolean }) => (
  <span className={`relative h-6 w-10 shrink-0 rounded-full ${on ? "bg-[#6666ff]" : "bg-[#0d0d50]/15"}`}>
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${on ? "left-[18px]" : "left-0.5"}`} />
  </span>
);

const BODY: Record<string, ReactNode> = {
  general: (
    <>
      <Group title="Store details" sub="What customers and couriers see.">
        <Row label={SHOP.name} value={`${SHOP.email} · 0300 1234567`} />
        <Row label="Store address" value="12-B Main Boulevard, Gulberg III, Lahore" />
      </Group>
      <Group title="Store defaults">
        <Row label="Currency" value="Pakistani rupee" right={<Pill tone="off">PKR</Pill>} />
        <Row label="Time zone" value="Pakistan Standard Time (UTC+5)" />
        <Row label="Weight unit" value="Kilograms" />
        <Row label="Order numbers" value="Start at #1001" />
      </Group>
    </>
  ),
  plan: (
    <Group title="Your plan">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div><p className="text-[18px] font-semibold">Free trial</p><p className="text-[13.5px] text-[#0d0d50]/60">Everything included. 23 days left.</p></div>
        <span className="rounded-[10px] bg-[#0d0d50] px-4 py-2 text-[13.5px] font-semibold text-white">Choose a plan</span>
      </div>
    </Group>
  ),
  billing: (
    <Group title="Invoices" sub="What you have paid Synora.">
      <Row label="No invoices yet" value="Your first appears when your trial ends." right={<span />} />
    </Group>
  ),
  domains: (
    <Group title="Your addresses">
      <Row label={SHOP.address} value="Free address, always on" right={<Pill tone="good">Connected</Pill>} />
      <Row label="zohralawn.pk" value="Your own domain · main address" right={<Pill tone="good">Live</Pill>} />
    </Group>
  ),
  payments: (
    <>
      <Group title="Ways customers can pay" sub="Switch each on or off. Changes reach checkout at once.">
        <Row label="Cash on delivery" value="Collected by your courier" right={<Toggle on />} />
        <Row label="JazzCash" value="Mobile wallet · connected" right={<Toggle on />} />
        <Row label="Easypaisa" value="Mobile wallet · connected" right={<Toggle on />} />
        <Row label="Cards through PayFast" value="Visa, Mastercard · not connected" right={<Toggle on={false} />} />
      </Group>
      <Group title="Cash on delivery">
        <Row label="Confirm cash orders by call" value="Mark them confirmed before you dispatch" right={<Toggle on />} />
      </Group>
    </>
  ),
  users: (
    <Group title="People on this store" sub="Owner, admins, staff and viewers.">
      <Row label={SHOP.owner} value={`${SHOP.email} · Owner`} right={<Pill tone="off">Owner</Pill>} />
      <Row label="Bilal Khan" value="bilal@zohralawn.pk · Admin" right={<Pill tone="off">Admin</Pill>} />
      <Row label="Rida Aslam" value="rida@zohralawn.pk · Staff" right={<Pill tone="off">Staff</Pill>} />
      <Row label="Invite someone" value="They get an email with a link" />
    </Group>
  ),
  shipping: (
    <>
      <Group title="Delivery rates" sub="What customers pay, by where they are.">
        <Row label="Lahore" value="Next day" right={<span className="font-semibold">{pkr(200)}</span>} />
        <Row label="Karachi, Islamabad, Rawalpindi" value="2 to 3 days" right={<span className="font-semibold">{pkr(250)}</span>} />
        <Row label="Rest of Pakistan" value="3 to 5 days" right={<span className="font-semibold">{pkr(300)}</span>} />
        <Row label="Free delivery" value={`On orders over ${pkr(10000)}`} right={<Toggle on />} />
      </Group>
      <Group title="Courier"><Row label="Leopards Courier" value="Bookings made by hand for now" /></Group>
    </>
  ),
  security: (
    <>
      <Group title="Password"><Row label="Last changed 5 months ago" value="Changing it signs you out everywhere else" /></Group>
      <Group title="Signed in on">
        <Row label="MacBook · Safari" value="Lahore · this device" right={<Monitor className="h-4 w-4 text-[#0d0d50]/40" />} />
        <Row label="iPhone · Synora app" value="Lahore · 2 hours ago" right={<Smartphone className="h-4 w-4 text-[#0d0d50]/40" />} />
      </Group>
    </>
  ),
};

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const here = SETTINGS.find((s) => s.slug === slug);
  if (!here) notFound();
  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Settings" className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0d0d50]/45">Settings</p>
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {SETTINGS.map((s) => {
            const Icon = ICONS[s.icon];
            const on = s.slug === slug;
            return (
              <li key={s.slug}>
                <Link href={`/new-admin/settings/${s.slug}`} className={`flex items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 py-2 text-[14px] ${on ? "bg-white font-semibold ring-1 ring-[#0d0d50]/10" : "text-[#0d0d50]/65 hover:bg-white/70"}`}>
                  <Icon className="h-4 w-4" /> {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex min-w-0 max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{here.label}</h1>
          <p className="text-[14px] text-[#0d0d50]/55">{here.blurb}</p>
        </div>
        {BODY[slug]}
      </div>
    </div>
  );
}
