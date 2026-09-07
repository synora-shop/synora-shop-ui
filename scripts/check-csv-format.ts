/**
 * Checks that our product CSV is Shopify's product CSV — run with
 * `npm run check:csv`.
 *
 * The point of the format is that a merchant can export from Shopify and from
 * SHOP, open both, and see the same file. That only holds if the columns match
 * exactly: same names, same order, same count. A renamed or reordered column is
 * not a cosmetic difference, it is a file Shopify's importer rejects.
 *
 * The header is asserted against a copy of Shopify's own template, checked in
 * beside this so the test does not depend on a file in somebody's Downloads.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { SHOPIFY_COLUMN_COUNT, SHOPIFY_PRODUCT_COLUMNS } from "../lib/csv/shopify-columns";
import { CSV_LINE_END, csvField, csvHeader, exportProductsCsv, pricePair, type ExportableProduct } from "../lib/csv/export";
import { cellNumber, parseCsv, toRecords } from "../lib/csv/parse";
import { readShopifyProducts } from "../lib/csv/import";
import { SHOPIFY_CUSTOMER_COLUMNS } from "../lib/csv/customer-columns";
import { customerCsvHeader, exportCustomersCsv, joinName, readShopifyCustomers, splitName, type ExportableCustomer } from "../lib/csv/customers";
import { SHOPIFY_ORDER_COLUMNS } from "../lib/csv/order-columns";
import { exportOrdersCsv, orderCsvHeader, readShopifyOrders, type ExportableOrder } from "../lib/csv/orders";

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? `  ${detail}` : ""}`);
  }
};

/* -------------------------------------------------------------------------- */
/* The header matches Shopify's own template                                  */
/* -------------------------------------------------------------------------- */

const fixture = join(process.cwd(), "lib/csv/shopify-product-template.csv");
check("Shopify's template is checked in beside the code", existsSync(fixture),
  "without it this test proves only that the list matches itself");

if (existsSync(fixture)) {
  // Only the header is needed, and only the first line of it: a quoted field
  // never contains a newline in Shopify's header row.
  const header = readFileSync(fixture, "utf8").replace(/^﻿/, "").split(/\r?\n/)[0];
  const theirs = header.split(",");

  check(
    "the same number of columns",
    theirs.length === SHOPIFY_COLUMN_COUNT,
    `theirs ${theirs.length}, ours ${SHOPIFY_COLUMN_COUNT}`
  );

  for (let i = 0; i < Math.max(theirs.length, SHOPIFY_COLUMN_COUNT); i++) {
    const mine = SHOPIFY_PRODUCT_COLUMNS[i];
    const mine_ = mine === undefined ? "(missing)" : mine;
    const their = theirs[i] ?? "(missing)";
    check(`column ${i + 1} matches`, mine_ === their, `theirs "${their}", ours "${mine_}"`);
  }
}

/* -------------------------------------------------------------------------- */
/* Shape rules the format depends on                                          */
/* -------------------------------------------------------------------------- */

check("no column is listed twice", new Set(SHOPIFY_PRODUCT_COLUMNS).size === SHOPIFY_COLUMN_COUNT);
check("no column has stray whitespace", SHOPIFY_PRODUCT_COLUMNS.every((c) => c === c.trim()));
check("no column is empty", SHOPIFY_PRODUCT_COLUMNS.every((c) => c.length > 0));

// The three that carry the file's structure. Title starts a product, URL handle
// is what joins a product's rows together, and the option columns are what a
// variant is. Losing any of them silently is losing the format.
for (const required of [
  "Title",
  "URL handle",
  "Option1 name",
  "Option1 value",
  "Option2 name",
  "Option2 value",
  "Option3 name",
  "Option3 value",
  "Price",
  "SKU",
  "Inventory quantity",
]) {
  check(`"${required}" is present`, (SHOPIFY_PRODUCT_COLUMNS as readonly string[]).includes(required));
}

check(
  "Title is first and URL handle second",
  SHOPIFY_PRODUCT_COLUMNS[0] === "Title" && SHOPIFY_PRODUCT_COLUMNS[1] === "URL handle",
  "a Shopify importer reads the first row's shape, not its labels alone"
);

