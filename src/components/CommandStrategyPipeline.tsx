import type { LiveTradingFeed } from "../lib/data";
import type { IrenSnapshot } from "../lib/runtime-topology";
import { ageText, displayState } from "../lib/system-display";
import SystemIcon from "./company/SystemIcon";

function activeCandidate(snapshot: IrenSnapshot | null) {
  const open = ["RUNNING", "QUEUED", "WAITING", "BLOCKED"];
  return (snapshot?.research?.graen_problems || []).find(row =>
    open.includes(String(row.status || "").toUpperCase())
  ) || null;
}

function latestReplay(snapshot: IrenSnapshot | null) {
  return (snapshot?.research?.velum_replays || [])
    .slice()
    .sort((a, b) => Date.parse(b.started_at || "") - Date.parse(a.started_at || ""))[0] || null;
}

export default function CommandStrategyPipeline({
  snapshot,
  feed,
  now
}: {
  snapshot: IrenSnapshot | null;
  feed?: LiveTradingFeed | null;
  now: number;
}) {
  const active = feed?.active_strategy;
  const candidate = activeCandidate(snapshot);
  const replay = latestReplay(snapshot);
  const next = feed?.research?.next_direction;
  const strategyLabel = active?.strategy_name || active?.version_id || "No canonical active strategy";
  const candidateLabel = candidate?.title || candidate?.candidate_id || next?.subject || "No replacement candidate";
  const validationState = replay?.status || candidate?.research_stage || "WAITING";
  const releaseState = candidate
    ? ["COMPLETE", "SUCCEEDED"].includes(String(candidate.status || "").toUpperCase()) ? "REVIEW" : "HOLD"
    : "NO CHANGE";

  return (
    <article className="command-panel command-strategy-pipeline">
      <header>
        <div>
          <span>STRATEGY LIFECYCLE</span>
          <strong>Current authority → next possible replacement</strong>
        </div>
        <small>Evidence-backed only</small>
      </header>

      <div className="command-strategy-flow" aria-label="Strategy research and promotion pipeline">
        <section>
          <SystemIcon system="RHEN" size="sm" />
          <span>01 · ACTIVE</span>
          <strong>{strategyLabel}</strong>
          <p>{active?.environment || "runtime"} · {displayState(active?.status || "UNKNOWN")}</p>
          <small>{active?.activated_at ? "activated " + ageText(active.activated_at, now) : "No activation timestamp"}</small>
        </section>
        <i aria-hidden="true">→</i>
        <section>
          <SystemIcon system="GRAEN" size="sm" />
          <span>02 · RESEARCH</span>
          <strong>{candidateLabel}</strong>
          <p>{candidate?.research_stage ? displayState(candidate.research_stage) : next?.conclusion || "No active superseding research"}</p>
          <small>{candidate?.updated_at ? ageText(candidate.updated_at, now) : "No active candidate"}</small>
        </section>
        <i aria-hidden="true">→</i>
        <section>
          <SystemIcon system="VELUM" size="sm" />
          <span>03 · VALIDATE</span>
          <strong>{displayState(validationState)}</strong>
          <p>{replay?.status ? "Latest replay evidence" : "Validation evidence required before promotion"}</p>
          <small>{replay?.completed_at || replay?.started_at ? ageText(replay.completed_at || replay.started_at, now) : "No replay timestamp"}</small>
        </section>
        <i aria-hidden="true">→</i>
        <section>
          <SystemIcon system="IREN" size="sm" />
          <span>04 · RELEASE GATE</span>
          <strong>{releaseState}</strong>
          <p>Research cannot silently replace production strategy.</p>
          <small>{snapshot?.action_required ? "Operator attention required" : "Protected authority boundary"}</small>
        </section>
      </div>
    </article>
  );
}
