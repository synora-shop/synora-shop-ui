/**
 * The honeypot on the one form anybody can submit.
 *
 * A field that is present in the HTML, hidden from people, and left empty by
 * every real visitor. Automated form-fillers fill in everything they find, so
 * anything arriving with this set did not come from a person.
 *
 * It is deliberately not a CAPTCHA. A CAPTCHA is a tax on every customer to
 * stop a nuisance that costs the merchant nothing but a row in a list, and it
 * would mean sending a visitor's details to a third party. This costs a
 * visitor nothing and catches the volume traffic, which is the whole problem.
 *
 * A caught submission is answered as though it worked. Telling a bot it was
 * detected only teaches whoever wrote it which field to leave alone.
 *
 * Client-safe: a constant and a pure predicate.
 */

/**
 * The field's name.
 *
 * Deliberately ordinary. "honeypot" or "leave-this-empty" is a label a
 * form-filler can be taught to skip; "website" is a field it expects to fill.
 */
export const HONEYPOT_FIELD = "website";

/** Whether a submission carrying this value came from a bot. */
export function looksAutomated(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