/* -------------------------------------------------------------------------- */
/* Quoting                                                                    */
/* -------------------------------------------------------------------------- */

// A description with a comma in it is the ordinary case. Getting this wrong
// shifts every column after it, silently, in a file that still opens.
check("a plain value is not quoted", csvField("Small") === "Small");
check("a comma forces quotes", csvField("a, b") === '"a, b"');
check("a quote is doubled", csvField('say "hi"') === '"say ""hi"""');
check("a newline forces quotes", csvField("a\nb") === '"a\nb"');
check("null is empty, not the word null", csvField(null) === "");
check("undefined is empty", csvField(undefined) === "");
check("zero survives", csvField(0) === "0");

/* -------------------------------------------------------------------------- */
/* Price, which is stored the other way round                                 */
/* -------------------------------------------------------------------------- */

// Shopify reads Compare-at as the higher was-this price. SHOP stores basePrice
// as the usual price and salePrice as the discount, so exporting them straight
// across would invert every sale on the platform.
{
  const onSale = pricePair(2499, 1999, null);
  check("a sale exports as the lower price", onSale.price === 1999);
  check("a sale exports the old price as compare-at", onSale.compareAt === 2499);

  const plain = pricePair(2499, null, null);
  check("no sale means no compare-at", plain.compareAt === null);
  check("no sale charges the base price", plain.price === 2499);

  check("a variant override wins", pricePair(2499, 1999, 3200).price === 3200);
  // A "sale" priced above the usual price is a mistake, not a sale, and
  // exporting it would strike through the cheaper number.
  check("a sale above base is not a sale", pricePair(1000, 2000, null).compareAt === null);
}

/* -------------------------------------------------------------------------- */
/* The file a merchant actually gets                                          */
/* -------------------------------------------------------------------------- */

const sample: ExportableProduct = {
  title: "Tee", slug: "tee", description: "One, two", vendor: "V", tags: ["a", "b"],
  status: "PUBLISHED", isActive: true, basePrice: 2499, salePrice: 1999, costPrice: 1100,
  images: ["i1", "i2", "i3"], seoTitle: null, seoDescription: null,
  option1Name: "Size", option2Name: "Colour", option3Name: null,
  categories: [{ name: "Tees" }],
  variants: [
    { option1: "S", option2: "green", option3: "", sku: "A", barcode: null, stock: 1, priceOverride: null, weightGrams: null, imageUrl: null },
    { option1: "M", option2: "green", option3: "", sku: "B", barcode: null, stock: 2, priceOverride: null, weightGrams: null, imageUrl: null },
  ],
};

{
  // Split on the real terminator: splitting on "\n" leaves a trailing
  // carriage return on every line and every comparison then fails on it.
  const lines = exportProductsCsv([sample]).trimEnd().split(CSV_LINE_END);
  check("the header comes first", lines[0] === SHOPIFY_PRODUCT_COLUMNS.join(","));
  // Two variants and a third image that needs a row of its own.
  check("a leftover image gets its own row", lines.length === 4, `${lines.length} lines`);

  const handleAt = SHOPIFY_PRODUCT_COLUMNS.indexOf("URL handle");
  const titleAt = SHOPIFY_PRODUCT_COLUMNS.indexOf("Title");
  const cells = (line: string) => line.split(",");

  // The handle is the join. A continuation row without it is a new, nameless
  // product as far as the importer is concerned.
  check("every row carries the handle", lines.slice(1).every((l) => cells(l)[handleAt] === "tee"));
  check("only the first row carries the title", cells(lines[2])[titleAt] === "" && cells(lines[3])[titleAt] === "");

  check("a product with no variants still exports",
    exportProductsCsv([{ ...sample, variants: [], images: [] }]).trimEnd().split(CSV_LINE_END).length === 2);
  check("nothing to export is still a valid file",
    exportProductsCsv([]).trimEnd() === SHOPIFY_PRODUCT_COLUMNS.join(","));
}

/* -------------------------------------------------------------------------- */
/* Byte for byte                                                              */
/* -------------------------------------------------------------------------- */

// The requirement is not "readable by Shopify", it is "the same file". A bare
// newline reads correctly everywhere and is still a different file: diffing an
// export from each platform would show every single line as changed. Shopify's
// own template ends every line 0d 0a.
check("lines end the way Shopify ends them", CSV_LINE_END === "\r\n");

