/**
 * Checks a section a merchant can pick is a section that actually works —
 * `npm run check:sections`.
 *
 * A section type has to exist in three places at once: the schema registry that
 * draws its settings, the database enum that stores which one was chosen, and
 * the renderer that draws it. Miss any one and it fails differently:
 *
 *   No enum value  — the picker offers it, the settings panel opens, and saving
 *                    fails. This is the one that happened: twenty-two sections
 *                    were written, tested against types, and could not be added
 *                    to a page at all.
 *   No schema      — nobody can configure it.
 *   No renderer    — it saves, and the page shows nothing where it sits.
 *
 * So the three lists are asserted to agree, rather than trusted to.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  SECTION_SCHEMAS,
  SECTION_TYPES,
  STYLE_KEY,
  defaultSectionData,
  getSectionSchema,
  sectionLabel,
} from "../lib/section-schema";

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const schema = read("prisma/schema.prisma");
const renderer = read("components/storefront/sections/render.tsx");

// ---------------------------------------------------------------------------
console.log("THE THREE LISTS AGREE");
// ---------------------------------------------------------------------------

const enumBlock = /enum SectionType \{([\s\S]*?)\n\}/.exec(schema);
check("the database has a SectionType enum", enumBlock !== null);

const enumValues = new Set(
  (enumBlock?.[1] ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[A-Z][A-Z0-9_]*$/.test(line))
);

check(
  "every section a merchant can pick can be stored",
  SECTION_TYPES.every((t) => enumValues.has(t)),
  SECTION_TYPES.filter((t) => !enumValues.has(t)).join(", ") ||
    `${SECTION_TYPES.length} types, all present`
);
check(
  "and every storable value is one somebody can configure",
  [...enumValues].every((v) => SECTION_TYPES.includes(v)),
  [...enumValues].filter((v) => !SECTION_TYPES.includes(v)).join(", ")
);
check(
  "every section has a renderer case",
  SECTION_TYPES.every((t) => new RegExp(`case "${t}":`).test(renderer)),
  SECTION_TYPES.filter((t) => !new RegExp(`case "${t}":`).test(renderer)).join(", ")
);
check(
  "there are at least thirty of them",
  SECTION_TYPES.length >= 30,
  `${SECTION_TYPES.length}`
);

// ---------------------------------------------------------------------------
console.log("\nEVERY SECTION IS DESCRIBED PROPERLY");
// ---------------------------------------------------------------------------

for (const type of SECTION_TYPES) {
  const s = getSectionSchema(type)!;
  check(`${type} is keyed by its own type`, s.type === type);
  check(`${type} has a label`, !!s.label?.trim());
  check(
    `${type} has a plain-language description`,
    (s.description ?? "").length > 15,
    "the picker shows it, and a name alone does not say what a section is for"
  );
  check(
    `${type} names a category the picker knows`,
    ["Layout", "Content", "Commerce", "Media"].includes(s.category)
  );
  check(
    `${type} explains every one of its settings`,
    s.fields.every((f) => (f.info ?? "").length > 10),
    s.fields.filter((f) => (f.info ?? "").length <= 10).map((f) => f.key).join(", ")
  );
  check(
    `${type} explains every setting inside its repeatable rows`,
    (s.blocks?.fields ?? []).every((f) => (f.info ?? "").length > 10),
    (s.blocks?.fields ?? []).filter((f) => (f.info ?? "").length <= 10).map((f) => f.key).join(", ")
  );
  check(
    `${type} gives every select at least two options`,
    s.fields.filter((f) => f.kind === "select").every((f) => (f.options ?? []).length >= 2)
  );
  check(
    `${type} defaults every select to one of its own options`,
    s.fields
      .filter((f) => f.kind === "select")
      .every((f) => (f.options ?? []).some((o) => o.value === f.default)),
    "a default nothing matches leaves the control showing nothing"
  );
  check(
    `${type} has no duplicate setting keys`,
    new Set(s.fields.map((f) => f.key)).size === s.fields.length
  );
  check(
    `${type} keeps its settings out of the reserved style key`,
    s.fields.every((f) => f.key !== STYLE_KEY)
  );
}

// ---------------------------------------------------------------------------
console.log("\nA NEW SECTION IS BORN VALID");
// ---------------------------------------------------------------------------

for (const type of SECTION_TYPES) {
  const s = getSectionSchema(type)!;
  const data = defaultSectionData(type) as Record<string, unknown>;
  check(`${type} starts with every setting present`, s.fields.every((f) => f.key in data));
  check(`${type} starts with the shared style settings`, STYLE_KEY in data);
  if (s.blocks) {
    check(
      `${type} starts with an empty list of ${s.blocks.label.toLowerCase()}s`,
      Array.isArray(data[s.blocks.key]) && (data[s.blocks.key] as unknown[]).length === 0,
      "a section arriving pre-filled would put somebody else's words on their page"
    );
  }
  check(`${type} has a readable name`, sectionLabel(type) !== type);
}

// ---------------------------------------------------------------------------
console.log("\nWHAT A SECTION MUST NOT DO");
// ---------------------------------------------------------------------------

/*
 * Column classes built from a setting.
 *
 * Tailwind ships only the classes it can find in the source, so a template
 * literal like `sm:grid-cols-${n}` produces a class that exists in the HTML and
 * in no stylesheet — the section silently renders as one column and nothing in
 * the build complains. lib/../grid-classes.ts is the shared answer.
 */
const sectionDir = "components/storefront/sections";
const built = [
  "gallery",
  "testimonials",
  "multicolumn",
  "trust-badges",
  "stats",
  "team",
  "collage",
  "steps",
];
for (const file of built) {
  const src = read(`${sectionDir}/${file}.tsx`);
  check(
    `${file} does not build a grid class from a setting`,
    !/`[^`]*grid-cols-\$\{/.test(src),
    "Tailwind would strip it, and the section would quietly render as one column"
  );
}

const frame = read(`${sectionDir}/section-frame.tsx`);
check(
  "an empty section can be collapsed",
  /section-body/.test(frame),
  "the frame drew its padding around a renderer that returned nothing — a 96px gap with no element to inspect"
);
const css = read("app/globals.css");
check(
  "and the stylesheet actually collapses it",
  /section:has\(> \.section-body:empty\)\s*\{[\s\S]{0,60}display: none/.test(css)
);
check(
  "but the customizer still shows it",
  /body\.in-preview section:has\(> \.section-body:empty\)/.test(css),
  "a section that vanished the moment it was added could never be filled in"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
