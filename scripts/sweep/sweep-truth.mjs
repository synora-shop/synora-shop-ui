// Reads each screen's own text through the signed-in browser, and checks it
// against the database. A plain fetch() here gets the login page, which is how
// the first version of this probe reported seven failures that were mine.
import { execSync } from "node:child_process";
let id=0,ws,pending=new Map();
const list=await (await fetch("http://127.0.0.1:9222/json/list")).json();
ws=new WebSocket(list.find(t=>t.type==="page").webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
ws.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
const send=(m,p={})=>{const n=++id;ws.send(JSON.stringify({id:n,method:m,params:p}));return new Promise(r=>pending.set(n,r));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ev=async e=>(await send("Runtime.evaluate",{expression:e,awaitPromise:true,returnByValue:true})).result?.result?.value;
await send("Page.enable");await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",{width:1512,height:950,deviceScaleFactor:1,mobile:false});

const text = async (path) => {
  await send("Page.navigate",{url:"http://localhost:3000"+path});
  await wait(3000);
  return (await ev("document.body.innerText")) ?? "";
};

const facts = JSON.parse(execSync("npx tsx scripts/sweep/facts.ts", { cwd: process.env.HOME + "/Business/synora-shop/synora-shop-ui", encoding: "utf8" }).trim().split("\n").pop());

let n = 0, bad = 0;
const probe = (name, ok, detail="") => { n++; if (ok) console.log(`  ok    ${name}${detail?" — "+detail:""}`); else { bad++; console.log(`  FAIL  ${name}${detail?" — "+detail:""}`); } };

console.log("DOES THE PANEL TELL THE TRUTH");
const drafts = await text("/admin/drafts");
probe("86 the drafts screen counts what the database holds",
  facts.drafts === 0 ? /Nothing waiting/.test(drafts) : drafts.includes(`${facts.drafts} products are`), `${facts.drafts} drafts`);

const pageDrafts = await text("/admin/pages/drafts");
probe("87 the page drafts screen counts what the database holds",
  facts.pageDrafts === 0 ? /Nothing waiting/.test(pageDrafts) : pageDrafts.includes(`${facts.pageDrafts} pages are`), `${facts.pageDrafts} page drafts`);

const customers = await text("/admin/customers");
probe("88 the customers screen counts everybody", customers.includes(String(facts.customers)), `${facts.customers} people`);

const analytics = await text("/admin/analytics");
probe("89 analytics revenue is the last 30 days, and says so",
  analytics.includes(facts.revenuePrinted) && /last 30 days/i.test(analytics),
  `30d ${facts.revenuePrinted}, all time ${facts.allTimePrinted}`);

const bin = await text("/admin/bin");
probe("90 an empty bin says it is empty", facts.binned > 0 || /bin is empty/i.test(bin), `${facts.binned} binned`);

const orders = await text("/admin/orders");
probe("91 the orders screen shows its orders", orders.includes("ORDER") && orders.includes("TOTAL"), `${facts.orders} orders`);

const pages = await text("/admin/pages");
probe("92 the pages screen lists the pages", pages.includes("Homepage"), `${facts.pages} pages`);

const shop = await text("/shop");
probe("93 the shop page counts only what is published", shop.includes(`${facts.live} products`), `${facts.live} live`);
probe("94 and shows no draft among them", !shop.includes("Draft"));

const products = await text("/admin/products");
probe("95 the catalogue shows the products it holds", products.includes(facts.firstProductTitle), `newest is "${facts.firstProductTitle}"`);

console.log(`\n${n - bad}/${n} passed`);
process.exit(0);
