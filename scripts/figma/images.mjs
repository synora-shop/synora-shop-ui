// Copy a .fig's placed images into public/, named by their Figma hash.
//
//   node scripts/figma/images.mjs <tree.json> <extracted-images-dir> <out-dir>
//
// A fillPaint of type IMAGE carries `image.hash` as a byte array; hex-encoded
// that is the filename inside the .fig's own images/ folder, at the
// resolution the designer placed. So the build uses the real photography
// rather than stand-ins, and nothing is re-exported or recompressed.
import { readFileSync, copyFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const [treePath, srcDir, outDir] = process.argv.slice(2);
const doc = JSON.parse(readFileSync(treePath, "utf8"));
mkdirSync(outDir, { recursive: true });

const hex = (bytes) => Buffer.from(bytes).toString("hex");
const wanted = new Set();
for (const n of doc.nodeChanges) {
  for (const p of n.fillPaints ?? []) {
    if (p.type === "IMAGE" && p.image?.hash) wanted.add(hex(p.image.hash));
  }
}

const onDisk = new Set(readdirSync(srcDir));
let copied = 0;
const missing = [];
for (const h of wanted) {
  if (!onDisk.has(h)) { missing.push(h); continue; }
  // Sniff the type: a .fig stores the original bytes with no extension.
  const head = readFileSync(join(srcDir, h)).subarray(0, 4);
  const ext = head[0] === 0x89 && head[1] === 0x50 ? ".png"
    : head[0] === 0xff && head[1] === 0xd8 ? ".jpg"
    : head.toString("ascii", 0, 4) === "RIFF" ? ".webp" : ".bin";
  copyFileSync(join(srcDir, h), join(outDir, h + ext));
  copied++;
}
console.log(`${wanted.size} referenced · ${copied} copied · ${missing.length} not in this export`);
