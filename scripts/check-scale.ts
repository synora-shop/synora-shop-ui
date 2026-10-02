/**
 * What has to hold when a thousand people are on one shop — `npm run check:scale`.
 *
 * Written after being asked whether this platform survives that. The honest
 * answer was "nobody has checked", so this checks, and keeps checking.
 *
 * The question is specifically about **one tenant out of many**, which is the
 * case that breaks differently from general load: a single shop's catalogue,
 * a single shop's cache tags, a single shop's rows in a table every other shop
 * shares. A query that reads "this shop's products" is bounded by that shop
 * and unbounded by the platform.
 *
 * Three verdicts rather than two:
 *
 *   PASS  — the invariant holds.
 *   FAIL  — it was true and has regressed. Fails the build.
 *   OPEN  — a known finding, recorded here with what it costs and what it
 *           needs, not yet fixed. Counted and printed, does not fail the
 *           build, because a guard that fails on day one is a guard somebody
 *           deletes.
 *
 * An OPEN becoming a PASS is the work. A PASS becoming a FAIL is the point.
 *
 * Dependency-free; reads the source and the schema rather than the database,
 * so it runs anywhere and needs no connection.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const read = (p: string) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), "utf8") : "");

let pass = 0;
let fail = 0;
const open: { name: string; why: string }[] = [];

const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

/** A finding that is real, understood, and not yet fixed. */
const finding = (name: string, why: string) => {
  open.push({ name, why });
};

const schema = read("prisma/schema.prisma");

