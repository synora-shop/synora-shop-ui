/**
 * Reading a CSV, to the same rules the exporter writes one by.
 *
 * Hand-written rather than a dependency, for the same reason the exporter is:
 * the format is small and the failure modes are all in the quoting, which a
 * library would hide rather than remove. What matters here:
 *
 *   - a quoted field may contain commas, newlines and doubled quotes
 *   - a line ends CRLF or LF, and a file may mix them
 *   - a leading byte-order mark is Excel's, not the merchant's
 *
 * A parser that splits on commas works on every file until the first product
 * description with a comma in it, at which point every column after it shifts
 * and the import writes prices into the barcode field. So this is a character
 * loop rather than a split.
 *
 * Client-safe: pure text in, rows out.
 */

/** Rows of raw cells, exactly as written. Nothing is trimmed or coerced here. */
export function parseCsv(text: string): string[][] {
  // Excel writes a BOM on every CSV it saves. Left in place it becomes part of
  // the first column's name, and every lookup for "Title" misses.
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"' && field === "") {
      quoted = true;
      i++;
      continue;
    }
    if (char === ",") {
      endField();
      i++;
      continue;
    }
    if (char === "\r") {
      // CRLF is one ending, not two.
      if (input[i + 1] === "\n") i++;
      endRow();
      i++;
      continue;
    }
    if (char === "\n") {
      endRow();
      i++;
      continue;
    }

    field += char;
    i++;
  }

  // Whatever is in hand at the end is a final row, unless the file ended on a
  // line terminator and left nothing behind.
  if (field !== "" || row.length > 0) endRow();

  // A trailing terminator produces one empty row. Every exporter writes one.
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/**
 * Rows keyed by their header, so a column can be read by name.
 *
 * Unknown columns are kept: a merchant's file may carry Shopify columns this
 * platform has nothing to do with, and dropping them on import and then
 * writing them back as empty on export would quietly destroy their data.
 */
export type CsvRow = Record<string, string>;

export function toRecords(rows: string[][]): { header: string[]; records: CsvRow[] } {
  if (rows.length === 0) return { header: [], records: [] };
  const header = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((cells) => {
    const record: CsvRow = {};
    header.forEach((name, i) => {
      record[name] = cells[i] ?? "";
    });
    return record;
  });
  return { header, records };
}

/**
 * A number from a cell, or a complaint.
 *
 * Three answers, not two: `null` when the cell is empty, `"bad"` when it holds
 * something that is not a number, and the number otherwise. The first version
 * of this stripped every non-digit and then parsed, which turned "lots" into
 * an empty string and an empty string into zero — so a price column full of
 * words imported silently as free.
 *
 * Currency symbols, spaces and thousands separators are stripped, because a
 * spreadsheet writes them and a merchant should not have to know that.
 */
export function cellNumber(value: string): number | null | "bad" {
  const raw = value.trim();
  if (raw === "") return null;
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  // Something was written, and none of it was a number.
  if (cleaned === "" || !/[0-9]/.test(cleaned)) return "bad";
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : "bad";
}
