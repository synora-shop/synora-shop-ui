// A decoder for Figma's .fig container.
//
// A .fig is a zip holding canvas.fig, which is "fig-kiwi": an 8-byte magic, a
// 4-byte version, then two raw-deflate blocks — a Kiwi *schema* and a message
// encoded against it. The schema travels with the file, so nothing here is
// guessed or version-pinned: the file describes its own shape and this reads
// what it says.
import { inflateRawSync, zstdDecompressSync } from "zlib";

/**
 * The two blocks, each decompressed with whatever it actually uses.
 *
 * The schema block is raw deflate and the data block is **zstd** — newer
 * exports changed the second one, and the only way to tell is to look at the
 * magic. `28 b5 2f fd` is zstd; anything else is tried as deflate. Guessing
 * one compressor for both is why this took three attempts.
 *
 * Each block is decompressed from its offset to the end of the file rather
 * than from a bounded slice. The length prefix is the compressed size and
 * both decoders stop at their own stream end, but handing deflate an exactly
 * bounded buffer makes it reject a stream it reads happily when open-ended.
 */
export function splitBlocks(buf) {
  if (buf.subarray(0, 8).toString() !== "fig-kiwi") throw new Error("not a fig-kiwi file");
  const version = buf.readUInt32LE(8);
  const blocks = [];
  let i = 12;
  while (i + 4 <= buf.length) {
    const len = buf.readUInt32LE(i);
    i += 4;
    if (len === 0 || i + len > buf.length) break;
    const start = i;
    const isZstd =
      buf[start] === 0x28 && buf[start + 1] === 0xb5 && buf[start + 2] === 0x2f && buf[start + 3] === 0xfd;
    blocks.push(isZstd ? zstdDecompressSync(buf.subarray(start)) : inflateRawSync(buf.subarray(start)));
    i += len;
  }
  return { version, blocks };
}

class Reader {
  constructor(buf) { this.b = buf; this.i = 0; }
  byte() { return this.b[this.i++]; }
  bool() { return !!this.b[this.i++]; }
  varuint() {
    let value = 0, shift = 0, b;
    do { b = this.b[this.i++]; value |= (b & 0x7f) << shift; shift += 7; } while (b & 0x80 && shift < 35);
    return value >>> 0;
  }
  varint() { const v = this.varuint(); return (v & 1) ? ~(v >>> 1) : (v >>> 1); }
  varuint64() {
    let value = 0n, shift = 0n, b;
    do { b = this.b[this.i++]; value |= BigInt(b & 0x7f) << shift; shift += 7n; } while (b & 0x80);
    return value;
  }
  varint64() { const v = this.varuint64(); return (v & 1n) ? -((v >> 1n) + 1n) : (v >> 1n); }
  // Kiwi stores a float with its exponent byte moved to the front, and 0 as a
  // single zero byte. Reversing that rotation is the whole trick.
  float() {
    if (this.b[this.i] === 0) { this.i++; return 0; }
    let bits = this.b[this.i] | (this.b[this.i+1] << 8) | (this.b[this.i+2] << 16) | (this.b[this.i+3] << 24);
    this.i += 4;
    bits = (bits << 23) | (bits >>> 9);
    const v = new DataView(new ArrayBuffer(4));
    v.setInt32(0, bits, true);
    return v.getFloat32(0, true);
  }
  string() {
    const start = this.i;
    while (this.b[this.i] !== 0) this.i++;
    const s = this.b.subarray(start, this.i).toString("utf8");
    this.i++;
    return s;
  }
}

const KINDS = ["ENUM", "STRUCT", "MESSAGE"];

export function parseSchema(buf) {
  const r = new Reader(buf);
  const defs = [];
  const count = r.varuint();
  for (let d = 0; d < count; d++) {
    const name = r.string();
    const kind = KINDS[r.byte()];
    const fieldCount = r.varuint();
    const fields = [];
    for (let f = 0; f < fieldCount; f++) {
      fields.push({ name: r.string(), type: r.varint(), isArray: r.bool(), value: r.varuint() });
    }
    defs.push({ name, kind, fields });
  }
  return defs;
}

const BUILTIN = { "-1": "bool", "-2": "byte", "-3": "int", "-4": "uint", "-5": "float", "-6": "string", "-7": "int64", "-8": "uint64" };

export function decode(defs, buf, rootName) {
  const r = new Reader(buf);
  const byName = new Map(defs.map((d) => [d.name, d]));
  const root = byName.get(rootName) ?? defs[defs.length - 1];

  function readValue(type) {
    const b = BUILTIN[String(type)];
    if (b) {
      switch (b) {
        case "bool": return r.bool();
        case "byte": return r.byte();
        case "int": return r.varint();
        case "uint": return r.varuint();
        case "float": return r.float();
        case "string": return r.string();
        case "int64": return Number(r.varint64());
        case "uint64": return Number(r.varuint64());
      }
    }
    return readDef(defs[type]);
  }

  function readDef(def) {
    if (!def) throw new Error("unknown definition");
    if (def.kind === "ENUM") {
      const v = r.varuint();
      const hit = def.fields.find((f) => f.value === v);
      return hit ? hit.name : v;
    }
    const out = {};
    if (def.kind === "STRUCT") {
      for (const f of def.fields) out[f.name] = f.isArray ? readArray(f.type) : readValue(f.type);
      return out;
    }
    // MESSAGE: field ids until a 0 terminator.
    for (;;) {
      const id = r.varuint();
      if (id === 0) return out;
      const f = def.fields.find((x) => x.value === id);
      if (!f) throw new Error(`unknown field ${id} on ${def.name}`);
      out[f.name] = f.isArray ? readArray(f.type) : readValue(f.type);
    }
  }

  function readArray(type) {
    const n = r.varuint();
    const a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = readValue(type);
    return a;
  }

  return readDef(root);
}
