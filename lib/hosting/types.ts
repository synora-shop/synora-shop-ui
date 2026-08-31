/** What the vendor thinks of a hostname we asked it to serve. */
export type HostnameState = {
  /** Registered with the provider. */
  known: boolean;
  /** A certificate exists and traffic will be served. */
  serving: boolean;
  /** Why not, in words a merchant can act on. Null when serving. */
  problem: string | null;
};

/**
 * Whoever terminates TLS and routes a hostname to this app.
 *
 * Three operations, all idempotent — they are called from a checker that may
 * run twice for the same domain, and from a merchant pressing a button twice.
 * None of them throw for an expected state; a hostname that is already added is
 * a success, and one that was never added is a successful removal.
 *
 * They may throw for a genuine failure — no credentials, vendor down — because
 * that is a different thing from "the domain is not ready" and must not be
 * reported to the merchant as their mistake.
 */
export type HostingProvider = {
  name: string;
  /** Asks the provider to start serving this hostname. */
  add(hostname: string): Promise<void>;
  /** Stops serving it. Must not fail if it was never added. */
  remove(hostname: string): Promise<void>;
  /** What the provider currently thinks. */
  status(hostname: string): Promise<HostnameState>;
};
