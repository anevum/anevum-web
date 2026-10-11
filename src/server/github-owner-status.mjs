// GitHub is only a public provenance source in V5. This adapter never
// authenticates as a GitHub administrator, runs Actions or infers deployment.
const ALLOWED_REPOSITORIES = Object.freeze(["anevum/anevum-web", "anevum/rhen"]);
const RUN_STATES = new Set(["queued", "in_progress", "completed", "waiting", "requested", "pending"]);
const RUN_OUTCOMES = new Set(["success", "failure", "cancelled", "skipped", "timed_out", "action_required", "neutral", "stale"]);

function safeLabel(value, length = 100) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, length)
    : "";
}

function safeTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function normalizeGitHubRun(repository, run) {
  if (!ALLOWED_REPOSITORIES.includes(repository) || !run ||
      !Number.isSafeInteger(run.id) || run.id <= 0 ||
      !RUN_STATES.has(run.status)) return null;
  const sha = typeof run.head_sha === "string" && /^[a-f0-9]{40}$/.test(run.head_sha)
    ? run.head_sha : null;
  const branch = safeLabel(run.head_branch, 90);
  return {
    run_id: run.id,
    workflow: safeLabel(run.name, 100) || "Unnamed workflow",
    status: run.status,
    conclusion: RUN_OUTCOMES.has(run.conclusion) ? run.conclusion : null,
    branch: branch || null,
    head_sha: sha,
    updated_at: safeTimestamp(run.updated_at),
    url: "https://github.com/" + repository + "/actions/runs/" + run.id
  };
}

// All repository names and URLs are constants. The only dynamic value ever
// used in a browser link is a validated integer Action run ID.
export async function observeOwnerGitHub({fetchImpl = fetch, now = new Date()} = {}) {
  const observed = now instanceof Date && Number.isFinite(now.getTime())
    ? now.toISOString() : new Date().toISOString();
  const repositories = await Promise.all(ALLOWED_REPOSITORIES.map(async repository => {
    const source = "https://github.com/" + repository + "/actions";
    try {
      const response = await fetchImpl(
        "https://api.github.com/repos/" + repository + "/actions/runs?per_page=1",
        {
          method: "GET",
          headers: {
            "Accept": "application/vnd.github+json",
            "User-Agent": "ANEVUM-V5-ReadOnly-Status",
            "X-GitHub-Api-Version": "2022-11-28"
          },
          redirect: "error",
          signal: AbortSignal.timeout(4500),
          // A bounded public-metadata cache avoids polling the unauthenticated
          // GitHub API on every owner view. This is not a browser credential.
          cf: { cacheTtl: 300, cacheEverything: true }
        }
      );
      if (!response.ok) throw new Error("GitHub observation unavailable");
      const data = await response.json();
      if (!Array.isArray(data?.workflow_runs)) throw new Error("Invalid public workflow response");
      const run = data.workflow_runs.length
        ? normalizeGitHubRun(repository, data.workflow_runs[0]) : null;
      if (data.workflow_runs.length && !run) throw new Error("Invalid public workflow run");
      return {
        repository,
        source,
        state: run ? "OBSERVED" : "NO_RUNS",
        latest_run: run
      };
    } catch {
      return {repository, source, state: "UNAVAILABLE", latest_run: null};
    }
  }));
  return {
    schema_version: "anevum.owner.github.v1",
    provider: "github",
    observed_at: observed,
    public_workflow_metadata_only: true,
    deployment_inferred: false,
    can_trigger_workflows: false,
    repositories
  };
}
