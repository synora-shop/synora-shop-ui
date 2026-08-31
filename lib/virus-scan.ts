import { createHash } from "node:crypto";

// Malware scanning for admin uploads.
//
// This sits *after* the format validators (lib/font-validation.ts,
// lib/icon-validation.ts) and answers the question they deliberately can't:
// the file really is a well-formed font/image, but is it known-malicious?
//
// PROVIDER
// --------
// VirusTotal's public API v3, which fans a file out across ~70 engines. Chosen
// because it needs no new dependency and no always-on host — ClamAV would mean
// running a daemon with a ~1 GB signature database, which doesn't fit a
// serverless deployment. The provider is behind an interface so swapping it
// (ClamAV on a worker, Cloudmersive, a cloud AV) is a contained change.
//
// HASH FIRST
// ----------
// Every scan starts by looking up the file's SHA-256. If VirusTotal has seen it
// before, the verdict comes back in one request and the bytes never leave this
// server. Only genuinely unknown files get uploaded — worth knowing, because
// files submitted to the public API are shared with VirusTotal's security
// partners. For fonts and button icons, which become publicly downloadable
// assets on the storefront anyway, that's not a meaningful exposure.
//
// FAILURE POLICY
// --------------
// If no key is configured, or the service is unreachable/rate-limited, the scan
// returns "unavailable" rather than a false clean. The caller decides what to
// do with that (see scanPolicyBlocks): by default an upload is still allowed
// and the UI says scanning is off, so the feature degrades honestly instead of
// silently pretending files were checked. Set VIRUS_SCAN_REQUIRED=true to fail
// closed and refuse any upload that couldn't be scanned.

const VT_BASE = "https://www.virustotal.com/api/v3";

/** Total wall-clock budget. Serverless functions have their own limit, and an
 *  admin waiting on a file picker shouldn't sit for a minute. */
const SCAN_BUDGET_MS = 14_000;
const POLL_INTERVAL_MS = 1_500;

export type ScanVerdict =
  | { status: "clean"; provider: string; detail: string; sha256: string }
  | { status: "infected"; provider: string; detail: string; sha256: string }
  | { status: "unavailable"; reason: string; sha256: string };

export function isScanConfigured(): boolean {
  return Boolean(process.env.VIRUSTOTAL_API_KEY);
}

