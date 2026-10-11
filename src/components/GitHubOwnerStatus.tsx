import {useEffect, useState} from "react";

type Workflow = {
  run_id: number;
  workflow: string;
  status: string;
  conclusion: string | null;
  branch: string | null;
  head_sha: string | null;
  updated_at: string | null;
  url: string;
};
type GitHubRepo = {
  repository: string;
  source: string;
  state: "OBSERVED" | "NO_RUNS" | "UNAVAILABLE";
  latest_run: Workflow | null;
};
type GitHubStatus = {
  schema_version: "anevum.owner.github.v1";
  provider: "github";
  observed_at: string;
  public_workflow_metadata_only: true;
  deployment_inferred: false;
  can_trigger_workflows: false;
  repositories: GitHubRepo[];
};

const EXPECTED = ["anevum/anevum-web", "anevum/rhen"];
function validSnapshot(value: unknown): value is GitHubStatus {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<GitHubStatus>;
  return v.schema_version === "anevum.owner.github.v1" &&
    v.provider === "github" &&
    v.deployment_inferred === false &&
    v.can_trigger_workflows === false &&
    v.public_workflow_metadata_only === true &&
    Array.isArray(v.repositories) &&
    v.repositories.length === EXPECTED.length &&
    v.repositories.every((row, i) => row?.repository === EXPECTED[i] &&
      ["OBSERVED","NO_RUNS","UNAVAILABLE"].includes(row.state));
}

function stamp(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Time unavailable";
  return new Date(value).toLocaleString();
}

// This component is rendered only inside the gated owner RHEN Terminal.
// The API independently re-verifies both owner credentials on every request.
export default function GitHubOwnerStatus() {
  const [snapshot, setSnapshot] = useState<GitHubStatus | null>(null);
  const [message, setMessage] = useState("Loading public CI observations…");
  useEffect(() => {
    const controller = new AbortController();
    async function read() {
      try {
        const response = await fetch("/api/command/integrations/github", {
          method: "GET", credentials: "same-origin", cache: "no-store",
          signal: controller.signal
        });
        if (!response.ok) throw new Error("Not authorized or GitHub observation unavailable");
        const body: unknown = await response.json();
        if (!validSnapshot(body)) throw new Error("GitHub observation contract unavailable");
        if (!controller.signal.aborted) {setSnapshot(body);setMessage("");}
      } catch {
        if (!controller.signal.aborted) {
          setSnapshot(null);
          setMessage("GitHub observations unavailable. No deployment state is implied.");
        }
      }
    }
    void read();
    const ticker = window.setInterval(() => void read(), 300000);
    return () => {controller.abort();window.clearInterval(ticker);};
  }, []);

  return <section className="command-v4-card command-v4-github" aria-label="Owner GitHub Actions status">
    <header><div><span>GITHUB / READ-ONLY</span><strong>Source and CI observations</strong></div>
      <small>{snapshot ? "Checked " + stamp(snapshot.observed_at) : "No verified observation"}</small></header>
    <p className="command-v4-github-disclaimer">Latest public workflow for each allowed repository, from any branch. CI is not a production deployment or runtime-health check.</p>
    {message && <p className="command-v4-github-disclaimer" role="status">{message}</p>}
    <div className="command-v4-table">
      {(snapshot?.repositories || EXPECTED.map(repository => ({
        repository, source: "https://github.com/" + repository + "/actions",
        state:"UNAVAILABLE" as const, latest_run:null
      }))).map(row => {
        const run = row.latest_run;
        return <div key={row.repository} className="command-v4-github-row">
          <strong>{row.repository}</strong>
          <span>{row.state === "OBSERVED" && run ? run.workflow + " · " + run.status +
            (run.conclusion ? " / " + run.conclusion : "") : row.state === "NO_RUNS" ?
            "No workflow runs recorded" : "Observation unavailable"}</span>
          <span>{run ? (run.branch || "Unknown branch") + " · " + stamp(run.updated_at) : "No verified timestamp"}</span>
          <b><a href={run?.url || row.source} target="_blank" rel="noopener noreferrer">
            {run ? "View run ↗" : "GitHub ↗"}</a></b>
        </div>;
      })}
    </div>
    <p className="command-v4-github-disclaimer">Repository access is not exposed to members. GitHub outages or rate limits show as unavailable; no workflows can be started here.</p>
  </section>;
}
