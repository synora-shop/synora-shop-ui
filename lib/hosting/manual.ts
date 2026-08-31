import type { HostingProvider } from "./types";

/**
 * No provider at all.
 *
 * For local development, CI, and any deployment where certificates are handled
 * outside this app — a reverse proxy with its own ACME setup, for instance.
 *
 * It reports `serving: true` because from this app's point of view there is
 * nothing left to wait for: if DNS is correct and nobody here is responsible
 * for the certificate, the domain is as ready as this code can make it. The
 * warning about using this in production lives in index.ts, where it is emitted
 * once rather than per domain.
 */
export const manualProvider: HostingProvider = {
  name: "manual",
  async add() {},
  async remove() {},
  async status() {
    return { known: true, serving: true, problem: null };
  },
};
