import { readShopifyProducts } from "../../lib/csv/import";
import { readShopifyCustomers } from "../../lib/csv/customers";
import { readShopifyOrders } from "../../lib/csv/orders";
import { exportProductsCsv, csvField } from "../../lib/csv/export";

let n = 0, bad = 0;
const probe = (name: string, ok: boolean, detail = "") => {
  n++;
  if (ok) console.log(`  ok    ${name}${detail ? " — " + detail : ""}`);
  else { bad++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

console.log("A FILE THAT IS NOT WHAT IT CLAIMS TO BE");

// 31 an empty file
probe("31 an empty file is refused, not accepted", readShopifyProducts("").products.length === 0 && readShopifyProducts("").problems.length > 0);

// 32 a header and nothing else
const headerOnly = readShopifyProducts("Title,URL handle\r\n");
probe("32 a header with no rows is refused", headerOnly.products.length === 0 && headerOnly.problems.length > 0);

// 33 the wrong file entirely — a customer CSV fed to the product reader
const customerFile = "First Name,Last Name,Email\r\nFaisal,Siddiqui,f@b.test\r\n";
const wrongFile = readShopifyProducts(customerFile);
probe("33 the wrong kind of file is refused with a reason", wrongFile.products.length === 0 && wrongFile.problems.length > 0,
  wrongFile.problems[0]?.message.slice(0, 60));

// 34 a product file fed to the customer reader
const productFile = "Title,URL handle,Price\r\nA thing,a-thing,100\r\n";
const wrongWay = readShopifyCustomers(productFile);
probe("34 and the other way round", wrongWay.customers.length === 0 && wrongWay.problems.length > 0);

// 35 a single cell holding a whole file's worth of text
const huge = "x".repeat(200_000);
const big = readShopifyProducts(`Title,URL handle,Description\r\nA,a,"${huge}"\r\n`);
probe("35 a 200,000-character cell is read, not truncated silently", big.products[0]?.description.length === huge.length);

// 36 a row with more columns than the header
const extra = readShopifyProducts("Title,URL handle\r\nA,a,surprise,more\r\n");
probe("36 extra columns do not shift the ones that matter", extra.products[0]?.slug === "a");

// 37 a row with fewer columns than the header
const short = readShopifyProducts("Title,URL handle,Price\r\nA,a\r\n");
probe("37 missing columns are empty, not undefined", short.products[0]?.basePrice === 0);

// 38 CSV/formula injection — the classic spreadsheet vulnerability
const dangerous = exportProductsCsv([{
  title: "=cmd|'/c calc'!A0", slug: "x", description: "", vendor: null, tags: [],
  status: "PUBLISHED", isActive: true, basePrice: 1, salePrice: null, costPrice: 0,
  images: [], option1Name: null, option2Name: null, option3Name: null, categories: [],
  csvExtras: null, variants: [],
}]);
const titleCell = dangerous.split("\r\n")[1].split(",")[0];
probe("38 a formula in a title cannot run when the file is opened",
  /^["']?[=+\-@]/.test(titleCell) === false || titleCell.startsWith("'"),
  `cell begins ${JSON.stringify(titleCell.slice(0, 12))}`);

// 39 a quote that is never closed
const unclosed = readShopifyProducts('Title,URL handle\r\n"A thing,a\r\n');
probe("39 an unclosed quote does not hang or throw", Array.isArray(unclosed.problems));

// 40 an order file where one order appears in two blocks
const split = readShopifyOrders(
  "Name,Email,Total,Lineitem name,Lineitem quantity\r\n#1,a@b.test,10,One,1\r\n#2,c@d.test,20,Two,1\r\n#1,,,Three,1\r\n"
);
probe("40 an order split across the file is still one order",
  split.orders.length === 2 && split.orders.find((o) => o.reference === "#1")?.items.length === 2);

console.log(`\n${n - bad}/${n} passed`);
