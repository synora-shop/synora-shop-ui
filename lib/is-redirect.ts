/**
 * Whether a thrown value is Next's way of performing a navigation.
 *
 * `redirect()` and `notFound()` inside a server action signal themselves by
 * throwing. A plain `try { await action() } catch { … }` therefore treats a
 * successful redirect as a failure: the optimistic row rolls back, an error
 * appears, and the navigation may never happen.
 *
 * The marker lives on `digest`, which is the only part of a server error that
 * survives the trip to the browser in production — the message and stack are
 * replaced with an opaque string.
 *
 * Any catch that wraps a server action which might navigate should rethrow
 * these rather than reporting them.
 */
export function isNavigationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== "string") return false;
  return digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND";
}
