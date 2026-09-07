import { config } from "dotenv"; config({ path: ".env" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { toSlug, addressProblem } from "../../lib/page-address";
import { typeSwitchGate } from "../../lib/store-type-switch";
import { formatMoney } from "../../lib/money";
import { describeDiscount } from "../../lib/discounts";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const BASE = "http://localhost:3000";
let n = 0, bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};
const status = async (p: string) => (await fetch(BASE + p, { redirect: "manual" })).status;

async function main() {
  console.log("INPUT THAT IS TRYING IT ON");

  // 41 a search that is 2,000 characters long
  const long = "a".repeat(2000);
  probe("41 a 2,000-character search does not break the shop", (await status(`/shop?q=${long}`)) === 200);

  // 42 quotes and percent signs in a search — a LIKE query with no escaping
  //    would either throw or match everything.
  probe("42 a search full of wildcards is just a search", (await status("/shop?q=%25%25%25%27%22")) === 200);

  // 43 a page number past the end
  probe("43 a page past the last one still renders", (await status("/shop?page=99999")) === 200);
  // 44 a page number that is not a number
  probe("44 a page that is not a number still renders", (await status("/shop?page=banana")) === 200);
  // 45 a sort nobody offers
  probe("45 an unknown sort falls back rather than throwing", (await status("/shop?sort=nonsense")) === 200);
  // 46 a filter value that does not exist
  probe("46 a filter for a category that does not exist", (await status("/shop?category=no-such-thing")) === 200);
  // 47 a negative page
  probe("47 a negative page number", (await status("/shop?page=-5")) === 200);

  // 48 an address made from something that is all punctuation
  probe("48 an address made of punctuation is refused, not empty", addressProblem(toSlug("!!!???")) !== null,
    `"${toSlug("!!!???")}"`);
  // 49 an address that is one of the shop's own routes
  probe("49 an address that would collide with the shop is refused", addressProblem(toSlug("Checkout")) !== null);
  // 50 a very long title makes a bounded address
  probe("50 a 500-character name makes an address that fits", toSlug("x".repeat(500)).length <= 80);

  console.log(`\n${n - bad}/${n} passed`);
  await prisma.$disconnect();
}
main();
