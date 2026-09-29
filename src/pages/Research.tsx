import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { RhenSectionLabel } from "../components/RhenMark";
import { useLiveTrading } from "../hooks/useLiveTrading";

type ResearchTab = "state" | "completed" | "evidence" | "questions" | "limits";

const tabs: [ResearchTab, string, string][] = [
  ["state", "Current state", "Today and tomorrow"],
  ["completed", "Decisions", "What research concluded"],
  ["evidence", "Evidence", "What exists now"],
  ["questions", "Questions", "What is monitored"],
  ["limits", "Limitations", "What we cannot claim"]
];

function human(value?: string | null) {
  return String(value || "unrecorded").replaceAll("_", " ");
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
  const decisions = research?.completed_decisions || [];
  const daily = research?.latest_daily;
  const ads = daily?.ads002;
  const weekly = research?.latest_weekly_summary;
  const outcomes = research?.evidence?.candidate_forward_outcomes;
  const comparisons = research?.evidence?.live_offline_comparison || [];
  const comparisonCount = comparisons.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const unreconstructable = comparisons
    .filter((row) => String(row.match_state).toUpperCase() === "UNRECONSTRUCTABLE")
    .reduce((sum, row) => sum + Number(row.count || 0), 0);
  const questions = research?.active_questions || [];
  const limitations = research?.limitations || [];
  const strategyUnchanged = ads ? ads.live_configuration_changed !== true : true;

  return (
    <section className="compact-page workspace-screen story-workspace research-story">
      <header className="workspace-heading story-heading">
        <div>
          <RhenSectionLabel context="RESEARCH" />
          <h1>Research</h1>
          <p className="story-heading-copy">
            RHEN publishes what the evidence supports, what it does not support, and what happens next. Research remains separate from live execution until its gates are met.
          </p>
        </div>
        <div className="workspace-heading-status story-status">
          <div><small>LIVE</small><strong>{data?.active_strategy?.version_id || "UNRECORDED"}</strong></div>
          <div><small>TODAY</small><strong>{daily?.classification || human(research?.current_status).toUpperCase()}</strong></div>
          <div><small>ADS-002</small><strong>{ads?.readiness_state || "UNRECORDED"}</strong></div>
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
                  <div><span className="story-kicker">SEPTEMBER 28 / POST-CLOSE</span><h2>Tomorrow stays unchanged until the evidence earns a change.</h2></div>
                  <p>{error || (loading ? "Loading canonical public research state…" : daily?.summary || "Derived from sanitized durable research decisions and report metadata.")}</p>
                </div>
                <div className="rhen-state-grid">
                  <article className="state-live"><span>LIVE STRATEGY</span><strong>{strategyUnchanged ? "UNCHANGED" : "UPDATED"}</strong><p>{data?.active_strategy?.strategy_name || "Current production strategy"} remains the authorized live strategy for the next session.</p></article>
                  <article className="state-research"><span>DAILY REVIEW</span><strong>{daily?.classification || "UNRECORDED"}</strong><p>{daily?.summary || "No daily summary is currently available."}</p></article>
                  <article className="state-rejected"><span>ADS-002</span><strong>{ads?.readiness_state || "RESEARCH ONLY"}</strong><p>{ads?.data_valid ? "Attribution data passed the current validity gate." : "Attribution integrity is not yet sufficient to interpret candidate-score performance."}</p></article>
                  <article className="state-next"><span>NEXT ACTION</span><strong>ATTRIBUTION INTEGRITY</strong><p>{daily?.next_action || next?.conclusion || "Continue evidence collection without changing live production."}</p></article>
                </div>
                <div className="research-status-strip">
                  <span>{strategyUnchanged ? "LIVE CONFIG UNCHANGED" : "LIVE CONFIG UPDATED"}</span>
                  <span>{ads?.promotion_authorized ? "PROMOTION AUTHORIZED" : "NO PROMOTION"}</span>
                  <span>CONFIDENCE {ads?.confidence_score ?? "—"}</span>
                  <span>{daily?.session || "LATEST SESSION"}</span>
                </div>
              </motion.div>
            )}

            {tab === "completed" && (
              <motion.div className="workspace-view story-view" key="completed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">DURABLE RESEARCH DECISIONS</span><h2>Conclusions remain visible after the experiment ends.</h2></div>
                  <p>Accepted directions, rejected lanes, and methodology decisions are preserved rather than rewritten after the fact.</p>
                </div>
                <div className="research-question-list">
                  {decisions.length ? decisions.map((decision, index) => (
                    <article key={decision.decision_key || String(index)}>
                      <span>{human(decision.decision_type).toUpperCase()}</span>
                      <div><strong>{decision.subject || "Research decision"}</strong><p>{decision.conclusion || "No public conclusion recorded."}</p></div>
                      <b>{decision.methodology_version || decision.status || "RECORDED"}</b>
                    </article>
                  )) : <div className="command-empty">No durable public research decisions are currently available.</div>}
                </div>
                <p className="research-principle">A research direction may be accepted without authorizing a live strategy change. Production promotion remains a separate, explicit decision.</p>
              </motion.div>
            )}

            {tab === "evidence" && (
              <motion.div className="workspace-view story-view" key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">EVIDENCE PIPELINE</span><h2>The durable evidence layers are active.</h2></div>
                  <p>Availability and completeness are not the same thing as proof of a production edge.</p>
                </div>
                <div className="evidence-summary-grid">
                  <article><span>CANONICAL TELEMETRY</span><strong>AVAILABLE</strong><p>Scan cycles, candidate evaluations, signals, intents, broker events, positions, exits, incidents, and provenance are durable.</p></article>
                  <article><span>CANDIDATE OUTCOMES</span><strong>AVAILABLE</strong><p>5m: {outcomeSummary(outcomes, 5)} · 15m: {outcomeSummary(outcomes, 15)} · 30m: {outcomeSummary(outcomes, 30)} · 60m: {outcomeSummary(outcomes, 60)}.</p></article>
                  <article><span>LIVE VS. OFFLINE</span><strong>{comparisonCount} EVENTS</strong><p>{unreconstructable} are explicitly unreconstructable with retained historical decision-time inputs. The comparison layer remains analytics-only.</p></article>
                  <article><span>ADS ATTRIBUTION</span><strong>{ads?.direct_signals ?? 0} / {ads?.executable_signals ?? 0} DIRECT</strong><p>{ads?.unlinked_signals ?? 0} executable signal(s) are currently unlinked for this research methodology; score interpretation therefore remains blocked.</p></article>
                  <article><span>DAILY REPORT</span><strong>{daily?.session || "UNAVAILABLE"}</strong><p>{daily?.classification || "No classification recorded."} · canonical post-close reporting is active.</p></article>
                  <article><span>ANALYTICS BOUNDARY</span><strong>READ ONLY</strong><p>Forward outcomes, ADS scoring, replay, and reports cannot retroactively alter the live decision that generated the evidence.</p></article>
                </div>
              </motion.div>
            )}

            {tab === "questions" && (
              <motion.div className="workspace-view story-view" key="questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">ACTIVE QUESTIONS</span><h2>Questions are not conclusions.</h2></div>
                  <p>The queue below comes from canonical research-question records and updates without a frontend rewrite.</p>
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
                  {ads?.reason_codes?.length ? (
                    <article><span>ADS-002 GATES</span><strong>{ads.readiness_state || "RESEARCH ONLY"}</strong><p>{ads.reason_codes.map(human).join(" · ")}</p></article>
                  ) : null}
                  {weekly?.completeness_state && (
                    <article><span>WEEKLY COVERAGE</span><strong>{weekly.completeness_state}</strong><p>{weekly.included_session_count ?? 0} of {weekly.expected_session_count ?? 0} expected sessions have canonical daily reports for the latest week.</p></article>
                  )}
                  {limitations.map((limitation, index) => (
                    <article key={limitation}><span>LIMIT {String(index + 1).padStart(2, "0")}</span><strong>Evidence boundary</strong><p>{limitation}</p></article>
                  ))}
                  {!limitations.length && !weekly?.completeness_state && !ads?.reason_codes?.length ? <div className="command-empty">No sanitized limitation record is currently available.</div> : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
