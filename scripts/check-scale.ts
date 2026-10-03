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
import { readFileSync, existsSync, readdirSync } from "fs";
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

  // Was unbounded: every variant of every live product, on every shop and
  // collection page. `distinct` does not save the read — Postgres visits the
  // rows and then de-duplicates — so it was the widest query the storefront
  // made, for an answer identical for every visitor.
  const filterOptions = /export async function getFilterOptions[\s\S]*?\n\}/.exec(products)?.[0] ?? "";
  check(
    "the filter options are cached per shop",
    /cachedForShop\([\s\S]{0,60}"filters"/.test(filterOptions),
    "the same answer for every visitor, read once per shop"
  );
  check("and bounded even so", /take: 500/.test(filterOptions));

  const sitemapUnbounded = unboundedFindMany("app/sitemap.ts");
  if (sitemapUnbounded === 0) check("the sitemap is bounded", true);
  else
    finding(
      "the sitemap is unbounded",
      `app/sitemap.ts has ${sitemapUnbounded} findMany with no take. A sitemap is fetched by crawlers, repeatedly, and ` +
        "renders every product and category of a shop in one response. FIX: a take, and split past 50,000 URLs as the spec requires."
    );

  check(
    "a customer's order history is paginated",
    unboundedFindMany("app/(storefront)/account/orders/page.tsx") === 0,
    "it read every order a customer had ever placed, with every line item — a bill paid by the customer who shops most"
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
console.log("\nA DERIVED COLUMN THAT CANNOT DRIFT");
// ===========================================================================
/*
 * `effectivePrice` is `salePrice ?? basePrice`, stored so the storefront can
 * order by it — the listing could not be paginated while the sort lived in
 * JavaScript, because you cannot take the first 24 of a list you have not
 * finished sorting.
 *
 * A stored derived value is only as good as the paths that write it. A
 * Postgres GENERATED column would make this impossible to get wrong, but
 * Prisma puts every scalar it knows about into its INSERTs and the failure
 * mode is every product save erroring in production. So the application
 * maintains it, and this is what stops a sixth write path from forgetting.
 */
{
  const writers = [
    "app/admin/products/actions.ts",
    "app/admin/products/import/actions.ts",
    "prisma/seed.ts",
    "scripts/seed-demo.ts",
    "scripts/seed-theme-store.ts",
  ];
  for (const f of writers) {
    const src = read(f);
    if (!/basePrice:/.test(src)) continue;
    check(
      `${f.replace(/^.*\//, "")} writes effectivePrice wherever it writes a price`,
      /effectivePrice/.test(src),
      "a price saved without it keeps sorting at its old value, and nothing looks wrong"
    );
  }

  // Any file that writes basePrice and is not on the list above is a path
  // nobody thought about.
  const all: string[] = [];
  const walk = (dir: string) => {
    for (const e of require("fs").readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        if (!/node_modules|generated|\.next/.test(rel)) walk(rel);
      } else if (/\.tsx?$/.test(e.name)) all.push(rel);
    }
  };
  for (const root of ["app", "lib", "scripts", "prisma"]) walk(root);
  // A *write* of a price, not a read of one. `basePrice: true` is a select,
  // `basePrice: number` is a type, and both appear in files that never write
  // a product — the first version of this check flagged nine of them. A write
  // is a value assigned in a file that also calls a product write.
  const writesAPrice = (f: string) => {
    const src = read(f);
    if (!/\bproduct\.(create|update|upsert|createMany|updateMany)\(/.test(src)) return false;
    return /basePrice:\s*(?!true\b|number\b|boolean\b)\S/.test(src);
  };
  const unexpected = all.filter((f) => writesAPrice(f) && !writers.includes(f));
  check(
    "no other file writes a price",
    unexpected.length === 0,
    `${unexpected.join(", ")} — add it to this guard and set effectivePrice`
  );

  check(
    "the listing orders by the stored column, not in JavaScript",
    /orderBy[\s\S]{0,400}effectivePrice/.test(read("lib/data/products.ts")),
    "sorting a page is not sorting"
  );
  check(
    "the listing is paginated",
    /take: perPage/.test(read("lib/data/products.ts")),
    "the whole catalogue per request is what this is all for"
  );
  check(
    "the count is of the same query as the page",
    /client\.product\.count\(\{ where \}\)/.test(read("lib/data/products.ts")),
    "a count of a looser query is a pagination bar that lies"
  );
  check(
    "hide-out-of-stock is applied in SQL, not after paging",
    /hideOutOfStock/.test(read("lib/data/products.ts")) &&
      !/allProducts\.filter/.test(read("app/(storefront)/shop/page.tsx")),
    "filtering after take returns short pages"
  );
  // Scoped to getProducts. getFeaturedProducts and getProductBySlug include
  // whole rows on purpose — one is eight products, the other is one, and the
  // product page renders nearly all of it.
  const listing = /export async function getProducts[\s\S]*?\n\}/.exec(read("lib/data/products.ts"))?.[0] ?? "";
  check(
    "the listing selects only what a card draws",
    /select: PRODUCT_CARD_SELECT/.test(listing) && !/include:/.test(listing),
    "whole variant rows for every product on the page is payload nobody reads"
  );
}

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
console.log("\nTHE CATALOGUE CACHE IS ACTUALLY DROPPED");
// ===========================================================================
/*
 * check:cache asserts that a file writing a cached model contains the string
 * `invalidateShop(`. That is weaker than it looks: this codebase now wraps the
 * call in a local `dropCatalog()` helper, and with the helper present every
 * call site can be deleted and that check still passes. Verified by deleting
 * them — 34 passed, 0 failed, with nothing dropping the cache.
 *
 * So the pairing is asserted here by counting instead. Every mutation that
 * revalidates the storefront must also drop the catalogue: those are the same
 * events, and a merchant who renames a category and watches their shop not
 * change for five minutes is the bug cache-tags.ts was written about.
 */
for (const f of [
  "app/admin/products/actions.ts",
  "app/admin/categories/actions.ts",
  "app/admin/products/import/actions.ts",
]) {
  const src = read(f);
  const revalidates = (src.match(/revalidatePath\("\/shop"\)/g) ?? []).length;
  const drops = (src.match(/await dropCatalog\(\)/g) ?? []).length;
  check(
    `${f.replace(/^app\/admin\//, "")} drops the catalogue wherever it revalidates the shop`,
    revalidates > 0 && drops >= revalidates,
    `${revalidates} revalidatePath("/shop"), ${drops} dropCatalog()`
  );
}
check(
  "the catalogue is a declared cache kind",
  /"catalog"/.test(read("lib/cache-tags.ts")),
  "an undeclared tag is dropped by nobody"
);
check(
  "the catalogue is read through one callback, not two under one kind",
  (read("lib/data/section-context.ts").match(/cachedForShop\(/g) ?? []).length === 1,
  "cachedForShop keys on shop and kind alone, so two callbacks under one kind are the same entry — " +
    "whichever runs first wins and the second gets the wrong shape, which has already happened here once"
);

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

  // Was a row per page view, kept 400 days, in the biggest table here. The
  // naive fix — stop recording repeats — was wrong, because the screen reports
  // views AND distinct people from these same rows. A counter keeps both and
  // bounds growth to visitor-path-days instead of page views.
  check(
    "a repeat view increments a counter rather than inserting a row",
    /visit\.upsert\(/.test(visits) && /views: \{ increment: 1 \}/.test(visits),
    "growth was page views; it is now visitors x paths x days"
  );
  check(
    "the day is the shop's own, decided when the row is written",
    /localDay\(settings\.timeZone/.test(visits),
    "a UTC day in the key puts one row across two of the shop's days for any shop not on UTC"
  );
  check(
    "direct traffic has an empty referrer, not a null one",
    /return "";/.test(visits) && hasIndex("Visit", "shopId,visitor,path,day,referrer"),
    "Postgres counts two NULLs as distinct, so a nullable column in the key de-duplicates nothing for direct visits — most of them"
  );
  check(
    "the live figure reads the latest sighting",
    /lastSeenAt/.test(read("lib/analytics/queries.ts")),
    "a counter row's createdAt is the first view, which would make \"right now\" wrong"
  );
  check(
    "every figure that counted rows now sums the counter",
    (read("lib/analytics/queries.ts").match(/sum\("views"\)/g) ?? []).length === 3,
    "views, top paths and referrers all counted rows"
  );

  // Retention is not a free dial. The screen offers "Last 12 months", so
  // anything under ~365 days silently empties that chart rather than saving
  // space — which is exactly the sort of tidy-up that looks like an
  // optimisation.
  {
    const retention = read("lib/retention.ts");
    const kept = Number(/visitDays:\s*(\d+)/.exec(retention)?.[1] ?? 0);
    const longestRange = Math.max(
      ...[...read("lib/analytics.ts").matchAll(/days:\s*(\d+)/g)].map((m) => Number(m[1]))
    );
    check(
      "visits are kept for at least as long as the longest range on offer",
      kept >= longestRange,
      `keeping ${kept} days, the analytics screen offers ${longestRange}`
    );
  }

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
  // Was a finding: the listing used include: { variants: true, categories: true },
  // so every variant of every product on the page — options, SKU, barcode,
  // weight, image URL and the CSV passthrough blob — went into the payload the
  // browser downloads, and the category join was fetched for nobody.
  check(
    "a product card is sent only the fields it draws",
    /variants: \{[\s\S]{0,400}select: \{/.test(read("lib/data/products.ts")),
    "whole variant rows for every product is payload nobody reads"
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
  // One run a day is the hosting plan's ceiling, not a bug, and a deploy
  // carrying a finer expression is refused outright — which is how it was
  // discovered. It is not fixable in code, so what is checked is that the
  // system is *correct* at that cadence rather than merely tolerable:
  //
  //   * the prune has nothing it must catch within the day — visits are now a
  //     bounded counter rather than unbounded rows, so a day's delay costs
  //     storage that no longer accumulates dangerously;
  //   * the domain sweep's backoff is written for an hourly schedule and says
  //     so, and the route comment names the one line to change on Pro.
  {
    const crons = read("vercel.json");
    const daily = [...crons.matchAll(/"schedule":\s*"([^"]+)"/g)].map((m) => m[1]);
    check(
      "every cron is daily or coarser, which is what the plan allows",
      daily.length > 0 && daily.every((e) => /^\d+ \d+ \* \* \*$/.test(e)),
      `${daily.join(", ")} — a finer expression is refused at deploy time, so this fails the deploy rather than the build`
    );
    check(
      "the one line to change on a bigger plan is named where it lives",
      /43 \* \* \* \*/.test(read("docs/QUEUE.md")) || /hourly/.test(read("app/api/cron/domains/route.ts")),
      "a constraint nobody wrote down is one nobody lifts"
    );
  }
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
  // This was recorded as a finding and the finding was overstated. Table-backed
  // rate limiting is a read and a write per limited request, which would matter
  // if it sat on the browse path. It does not: every call site is an action or
  // a confirmation page — signing up, resetting a password, an enquiry, a
  // discount preview, a payment callback. The thousand people browsing a shop
  // never touch it.
  //
  // So what is asserted is the thing that must stay true: the pages those
  // thousand people load do not rate-limit.
  for (const page of [
    "app/(storefront)/page.tsx",
    "app/(storefront)/shop/page.tsx",
    "app/(storefront)/product/[slug]/page.tsx",
    "app/(storefront)/collections/[slug]/page.tsx",
    "app/(storefront)/cart/page.tsx",
    "app/(storefront)/layout.tsx",
  ]) {
    check(
      `${page.replace("app/(storefront)/", "")} does not rate-limit`,
      !/rateLimit\(/.test(read(page)),
      "a database read and write per page view, on the pool the storefront is already using"
    );
  }
}


// ===========================================================================
console.log("\nTHE DATABASE CAN BE REBUILT FROM ITS MIGRATIONS");
// ===========================================================================
/*
 * Every model needs a CREATE TABLE somewhere in the history.
 *
 * `AdminOtp` did not have one. It was in schema.prisma, written to on every
 * admin sign-in code and deleted from by the nightly prune, and no migration
 * ever created it — production has it because it got there some other way,
 * most likely a `db push` before hand-written migrations became the rule.
 *
 * Nothing catches that from the inside. `prisma generate` reads the schema and
 * is happy, every type checks, every query compiles, and the running system
 * works. It only appears when the history is applied to an empty database:
 * a fresh Preview branch, a rebuild from backup, a new environment. Admin
 * sign-in then throws the first time anybody asks for a code.
 *
 * MASTER.md names this hazard — "_prisma_migrations can diverge from the real
 * schema" — and warns against fixing it with `db push`, which would make the
 * divergence permanent. This asserts it instead, statically, so the next
 * missing table fails the build rather than a disaster recovery.
 */
{
  const models = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]);
  const dirs = readdirSync(join(ROOT, "prisma/migrations"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const history = dirs
    .map((d) => read(`prisma/migrations/${d}/migration.sql`))
    .join("\n");

  check("there is a migration history to check", dirs.length > 0);
  for (const model of models) {
    check(
      `${model} is created by a migration`,
      new RegExp(`CREATE TABLE\\s+(IF NOT EXISTS\\s+)?"${model}"`).test(history),
      "in the schema and in no migration — a fresh database comes up without it"
    );
  }

  // A table has to be created by a file that sorts earlier than one indexing
  // it, because migrations apply in filename order. This is how the missing
  // table surfaced: an index migration failed on a relation that did not exist.
  for (const model of models) {
    const creator = dirs.sort().find((d) =>
      new RegExp(`CREATE TABLE\\s+(IF NOT EXISTS\\s+)?"${model}"`).test(
        read(`prisma/migrations/${d}/migration.sql`)
      )
    );
    if (!creator) continue;
    const toucher = dirs.sort().find((d) =>
      new RegExp(`(CREATE INDEX|ALTER TABLE)[^;]*"${model}"`).test(
        read(`prisma/migrations/${d}/migration.sql`)
      )
    );
    if (!toucher) continue;
    check(
      `${model} is created before it is altered`,
      creator <= toucher,
      `created in ${creator}, touched in ${toucher}`
    );
  }
}

// ===========================================================================
console.log("\nRENDERING");
// ===========================================================================
{
  // A storefront page renders on every request, and that is correct: which
  // shop it is comes from the host, and what it shows is that shop's live
  // data. The question is not whether to stop — it is what one render costs,
  // because a thousand concurrent visitors are a thousand of them.
  //
  // Serving the HTML from the CDN instead would remove nearly all of that, and
  // the precondition for it holds: nothing in the storefront shell is
  // per-visitor — the header reads no session and the basket lives in the
  // browser. It is **deliberately not switched on**, for two reasons that are
  // not about performance: a shop that pauses would keep serving its old page
  // for the length of the cache, and the customizer preview renders through
  // the same route, so a merchant would edit a section and watch it not
  // change. Both need a bypass, and the bypass needs to know things proxy.ts
  // is forbidden to ask the database.
  //
  // So what is asserted is that the render stays cheap, and that the door
  // stays open.
  check(
    "nothing in the storefront shell is per-visitor",
    !/currentCustomer|useSession|auth\(\)/.test(read("app/(storefront)/layout.tsx")) &&
      !/currentCustomer|useSession|auth\(\)/.test(read("components/storefront/site-header.tsx")),
    "the moment the header greets somebody by name, caching the HTML stops being possible at all"
  );
  check(
    "the basket is the browser's, so two visitors share a page",
    /create<CartState>/.test(read("lib/cart-store.ts"))
  );
  check(
    "every read the layout makes is a cached kind",
    (read("app/(storefront)/layout.tsx").match(/get(StoreSettings|Menus|SiteText|ThemeTokens|FontAssets|StickyButtons|ThemeLayout)\(\)/g) ?? [])
      .length >= 7,
    "the floor every storefront page pays"
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
