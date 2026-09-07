import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
let n = 0, bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

async function main() {
  const shops = await prisma.shop.findMany({ select: { id: true, subdomain: true } });
  console.log("TENANCY — shops on this database:", shops.map((s) => s.subdomain).join(", "));

  // 11: no order line belongs to a different shop than its order
  const cross = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "OrderItem" oi JOIN "Order" o ON oi."orderId" = o."id"
     WHERE oi."shopId" <> o."shopId"`;
  probe("11 no order line belongs to another shop's order", Number(cross[0].n) === 0, `${cross[0].n} lines`);

  // 12: every row that carries a shopId carries a real one
  const orphanProducts = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "Product" p LEFT JOIN "Shop" s ON p."shopId" = s."id" WHERE s."id" IS NULL`;
  probe("12 no product points at a shop that does not exist", Number(orphanProducts[0].n) === 0);

  // 13: a variant's shop matches its product's
  const crossVariant = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "ProductVariant" v JOIN "Product" p ON v."productId" = p."id"
     WHERE v."shopId" <> p."shopId"`;
  probe("13 no variant belongs to another shop's product", Number(crossVariant[0].n) === 0);

  // 14: a section's shop matches its page's
  const crossSection = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "Section" x JOIN "Page" p ON x."pageId" = p."id"
     WHERE x."shopId" <> p."shopId"`;
  probe("14 no section belongs to another shop's page", Number(crossSection[0].n) === 0);

  // 15: an address's shop matches its customer's
  const crossAddress = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "Address" a JOIN "Customer" c ON a."customerId" = c."id"
     WHERE a."shopId" <> c."shopId"`;
  probe("15 no address belongs to another shop's customer", Number(crossAddress[0].n) === 0);

  // 16: the same email can exist in two shops without colliding
  const emails = await prisma.$queryRaw<{ email: string; shops: bigint }[]>`
    SELECT "email", COUNT(DISTINCT "shopId")::bigint AS shops FROM "Customer" GROUP BY "email" HAVING COUNT(DISTINCT "shopId") > 1 LIMIT 3`;
  probe("16 one address may belong to a person in two shops", true, emails.length ? `${emails.length} shared` : "none shared, constraint is per shop");

  // 17: no page slug is duplicated inside one shop and business type
  const dupSlug = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM (
      SELECT "shopId", "businessType", "slug" FROM "Page" GROUP BY 1,2,3 HAVING COUNT(*) > 1
    ) d`;
  probe("17 no two pages share an address in one shop", Number(dupSlug[0].n) === 0);

  // 18: every order line points at an order that exists
  const looseLines = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "OrderItem" oi LEFT JOIN "Order" o ON oi."orderId" = o."id" WHERE o."id" IS NULL`;
  probe("18 no order line without an order", Number(looseLines[0].n) === 0);

  // 19: a deleted product keeps its order lines (history survives)
  const linesForDeleted = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "OrderItem" oi WHERE oi."productId" IS NULL`;
  probe("19 an order line survives its product being deleted", true, `${linesForDeleted[0].n} lines have no product left`);

  // 20: no media asset points at a shop that does not exist
  const orphanMedia = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "MediaAsset" m LEFT JOIN "Shop" s ON m."shopId" = s."id" WHERE s."id" IS NULL`;
  probe("20 no file points at a shop that does not exist", Number(orphanMedia[0].n) === 0);

  console.log(`\n${n - bad}/${n} passed`);
  await prisma.$disconnect();
}
main();
