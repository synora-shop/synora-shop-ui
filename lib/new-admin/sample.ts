/**
 * The new admin's preview (15 October): sample data only, so the design can
 * be judged on a believable shop without touching any database. A lawn label
 * in Lahore, with the products this repository already has photographs of
 * (public/products). Nothing here is read by the real admin.
 */
import { formatMoney } from "@/lib/money";

export type NavItem = { href: string; label: string };
/** The brand colour an area of the admin wears: its dot in the rail and its page icon. */
export type Tone = "iris" | "lavender" | "sky" | "mint" | "ink";
export type NavGroup = { id: string; label: string; href: string; icon: string; tone: Tone; badge?: number; items?: NavItem[] };

const A = "/new-admin";

/**
 * Shopify's organisation of the panel, cut to what Synora can build in code
 * alone (Abdul, 15 October): Home; Orders; Products; Customers; Discounts;
 * Content; Analytics; Online Store (themes, pages, preferences). Settings sit
 * apart, and Policies live there, as on Shopify. Every group is drawn open.
 */
export const NAV: NavGroup[] = [
  { id: "home", label: "Home", href: A, icon: "home", tone: "ink" },
  {
    id: "orders", label: "Orders", href: `${A}/orders`, icon: "orders", tone: "iris", badge: 4,
    items: [
      { href: `${A}/orders/drafts`, label: "Drafts" },
      { href: `${A}/orders/abandoned`, label: "Abandoned checkouts" },
    ],
  },
  {
    id: "products", label: "Products", href: `${A}/products`, icon: "products", tone: "mint",
    items: [
      { href: `${A}/products/collections`, label: "Collections" },
      { href: `${A}/products/inventory`, label: "Inventory" },
    ],
  },
  {
    id: "customers", label: "Customers", href: `${A}/customers`, icon: "customers", tone: "sky",
    items: [{ href: `${A}/customers/accounts`, label: "With accounts" }],
  },
  { id: "discounts", label: "Discounts", href: `${A}/discounts`, icon: "discounts", tone: "lavender" },
  {
    id: "content", label: "Content", href: `${A}/content`, icon: "content", tone: "mint",
    items: [
      { href: `${A}/content/menus`, label: "Menus" },
      { href: `${A}/content/blog`, label: "Blog posts" },
    ],
  },
  { id: "analytics", label: "Analytics", href: `${A}/analytics`, icon: "analytics", tone: "iris" },
  {
    id: "store", label: "Online Store", href: `${A}/online-store`, icon: "app", tone: "sky",
    items: [
      { href: `${A}/online-store/pages`, label: "Pages" },
      { href: `${A}/online-store/preferences`, label: "Preferences" },
    ],
  },
];

/** Settings: one page, every section open; this is its index. */
export const SETTINGS: { slug: string; label: string; icon: string; tone: Tone; blurb: string }[] = [
  { slug: "general", label: "General", icon: "store", tone: "iris", blurb: "Store details and defaults" },
  { slug: "plan", label: "Plan", icon: "plan", tone: "lavender", blurb: "Your plan and what it includes" },
  { slug: "billing", label: "Billing", icon: "billing", tone: "lavender", blurb: "How you pay Synora, and your invoices" },
  { slug: "users", label: "Users and permissions", icon: "users", tone: "sky", blurb: "Who can work on this store, and what they can do" },
  { slug: "payments", label: "Payments", icon: "payments", tone: "mint", blurb: "Cash on delivery, wallets and cards" },
  { slug: "checkout", label: "Checkout", icon: "checkout", tone: "iris", blurb: "What customers fill in, and what happens after" },
  { slug: "customer-accounts", label: "Customer accounts", icon: "customers", tone: "sky", blurb: "How customers sign in to your store" },
  { slug: "shipping", label: "Shipping and delivery", icon: "shipping", tone: "mint", blurb: "Where you deliver, how fast, and for how much" },
  { slug: "domains", label: "Domains", icon: "domains", tone: "iris", blurb: "Your free address and your own domain" },
  { slug: "notifications", label: "Notifications", icon: "bell", tone: "lavender", blurb: "The emails your store sends, and to whom" },
  { slug: "custom-data", label: "Custom data", icon: "data", tone: "sky", blurb: "Extra fields on products, orders and customers" },
  { slug: "privacy", label: "Customer privacy", icon: "shield", tone: "mint", blurb: "Cookie banner and privacy choices" },
  { slug: "policies", label: "Policies", icon: "policy", tone: "lavender", blurb: "Refunds, privacy, terms and shipping, linked from checkout" },
  { slug: "account", label: "Your account", icon: "security", tone: "ink", blurb: "Your profile, password and signed-in devices" },
];

