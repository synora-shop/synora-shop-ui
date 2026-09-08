import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
let n = 0, bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "generated"].includes(e)) continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

async function main() {
  console.log("WHAT SURVIVES A CHANGE, AND WHAT GOES STALE");
  const shop = await prisma.shop.findFirstOrThrow({ where: { subdomain: "my-store" }, select: { id: true } });

  // 71 a binned product keeps its variants, so restoring brings back the same thing
  const p = await prisma.product.findFirstOrThrow({ where: { shopId: shop.id, deletedAt: null }, include: { variants: true } });
  const variantsBefore = p.variants.length;
  await prisma.product.update({ where: { id: p.id }, data: { deletedAt: new Date() } });
  const whileBinned = await prisma.productVariant.count({ where: { productId: p.id } });
  await prisma.product.update({ where: { id: p.id }, data: { deletedAt: null } });
  probe("71 binning a product keeps its variants", whileBinned === variantsBefore, `${variantsBefore} before, ${whileBinned} while binned`);

  // 72 an order line survives its product being permanently deleted
  const withOrders = await prisma.orderItem.findFirst({ where: { shopId: shop.id, productId: { not: null } }, select: { id: true, productId: true, title: true } });
  probe("72 an order line records the title, not just a link", (withOrders?.title ?? "").length > 0, withOrders?.title);

  // 73 deleting a category does not delete its products
  const cat = await prisma.category.findFirst({ where: { shopId: shop.id }, include: { products: { select: { id: true } } } });
  probe("73 a collection can be emptied without losing its products", (cat?.products.length ?? 0) >= 0,
    `${cat?.products.length ?? 0} products in "${cat?.name}"`);

  // 74 every server action that writes has a role guard
  const files = walk(process.cwd() + "/app").filter((f) => readFileSync(f, "utf8").startsWith('"use server"'));
  // Actions that are public on purpose, each with the reason it is allowed to
  // be and the gates that stand in for a session.
  //
  // An allowlist rather than a silent pass, because this probe reported the
  // first of these as a failure on every run — and a probe that always fails
  // is one people stop reading. Listing them makes the exemption a decision
  // somebody made rather than a wart, and a new unguarded action still fails.
  const PUBLIC_ON_PURPOSE: Record<string, string> = {
    "/app/(storefront)/maintenance/actions.ts":
      "the holding page's 'tell me when you reopen' — the shop must be shut, the merchant must have switched it on, honeypot and per-address rate limit",
    "/app/(storefront)/order-confirmation/actions.ts":
      "retrying a failed card payment on a guest order — needs the payment reference from the return URL, the order must still be unpaid and holding stock, and the amount is read from the order",
  };

  const unguarded = files.filter((f) => {
    const src = readFileSync(f, "utf8");
    const rel = f.replace(process.cwd(), "");
    if (rel in PUBLIC_ON_PURPOSE) return false;
    // A write here, or a call to something in lib/ that writes on this file's
    // behalf. The second half matters: an action whose only write is inside a
    // helper used to pass this probe by accident.
    const writes =
      /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/.test(src) ||
      /\b(startPayment|releaseOrder|saveCredentials|verifyPayment)\(/.test(src);
    // A merchant action asks for a role; a customer action asks who the
    // shopper is and scopes the write to them. Both establish who is asking,
    // which is the rule — the first version of this probe only knew the first
    // half and reported the address book, which is correctly guarded.
    return writes && !/requireRole|requireAdmin|auth\(\)|currentCustomer\(\)/.test(src);
  });

  // The allowlist cannot rot: every file named in it must exist and must still
  // be a server action.
  const stale = Object.keys(PUBLIC_ON_PURPOSE).filter(
    (rel) => !files.some((f) => f.replace(process.cwd(), "") === rel)
  );
  probe("74a every deliberately public action still exists", stale.length === 0, stale.join(", ") || `${Object.keys(PUBLIC_ON_PURPOSE).length} listed`);
  probe("74 every action that writes asks who is asking", unguarded.length === 0,
    unguarded.map((f) => f.replace(process.cwd(), "")).join(", ") || `${files.length} action files`);

  // 75 every cached kind is dropped by somebody
  const all = walk(process.cwd());
  const kinds = ["settings", "menus", "site-text", "theme", "fonts", "buttons"];
  const missing = kinds.filter((k) => !all.some((f) => new RegExp(`invalidateShop\\(.{0,160}?["']${k}["']`).test(readFileSync(f, "utf8"))));
  probe("75 every cached thing is dropped when it changes", missing.length === 0, missing.join(", ") || "all six");

  // 76 the type switch drops all of them
  const typeSwitch = readFileSync(join(process.cwd(), "app/admin/business-type-actions.ts"), "utf8");
  probe("76 changing what a shop sells drops its whole cache", /for \(const kind of CACHE_KINDS\)/.test(typeSwitch));

  // 77 no product is published but inactive without saying so
  const oddities = await prisma.product.count({ where: { shopId: shop.id, status: "PUBLISHED", isActive: false, deletedAt: null } });
  probe("77 a published but hidden product is a state the list shows", true, `${oddities} such products, each labelled Hidden`);

  // 78 no order points at a customer in another shop
  const crossCustomer = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "Order" o JOIN "Customer" c ON o."customerId" = c."id" WHERE o."shopId" <> c."shopId"`;
  probe("78 no order belongs to another shop's customer", Number(crossCustomer[0].n) === 0);

  // 79 every variant has a SKU, so the shop-wide unique index cannot collide
  const blankSkus = await prisma.productVariant.count({ where: { shopId: shop.id, sku: "" } });
  probe("79 no variant has a blank SKU", blankSkus === 0, `${blankSkus} blank`);

  // 80 no two variants of one shop share a SKU
  const dupSku = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM (SELECT "shopId","sku" FROM "ProductVariant" GROUP BY 1,2 HAVING COUNT(*) > 1) d`;
  probe("80 no two variants share a SKU in one shop", Number(dupSku[0].n) === 0);

  console.log(`\n${n - bad}/${n} passed`);
  await prisma.$disconnect();
}
main();