if (existsSync(fixture)) {
  const theirHeaderLine = readFileSync(fixture);
  const ourHeaderLine = Buffer.from(csvHeader() + CSV_LINE_END, "utf8");
  // Compared as bytes, not as strings, because that is the difference this
  // check exists to catch.
  check(
    "our header is byte for byte Shopify's header",
    theirHeaderLine.equals(ourHeaderLine),
    `theirs ${theirHeaderLine.length} bytes, ours ${ourHeaderLine.length}`
  );
  check(
    "neither file carries a byte order mark",
    theirHeaderLine[0] !== 0xef && ourHeaderLine[0] !== 0xef,
    "three invisible bytes would break the diff"
  );
}

check(
  "an exported file ends with a terminator",
  exportProductsCsv([]).endsWith(CSV_LINE_END)
);

/* -------------------------------------------------------------------------- */
/* Reading one back                                                            */
/* -------------------------------------------------------------------------- */

console.log("\nTHE PARSER SURVIVES WHAT A SPREADSHEET WRITES");

// The failure this parser exists to prevent: one comma inside a description
// shifting every column after it, so prices land in the barcode field.
check(
  "a comma inside a quoted field stays inside it",
  parseCsv('a,b\r\n"one, two",three\r\n')[1][0] === "one, two"
);
check(
  "a doubled quote is one quote",
  parseCsv('a\r\n"He said ""no"""\r\n')[1][0] === 'He said "no"'
);
check(
  "a newline inside a quoted field does not end the row",
  parseCsv('a,b\r\n"line one\nline two",x\r\n')[1][1] === "x"
);
check("a file with LF endings reads the same", parseCsv("a,b\n1,2\n")[1][1] === "2");
check("a trailing terminator does not invent an empty row", parseCsv("a,b\r\n1,2\r\n").length === 2);
check(
  "Excel's byte order mark is not part of the first column's name",
  toRecords(parseCsv("\ufeffTitle,URL handle\r\nA,a\r\n")).header[0] === "Title"
);
check("an empty cell is empty, not missing", parseCsv("a,b,c\r\n1,,3\r\n")[1][1] === "");

console.log("\nA FILE WE WROTE READS BACK AS WHAT WE WROTE");

// The whole point of the pair. A merchant exports, edits one cell in Excel,
// and imports: everything they did not touch has to survive the trip.
const roundTripSample: ExportableProduct[] = [
  {
    title: "Everyday Tee, washed",
    slug: "everyday-tee",
    description: 'Soft cotton. Says "hello" on the label.\nTwo lines.',
    vendor: "Demo Supplier",
    tags: ["demo", "tee"],
    status: "PUBLISHED",
    isActive: true,
    basePrice: 5500,
    salePrice: 4200,
    costPrice: 2000,
    images: ["https://example.test/a.jpg", "https://example.test/b.jpg", "https://example.test/c.jpg"],
    seoTitle: null,
    seoDescription: null,
    option1Name: "Size",
    option2Name: "Colour",
    option3Name: null,
    categories: [{ name: "T-shirts" }],
    csvExtras: { "Charge tax": "TRUE" },
    variants: [
      { option1: "S", option2: "Rust", option3: "", sku: "DEMO-001-S", barcode: "500123", stock: 4, priceOverride: null, weightGrams: 210, imageUrl: null },
      { option1: "M", option2: "Navy", option3: "", sku: "DEMO-001-M", barcode: null, stock: 0, priceOverride: 4800, weightGrams: 220, imageUrl: "https://example.test/m.jpg" },
    ],
  },
  {
    title: "No options at all",
    slug: "plain",
    description: "",
    vendor: null,
    tags: [],
    status: "DRAFT",
    isActive: false,
    basePrice: 900,
    salePrice: null,
    costPrice: 300,
    images: [],
    seoTitle: null,
    seoDescription: null,
    option1Name: null,
    option2Name: null,
    option3Name: null,
    categories: [],
    csvExtras: null,
    variants: [],
  },
];

