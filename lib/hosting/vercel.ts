import type { HostingProvider, HostnameState } from "./types";

// Vercel's project-domains API.
//
// Vercel issues and renews the certificate once a domain is attached to the
// project and its DNS points at them, so there is nothing here about
// certificates directly — `verified` is Vercel's word for "we can serve this".

const API = "https://api.vercel.com";

function config() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    throw new Error(
      "Vercel hosting needs VERCEL_API_TOKEN and VERCEL_PROJECT_ID. Custom domains can't be set up without them."
    );
  }
  // A token scoped to a team must say which team, or the call 404s in a way
  // that reads as "no such project".
  const team = process.env.VERCEL_TEAM_ID;
  return { token, projectId, query: team ? `?teamId=${encodeURIComponent(team)}` : "" };
}

async function call(path: string, init?: RequestInit) {
  const { token, query } = config();
  const response = await fetch(`${API}${path}${query}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    // The checker runs on a schedule and must not hang on a slow vendor.
    signal: AbortSignal.timeout(10_000),
  });

  const body = await response.json().catch(() => ({}));
  return { response, body: body as Record<string, unknown> };
}

/** Vercel's error codes that mean "already in the state you asked for". */
const ALREADY_DONE = new Set(["domain_already_in_use_by_this_project", "not_found"]);

export const vercelProvider: HostingProvider = {
  name: "vercel",

  async add(hostname) {
    const { projectId } = config();
    const { response, body } = await call(`/v10/projects/${projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: hostname }),
    });

    if (response.ok) return;

    const code = (body.error as { code?: string } | undefined)?.code ?? "";
    // Adding a domain that is already on this project is the state we wanted.
    if (ALREADY_DONE.has(code)) return;

    if (code === "domain_already_in_use") {
      throw new Error(
        `${hostname} is already attached to another project. Remove it there first.`
      );
    }
    throw new Error(
      `Vercel refused ${hostname}: ${(body.error as { message?: string } | undefined)?.message ?? response.status}`
    );
  },

  async remove(hostname) {
    const { projectId } = config();
    const { response } = await call(
      `/v9/projects/${projectId}/domains/${encodeURIComponent(hostname)}`,
      { method: "DELETE" }
    );
    // 404 means it is not there, which is what removal is for.
    if (response.ok || response.status === 404) return;
    throw new Error(`Vercel wouldn't remove ${hostname}: ${response.status}`);
  },

  async status(hostname): Promise<HostnameState> {
    const { projectId } = config();
    const { response, body } = await call(
      `/v9/projects/${projectId}/domains/${encodeURIComponent(hostname)}`
    );

    if (response.status === 404) {
      return { known: false, serving: false, problem: "Not set up on the host yet." };
    }
    if (!response.ok) {
      throw new Error(`Vercel wouldn't say: ${response.status}`);
    }

    const verified = body.verified === true;
    return {
      known: true,
      serving: verified,
      problem: verified ? null : "Waiting for the certificate. This usually takes a few minutes.",
    };
  },
};
