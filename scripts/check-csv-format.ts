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
import { parseCsv, toRecords } from "../lib/csv/parse";
import { readShopifyProducts } from "../lib/csv/import";

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