const roundTrip = readShopifyProducts(exportProductsCsv(roundTripSample));
check("it reads without complaint", roundTrip.problems.length === 0, roundTrip.problems.map((p) => `line ${p.line}: ${p.message}`).join("; "));
check("every product comes back", roundTrip.products.length === 2);
check("and every column in it is one Shopify defines", roundTrip.unknownColumns.length === 0, roundTrip.unknownColumns.join(", "));

const tee = roundTrip.products.find((p) => p.slug === "everyday-tee");
check("the title survives its comma", tee?.title === "Everyday Tee, washed");
check("the description survives its quotes and newline", tee?.description === roundTripSample[0].description);
check("tags come back as a list", tee?.tags.join(",") === "demo,tee");
check("published stays published", tee?.status === "PUBLISHED" && tee?.isActive === true);
// The trap: Shopify's Price is what is charged and Compare-at is the was-price,
// which is the opposite way round from how this platform stores a sale.
check("a sale price is not inverted", tee?.basePrice === 5500 && tee?.salePrice === 4200);
check("cost per item survives", tee?.costPrice === 2000);
check("the category comes back", tee?.categoryName === "T-shirts");
check("option names survive", tee?.option1Name === "Size" && tee?.option2Name === "Colour");
check("both variants come back", tee?.variants.length === 2);
check("in the order they were written", tee?.variants[0].sku === "DEMO-001-S");
check("a variant's own price is an override", tee?.variants[1].priceOverride === 4800);
check("and an ordinary variant has none", tee?.variants[0].priceOverride === null);
check("stock of zero is zero, not missing", tee?.variants[1].stock === 0);
check("a barcode survives", tee?.variants[0].barcode === "500123");
check("a weight survives", tee?.variants[0].weightGrams === 210);
check("a variant picture survives", tee?.variants[1].imageUrl === "https://example.test/m.jpg");
// Three pictures on a two-variant product: one rides a row of its own.
check("every picture comes back", tee?.images.length === 3);
check("in the order they were written", tee?.images[2] === "https://example.test/c.jpg");
// A column this platform has no meaning for must not be destroyed by the trip.
check("a column we do not read is kept", tee?.csvExtras["Charge tax"] === "TRUE");

const plain = roundTrip.products.find((p) => p.slug === "plain");
check("a product with no options is not lost", plain !== undefined);
check("and does not gain a fake option", plain?.variants[0]?.option1 === "");
check("a draft stays a draft", plain?.status === "DRAFT" && plain?.isActive === false);

console.log("\nA BROKEN FILE SAYS WHICH LINE IS BROKEN");

const noHandle = readShopifyProducts("Title,URL handle\r\nA thing,\r\n");
check("a row with no handle is reported", noHandle.problems.some((p) => p.line === 2));
const noHandleColumn = readShopifyProducts("Title,Price\r\nA thing,10\r\n");
check("a file with no handle column is refused", noHandleColumn.problems.length > 0 && noHandleColumn.products.length === 0);
const badPrice = readShopifyProducts("Title,URL handle,Price\r\nA thing,a-thing,not-a-price\r\n");
check(
  "a price that is not a price is reported with its line",
  badPrice.problems.some((p) => p.line === 2 && /price/i.test(p.message))
);
const clash = readShopifyProducts(
  "Title,URL handle,Option1 value\r\nOne,same,S\r\nTwo,same,M\r\n"
);
check("two products sharing a handle is reported", clash.problems.some((p) => p.line === 3));
const dupVariant = readShopifyProducts(
  "Title,URL handle,Option1 value,Inventory quantity\r\nOne,one,S,3\r\n,one,S,4\r\n"
);
check("the same option twice is reported", dupVariant.problems.some((p) => p.line === 3));
check("an empty file is reported rather than accepted", readShopifyProducts("").problems.length > 0);

// A file from Shopify carrying columns we have never heard of must still load.
const strange = readShopifyProducts(
  "Title,URL handle,Price,Their Own Column\r\nA thing,a-thing,10,kept\r\n"
);
check("an unknown column does not stop the import", strange.products.length === 1);
check("and is reported so the merchant knows", strange.unknownColumns.includes("Their Own Column"));
check("and is kept rather than dropped", strange.products[0].csvExtras["Their Own Column"] === "kept");

console.log("\nCUSTOMERS GO OUT AND COME BACK");

