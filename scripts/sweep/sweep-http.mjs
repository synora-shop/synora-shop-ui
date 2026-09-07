// Probes that need no session: what does the app give a stranger?
const BASE = "http://localhost:3000";
let n = 0, bad = 0;
const probe = async (name, path, expect) => {
  n++;
  const r = await fetch(BASE + path, { redirect: "manual" });
  const body = r.status === 200 ? (await r.text()).slice(0, 200) : "";
  const ok = expect(r, body);
  if (!ok) { bad++; console.log(`  FAIL  ${name} → ${r.status} ${r.headers.get("location") ?? ""} ${body.slice(0,80)}`); }
  else console.log(`  ok    ${name} → ${r.status}${r.headers.get("location") ? " → " + r.headers.get("location") : ""}`);
};

console.log("ACCESS WITHOUT A SESSION");
const redirects = (r) => r.status === 307 || r.status === 302 || (r.status === 200 && false);
await probe("1  /admin", "/admin", redirects);
await probe("2  /admin/products", "/admin/products", redirects);
await probe("3  /admin/settings", "/admin/settings", redirects);
await probe("4  product export", "/admin/products/export", (r, b) => r.status !== 200 || !b.includes("Title,URL handle"));
await probe("5  customer export", "/admin/customers/export", (r, b) => r.status !== 200 || !b.includes("First Name"));
await probe("6  order export", "/admin/orders/export", (r, b) => r.status !== 200 || !b.includes("Name,Email"));
await probe("7  analytics export", "/admin/analytics/export", (r, b) => r.status !== 200 || !b.toLowerCase().includes("revenue"));
await probe("8  drafts screen", "/admin/drafts", redirects);
await probe("9  page drafts", "/admin/pages/drafts", redirects);
await probe("10 an admin route that does not exist", "/admin/nonsense", (r) => r.status === 307 || r.status === 404);

console.log(`\n${n - bad}/${n} passed`);
process.exit(0);
