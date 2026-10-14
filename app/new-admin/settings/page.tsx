import type { ReactNode } from "react";
import { Monitor, Plus, RefreshCw, Smartphone, Upload } from "lucide-react";
import { Box, Choice, Field, Row, Toggle } from "@/components/new-admin/bits";
import { Pill, pkr } from "@/components/new-admin/ui";
import { OpenSections, type OpenSection } from "@/components/new-admin/open-sections";
import { SETTINGS, SHOP } from "@/lib/new-admin/sample";

export const metadata = { title: "Settings" };

/**
 * Settings (preview): one page, every section open, findable by typing.
 * What the real admin does today (identity and logos, defaults, business
 * type, payments with their gateway states, domains with DNS checks, staff,
 * push alerts, pausing or closing the store, account security), plus the few
 * Shopify settings Synora can add in code alone (checkout fields, customer
 * accounts, shipping rates, privacy).
 */
const add = (t: string) => <span className="inline-flex items-center gap-1.5 font-semibold"><Plus className="h-4 w-4" /> {t}</span>;
const gw = (connected: boolean, on: boolean, tested: boolean) => (
  <span className="flex flex-wrap justify-end gap-1">
    <Pill tone={connected ? "good" : "off"}>{connected ? "Connected" : "Not connected"}</Pill>
    {connected && <Pill tone={tested ? "good" : "wait"}>{tested ? "Tested" : "Test a payment first"}</Pill>}
    {connected && <Toggle on={on} label="Switched on" />}
  </span>
);

