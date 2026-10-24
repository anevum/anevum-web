// Reads only public GitHub PR metadata. Never treats PR state as live production health.
let cached = null;

export async function getPublicDevelopmentActivity(fetchImpl = globalThis.fetch, now = Date.now()) {
  if (cached && cached.expires > now) return cached.value;
  try {
    const result = await fetchImpl(
      "https://api.github.com/repos/anevum/anevum-web/pulls?state=open&per_page=8&sort=updated&direction=desc",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "ANEVUM-Continuance-House-V001"
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!result.ok) throw new Error("GitHub unavailable");
    const raw = await result.json();
    if (!Array.isArray(raw)) throw new Error("Unexpected GitHub response");
    const value = {
      live: true,
      source: "public-github-prs",
      note: "Open public pull requests, not production deployment or CI verification.",
      fetchedAt: new Date(now).toISOString(),
      items: raw.slice(0, 8).filter((item) =>
        typeof item.html_url === "string" &&
        /^https:\/\/github\.com\/anevum\/anevum-web\/pull\/\d+$/.test(item.html_url)
      ).map((item) => ({
        number: Number(item.number) || 0,
        title: String(item.title || "Untitled change").slice(0, 160),
        url: item.html_url,
        updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
        draft: Boolean(item.draft)
      }))
    };
    cached = { value, expires: now + 120000 };
    return value;
  } catch {
    return {
      live: false,
      source: "public-github-prs",
      note: "Public development activity could not be retrieved. No status has been inferred.",
      fetchedAt: new Date(now).toISOString(),
      items: []
    };
  }
}


let workflowCache = null;

/** Only public GitHub Actions metadata, never inferred hosting or deployment health. */
export async function getPublicWorkflowActivity(fetchImpl = globalThis.fetch, now = Date.now()) {
  if (workflowCache && workflowCache.expires > now) return workflowCache.value;
  try {
    const response = await fetchImpl(
      "https://api.github.com/repos/anevum/anevum-web/actions/runs?per_page=8",
      {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "ANEVUM-Continuance-House-V001" },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!response.ok) throw new Error("GitHub Actions unavailable.");
    const body = await response.json();
    if (!Array.isArray(body.workflow_runs)) throw new Error("Unexpected GitHub Actions response.");
    const allowedStatuses = new Set(["completed", "in_progress", "queued", "waiting", "requested", "pending"]);
    const value = {
      live: true,
      source: "public-github-actions",
      note: "Public workflow-run metadata; a successful workflow is not proof of live deployment.",
      fetchedAt: new Date(now).toISOString(),
      items: body.workflow_runs.slice(0, 8)
        .filter((item) => typeof item.html_url === "string" &&
          /^https:\/\/github\.com\/anevum\/anevum-web\/actions\/runs\/\d+$/.test(item.html_url))
        .map((item) => ({
          id: Number(item.id) || 0,
          title: String(item.name || "Unnamed workflow").slice(0, 130),
          url: item.html_url,
          status: allowedStatuses.has(item.status) ? item.status : "unknown",
          conclusion: typeof item.conclusion === "string" ? item.conclusion.slice(0, 50) : null,
          updatedAt: typeof item.updated_at === "string" ? item.updated_at : null
        }))
    };
    workflowCache = { value, expires: now + 120000 };
    return value;
  } catch {
    return {
      live: false,
      source: "public-github-actions",
      note: "GitHub workflow metadata is currently unavailable. No verification status is inferred.",
      fetchedAt: new Date(now).toISOString(),
      items: []
    };
  }
}