export const SHOP = { name: "Zohra Lawn", address: "zohra.app.synoradigitals.com", initials: "ZL", owner: "Ayesha Khan", email: "ayesha@zohralawn.pk" };

const img = (slug: string, file = "01_front.png") => `/products/${slug}/${file}`;

export type Product = { slug: string; name: string; image: string; status: "Active" | "Draft"; stock: number | null; variants: number; collection: string; price: number };
export const PRODUCTS: Product[] = [
  { slug: "zohra", name: "Zohra 3-piece embroidered lawn", image: img("zohra"), status: "Active", stock: 42, variants: 4, collection: "Summer Lawn", price: 8900 },
  { slug: "gulnaar", name: "Gulnaar printed lawn with chiffon dupatta", image: img("gulnaar"), status: "Active", stock: 18, variants: 4, collection: "Summer Lawn", price: 7450 },
  { slug: "kajal", name: "Kajal black chikankari kurta", image: img("kajal"), status: "Active", stock: 6, variants: 3, collection: "Eid Edit", price: 6200 },
  { slug: "zamurd", name: "Zamurd emerald jacquard suit", image: img("zamurd"), status: "Active", stock: 27, variants: 4, collection: "Eid Edit", price: 11900 },
  { slug: "ayla", name: "Ayla two-piece co-ord", image: img("ayla", "01_top_1.jpg"), status: "Active", stock: 0, variants: 3, collection: "Pret", price: 5600 },
  { slug: "naqsh", name: "Naqsh block-print lawn", image: img("naqsh"), status: "Active", stock: 33, variants: 4, collection: "Summer Lawn", price: 6950 },
  { slug: "merlot", name: "Merlot velvet shawl suit", image: img("merlot"), status: "Draft", stock: 12, variants: 3, collection: "Winter", price: 14500 },
  { slug: "safa", name: "Safa white cotton kurta", image: img("safa"), status: "Active", stock: 4, variants: 3, collection: "Pret", price: 4300 },
  { slug: "siyah-gul", name: "Siyah Gul embroidered organza", image: img("siyah-gul"), status: "Active", stock: 15, variants: 4, collection: "Eid Edit", price: 13200 },
  { slug: "veyra", name: "Veyra pastel lawn", image: img("veyra"), status: "Active", stock: null, variants: 1, collection: "Summer Lawn", price: 5900 },
  { slug: "blush", name: "Blush pink festive suit", image: img("blush"), status: "Draft", stock: 9, variants: 3, collection: "Eid Edit", price: 9800 },
  { slug: "sage", name: "Sage linen two-piece", image: img("sage"), status: "Active", stock: 21, variants: 3, collection: "Winter", price: 7800 },
];

export type Payment = "Cash on delivery" | "JazzCash" | "Easypaisa" | "Card";
export type Order = { id: number; when: string; customer: string; city: string; items: number; total: number; payment: Payment; paid: boolean; fulfilled: "Unfulfilled" | "Fulfilled" | "Returned"; note?: boolean };
export const ORDERS: Order[] = [
  { id: 1048, when: "Today, 2:31 pm", customer: "Hira Malik", city: "Lahore", items: 2, total: 16350, payment: "Cash on delivery", paid: false, fulfilled: "Unfulfilled", note: true },
  { id: 1047, when: "Today, 11:05 am", customer: "Sana Iqbal", city: "Karachi", items: 1, total: 8900, payment: "JazzCash", paid: true, fulfilled: "Unfulfilled" },
  { id: 1046, when: "Yesterday, 9:48 pm", customer: "Mehwish Raza", city: "Islamabad", items: 3, total: 23100, payment: "Card", paid: true, fulfilled: "Unfulfilled" },
  { id: 1045, when: "Yesterday, 4:12 pm", customer: "Ayesha Tariq", city: "Faisalabad", items: 1, total: 6200, payment: "Easypaisa", paid: true, fulfilled: "Unfulfilled" },
  { id: 1044, when: "13 Oct, 7:20 pm", customer: "Fatima Noor", city: "Lahore", items: 2, total: 13350, payment: "Cash on delivery", paid: true, fulfilled: "Fulfilled" },
  { id: 1043, when: "13 Oct, 1:02 pm", customer: "Zainab Ali", city: "Multan", items: 1, total: 11900, payment: "JazzCash", paid: true, fulfilled: "Fulfilled", note: true },
  { id: 1042, when: "12 Oct, 6:45 pm", customer: "Rabia Saeed", city: "Rawalpindi", items: 1, total: 5600, payment: "Cash on delivery", paid: false, fulfilled: "Returned" },
  { id: 1041, when: "12 Oct, 10:15 am", customer: "Amna Shah", city: "Karachi", items: 4, total: 29800, payment: "Card", paid: true, fulfilled: "Fulfilled" },
  { id: 1040, when: "11 Oct, 8:30 pm", customer: "Noor Fatima", city: "Peshawar", items: 1, total: 7450, payment: "Easypaisa", paid: true, fulfilled: "Fulfilled" },
  { id: 1039, when: "10 Oct, 3:55 pm", customer: "Iqra Javed", city: "Lahore", items: 2, total: 12750, payment: "Cash on delivery", paid: true, fulfilled: "Fulfilled" },
];

