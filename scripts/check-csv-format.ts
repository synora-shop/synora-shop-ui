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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
