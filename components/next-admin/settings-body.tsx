import type { ReactNode } from "react";
import { Monitor, Plus, RefreshCw, Smartphone, Upload } from "lucide-react";
import { Choice, Toggle } from "@/components/next-admin/bits";
import { OrderNumber, PolicyList, TeamList } from "@/components/next-admin/settings-bits";
import { Act } from "@/components/next-admin/act";
import { Field, Panel, Row, Rows, Status, Tag, link, pkr } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";
import { SHOP } from "@/lib/new-admin/sample";

/**
 * What each settings section holds (third design): the preview's options,
 * every one, as rows of 44px with their control on the right.
 */
const add = (t: string) => <span className={`inline-flex items-center gap-1 ${link}`}><Plus className="h-3.5 w-3.5" /> {t}</span>;
const gw = (connected: boolean, on: boolean, tested: boolean) => (
  <span className="flex flex-wrap items-center justify-end gap-3">
    <Status tone={connected ? "good" : "off"}>{connected ? "Connected" : "Not connected"}</Status>
    {connected && <Status tone={tested ? "info" : "wait"}>{tested ? "Live" : "Test a payment first"}</Status>}
    {connected ? <Toggle on={on} label="Switched on" /> : <Act small msg="Connecting opens the gateway's sign-in">Connect</Act>}
  </span>
);
const edit = <button type="button" className={link}>Edit</button>;

