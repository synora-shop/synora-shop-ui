/**
 * Reading the times a merchant types.
 *
 * Its own module rather than living beside the action that uses it, because a
 * `"use server"` file may only export async functions — everything exported
 * from one becomes callable over the network, so a plain helper there is a
 * build error rather than a style problem.
 *
 * Pure: string in, string or nothing out.
 */

/**
 * A time a door sign would show, or nothing.
 *
 * Accepts what a merchant types rather than demanding a format: "9", "9:00",
 * "09:00", "9.00" and "9am" all mean the same thing and all store the same way.
 * Anything that is not a time at all becomes nothing, which reads on the
 * storefront as "not set" rather than as a broken row.
 */
export function normaliseTime(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const match = value.match(/^(\d{1,2})\s*[:.]?\s*(\d{2})?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const suffix = match[3]?.toLowerCase();

  if (minute > 59) return null;
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  if (hour > 23) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
