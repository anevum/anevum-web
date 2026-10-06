import type { CommandEvidence } from "../lib/data";
import type { IrenSnapshot } from "../lib/runtime-topology";
import { ageText, displayState } from "../lib/system-display";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function yesNo(value: unknown) {
  return value === true ? "YES" : "NO";
}

export default function CommandReviewDeck({
  snapshot,
  evidence,
  daily,
  weekly,
  now
}: {
  snapshot: IrenSnapshot | null;
  evidence: CommandEvidence | null;
  daily: Record<string, unknown> | null;
  weekly: Record<string, unknown> | null;
  now: number;
}) {
  const control = snapshot?.research?.control;
  const pipeline = snapshot?.strategy_pipeline;
  const candidate = pipeline?.candidate;
  const validation = pipeline?.validation;
  const release = pipeline?.release_gate;
  const readiness = pipeline?.evidence_readiness;
  const autonomy = control?.autonomy || {};
  const dailyMetrics = record(daily?.metrics);
  const dailyClass = record(daily?.classification);
  const weeklyStability = record(weekly?.evidence_stability);
  const reviewRequired = control?.review_required === true;
  const mode = text(control?.mode, "IDLE");

  const permissions = [
    ["Collect evidence", autonomy.collect_market_evidence],
    ["Execute frozen hypothesis", autonomy.execute_frozen_hypotheses],
    ["Run replay validation", autonomy.run_replay_validation],
    ["Invent new hypothesis family", autonomy.generate_new_hypothesis_family],
    ["Patch strategy code", autonomy.patch_strategy_code],
    ["Promote live strategy", autonomy.promote_live_strategy],
    ["Change risk / capital", autonomy.change_risk_or_capital]
  ] as const;

  return (
    <div className="command-v4-review">
      <section className={"command-v4-review-hero" + (reviewRequired ? " needs-review" : "")}>
        <div>
          <span>{reviewRequired ? "DECISION REQUIRED" : "REVIEW QUEUE"}</span>
          <h2>{displayState(mode)}</h2>
          <p>{control?.reason || "No research decision currently requires an operator or model pass."}</p>
        </div>
        <div className="command-v4-review-action">
          <span>NEXT ACTION</span>
          <strong>{displayState(control?.next_action)}</strong>
          <small>{control?.work_credit_recommended ? "Use a deliberate Work / Codex pass below." : "Automation may continue within frozen boundaries."}</small>
        </div>
      </section>

      <article className="command-v4-card command-v4-evidence-readiness">
        <header>
          <div><span>FORWARD EVIDENCE READINESS</span><strong>{displayState(readiness?.state || "AWAITING_MEASURABLE_COHORT")}</strong></div>
          <small>{readiness?.latest_observed_at ? ageText(readiness.latest_observed_at, now) : "Awaiting first measurable post-fix cycle"}</small>
        </header>
        <div className="command-v4-metrics">
          <div><span>CANDIDATES</span><strong>{readiness?.candidate_count ?? 0}</strong></div>
          <div><span>MEASURABLE</span><strong>{readiness?.measurement_ready_count ?? 0}</strong></div>
          <div><span>COVERAGE</span><strong>{readiness?.measurement_ready_rate_pct == null ? "—" : readiness.measurement_ready_rate_pct.toFixed(1) + "%"}</strong></div>
          <div><span>RECENT CYCLES</span><strong>{readiness?.sampled_cycles ?? 0}</strong></div>
        </div>
        <p className="command-v4-note">
          Contract: <strong>{text(readiness?.measurement_contract, "exact_decision_price_plus_completed_bar_time").replaceAll("_", " ")}</strong>.
          {" "}Missing decision price {readiness?.missing_reference_price_count ?? 0}; missing completed-bar time {readiness?.missing_bar_time_count ?? 0}.
          {" "}Legacy gaps remain unmeasurable rather than reconstructed.
        </p>
        <p className="command-v4-note"><strong>Next:</strong> {readiness?.next_action || "Collect the first post-fix live decision cycle before evaluating forward-outcome coverage."}</p>
      </article>

      <div className="command-v4-two">
        <article className="command-v4-card">
          <header><div><span>AUTONOMY CONTRACT</span><strong>What may happen without you</strong></div><small>{control?.schema_version || "research_control unavailable"}</small></header>
          <div className="command-v4-permissions">
            {permissions.map(([label, allowed]) => (
              <div key={label} className={allowed ? "allowed" : "protected"}>
                <span>{label}</span><strong>{yesNo(allowed)}</strong>
              </div>
            ))}
          </div>
          <p className="command-v4-note">The runtime may collect evidence and execute already-frozen experiments. New research direction, production strategy code, live promotion, and risk changes remain protected decisions.</p>
        </article>

        <article className="command-v4-card">
          <header><div><span>STRATEGY CHANGE</span><strong>Candidate → validation → release</strong></div><small>Automatic promotion off</small></header>
          <div className="command-v4-lifecycle">
            <div><span>CANDIDATE</span><strong>{candidate?.candidate_id || candidate?.title || "NONE"}</strong><small>{[candidate?.lane, candidate?.stage || candidate?.status].filter(Boolean).map(displayState).join(" · ") || "No superseding candidate"}</small></div>
            <i>→</i>
            <div><span>VELUM</span><strong>{displayState(validation?.status)}</strong><small>{validation?.observed_at ? ageText(validation.observed_at, now) : "No matching replay evidence"}</small></div>
            <i>→</i>
            <div><span>RELEASE</span><strong>{displayState(release?.status)}</strong><small>{release?.reason || "Protected production boundary"}</small></div>
          </div>
        </article>
      </div>

      <div className="command-v4-two">
        <article className="command-v4-card">
          <header><div><span>LIVE EVIDENCE</span><strong>Current session</strong></div><small>{text(daily?.session, text(evidence?.generated_at, "No report"))}</small></header>
          <div className="command-v4-metrics">
            <div><span>CLOSED TRADES</span><strong>{text(dailyMetrics.closed_trades)}</strong></div>
            <div><span>W / L</span><strong>{text(dailyMetrics.wins, "0")} / {text(dailyMetrics.losses, "0")}</strong></div>
            <div><span>WIN RATE</span><strong>{text(dailyMetrics.win_rate_pct, "—")}{dailyMetrics.win_rate_pct != null ? "%" : ""}</strong></div>
            <div><span>CLASSIFICATION</span><strong>{displayState(text(dailyClass.state || dailyClass.classification, "UNKNOWN"))}</strong></div>
          </div>
        </article>

        <article className="command-v4-card">
          <header><div><span>EVIDENCE STABILITY</span><strong>Weekly decision context</strong></div><small>{text(weekly?.week_end, "No weekly report")}</small></header>
          <div className="command-v4-metrics">
            <div><span>CONFIRMED FACTS</span><strong>{Array.isArray(weeklyStability.confirmed_facts) ? weeklyStability.confirmed_facts.length : 0}</strong></div>
            <div><span>INCIDENTS</span><strong>{snapshot?.incidents?.length ?? 0}</strong></div>
            <div><span>REJECTED GENERATIONS</span><strong>{control?.rejected_generations ?? 0}</strong></div>
            <div><span>REVIEW TYPE</span><strong>{displayState(control?.review_kind)}</strong></div>
          </div>
        </article>
      </div>
    </div>
  );
}
