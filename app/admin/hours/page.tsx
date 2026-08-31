import { db } from "@/lib/data/shop";
import { FormSaveButton } from "@/components/admin/form-save-button";
import { saveOpeningHours } from "@/app/admin/hours/actions";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Read Monday first, stored Sunday first. See the section renderer. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminHoursPage() {
  const rows = await (await db()).openingHours.findMany();
  const byDay = new Map(rows.map((row) => [row.day, row]));

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl font-semibold">Opening hours</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Shown on your storefront wherever you add the opening hours section. Leave a day empty
        to say nothing about it at all.
      </p>

      <form action={saveOpeningHours} className="mt-6 space-y-3">
        <div className="rounded-lg border border-border bg-white">
          <div className="hidden gap-3 border-b border-border px-4 py-2 text-xs font-medium text-ink-soft sm:grid sm:grid-cols-[7rem_1fr_1fr_auto]">
            <span>Day</span>
            <span>Open</span>
            <span>Second service</span>
            <span>Closed</span>
          </div>

          {WEEK.map((day) => {
            const hours = byDay.get(day);
            return (
              <div
                key={day}
                className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center"
              >
                <span className="text-sm font-medium">{DAYS[day]}</span>

                <span className="flex items-center gap-2">
                  <input
                    name={`opensAt-${day}`}
                    defaultValue={hours?.opensAt ?? ""}
                    aria-label={`${DAYS[day]} opening time`}
                    className="input h-9 w-full text-sm"
                  />
                  <span className="text-xs text-ink-faint">to</span>
                  <input
                    name={`closesAt-${day}`}
                    defaultValue={hours?.closesAt ?? ""}
                    aria-label={`${DAYS[day]} closing time`}
                    className="input h-9 w-full text-sm"
                  />
                </span>

                <span className="flex items-center gap-2">
                  <input
                    name={`reopensAt-${day}`}
                    defaultValue={hours?.reopensAt ?? ""}
                    aria-label={`${DAYS[day]} second opening time`}
                    className="input h-9 w-full text-sm"
                  />
                  <span className="text-xs text-ink-faint">to</span>
                  <input
                    name={`reclosesAt-${day}`}
                    defaultValue={hours?.reclosesAt ?? ""}
                    aria-label={`${DAYS[day]} second closing time`}
                    className="input h-9 w-full text-sm"
                  />
                </span>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`closed-${day}`}
                    defaultChecked={hours?.closed ?? false}
                  />
                  <span className="sm:sr-only">Closed all day</span>
                </label>
              </div>
            );
          })}
        </div>

        {/* The format hint lives here rather than in every box. A placeholder
            reading "09:00" is indistinguishable at a glance from a saved
            09:00, so a merchant who filled in Monday and left Tuesday empty
            saw the same thing on both rows and had no way to tell which days
            their customers would actually see. An empty field now looks
            empty, which is the only thing it can honestly look like. */}
        <p className="text-xs text-ink-faint">
          Write times however you like: 9, 9:00 and 9am all mean the same thing. Leave a day
          blank to say nothing about it. The second service is for a kitchen that shuts in the
          afternoon and opens again for dinner.
        </p>

        <FormSaveButton idleLabel="Save hours" savedLabel="Hours saved" />
      </form>
    </div>
  );
}