export const BODY: Record<string, ReactNode> = {
  general: (
    <>
      <Panel title="Your logo" action={<span className="text-[#737373]">We make the other three from one, if you like</span>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[["On light", "bg-white", "text-[#0a0a0a]"], ["On dark", "bg-[#0a0a0a]", "text-white"], ["Small", "bg-white", "text-[#0a0a0a]"], ["Browser tab", "bg-[#f3f3f3]", "text-[#0a0a0a]"]].map(([l, bg, fg], i) => (
            <div key={l}>
              <div className={`grid h-14 place-items-center rounded-[10px] ring-1 ring-inset ring-[#ebebeb] ${bg}`}><span className={`font-bold tracking-[0.12em] ${fg} ${i > 1 ? "text-[13px]" : "text-[11.5px]"}`}>{i > 1 ? "ZL" : "ZOHRA LAWN"}</span></div>
              <p className="mt-1 text-[11.5px] text-[#737373]">{l}</p>
            </div>
          ))}
          <button type="button" className="grid h-14 place-items-center rounded-[10px] border border-dashed border-[#dddddd] text-[12px] text-[#737373] hover:border-[#6666ff] hover:text-[#4b4bea]"><span className="inline-flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Upload</span></button>
        </div>
      </Panel>
      <Panel title="Store details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Store name" value={SHOP.name} />
          <Field label="Contact email" value={SHOP.email} hint="Where customers reach you. Not your sign-in." />
          <Field label="Address" value="12-B Main Boulevard, Gulberg III, Lahore" />
          <Field label="WhatsApp" value="0300 1234567" />
        </div>
      </Panel>
      <Rows title="Store defaults">
        <Row label="Currency" value="Pakistani rupee" right={<Tag mono>PKR</Tag>} />
        <Row label="Time zone" value="Pakistan Standard Time (UTC+5). Orders are dated in it." />
        <Row label="Units" value="Kilograms and centimetres" />
        <Row label="What you sell" value="Products, with a cart and checkout" right={<Tag>E-commerce</Tag>} />
      </Rows>
      <Panel title="Order numbers" flush><OrderNumber /></Panel>
      <Rows title="After an order is done">
        <Row label="Tidy delivered, paid orders away" value="They leave the main list but stay searchable and in your reports" right={<Toggle on label="Archive done orders" />} />
      </Rows>
    </>
  ),
  plan: (
    <>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[15px] font-semibold">Free trial <Status tone="good">23 days left</Status></p><p className="text-[12.5px] text-[#737373]">Everything is included while you try it.</p></div>
          <Act kind="primary" msg="Plans would open here">Choose a plan</Act>
        </div>
      </Panel>
      <Rows title="Billing">
        <Row label="Payment method" value="None yet. Add one before your trial ends." right={<button type="button" className={link}>Add</button>} />
        <Row label="Billing address" value="Zohra Lawn, 12-B Main Boulevard, Gulberg III, Lahore" right={edit} />
        <Row label="Tax number (NTN)" value="Printed on your Synora invoices, if you add it" right={<button type="button" className={link}>Add</button>} />
      </Rows>
      <Panel title="Past bills"><p className="py-3 text-center text-[12.5px] text-[#737373]"><b className="font-medium text-[#0a0a0a]">No bills yet.</b> Each month&apos;s bill appears here with its number, date and a PDF.</p></Panel>
    </>
  ),
  users: <Panel title="People who work on this store" flush><TeamList owner={SHOP.owner} ownerEmail={SHOP.email} /></Panel>,
  payments: (
    <>
      <Rows title="Online payments">
        <Row label="JazzCash" value="Mobile wallet" right={gw(true, true, true)} />
        <Row label="Easypaisa" value="Mobile wallet" right={gw(true, false, false)} />
        <Row label="Cards through PayFast" value="Visa and Mastercard" right={gw(false, false, false)} />
      </Rows>
      <Rows title="Manual payments">
        <Row label="Cash on delivery" value="Collected by your courier" right={<Toggle on label="Cash on delivery" />} />
        <Row label="Bank transfer" value="Meezan Bank · account details shown at checkout" right={<Toggle label="Bank transfer" />} />
        <Row label="Confirm cash orders before dispatch" value="Pending until you confirm by phone" right={<Toggle on label="Confirm cash orders" />} />
      </Rows>
    </>
  ),
  checkout: (
    <>
      <Panel title="How customers contact you" flush><Choice name="Contact method" options={[{ label: "Phone number or email", hint: "Best for Pakistan: most customers answer a call or WhatsApp" }, { label: "Email only" }]} /></Panel>
      <Rows title="What customers fill in">
        <Row label="Full name" value="Required" right={<Status tone="off">Always</Status>} />
        <Row label="Phone number" value="Required, for the courier" right={<Toggle on label="Phone required" />} />
        <Row label="Second address line" value="Optional" right={<Toggle on label="Address line 2" />} />
        <Row label="Order notes" value="Gift messages and special instructions" right={<Toggle on label="Order notes" />} />
      </Rows>
      <Rows title="Offers by email and WhatsApp">
        <Row label="Ask customers if they want offers" value="A tick box at checkout, unticked to start, as the law expects" right={<Toggle on label="Marketing tick box" />} />
        <Row label="Words beside the box" value="Send me new arrivals and sale news" right={edit} />
      </Rows>
      <Rows title="Wording and reminders">
        <Row href={`${A}/content/words`} label="Change any word at checkout" value="Place order, Cash on delivery, and the rest, in Store wording" />
        <Row label="Remind people who leave at checkout" value="Email after 1 hour, once" right={<Toggle on label="Checkout reminder" />} />
      </Rows>
    </>
  ),
  shipping: (
    <>
      <Rows title="Delivery rates" action={add("Add a rate")}>
        <Row label="Lahore" value="Next day" right={<span className="text-[13px] font-semibold tabular-nums">{pkr(200)}</span>} />
        <Row label="Karachi, Islamabad, Rawalpindi" value="2 to 3 days" right={<span className="text-[13px] font-semibold tabular-nums">{pkr(250)}</span>} />
        <Row label="Rest of Pakistan" value="3 to 5 days" right={<span className="text-[13px] font-semibold tabular-nums">{pkr(300)}</span>} />
      </Rows>
      <Rows title="Options">
        <Row label="Free delivery" value={`On orders over ${pkr(10000)}`} right={<Toggle on label="Free delivery" />} />
        <Row label="Pick up from the shop" value="Gulberg III, Lahore" right={<Toggle label="Local pickup" />} />
        <Row label="Show when it will arrive" value="“Arrives Thursday to Saturday” on the product page and at checkout" right={<Toggle on label="Delivery estimate" />} />
      </Rows>
      <Rows title="Printed with each order">
        <Row label="Packing slip" value="What is in the parcel, with your logo" right={edit} />
        <Row label="Invoice" value="For customers who ask for one" right={edit} />
        <Row label="Pick list" value="Every item to pull from the shelf, for many orders at once" right={edit} />
      </Rows>
    </>
  ),
  domains: (
    <Rows title="Addresses" action={add("Connect a domain")}>
      <Row label="zohralawn.pk" value="Your own domain · main address · secure (https)" right={<Status tone="good">Live</Status>} />
      <Row label="shop.zohralawn.pk" value="Waiting for its DNS record · last checked 10 min ago" right={<Act small msg="Checked: still waiting for the record"><RefreshCw /> Check now</Act>} />
      <Row label={SHOP.address} value="Free address · sends people to your main address" right={<Status tone="off">Redirects</Status>} />
      <Row label="Change your free address" value="Pick another name before .app.synoradigitals.com; the old one keeps working for 30 days" />
    </Rows>
  ),
  notifications: (
    <>
      <Panel title="Sent from">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field label="Your store's email" value="hello@zohralawn.pk" hint="Replies from customers come here" />
          <Status tone="wait">Prove it is you: 2 records to add</Status>
        </div>
      </Panel>
      <Rows title="On your devices">
        <Row label="New order alerts on this phone" value="A notification the moment an order comes in" right={<Toggle on label="Push alerts" />} />
      </Rows>
      <Rows title="Emails to customers">
        <Row label="Order confirmation" value="With a private link to their order" right={<Toggle on label="Order confirmation" />} />
        <Row label="Shipped" value="With the courier's tracking number" right={<Toggle on label="Shipped" />} />
        <Row label="Sign-in code" value="Customers need it to sign in" right={<Status tone="off">Always</Status>} />
      </Rows>
      <Rows title="Emails to you">
        <Row label="New orders go to" value="orders@zohralawn.pk, bilal@zohralawn.pk" right={edit} />
        <Row label="Low stock" value="When a size drops under 5" right={<Toggle on label="Low stock" />} />
      </Rows>
    </>
  ),
  "customer-accounts": (
    <>
      <Panel title="How customers sign in" flush><Choice name="Sign-in" options={[{ label: "A code by email", hint: "No password to forget: customers type the 6-digit code we send" }, { label: "No accounts", hint: "Everyone checks out as a guest" }]} /></Panel>
      <Rows><Row label="Order links carry a private key" value="Customers can see their order without signing in" right={<Status tone="off">Always</Status>} /></Rows>
    </>
  ),
  privacy: (
    <Rows>
      <Row label="Cookie banner" value="Ask visitors before tracking them" right={<Toggle on label="Cookie banner" />} />
      <Row label="Let customers delete their account" value="From their account page" right={<Toggle on label="Account deletion" />} />
    </Rows>
  ),
  policies: <Panel title="Your policies" flush><PolicyList /></Panel>,
  "custom-data": (
    <Rows title="Which things carry extra fields">
      {[["Products", "3 fields"], ["Variants", "1 field"], ["Customers", "1 field"], ["Orders", "1 field"], ["Collections", "None yet"]].map(([t, n]) => <Row key={t} href={`${A}/content/fields`} label={t} value={n} />)}
    </Rows>
  ),
  "store-status": (
    <>
      <Rows>
        <Row label="Open" value="Customers can browse and buy" right={<Status tone="good">Now</Status>} />
        <Row label="Pause the store" value="Customers see your holding page. Orders stop; nothing is lost." right={<Act small msg="Pausing asks you to confirm first">Pause</Act>} />
        <Row label="Change what this store is" value="E-commerce, a blog, or a restaurant. Pause first; your products are kept." />
      </Rows>
      <Rows><Row label={<span className="text-[#b91c1c]">Close this store</span>} value="Asks for your password. You can download everything first." right={<Act small kind="danger" msg="Closing asks for your password">Close store</Act>} /></Rows>
    </>
  ),
};

/** Your account: about the person, not the store. Reached from the store button. */
export const ACCOUNT: ReactNode = (
  <>
    <Panel title="Profile">
      <div className="flex flex-wrap items-end gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ecebff] text-[13px] font-semibold text-[#3d3dc4]">AK</span>
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <Field label="Name" value={SHOP.owner} />
          <Field label="Email" value={SHOP.email} hint="Confirmed. Changing it sends a code to the new address." />
        </div>
      </div>
    </Panel>
    <Rows title="Security">
      <Row label="Password" value="Changed 5 months ago. Changing it signs you out everywhere else." right={<Act small msg="A password form would open">Change</Act>} />
      <Row label="Two-step sign-in" value="A code from an app as well as your password" right={<Toggle label="Two-step sign-in" />} />
    </Rows>
    <Rows title="Signed in on" action={<button type="button" className="text-[12.5px] text-[#b91c1c] hover:underline">Sign out everywhere else</button>}>
      <Row label={<span className="inline-flex items-center gap-2"><Monitor className="h-3.5 w-3.5 text-[#737373]" /> MacBook · Safari</span>} value="Lahore · this device" right={<Status tone="good">Now</Status>} />
      <Row label={<span className="inline-flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-[#737373]" /> iPhone · Safari</span>} value="Lahore · 2 hours ago" right={<button type="button" className="text-[12.5px] text-[#737373] hover:text-[#b91c1c]">Sign out</button>} />
    </Rows>
    <Rows title="Your stores">
      <Row label={SHOP.name} value={`${SHOP.address} · owner`} right={<Status tone="good">This one</Status>} />
    </Rows>
  </>
);
