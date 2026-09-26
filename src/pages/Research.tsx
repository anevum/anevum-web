import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLiveTrading } from "../hooks/useLiveTrading";

type ResearchTab = "state" | "completed" | "evidence" | "questions" | "limits";

const tabs: [ResearchTab, string, string][] = [
  ["state", "Current state", "Live vs. next research"],
  ["completed", "Completed", "What was rejected"],
  ["evidence", "Evidence", "What exists now"],
  ["questions", "Questions", "What is monitored"],
  ["limits", "Limitations", "What we cannot claim"]
];

function human(value?: string | null) {
  return String(value || "unrecorded").replaceAll("_", " ");
}

function labelFamily(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function outcomeSummary(rows: { horizon_minutes?: number; status?: string; count?: number }[] | undefined, horizon: number) {
  const matching = (rows || []).filter((row) => Number(row.horizon_minutes) === horizon);
  const complete = matching.find((row) => row.status === "complete")?.count ?? 0;
  const incomplete = matching.filter((row) => row.status !== "complete").reduce((sum, row) => sum + Number(row.count || 0), 0);
  return complete + " complete / " + incomplete + " incomplete";
}

export default function Research() {
  const [tab, setTab] = useState<ResearchTab>("state");
  const { data, loading, error } = useLiveTrading(10000);
  const research = data?.research;
  const next = research?.next_direction;
  const terminal = research?.completed_decisions?.find((row) => row.decision_type === "terminal_rejection");
  const families = terminal?.families || [];
  const weekly = research?.latest_weekly_summary;
  const outcomes = research?.evidence?.candidate_forward_outcomes;
  const comparisons = research?.evidence?.live_offline_comparison || [];
  const comparisonCount = comparisons.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const unreconstructable = comparisons
    .filter((row) => String(row.match_state).toUpperCase() === "UNRECONSTRUCTABLE")
    .reduce((sum, row) => sum + Number(row.count || 0), 0);
  const questions = research?.active_questions || [];
  const limitations = research?.limitations || [];

  return (
    <section className="compact-page workspace-screen story-workspace research-story">
      <header className="workspace-heading story-heading">
        <div>
          <p className="compact-eyebrow">RHEN / RESEARCH</p>
          <h1>Research</h1>
          <p className="story-heading-copy">
            Production keeps running its active strategy. Research preserves failed ideas, evidence gaps, open questions, and the next experiment without pretending an unrun experiment has results.
          </p>
        </div>
        <div className="workspace-heading-status story-status">
          <div><small>LIVE</small><strong>{data?.active_strategy?.version_id || "UNRECORDED"}</strong></div>
          <div><small>NEXT RESEARCH</small><strong>{human(research?.current_status).toUpperCase()}</strong></div>
          <div><small>WEEKLY</small><strong>{weekly?.completeness_state || "UNAVAILABLE"}</strong></div>
        </div>
      </header>

      <div className="workspace-layout story-layout">
        <aside className="workspace-tabs story-tabs research-tabs" aria-label="Research sections">
          {tabs.map(([id, label, hint], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><small>{hint}</small></div>
            </button>
          ))}
        </aside>

        <div className="workspace-content story-content">
          <AnimatePresence mode="wait" initial={false}>
            {tab === "state" && (
              <motion.div className="workspace-view story-view" key="state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">CURRENT STATE</span><h2>Live, rejected, and next research are separate states.</h2></div>
                  <p>{error || (loading ? "Loading canonical public research state…" : "Derived from sanitized durable research decisions and report metadata.")}</p>
                </div>
                <div className="rhen-state-grid">
                  <article className="state-live"><span>LIVE</span><strong>{data?.active_strategy?.version_id || "Unrecorded"}</strong><p>{data?.active_strategy?.strategy_name || "No active live strategy is recorded."} remains the production strategy.</p></article>
                  <article className="state-research"><span>RESEARCH</span><strong>Monitoring</strong><p>{questions.length} canonical research question{questions.length === 1 ? "" : "s"} currently remain open for observation.</p></article>
                  <article className="state-rejected"><span>REJECTED</span><strong>Edge Discovery v1</strong><p>Five frozen directional-continuation families failed the predefined development gates and remain closed under that methodology.</p></article>
                  <article className="state-next"><span>NEXT RESEARCH</span><strong>{next?.subject || "Unrecorded"}</strong><p>{next?.conclusion || "No next research direction is recorded."}</p></article>
                </div>
                <div className="research-status-strip">
                  <span>{next?.implemented ? "IMPLEMENTED" : "NOT IMPLEMENTED"}</span>
                  <span>{next?.executed ? "RUN" : "NOT RUN"}</span>
                  <span>{next?.observation_interval || "OBSERVATION UNRECORDED"}</span>
                  <span>{next?.primary_forward_horizon_minutes ? next.primary_forward_horizon_minutes + "M PRIMARY HORIZON" : "HORIZON UNRECORDED"}</span>
                </div>
              </motion.div>
            )}

            {tab === "completed" && (
              <motion.div className="workspace-view story-view" key="completed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">EDGE DISCOVERY V1 / FINAL</span><h2>All five families were rejected.</h2></div>
                  <p>{terminal?.conclusion || "The canonical terminal research decision is not available."}</p>
                </div>
                <div className="research-family-list" aria-label="Permanently rejected Edge Discovery v1 families">
                  {families.length ? families.map((family, index) => (
                    <article key={family}><span>{String(index + 1).padStart(2, "0")}</span><strong>{labelFamily(family)}</strong><b>REJECTED</b></article>
                  )) : <div className="command-empty">Canonical rejected-family detail is unavailable.</div>}
                </div>
                <div className="rhen-state-grid compact">
                  <article><span>METHODOLOGY</span><strong>{terminal?.methodology_version || "edge-corpus-v1"}</strong><p>The research methodology was frozen before terminal evaluation.</p></article>
                  <article><span>CORPUS INTEGRITY</span><strong>36 / 36</strong><p>Diagnostics established complete representation of expected development trading sessions.</p></article>
                  <article><span>VALIDATION</span><strong>UNOPENED</strong><p>No family survived development, so validation was correctly not opened.</p></article>
                  <article><span>HOLDOUT</span><strong>UNOPENED</strong><p>The untouched holdout remained unopened because there was no surviving family to validate.</p></article>
                </div>
                <p className="research-principle">RHEN did not loosen the predefined gates or keep tuning the rejected lane until a winner appeared.</p>
              </motion.div>
            )}

            {tab === "evidence" && (
              <motion.div className="workspace-view story-view" key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">EVIDENCE PIPELINE</span><h2>The durable evidence layers are active.</h2></div>
                  <p>These are availability/completeness facts, not claims that the current live strategy has a proven edge.</p>
                </div>
                <div className="evidence-summary-grid">
                  <article><span>CANONICAL TELEMETRY</span><strong>AVAILABLE</strong><p>Scan cycles, candidate evaluations, signals, intents, broker events, positions, exits, incidents, and provenance are durable.</p></article>
                  <article><span>CANDIDATE OUTCOMES</span><strong>AVAILABLE</strong><p>5m: {outcomeSummary(outcomes, 5)} · 15m: {outcomeSummary(outcomes, 15)} · 30m: {outcomeSummary(outcomes, 30)} · 60m: {outcomeSummary(outcomes, 60)}.</p></article>
                  <article><span>LIVE VS. OFFLINE</span><strong>{comparisonCount} EVENTS</strong><p>{unreconstructable} are explicitly unreconstructable with the retained historical decision-time inputs. The comparison layer remains analytics-only.</p></article>
                  <article><span>DAILY REPORT</span><strong>{research?.latest_daily?.session || "UNAVAILABLE"}</strong><p>{research?.latest_daily?.classification || "No classification recorded."} · canonical session reporting is active.</p></article>
                  <article><span>WEEKLY REPORT</span><strong>{weekly?.completeness_state || "UNAVAILABLE"}</strong><p>{weekly?.report_version || "No version"} · {weekly?.included_session_count ?? 0} included / {weekly?.expected_session_count ?? 0} expected sessions.</p></article>
                  <article><span>ANALYTICS BOUNDARY</span><strong>READ ONLY</strong><p>Forward outcomes and replay cannot alter the live decision that created the evidence.</p></article>
                </div>
              </motion.div>
            )}

            {tab === "questions" && (
              <motion.div className="workspace-view story-view" key="questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">ACTIVE QUESTIONS</span><h2>Questions are not conclusions.</h2></div>
                  <p>The queue below comes from canonical weekly research-question records and updates without a frontend rewrite.</p>
                </div>
                <div className="research-question-list">
                  {questions.length ? questions.map((question) => (
                    <article key={question.research_question_id || question.question}>
                      <span>{question.status || "MONITOR"}</span>
                      <div><strong>{question.question || "Untitled question"}</strong><p>{question.why_it_matters || "No rationale recorded."}</p></div>
                      <b>{question.sample_size ?? "—"} OBS</b>
                    </article>
                  )) : <div className="command-empty">No active research questions are currently recorded.</div>}
                </div>
              </motion.div>
            )}

            {tab === "limits" && (
              <motion.div className="workspace-view story-view" key="limits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">CURRENT LIMITATIONS</span><h2>Incomplete evidence stays visible.</h2></div>
                  <p>A limitation is not repaired by omitting it from the page.</p>
                </div>
                <div className="research-limitation-list">
                  {weekly?.completeness_state && (
                    <article><span>WEEKLY COVERAGE</span><strong>{weekly.completeness_state}</strong><p>{weekly.included_session_count ?? 0} of {weekly.expected_session_count ?? 0} expected sessions have canonical daily reports for the latest week.</p></article>
                  )}
                  {limitations.map((limitation, index) => (
                    <article key={limitation}><span>LIMIT {String(index + 1).padStart(2, "0")}</span><strong>Evidence boundary</strong><p>{limitation}</p></article>
                  ))}
                  {!limitations.length && !weekly?.completeness_state ? <div className="command-empty">No sanitized limitation record is currently available.</div> : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