check("the customer header is Shopify's", customerCsvHeader() === SHOPIFY_CUSTOMER_COLUMNS.join(","));
check("a file ends with a terminator", exportCustomersCsv([]).endsWith(CSV_LINE_END));

// The one rule that survives every name badly and predictably: everything
// before the last space is the first name.
check("a two-part name splits", splitName("Faisal Siddiqui").last === "Siddiqui");
check("a three-part name keeps the middle with the first", splitName("Maria del Carmen Ruiz").first === "Maria del Carmen");
check("a one-part name is all first name", splitName("Prince").last === "");
check("and joins back", joinName("Faisal", "Siddiqui") === "Faisal Siddiqui");
check("without a stray space", joinName("Prince", "") === "Prince");
check("a name survives the round trip", joinName(...Object.values(splitName("Ayesha Noor")) as [string, string]) === "Ayesha Noor");

const people: ExportableCustomer[] = [
  {
    name: "Faisal Siddiqui",
    email: "faisal@example.test",
    phone: "03001234567",
    address: {
      line1: 'House 12, "The Corner"',
      line2: "Street 24",
      city: "Karachi",
      province: "Sindh",
      postalCode: "75500",
      phone: "03001234567",
    },
    totalSpent: 43223,
    totalOrders: 3,
  },
  {
    name: "Prince",
    email: "prince@example.test",
    phone: null,
    address: null,
    totalSpent: 0,
    totalOrders: 0,
  },
];

const readBack = readShopifyCustomers(exportCustomersCsv(people));
check("it reads without complaint", readBack.problems.length === 0, readBack.problems.map((p) => `line ${p.line}: ${p.message}`).join("; "));
check("everybody comes back", readBack.customers.length === 2);
check("and every column is one Shopify defines", readBack.unknownColumns.length === 0);
const faisal = readBack.customers.find((c) => c.email === "faisal@example.test");
check("the name survives", faisal?.name === "Faisal Siddiqui");
check("the phone survives", faisal?.phone === "03001234567");
check("an address with a quote in it survives", faisal?.address?.line1 === 'House 12, "The Corner"');
check("the city survives", faisal?.address?.city === "Karachi");
// Shopify writes empty address columns for everybody; a row of blanks must not
// become an address the merchant then has to delete.
const prince = readBack.customers.find((c) => c.email === "prince@example.test");
check("somebody with no address does not gain a blank one", prince?.address === null);
check("a one-word name survives", prince?.name === "Prince");

console.log("\nA BROKEN CUSTOMER FILE SAYS WHICH LINE IS BROKEN");
check(
  "a file with no email column is refused",
  readShopifyCustomers("First Name,Last Name\r\nA,B\r\n").customers.length === 0
);
check(
  "a row with no email is reported",
  readShopifyCustomers("First Name,Email\r\nA,\r\n").problems.some((p) => p.line === 2)
);
check(
  "something that is not an address is reported",
  readShopifyCustomers("Email\r\nnot-an-email\r\n").problems.some((p) => /not an email/.test(p.message))
);
check(
  "the same person twice is reported",
  readShopifyCustomers("Email\r\na@b.test\r\na@b.test\r\n").problems.some((p) => p.line === 3)
);
// An address is a name in a file: case must not make two people.
check(
  "an address is matched however it is capitalised",
  readShopifyCustomers("Email\r\nA@B.test\r\n").customers[0].email === "a@b.test"
);
check(
  "somebody with no name is not nameless",
  readShopifyCustomers("Email\r\nsomebody@b.test\r\n").customers[0].name === "somebody"
);

console.log("\nORDERS GO OUT AND COME BACK");

check("the order header is Shopify's", orderCsvHeader() === SHOPIFY_ORDER_COLUMNS.join(","));

