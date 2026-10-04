// Turn a .fig into JSON, with no Figma account involved.
//
//   node scripts/figma/read-fig.mjs "<path to .fig>" <out.json>
//
// Why this exists: reading a design through Figma's MCP server costs a tool
// call, and the Starter plan allows twenty a month — which ran out halfway
// through measuring one page. A .fig on disk has no quota, no expiry and no
// network, and it carries strictly more than the API returns: the raw node
// tree rather than Dev Mode's translation of it into React and Tailwind.
//
// A .fig is a zip of canvas.fig (the document), meta.json, a thumbnail and
// every placed image at full resolution. fig-decode.mjs handles the document;
// the images come out with `unzip`.
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { splitBlocks, parseSchema, decode } from "./fig-decode.mjs";

const [figPath, outPath] = process.argv.slice(2);
if (!figPath || !outPath) {
  console.error('usage: node scripts/figma/read-fig.mjs "<file.fig>" <out.json>');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "fig-"));
execFileSync("unzip", ["-o", "-q", figPath, "-d", dir]);

const { version, blocks } = splitBlocks(readFileSync(join(dir, "canvas.fig")));
const defs = parseSchema(blocks[0]);
const doc = decode(defs, blocks[1], "Message");

writeFileSync(outPath, JSON.stringify(doc));
console.log(`kiwi v${version} · ${defs.length} definitions · ${doc.nodeChanges.length} nodes -> ${outPath}`);
console.log(`images and meta.json extracted to ${dir}`);
