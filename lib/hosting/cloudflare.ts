import type { HostingProvider, HostnameState } from "./types";

// Cloudflare for SaaS — "custom hostnames".
//
// This is the one that scales past a hundred merchants without the per-domain
// cost getting silly: the first 100 custom hostnames are free and it is a few
// cents each after that, certificates are issued and renewed automatically, and
// it sits in front of whatever the app happens to be running on. That last part
// is the reason it is worth the extra adapter — moving the app from Vercel to
// our own machines later does not touch any merchant's DNS.

const API = "https://api.cloudflare.com/client/v4";

function config() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw new Error(
      "Cloudflare hosting needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID. Custom domains can't be set up without them."
    );
  }
  return { token, zoneId };
}

type CloudflareResponse = {
  success: boolean;
  errors?: { code: number; message: string }[];
  result?: unknown;
};

async function call(path: string, init?: RequestInit): Promise<CloudflareResponse> {
  const { token } = config();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  return (await response.json().catch(() => ({ success: false }))) as CloudflareResponse;
}

type CustomHostname = {
  id: string;
  hostname: string;
  status: string;
  ssl?: { status?: string; validation_errors?: { message: string }[] };
};

/** Cloudflare has no "get by hostname", so a filtered list stands in for one. */
async function find(hostname: string): Promise<CustomHostname | null> {
  const { zoneId } = config();
  const body = await call(
    `/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`
  );
  const results = (body.result as CustomHostname[] | undefined) ?? [];
  return results.find((r) => r.hostname === hostname) ?? null;
}

export const cloudflareProvider: HostingProvider = {
  name: "cloudflare",

  async add(hostname) {
    // Idempotent by checking first. Cloudflare would return an error code for a
    // duplicate, but the code differs between plan types and matching on it is
    // more fragile than one extra request.
    if (await find(hostname)) return;

    const { zoneId } = config();
    const body = await call(`/zones/${zoneId}/custom_hostnames`, {
      method: "POST",
      body: JSON.stringify({
        hostname,
        // http validation needs the domain to already resolve to us, which it
        // does by the time this is called — DNS is checked first.
        ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } },
      }),
    });

    if (!body.success) {
      const message = body.errors?.map((e) => e.message).join("; ") ?? "unknown error";
      throw new Error(`Cloudflare refused ${hostname}: ${message}`);
    }
  },

  async remove(hostname) {
    const existing = await find(hostname);
    if (!existing) return;

    const { zoneId } = config();
    const body = await call(`/zones/${zoneId}/custom_hostnames/${existing.id}`, {
      method: "DELETE",
    });
    if (!body.success) {
      throw new Error(`Cloudflare wouldn't remove ${hostname}`);
    }
  },

  async status(hostname): Promise<HostnameState> {
    const existing = await find(hostname);
    if (!existing) {
      return { known: false, serving: false, problem: "Not set up on the host yet." };
    }

    const sslStatus = existing.ssl?.status ?? "";
    const serving = existing.status === "active" && sslStatus === "active";
    if (serving) return { known: true, serving: true, problem: null };

    // Validation errors are the useful case: they say what is wrong with the
    // domain rather than with us, and the merchant can act on them.
    const validationErrors = existing.ssl?.validation_errors
      ?.map((e) => e.message)
      .filter(Boolean);

    return {
      known: true,
      serving: false,
      problem: validationErrors?.length
        ? validationErrors.join("; ")
        : "Waiting for the certificate. This usually takes a few minutes.",
    };
  },
};