const placed = new Date("2026-03-14T09:30:00.000Z");
const orders: ExportableOrder[] = [
  {
    id: "DZVN00I",
    customerName: "Faisal Siddiqui",
    customerEmail: "faisal@example.test",
    customerPhone: "03001234567",
    shippingLine1: 'House 12, "The Corner"',
    shippingLine2: "Street 24",
    shippingCity: "Karachi",
    shippingProvince: "Sindh",
    shippingPostalCode: "75500",
    subtotal: 43223,
    shippingFee: 0,
    total: 43223,
    discountCode: "WELCOME10",
    discountAmount: 500,
    paymentMethod: "BANK_TRANSFER",
    paymentStatus: "CONFIRMED",
    orderStatus: "DELIVERED",
    notes: "Leave with the guard,\nplease",
    createdAt: placed,
    items: [
      { title: "Slim Hoodie (S/Rust)", sku: "DEMO-001-S", quantity: 3, price: 8167 },
      { title: "Textured Tee (M/Navy)", sku: "DEMO-002-M", quantity: 2, price: 7188 },
    ],
  },
];

const backAgain = readShopifyOrders(exportOrdersCsv(orders, "PKR"));
check("it reads without complaint", backAgain.problems.length === 0, backAgain.problems.map((p) => `line ${p.line}: ${p.message}`).join("; "));
check("the order comes back", backAgain.orders.length === 1);
check("and every column is one Shopify defines", backAgain.unknownColumns.length === 0);
const back = backAgain.orders[0];
check("the order number survives", back.reference === "DZVN00I");
check("the customer survives", back.customerName === "Faisal Siddiqui" && back.customerEmail === "faisal@example.test");
check("an address with a quote survives", back.shippingLine1 === 'House 12, "The Corner"');
check("a note with a newline survives", back.notes === "Leave with the guard,\nplease");
check("the money survives", back.subtotal === 43223 && back.total === 43223);
check("the discount survives", back.discountCode === "WELCOME10" && back.discountAmount === 500);
// Shopify says "paid"/"fulfilled"; this platform says CONFIRMED/DELIVERED.
check("paid comes back as paid", back.paymentStatus === "CONFIRMED");
check("fulfilled comes back as delivered", back.orderStatus === "DELIVERED");
check("the payment method survives", back.paymentMethod === "BANK_TRANSFER");
check("the date survives to the second", back.placedAt.toISOString() === placed.toISOString());
check("both lines come back", back.items.length === 2);
check("in the order they were written", back.items[0].sku === "DEMO-001-S");
check("with their quantities", back.items[0].quantity === 3 && back.items[1].quantity === 2);
check("and their prices", back.items[1].price === 7188);

console.log("\nA BROKEN ORDER FILE SAYS WHICH LINE IS BROKEN");
check(
  "a file with no Name column is refused",
  readShopifyOrders("Email,Total\r\na@b.test,10\r\n").orders.length === 0
);
check(
  "an order with no email is reported",
  readShopifyOrders("Name,Email,Total\r\n#1001,,10\r\n").problems.some((p) => p.line === 2)
);
check(
  "a total that is not a number is reported",
  readShopifyOrders("Name,Email,Total\r\n#1001,a@b.test,lots\r\n").problems.some((p) => /total/i.test(p.message))
);
check(
  "a date that is not a date is reported",
  readShopifyOrders("Name,Email,Total,Created at\r\n#1001,a@b.test,10,soon\r\n").problems.some((p) => /date/i.test(p.message))
);
// A cancelled order is cancelled whatever its fulfilment column says.
check(
  "a cancelled order comes back cancelled",
  readShopifyOrders(
    "Name,Email,Total,Fulfillment Status,Cancelled at\r\n#1001,a@b.test,10,fulfilled,2026-01-01T00:00:00Z\r\n"
  ).orders[0].orderStatus === "CANCELLED"
);
// Continuation rows carry only the name and their own line.
check(
  "a second line joins the order above it",
  readShopifyOrders(
    "Name,Email,Total,Lineitem name,Lineitem quantity\r\n#1001,a@b.test,10,One,1\r\n#1001,,,Two,2\r\n"
  ).orders[0].items.length === 2
);

// The bug that made this a shared function: a price column full of words
// imported silently as free, because stripping non-digits turned "lots" into
// an empty string and an empty string into nothing to complain about.
check("a cell of words is not a number", cellNumber("lots") === "bad");
check("an empty cell is nothing, not zero", cellNumber("") === null);
check("a price with a symbol in it is a number", cellNumber("Rs 1,250") === 1250);
check("a negative is a number", cellNumber("-40") === -40);
check("a zero is a zero", cellNumber("0") === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