/** When true, an upload that couldn't be scanned is refused outright. */
export function scanRequired(): boolean {
  return process.env.VIRUS_SCAN_REQUIRED === "true";
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

type VtStats = {
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  timeout?: number;
};

function verdictFromStats(stats: VtStats, sha: string): ScanVerdict {
  const malicious = stats.malicious ?? 0;
  const suspicious = stats.suspicious ?? 0;
  const engines =
    malicious + suspicious + (stats.harmless ?? 0) + (stats.undetected ?? 0) + (stats.timeout ?? 0);

  if (malicious > 0) {
    return {
      status: "infected",
      provider: "VirusTotal",
      detail: `${malicious} of ${engines} engines flagged this file as malicious.`,
      sha256: sha,
    };
  }
  if (suspicious > 0) {
    // Suspicious-without-malicious is usually heuristics on an unusual but
    // benign file. Refusing it is the conservative call for something that will
    // be served to every visitor, and the count is surfaced so the admin can
    // judge for themselves.
    return {
      status: "infected",
      provider: "VirusTotal",
      detail: `${suspicious} of ${engines} engines flagged this file as suspicious.`,
      sha256: sha,
    };
  }
  return {
    status: "clean",
    provider: "VirusTotal",
    detail: `No detections across ${engines} engines.`,
    sha256: sha,
  };
}

async function vtFetch(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  return fetch(`${VT_BASE}${path}`, {
    ...init,
    headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY as string, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Scans a buffer, returning a verdict.
 *
 * Never throws — a scanner problem must not take down the upload path, so
 * everything unexpected becomes an "unavailable" verdict the caller can reason
 * about.
 */
export async function scanBuffer(bytes: Uint8Array, filename: string): Promise<ScanVerdict> {
  const sha = sha256(bytes);

  if (!isScanConfigured()) {
    return { status: "unavailable", reason: "No malware scanner is configured.", sha256: sha };
  }

  const deadline = Date.now() + SCAN_BUDGET_MS;
  const remaining = () => Math.max(1_000, deadline - Date.now());

  try {
    // 1. Hash lookup — instant for anything VirusTotal has seen, and the file
    //    itself is never transmitted.
    const known = await vtFetch(`/files/${sha}`, { method: "GET" }, Math.min(6_000, remaining()));

    if (known.ok) {
      const body = (await known.json()) as { data?: { attributes?: { last_analysis_stats?: VtStats } } };
      const stats = body.data?.attributes?.last_analysis_stats;
      if (stats) return verdictFromStats(stats, sha);
    } else if (known.status === 401) {
      return { status: "unavailable", reason: "The malware scanner rejected the API key.", sha256: sha };
    } else if (known.status === 429) {
      return { status: "unavailable", reason: "The malware scanner is rate-limited right now.", sha256: sha };
    } else if (known.status !== 404) {
      return { status: "unavailable", reason: `Scanner returned HTTP ${known.status}.`, sha256: sha };
    }

    // 2. Unknown file — submit it for analysis.
    const form = new FormData();
    form.append("file", new Blob([Buffer.from(bytes)]), filename);
    const submitted = await vtFetch(
      "/files",
      { method: "POST", body: form },
      Math.min(8_000, remaining())
    );

    if (submitted.status === 429) {
      return { status: "unavailable", reason: "The malware scanner is rate-limited right now.", sha256: sha };
    }
    if (!submitted.ok) {
      return { status: "unavailable", reason: `Scanner upload failed (HTTP ${submitted.status}).`, sha256: sha };
    }

    const submitBody = (await submitted.json()) as { data?: { id?: string } };
    const analysisId = submitBody.data?.id;
    if (!analysisId) {
      return { status: "unavailable", reason: "Scanner did not return an analysis id.", sha256: sha };
    }

    // 3. Poll until the analysis completes or the budget runs out.
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      const res = await vtFetch(`/analyses/${analysisId}`, { method: "GET" }, Math.min(5_000, remaining()));
      if (!res.ok) continue;
      const body = (await res.json()) as {
        data?: { attributes?: { status?: string; stats?: VtStats } };
      };
      const attrs = body.data?.attributes;
      if (attrs?.status === "completed" && attrs.stats) return verdictFromStats(attrs.stats, sha);
    }

    // Timed out. Retrying almost always succeeds instantly, because the hash
    // lookup in step 1 will now hit VirusTotal's cached result.
    return {
      status: "unavailable",
      reason: "The scan didn't finish in time. Try uploading again, the result is usually ready within a minute.",
      sha256: sha,
    };
  } catch {
    return { status: "unavailable", reason: "Couldn't reach the malware scanner.", sha256: sha };
  }
}

/**
 * Turns a verdict into an upload decision.
 *
 * Infected always blocks. "Unavailable" blocks only in strict mode
 * (VIRUS_SCAN_REQUIRED=true), so a store without a scanner key keeps working
 * on format validation alone rather than losing uploads entirely.
 */
export function scanPolicyBlocks(verdict: ScanVerdict): string | null {
  if (verdict.status === "infected") {
    return `Upload blocked, this file was flagged as malicious. ${verdict.detail}`;
  }
  if (verdict.status === "unavailable" && scanRequired()) {
    return `Upload blocked, malware scanning is required but unavailable. ${verdict.reason}`;
  }
  return null;
}

/** Compact, storable summary for the audit trail on an uploaded asset. */
export function verdictSummary(verdict: ScanVerdict): { status: string; provider: string; detail: string } {
  if (verdict.status === "unavailable") {
    return { status: "unscanned", provider: "none", detail: verdict.reason };
  }
  return { status: verdict.status, provider: verdict.provider, detail: verdict.detail };
}
