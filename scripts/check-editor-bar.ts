/**
 * Checks Discard and Save behave the same on every screen — run with
 * `npm run check:editor`.
 *
 * The documented standard is two buttons in the action bar on every screen that
 * can be changed, and a warning if you try to leave with work unsaved. Getting
 * that consistent is mostly about what must NOT happen: a form keeping its own
 * save button so the screen has two, a form installing a second leave-guard so
 * the merchant is asked twice, or a form registering and then being unable to
 * report that it finished saving.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { anyDirty, anySaving, type EditorEntry } from "../lib/admin-editor-store";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

/* -------------------------------------------------------------------------- */
/* The screen's state, not one form's                                         */
/* -------------------------------------------------------------------------- */

const entry = (dirty: boolean, saving = false): EditorEntry => ({
  dirty, saving, save: () => {}, discard: () => {},
});

check("nothing registered is not dirty", anyDirty({}) === false);
check("one clean form is not dirty", anyDirty({ a: entry(false) }) === false);
// Settings carries three forms. A merchant who edited one of them has unsaved
// work on the screen, whatever the other two say.
check("one dirty form among three makes the screen dirty",
  anyDirty({ a: entry(false), b: entry(true), c: entry(false) }) === true);
check("saving is reported the same way",
  anySaving({ a: entry(true, false), b: entry(true, true) }) === true);
check("nothing saving is not saving", anySaving({ a: entry(true) }) === false);

/* -------------------------------------------------------------------------- */
/* The bar                                                                    */
/* -------------------------------------------------------------------------- */

const bar = read("components/admin/editor-bar.tsx");
// A list page draws its own action bar; this must stay out of the way there.
check("the bar draws nothing when no screen has registered",
  /entries\.length === 0\) return null/.test(bar));
// A permanently visible Discard on an untouched form is a button whose only
// purpose is to frighten you.
check("Discard appears only once there is something to discard",
  /\{dirty && \([\s\S]{0,200}Discard/.test(bar));
check("Save is disabled when there is nothing to save", /disabled=\{!dirty \|\| saving\}/.test(bar));
check("one press saves every changed form",
  /Promise\.all\(entries\.filter\(\(e\) => e\.dirty\)/.test(bar));
check("the bar owns the leave dialog, since a hook cannot render one",
  /setConfirmLeave/.test(bar) && /useConfirm/.test(bar));

const hook = read("components/admin/use-editor.ts");
check("registering also guards the work", /useUnsavedChanges/.test(hook));
// Without this a form that rebuilds its callbacks every render — which is most
// of them — re-registers on every keystroke.
check("handlers are held in a ref, not in the dependency list",
  /useRef\(\{ onSave, onDiscard \}\)/.test(hook) && /\[id, dirty, saving, register\]/.test(hook));
// Either shape of cleanup counts: `return () => unregister(id)` or the
// arrow-returning-arrow the hook actually uses.
check("leaving a screen takes its buttons with it", /=> unregister\(id\)/.test(hook));

/* -------------------------------------------------------------------------- */
/* Every editable screen is on it                                             */
/* -------------------------------------------------------------------------- */

const FORMS = [
  "components/admin/store-identity-form.tsx",
  "components/admin/visibility-form.tsx",
  "components/admin/store-settings-form.tsx",
  "components/admin/store-defaults-form.tsx",
  "components/admin/global-edits-form.tsx",
];

for (const file of FORMS) {
  const src = read(file);
  check(`${file} registers with the bar`, /useEditor\(/.test(src));
  // Two save buttons on one screen is the thing this whole scheme replaces.
  check(`${file} keeps no save button of its own`,
    !/<SaveButton/.test(src) && !/<StickySaveBar/.test(src));
  // Two guards means the merchant is asked to confirm leaving twice.
  check(`${file} installs no second leave-guard`,
    !/useUnsavedChanges\(/.test(src),
    "useEditor already installs one");
}

check("the bar is mounted once, in the layout",
  /<EditorBar \/>/.test(read("app/admin/layout.tsx")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