/** The @@index and @@unique lines of one model, whitespace removed. */
function indexesOf(model: string): string[] {
  const block = new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`).exec(schema)?.[0] ?? "";
  return [...block.matchAll(/@@(?:index|unique)\(\[([^\]]+)\]/g)].map((m) =>
    m[1].replace(/\s/g, "")
  );
}

const hasIndex = (model: string, cols: string) => indexesOf(model).includes(cols.replace(/\s/g, ""));

/** Every model that carries a shopId, from the schema itself. */
function tenantModels(): string[] {
  return [...schema.matchAll(/model (\w+) \{([\s\S]*?)\n\}/g)]
    .filter(([, , body]) => /\n\s+shopId\s+String/.test(body))
    .map(([, name]) => name);
}

/** Does this findMany call bound its result? */
function unboundedFindMany(file: string): number {
  const src = read(file);
  let n = 0;
  for (const m of src.matchAll(/\.findMany\(\s*\{/g)) {
    // Walk from the opening brace of the argument object to its match, so a
    // nested `where`/`select` cannot end the block early. `m.index` is where
    // the match starts; the brace is the last character of the match.
    const start = m.index + m[0].length - 1;
    let depth = 0;
    let i = start;
    while (i < src.length) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}" && --depth === 0) break;
      i++;
    }
    if (!src.slice(m.index, i + 1).includes("take:")) n++;
  }
  return n;
}

// ===========================================================================
console.log("INDEXES THE HOT PATHS ACTUALLY USE");
// ===========================================================================
/*
 * An index is only used if its leading columns match the query's filter. Two
 * of these were missing in a way that is easy to miss precisely because an
 * index *existed* on the table — it just led with the wrong column.
 */
check(
  "the storefront product listing has a composite index",
  hasIndex("Product", "shopId,status,isActive,createdAt"),
  "shopId alone means every one of a shop's products is read and sorted in memory, on every shop and collection page"
);
check("ordered categories are indexed", hasIndex("Category", "shopId,name"));
check("a page's sections are indexed in the order they are read", hasIndex("Section", "pageId,order"));
check(
  "the visit prune can use an index",
  hasIndex("Visit", "createdAt"),
  "the prune has no shopId in it, and both other Visit indexes lead with shopId — so it full-scans the biggest table in the database"
);
check("the audit-log prune can use an index", hasIndex("AuditLog", "createdAt"));
check("the OTP prune can use an index", hasIndex("AdminOtp", "expiresAt"));
check("payment events keep the prune index they already had", hasIndex("PaymentEvent", "createdAt"));
check("orders are indexed for the date range every report uses", hasIndex("Order", "shopId,createdAt"));

// Every tenant table needs at least one index leading with shopId, or one
// shop's growth is paid for by every other shop's queries.
for (const model of tenantModels()) {
  const leads = indexesOf(model).some((i) => i.split(",")[0] === "shopId");
  check(`${model} is indexed by the shop that owns it`, leads, "a tenant table without one scans across tenants");
}

// ===========================================================================
console.log("\nNOTHING READS A WHOLE TABLE TO RENDER ONE PAGE");
// ===========================================================================
{
  const products = read("lib/data/products.ts");

  // getProducts: the shop page, every collection page, every search.
  const getProducts = /export async function getProducts[\s\S]*?\n\}/.exec(products)?.[0] ?? "";
  if (getProducts.includes("take:")) {
    check("the storefront product listing is bounded", true);
  } else {
    finding(
      "the storefront product listing is unbounded",
      "lib/data/products.ts getProducts() has no take. It loads every matching product WITH all variants and categories, " +
        "then filters by price and sorts IN JAVASCRIPT. At 2,000 products that is the whole catalogue into memory and into the " +
        "RSC payload on every request. lib/paging.ts exists and is wired into six admin screens; the storefront has none. " +
        "FIX: paginate the shop page. Needs a product decision on page size, because it is visible to customers."
    );
  }

  check(
    "featured products are bounded",
    /getFeaturedProducts[\s\S]*?take:\s*\d+/.test(products),
    "the home page would otherwise render every featured product"
  );

  if (/getFilterOptions[\s\S]*?take:/.test(products)) {
    check("the filter options query is bounded", true);
  } else {
    finding(
      "the filter options query is unbounded",
      "lib/data/products.ts getFilterOptions() reads every variant of every live product to build the size and colour lists. " +
        "DISTINCT in Postgres still reads the rows. FIX: a cached per-shop read, or a facet table."
    );
  }

  const sitemapUnbounded = unboundedFindMany("app/sitemap.ts");
  if (sitemapUnbounded === 0) check("the sitemap is bounded", true);
  else
    finding(
      "the sitemap is unbounded",
      `app/sitemap.ts has ${sitemapUnbounded} findMany with no take. A sitemap is fetched by crawlers, repeatedly, and ` +
        "renders every product and category of a shop in one response. FIX: a take, and split past 50,000 URLs as the spec requires."
    );

  const accountOrders = unboundedFindMany("app/(storefront)/account/orders/page.tsx");
  if (accountOrders === 0) check("a customer's order history is bounded", true);
  else
    finding(
      "a customer's order history is unbounded",
      "app/(storefront)/account/orders/page.tsx reads every order a customer has ever placed. Grows forever, per customer. FIX: paginate."
    );
}

// Bounded by construction: these read a cart, which the client sends and the
// checkout validates, so their size is the cart's size rather than a table's.
check(
  "checkout reads only the variants in the cart",
  /findMany\(\{[\s\S]{0,200}id:\s*\{\s*in:\s*variantIds/.test(read("app/api/orders/route.ts")),
  "an id list is bounded by the cart; a table scan is not"
);

// ===========================================================================
console.log("\nWORK DONE ONCE, NOT PER VISITOR");
// ===========================================================================
{
  const cached = read("lib/data/cached.ts");
  check("there is one place that caches a shop's reads", /unstable_cache/.test(cached));
  check("the cache key carries the shop", /\[kind, shopId\]/.test(cached));
  check(
    "cache tags are per shop, not global",
    /shopTag\(shopId, kind\)/.test(cached),
    "a global tag means one merchant saving a menu discards every other shop's cached pages"
  );
  check("cached reads expire rather than growing forever", /revalidate: CACHE_TTL_SECONDS/.test(cached));

  const tags = read("lib/cache-tags.ts");
  const kinds = [...tags.matchAll(/"(settings|menus|site-text|theme|fonts|buttons)"/g)].length;
  check("all six cached kinds are declared", kinds >= 6, `${kinds} found`);

  // The layout's seven reads are the per-request floor for every storefront
  // page. Six are cached; the seventh resolves the shop and is request-cached.
  const layout = read("app/(storefront)/layout.tsx");
  check(
    "the layout's reads are issued together, not in sequence",
    /await Promise\.all\(\[/.test(layout),
    "seven serial round trips to a database in another region is the whole TTFB"
  );

  const sectionCtx = read("lib/data/section-context.ts");
  check(
    "section data is fetched once per request rather than per section",
    /export const getSectionContext = cache\(/.test(sectionCtx),
    "each section querying for itself is an N+1 across the page"
  );
  if (/cachedForShop/.test(sectionCtx)) {
    check("section data is cached across requests", true);
  } else {
    finding(
      "section data is fetched from the database on every request",
      "lib/data/section-context.ts is wrapped in React cache(), which dedupes within one request and caches nothing between them. " +
        "Every home-page view reads all categories WITH a product _count join, plus featured products. At 1,000 concurrent " +
        "visitors that is 1,000 of those per render window. FIX: cachedForShop, with invalidation wired to product and category writes."
    );
  }
}

// ===========================================================================
console.log("\nA PAGE VIEW IS NOT A WRITE");
// ===========================================================================
{
  const visits = read("lib/analytics/visits.ts");
  check(
    "the visit write never blocks the response",
    /after\(async/.test(visits),
    "a visitor must not wait on bookkeeping"
  );
  check("a failed visit write cannot break a page", /catch\s*\{/.test(visits));
  check("crawlers are not recorded", /BOTS\.test\(userAgent\)/.test(visits));
  check("the visitor is stored as a salted hash, not an address", /createHash\("sha256"\)/.test(visits));

  finding(
    "every storefront page view inserts a row",
    "lib/analytics/visits.ts writes one Visit per view, from the storefront layout. It is after() so nobody waits, but it still " +
      "takes a pooled connection per view and grows the largest table in the database. 1,000 concurrent visitors at ~5 views each " +
      "is ~5,000 inserts, and sustained traffic is hundreds of MB a day for ONE shop against a 0.5 GB database. " +
      "NOT fixable by deduping: analytics reports views AND distinct people from the same rows, so collapsing them changes a " +
      "merchant's numbers. FIX: batch the inserts, or roll up to a daily counter and keep raw rows briefly."
  );
  finding(
    "visits are kept for 400 days",
    "lib/retention.ts RETENTION.visitDays = 400. Reasonable for a year-on-year comparison, impossible at this write rate on the " +
      "current plan. FIX: pair a short raw-row retention with a rolled-up daily table."
  );

  // Nothing else may write on a storefront render.
  const storefrontWrites = ["app/(storefront)/page.tsx", "app/(storefront)/shop/page.tsx", "app/(storefront)/product/[slug]/page.tsx"]
    .filter((f) => /\.(create|update|upsert|delete)(Many)?\(/.test(read(f)));
  check(
    "rendering a storefront page writes nothing else",
    storefrontWrites.length === 0,
    storefrontWrites.join(", ")
  );
}

// ===========================================================================
console.log("\nCONNECTIONS, AND HOW MANY OF THEM THERE CAN BE");
// ===========================================================================
{
  const client = read("lib/prisma.ts");
  check(
    "the pool size is set in code, not in the URL",
    /POOL_MAX/.test(client) && /max:/.test(client),
    "Prisma 7 uses a driver adapter, so ?connection_limit= in DATABASE_URL is read by nobody"
  );
  check("the pool is small per instance", /DATABASE_POOL_MAX \?\? 5/.test(client), "the ceiling is instances x max");
  check("idle sockets are handed back", /idleTimeoutMillis/.test(client));
  check("a dead database fails fast rather than hanging", /connectionTimeoutMillis/.test(client));
  check("one client is reused rather than made per request", /globalForPrisma\.prisma \?\?/.test(client));
  check(
    "TLS is verified rather than merely required",
    /verify-full/.test(client),
    "node-postgres is changing what `require` means"
  );
  check(
    "the pooled endpoint is what the app connects to",
    /DATABASE_URL_UNPOOLED/.test(read("README.md")),
    "direct connections do not survive serverless fan-out"
  );
}

// ===========================================================================
console.log("\nWHAT CROSSES THE WIRE TO THE BROWSER");
// ===========================================================================
{
  const products = read("lib/data/products.ts");
  const omits = (products.match(/omit: \{ costPrice: true \}/g) ?? []).length;
  check("storefront product reads never carry cost price", omits >= 3, `${omits} of them do`);
  check(
    "the cart lives in the browser, not in a table",
    /create<CartState>/.test(read("lib/cart-store.ts")),
    "a server cart is a write per add-to-cart"
  );
  check(
    "storefront images go through the image pipeline",
    /next\/image/.test(read("components/storefront/section-image.tsx")),
    "raw <img> means no AVIF, no resizing and no cache headers"
  );
  check(
    "images are cached for longer than a minute",
    /minimumCacheTTL/.test(read("next.config.ts")),
    "at 60s the same photograph is re-optimised on nearly every view"
  );
  finding(
    "the listing ships every variant of every product",
    "lib/data/products.ts getProducts() uses include: { variants: true, categories: true }. A product card needs a thumbnail, a " +
      "title and a price. Every variant of every product is serialised into the RSC payload instead. FIX: select only what a card renders."
  );
}

// ===========================================================================
console.log("\nTABLES THAT ONLY GROW");
// ===========================================================================
{
  const retention = read("lib/retention.ts");
  for (const table of ["visit", "auditLog", "paymentEvent", "rateLimit", "verificationToken", "adminOtp"]) {
    check(`${table} is pruned on a schedule`, new RegExp(`step\\("${table}"`).test(retention));
  }
  check(
    "the prune runs from a cron rather than by hand",
    /cron\/prune/.test(read("vercel.json")),
    "a sweep nobody triggers is a sweep that does not happen"
  );
  check(
    "the cron refuses an unauthenticated caller",
    /CRON_SECRET/.test(read("app/api/cron/prune/route.ts")),
    "an open prune endpoint is a denial-of-service lever"
  );
  finding(
    "one cron run a day is the plan's ceiling",
    "vercel.json can carry nothing finer than daily — a deploy with an hourly expression is refused outright. The prune and the " +
      "domain sweep both want to run more often, and at this write rate the prune wants to be hourly. Lifts with the plan."
  );
}

// ===========================================================================
console.log("\nWHAT HAPPENS WHEN TWO PEOPLE BUY THE LAST ONE");
// ===========================================================================
{
  const orders = read("app/api/orders/route.ts");
  check("checkout runs in a transaction", /\$transaction\(/.test(orders));
  check(
    "stock moves by a conditional write, not read-then-write",
    /decrement: item\.quantity/.test(orders),
    "reading a count and writing count-1 loses a race"
  );
  check(
    "the decrement is scoped to the shop",
    /shopId: sid[\s\S]{0,80}decrement/.test(orders),
    "a cross-tenant variant id drained a competitor's inventory"
  );
  check(
    "an untracked variant is not decremented",
    /trackInventory: true[\s\S]{0,80}decrement/.test(orders),
    "driving an untracked count negative makes every later reading a lie"
  );
  check("gateway orders hold stock for a bounded time", /reservedUntil/.test(read("prisma/schema.prisma")));
  check(
    "a confirmation is claimed once, by a conditional write",
    /count === 1/.test(read("lib/payments/verify.ts")),
    "two callbacks must confirm once"
  );
  check(
    "rate limiting exists for the public write paths",
    /rateLimit\(/.test(read("app/api/orders/route.ts")) || /rateLimit/.test(read("lib/rate-limit.ts"))
  );
  finding(
    "rate limiting is a row in Postgres",
    "lib/rate-limit.ts is table-backed and says so deliberately — it works on day one with the database that already exists. " +
      "It is a read and a write on every limited request, on the same pool the storefront is using. Fine at tens of shops; the " +
      "first thing to move to Redis when one shop is busy."
  );
}

// ===========================================================================
console.log("\nRENDERING");
// ===========================================================================
{
  const dynamicCount = [
    "app/(storefront)/page.tsx",
    "app/(storefront)/shop/page.tsx",
    "app/(storefront)/product/[slug]/page.tsx",
  ].filter((f) => /force-dynamic/.test(read(f))).length;
  finding(
    `the storefront renders dynamically on every request (${dynamicCount} of 3 key pages)`,
    "Correct today — the page depends on which shop the host resolves to, and on that shop's live data. But it means no page is " +
      "ever served from cache: 1,000 concurrent visitors are 1,000 renders, each paying the layout's reads. The data cache absorbs " +
      "six of those reads; the rest is per request. FIX: a short revalidate per shop on pages that have no per-visitor content."
  );
  check(
    "the proxy makes no database call",
    !/prisma|db\(\)/.test(read("proxy.ts")),
    "it runs on every request for every asset"
  );
  check(
    "host classification is pure string work",
    /classifyHost/.test(read("lib/shop-context.ts")),
    "the cheapest question is answered first"
  );
  check(
    "the shop is resolved once per request",
    /cache\(/.test(read("lib/data/shop.ts")),
    "every later question would otherwise re-ask it"
  );
}

// ===========================================================================
const total = pass + fail;
console.log(`\n${pass} passed, ${fail} failed, ${open.length} open finding(s)`);
if (open.length > 0) {
  console.log("\nOPEN — real, understood, not yet fixed:\n");
  open.forEach((o, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${o.name}`);
    console.log(`      ${o.why.replace(/\s+/g, " ").replace(/(.{96})\s/g, "$1\n      ")}\n`);
  });
}
console.log(`${total + open.length} checks run.`);
process.exit(fail === 0 ? 0 : 1);