export const CUSTOMERS = [
  { name: "Amna Shah", email: "amna.shah@gmail.com", city: "Karachi", orders: 6, spent: 71400, account: true, since: "Mar 2026" },
  { name: "Hira Malik", email: "hira.malik@outlook.com", city: "Lahore", orders: 4, spent: 43900, account: true, since: "May 2026" },
  { name: "Mehwish Raza", email: "mehwish.r@gmail.com", city: "Islamabad", orders: 3, spent: 38250, account: false, since: "Jun 2026" },
  { name: "Fatima Noor", email: "fatima.noor@yahoo.com", city: "Lahore", orders: 3, spent: 27600, account: true, since: "Jul 2026" },
  { name: "Zainab Ali", email: "zainab.ali@gmail.com", city: "Multan", orders: 2, spent: 19800, account: false, since: "Aug 2026" },
  { name: "Sana Iqbal", email: "sana.iqbal@gmail.com", city: "Karachi", orders: 1, spent: 8900, account: false, since: "Oct 2026" },
  { name: "Ayesha Tariq", email: "ayesha.t@gmail.com", city: "Faisalabad", orders: 1, spent: 6200, account: true, since: "Oct 2026" },
];

export const DISCOUNTS = [
  { code: "EID25", kind: "25% off the order", who: "Everyone", used: 128, limit: 300, status: "Active" as const, ends: "Ends 20 Oct" },
  { code: "FREESHIP", kind: "Free delivery", who: `Orders over ${formatMoney(10000, "PKR")}`, used: 64, limit: null, status: "Active" as const, ends: "No end date" },
  { code: "WELCOME10", kind: "10% off the first order", who: "New customers", used: 211, limit: null, status: "Active" as const, ends: "No end date" },
  { code: "LAWN500", kind: `${formatMoney(500, "PKR")} off Summer Lawn`, who: "Everyone", used: 90, limit: 90, status: "Used up" as const, ends: "Ended 30 Sep" },
  { code: "WINTER15", kind: "15% off Winter", who: "Everyone", used: 0, limit: 200, status: "Scheduled" as const, ends: "Starts 1 Nov" },
];

/** Last 30 days, for the home page's charts. */
export const SALES_30 = [41, 38, 52, 47, 60, 55, 49, 63, 71, 58, 66, 74, 69, 81, 77, 72, 88, 84, 79, 93, 90, 86, 101, 97, 92, 108, 114, 105, 121, 128].map((n) => n * 1000);
export const ORDERS_30 = [5, 4, 6, 6, 7, 6, 5, 8, 9, 7, 8, 9, 8, 10, 9, 9, 11, 10, 9, 12, 11, 10, 13, 12, 11, 13, 14, 13, 15, 16];
export const SESSIONS_30 = [310, 290, 355, 340, 402, 388, 361, 420, 455, 410, 438, 470, 452, 501, 489, 470, 530, 516, 498, 560, 548, 531, 590, 575, 560, 612, 640, 618, 668, 702];

/** One order in full, for the order page. */
export const ORDER_DETAIL = {
  id: 1048,
  when: "15 Oct 2026 at 2:31 pm",
  customer: { name: "Hira Malik", email: "hira.malik@outlook.com", phone: "0300 1234567", orders: 4, address: "House 14, Street 7, DHA Phase 5, Lahore" },
  lines: [
    { slug: "zohra", qty: 1, size: "M", price: 8900 },
    { slug: "gulnaar", qty: 1, size: "L", price: 7450 },
  ],
  delivery: 0,
  discount: null as { code: string; amount: number } | null,
  note: "Please gift wrap the Gulnaar suit, it is for my sister's mehndi.",
  timeline: [
    { at: "2:31 pm", text: "Order placed by Hira Malik, cash on delivery." },
    { at: "2:31 pm", text: "Confirmation email sent to hira.malik@outlook.com." },
    { at: "2:34 pm", text: "New-order email sent to the store." },
  ],
};
