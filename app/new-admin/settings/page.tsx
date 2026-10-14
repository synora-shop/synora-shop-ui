import type { ReactNode } from "react";
import { Monitor, Plus, Smartphone } from "lucide-react";
import { Box, Choice, Field, Row, SectionIndex, Toggle } from "@/components/new-admin/bits";
import { ICONS, Pill, TONE, pkr } from "@/components/new-admin/ui";
import { SETTINGS, SHOP } from "@/lib/new-admin/sample";

export const metadata = { title: "Settings" };

/**
 * Settings (preview, 15 October): one page, every section open.
 *
 * Abdul's rule: no page of cards that each lead somewhere else, then back.
 * Every setting is here, in Shopify's order, cut to what Synora can build in
 * code alone; the index on the left follows you down and lights the section
 * you are in, by its colour. Each section is marked by that colour too, so a
 * long page still reads as separate rooms.
 */
const BODY: Record<string, ReactNode> = {
  general: (
    <>
      <Box title="Store details">
        <Row icon="store" label={SHOP.name} value={`${SHOP.email} · 0300 1234567`} />
        <Row icon="domains" label="Store address" value="12-B Main Boulevard, Gulberg III, Lahore" />
      </Box>
      <Box title="Store defaults">
        <Row label="Currency" value="Pakistani rupee" right={<Pill tone="off">PKR</Pill>} />
        <Row label="Time zone" value="Pakistan Standard Time (UTC+5)" />
        <Row label="Units" value="Kilograms and centimetres" />
        <Row label="Order numbers" value="#1001 onwards, no prefix" />
      </Box>
    </>
  ),
  plan: (
    <Box>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-[18px] font-semibold">Free trial</p>
          <p className="text-[13.5px] text-[#0a0a0a]/55">Everything included. 23 days left.</p>
        </div>
        <span className="rounded-[10px] bg-[#0a0a0a] px-4 py-2 text-[13.5px] font-semibold text-white">Choose a plan</span>
      </div>
    </Box>
  ),
  billing: (
    <Box>
      <Row icon="card" label="Payment method" value="None yet. Add one before your trial ends." />
      <Row icon="billing" label="Invoices" value="Your first appears when your trial ends." />
    </Box>
  ),
  users: (
    <Box>
      <Row label={SHOP.owner} value={SHOP.email} right={<Pill tone="off">Owner</Pill>} />
      <Row label="Bilal Khan" value="bilal@zohralawn.pk · last active today" right={<Pill tone="info">Admin</Pill>} />
      <Row label="Rida Aslam" value="rida@zohralawn.pk · packs orders" right={<Pill tone="off">Staff</Pill>} />
      <Row label={<span className="inline-flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" /> Invite someone</span>} value="They get an email with a link, good for 7 days" />
    </Box>
  ),
  payments: (
    <>
      <Box title="Ways customers can pay">
        <Row label="Cash on delivery" value="Collected by your courier" right={<Toggle on label="Cash on delivery" />} />
        <Row label="JazzCash" value="Mobile wallet · connected" right={<Toggle on label="JazzCash" />} />
        <Row label="Easypaisa" value="Mobile wallet · connected" right={<Toggle on label="Easypaisa" />} />
        <Row label="Cards through PayFast" value="Visa and Mastercard · not connected" right={<Toggle label="Cards" />} />
        <Row label="Bank transfer" value="Customers pay into your account and send a screenshot" right={<Toggle label="Bank transfer" />} />
      </Box>
      <Box title="Cash on delivery">
        <Row label="Confirm cash orders before dispatch" value="A call or WhatsApp, then mark it confirmed" right={<Toggle on label="Confirm cash orders" />} />
        <Row label="Cash on delivery limit" value={`Not offered on orders over ${pkr(50000)}`} />
      </Box>
    </>
  ),
  checkout: (
    <>
      <Box title="How customers contact you">
        <Choice name="Contact method" start={0} options={[{ label: "Phone number or email", hint: "Best for Pakistan: most customers answer a call or WhatsApp" }, { label: "Email only" }]} />
      </Box>
      <Box title="What customers fill in">
        <Row label="Full name" value="Required" right={<span />} />
        <Row label="Phone number" value="Required, for the courier" right={<Toggle on label="Phone required" />} />
        <Row label="Second address line" value="Optional" right={<Toggle on label="Address line 2" />} />
        <Row label="Order notes" value="Gift messages and special instructions" right={<Toggle on label="Order notes" />} />
      </Box>
      <Box title="After checkout">
        <Row label="Remind people who leave at checkout" value="Email after 1 hour, once" right={<Toggle on label="Abandoned checkout reminder" />} />
        <Row label="Archive orders once fulfilled and paid" right={<Toggle on label="Auto archive" />} />
      </Box>
    </>
  ),
  "customer-accounts": (
    <Box>
      <Choice name="Sign-in" start={0} options={[{ label: "A code by email", hint: "No password to forget. Customers type the 6-digit code we send" }, { label: "No accounts", hint: "Everyone checks out as a guest" }]} />
      <Row label="Show the sign-in link in your store's header" right={<Toggle on label="Header sign-in link" />} />
      <Row label="Offer sign-in at checkout" value="Saved addresses fill themselves in" right={<Toggle on label="Checkout sign-in" />} />
    </Box>
  ),
  shipping: (
    <>
      <Box title="Delivery rates">
        <Row label="Lahore" value="Next day" right={<span className="text-[14px] font-semibold">{pkr(200)}</span>} />
        <Row label="Karachi, Islamabad, Rawalpindi" value="2 to 3 days" right={<span className="text-[14px] font-semibold">{pkr(250)}</span>} />
        <Row label="Rest of Pakistan" value="3 to 5 days" right={<span className="text-[14px] font-semibold">{pkr(300)}</span>} />
        <Row label={<span className="inline-flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" /> Add a rate</span>} />
      </Box>
      <Box title="Options">
        <Row label="Free delivery" value={`On orders over ${pkr(10000)}`} right={<Toggle on label="Free delivery" />} />
        <Row label="Show expected delivery dates" value="At checkout and on the order page" right={<Toggle on label="Delivery dates" />} />
        <Row label="Pick up from the shop" value="Gulberg III, Lahore · ready in 24 hours" right={<Toggle label="Local pickup" />} />
      </Box>
    </>
  ),
  domains: (
    <Box>
      <Row icon="domains" label="zohralawn.pk" value="Your own domain · main address" right={<Pill tone="good">Live</Pill>} />
      <Row icon="domains" label={SHOP.address} value="Free address · sends people to your main address" right={<Pill tone="off">Redirects</Pill>} />
      <Row label={<span className="inline-flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" /> Connect a domain</span>} />
    </Box>
  ),
  notifications: (
    <>
      <Box title="Sender">
        <Field label="Replies go to" value="orders@zohralawn.pk" hint="Emails come from Synora on your behalf; replies reach you here." />
      </Box>
      <Box title="Emails to customers">
        <Row label="Order confirmation" value="Sent when an order is placed" right={<Toggle on label="Order confirmation" />} />
        <Row label="Shipped" value="With the courier's tracking number" right={<Toggle on label="Shipped" />} />
        <Row label="Sign-in code" value="Always on: customers need it to sign in" right={<Pill tone="off">Always</Pill>} />
        <Row label="Checkout reminder" value="For people who left at checkout" right={<Toggle on label="Checkout reminder" />} />
      </Box>
      <Box title="Emails to you">
        <Row label="New order" value="To orders@zohralawn.pk and bilal@zohralawn.pk" right={<Toggle on label="New order" />} />
        <Row label="Low stock" value="When a size drops under 5" right={<Toggle on label="Low stock" />} />
      </Box>
    </>
  ),
  "custom-data": (
    <Box>
      {[["Products", 3, "Fabric, care instructions, dupatta length"], ["Variants", 1, "Chest size"], ["Collections", 0, ""], ["Customers", 1, "Preferred delivery time"], ["Orders", 1, "Gift message"]].map(([t, n, eg]) => (
        <Row key={t as string} label={t} value={eg || "No fields yet"} right={<span className="flex items-center gap-3 text-[14px] font-semibold text-[#0a0a0a]/60">{n}<span className="text-[#0a0a0a]/30">›</span></span>} />
      ))}
    </Box>
  ),
  privacy: (
    <Box>
      <Row label="Cookie banner" value="Ask visitors before tracking them" right={<Toggle on label="Cookie banner" />} />
      <Row label="Privacy policy" value="Published and linked in your footer" right={<Pill tone="good">Published</Pill>} />
      <Row label="Let customers delete their account" value="From their account page" right={<Toggle on label="Account deletion" />} />
    </Box>
  ),
  policies: (
    <Box>
      {[["Return and refund policy", true], ["Privacy policy", true], ["Terms of service", true], ["Shipping policy", true], ["Contact information", true], ["Legal notice", false]].map(([t, done]) => (
        <Row key={t as string} label={t} value={done ? "Linked from checkout and your footer" : "Start from a template written for Pakistan"} right={done ? <Pill tone="good">Written</Pill> : <Pill tone="wait">Not written</Pill>} />
      ))}
    </Box>
  ),
  account: (
    <>
      <Box title="Profile">
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#6666ff] text-[15px] font-semibold text-white">AK</span>
          <span className="rounded-[10px] px-3 py-1.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/15">Upload photo</span>
        </div>
        <Field label="Name" value={SHOP.owner} />
        <Row label="Email" value={SHOP.email} right={<Pill tone="good">Confirmed</Pill>} />
        <Row label="Phone" value="Not added" />
      </Box>
      <Box title="Security">
        <Row label="Password" value="Changed 5 months ago. Changing it signs you out everywhere else." />
        <Row label="Sign-in codes" value="Ask for an emailed code when signing in on a new device" right={<Toggle on label="Two-step sign-in" />} />
        <Row label={<span className="inline-flex items-center gap-2"><Monitor className="h-4 w-4" /> MacBook · Safari</span>} value="Lahore · this device" right={<Pill tone="good">Now</Pill>} />
        <Row label={<span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4" /> iPhone · Safari</span>} value="Lahore · 2 hours ago" right={<span className="text-[13px] font-semibold text-[#a3330c]">Sign out</span>} />
      </Box>
    </>
  ),
};

export default function SettingsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <SectionIndex title="Settings" items={SETTINGS.map(({ slug, label, tone, icon }) => ({ id: slug, label, tone, icon }))} />
      <div className="flex min-w-0 max-w-3xl flex-col gap-12">
        {SETTINGS.map((s) => {
          const Icon = ICONS[s.icon];
          return (
            <section key={s.slug} id={s.slug} className="scroll-mt-6">
              <div className="mb-4 flex items-start gap-3.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${TONE[s.tone].chip}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{s.label}</h2>
                  <p className="text-[13.5px] text-[#0a0a0a]/55">{s.blurb}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">{BODY[s.slug]}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