const BODY: Record<string, ReactNode> = {
  general: (
    <>
      <Box title="Your logo">
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {[["On light", "bg-white", "text-[#0a0a0a]"], ["On dark", "bg-[#0a0a0a]", "text-white"], ["Small", "bg-white", "text-[#0a0a0a]"], ["Browser tab", "bg-[#f5f5f5]", "text-[#0a0a0a]"]].map(([l, bg, fg], i) => (
            <div key={l} className="text-center">
              <div className={`grid h-20 place-items-center rounded-xl ring-1 ring-[#0a0a0a]/10 ${bg}`}><span className={`font-bold tracking-[0.12em] ${fg} ${i > 1 ? "text-[15px]" : "text-[13px]"}`}>{i > 1 ? "ZL" : "ZOHRA LAWN"}</span></div>
              <p className="mt-1.5 text-[12px] text-[#0a0a0a]/55">{l}</p>
            </div>
          ))}
        </div>
        <Row label={add("Upload a logo")} value="We make the other three from one, if you like" right={<Upload className="h-4 w-4 text-[#0a0a0a]/35" />} />
      </Box>
      <Box title="Store details">
        <Field label="Store name" value={SHOP.name} />
        <Row icon="domains" label="Address" value="12-B Main Boulevard, Gulberg III, Lahore" />
        <Row icon="users" label="How customers reach you" value={`${SHOP.email} · WhatsApp 0300 1234567`} />
      </Box>
      <Box title="Store defaults">
        <Row label="Currency" value="Pakistani rupee" right={<Pill tone="off">PKR</Pill>} />
        <Row label="Time zone" value="Pakistan Standard Time (UTC+5). Orders are dated in it." />
        <Row label="Units" value="Kilograms and centimetres" />
        <Row label="What you sell" value="Products, with a cart and checkout" right={<Pill tone="info">E-commerce</Pill>} />
      </Box>
    </>
  ),
  plan: (
    <>
      <Box>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div><p className="text-[18px] font-semibold">Free trial</p><p className="text-[13.5px] text-[#0a0a0a]/55">Everything included. 23 days left.</p></div>
          <span className="rounded-[10px] bg-[#0a0a0a] px-4 py-2 text-[13.5px] font-semibold text-white">Choose a plan</span>
        </div>
      </Box>
      <Box title="Billing">
        <Row icon="card" label="Payment method" value="None yet. Add one before your trial ends." />
        <Row icon="billing" label="Invoices" value="Your first appears when your trial ends." />
      </Box>
    </>
  ),
  users: (
    <Box>
      <Row label={SHOP.owner} value={`${SHOP.email} · full access, including billing and closing the store`} right={<Pill tone="off">Owner</Pill>} />
      <Row label="Bilal Khan" value="Everything except billing and ownership · active today" right={<Pill tone="info">Admin</Pill>} />
      <Row label="Rida Aslam" value="Products, orders and customers · packs orders" right={<Pill tone="off">Staff</Pill>} />
      <Row label="sana@zohralawn.pk" value="Invited 2 days ago · link good for 5 more days" right={<span className="text-[13px] font-semibold text-[#4b4bea]">Resend</span>} />
      <Row label={add("Invite someone")} value="Owner, Admin, Staff, or Viewer (can look, cannot change)" />
    </Box>
  ),
  payments: (
    <>
      <Box title="Online payments">
        <Row label="JazzCash" value="Mobile wallet" right={gw(true, true, true)} />
        <Row label="Easypaisa" value="Mobile wallet" right={gw(true, false, false)} />
        <Row label="Cards through PayFast" value="Visa and Mastercard" right={gw(false, false, false)} />
      </Box>
      <Box title="Manual payments">
        <Row label="Cash on delivery" value="Collected by your courier" right={<Toggle on label="Cash on delivery" />} />
        <Row label="Bank transfer" value="Meezan Bank · account details shown at checkout" right={<Toggle label="Bank transfer" />} />
        <Row label="Confirm cash orders before dispatch" value="Pending until you confirm by phone" right={<Toggle on label="Confirm cash orders" />} />
      </Box>
    </>
  ),
  checkout: (
    <>
      <Box title="How customers contact you">
        <Choice name="Contact method" options={[{ label: "Phone number or email", hint: "Best for Pakistan: most customers answer a call or WhatsApp" }, { label: "Email only" }]} />
      </Box>
      <Box title="What customers fill in">
        <Row label="Full name" value="Required" right={<span />} />
        <Row label="Phone number" value="Required, for the courier" right={<Toggle on label="Phone required" />} />
        <Row label="Second address line" value="Optional" right={<Toggle on label="Address line 2" />} />
        <Row label="Order notes" value="Gift messages and special instructions" right={<Toggle on label="Order notes" />} />
      </Box>
      <Box title="After checkout">
        <Row label="Remind people who leave at checkout" value="Email after 1 hour, once" right={<Toggle on label="Checkout reminder" />} />
      </Box>
    </>
  ),
  "customer-accounts": (
    <Box>
      <Choice name="Sign-in" options={[{ label: "A code by email", hint: "No password to forget: customers type the 6-digit code we send" }, { label: "No accounts", hint: "Everyone checks out as a guest" }]} />
      <Row label="Order links carry a private key" value="Customers can see their order without signing in" right={<Pill tone="off">Always</Pill>} />
    </Box>
  ),
  shipping: (
    <>
      <Box title="Delivery rates">
        <Row label="Lahore" value="Next day" right={<span className="text-[14px] font-semibold">{pkr(200)}</span>} />
        <Row label="Karachi, Islamabad, Rawalpindi" value="2 to 3 days" right={<span className="text-[14px] font-semibold">{pkr(250)}</span>} />
        <Row label="Rest of Pakistan" value="3 to 5 days" right={<span className="text-[14px] font-semibold">{pkr(300)}</span>} />
        <Row label={add("Add a rate")} />
      </Box>
      <Box title="Options">
        <Row label="Free delivery" value={`On orders over ${pkr(10000)}`} right={<Toggle on label="Free delivery" />} />
        <Row label="Pick up from the shop" value="Gulberg III, Lahore" right={<Toggle label="Local pickup" />} />
      </Box>
    </>
  ),
  domains: (
    <Box>
      <Row icon="domains" label="zohralawn.pk" value="Your own domain · main address · secure (https)" right={<Pill tone="good">Live</Pill>} />
      <Row icon="domains" label="shop.zohralawn.pk" value="Waiting for its DNS record · last checked 10 min ago" right={<span className="inline-flex items-center gap-1.5 text-[13px] font-semibold"><RefreshCw className="h-3.5 w-3.5" /> Check now</span>} />
      <Row icon="domains" label={SHOP.address} value="Free address · sends people to your main address" right={<Pill tone="off">Redirects</Pill>} />
      <Row label={add("Connect a domain")} value="We show you the two records to add at your domain company" />
    </Box>
  ),
  notifications: (
    <>
      <Box title="On your devices">
        <Row icon="bell" label="New order alerts on this phone" value="A notification the moment an order comes in" right={<Toggle on label="Push alerts" />} />
      </Box>
      <Box title="Emails to customers">
        <Row label="Order confirmation" value="With a private link to their order" right={<Toggle on label="Order confirmation" />} />
        <Row label="Shipped" value="With the courier's tracking number" right={<Toggle on label="Shipped" />} />
        <Row label="Sign-in code" value="Customers need it to sign in" right={<Pill tone="off">Always</Pill>} />
      </Box>
      <Box title="Emails to you">
        <Field label="New orders go to" value="orders@zohralawn.pk, bilal@zohralawn.pk" />
        <Row label="Low stock" value="When a size drops under 5" right={<Toggle on label="Low stock" />} />
      </Box>
    </>
  ),
  "custom-data": (
    <Box>
      {[["Products", "3 fields"], ["Variants", "1 field"], ["Customers", "1 field"], ["Orders", "1 field"], ["Collections", "None yet"]].map(([t, n]) => (
        <Row key={t} label={t} value={n} />
      ))}
    </Box>
  ),
  privacy: (
    <Box>
      <Row label="Cookie banner" value="Ask visitors before tracking them" right={<Toggle on label="Cookie banner" />} />
      <Row label="Let customers delete their account" value="From their account page" right={<Toggle on label="Account deletion" />} />
    </Box>
  ),
  policies: (
    <Box>
      {([["Return and refund policy", true], ["Privacy policy", true], ["Terms of service", false], ["Shipping policy", true]] as [string, boolean][]).map(([t, done]) => (
        <Row key={t} label={t} value={done ? "Published · linked from checkout and your footer" : "A draft for Pakistan is ready: read it, then publish"} right={done ? <Pill tone="good">Published</Pill> : <Pill tone="wait">Draft</Pill>} />
      ))}
    </Box>
  ),
  "store-status": (
    <>
      <Box>
        <Row label="Open" value="Customers can browse and buy" right={<Pill tone="good">Now</Pill>} />
        <Row label="Pause the store" value="Customers see your holding page. Orders stop; nothing is lost." />
        <Row label="Change what this store is" value="E-commerce, a blog, or a restaurant. Pause first; your products are kept." />
      </Box>
      <Box>
        <Row label={<span className="font-semibold text-[#a3330c]">Close this store</span>} value="Asks for your password. You can download everything first." right={<span />} />
      </Box>
    </>
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
      </Box>
      <Box title="Security">
        <Row label="Password" value="Changed 5 months ago. Changing it signs you out everywhere else." />
        <Row label={<span className="inline-flex items-center gap-2"><Monitor className="h-4 w-4" /> MacBook · Safari</span>} value="Lahore · this device" right={<Pill tone="good">Now</Pill>} />
        <Row label={<span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4" /> iPhone · Safari</span>} value="Lahore · 2 hours ago" right={<span className="text-[13px] font-semibold text-[#a3330c]">Sign out</span>} />
        <Row label="Sign out everywhere else" right={<span />} />
      </Box>
    </>
  ),
};

const WORDS: Record<string, string> = {
  general: "logo name address whatsapp email phone currency rupee time zone units business type",
  plan: "trial invoice billing card",
  users: "staff team invite role owner admin viewer",
  payments: "jazzcash easypaisa payfast card cod cash bank transfer meezan gateway sandbox",
  checkout: "order notes phone address gift",
  "customer-accounts": "sign in code password guest",
  shipping: "delivery rate lahore karachi free pickup courier",
  domains: "dns https domain address redirect",
  notifications: "push email alert low stock",
  privacy: "cookie delete",
  policies: "refund terms privacy shipping",
  "store-status": "pause close holding business type restaurant blog",
  account: "password devices security sign out profile",
};

export default function SettingsPage() {
  const sections: OpenSection[] = SETTINGS.map((s) => ({ id: s.slug, label: s.label, tone: s.tone, icon: s.icon, blurb: s.blurb, group: s.group, body: BODY[s.slug], words: WORDS[s.slug] }));
  return <OpenSections title="Settings" sections={sections} searchable />;
}
