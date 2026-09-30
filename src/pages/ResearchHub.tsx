import { Link } from "react-router-dom";
import { useLiveTrading } from "../hooks/useLiveTrading";

const programs = [
  ["GRAEN","Mathematical validation","Selection bias, multiplicity, dependence, falsification, simulation design, and promotion methodology.","/products/graen"],
  ["NOSTRA","Forecasting","Regime inference, prediction state, forward horizons, uncertainty, post-event outcomes, and calibration.","/products/nostra"],
  ["VELUM","Replay & counterfactual","Historical reconstruction, broker-isolated replay, friction assumptions, counterfactual comparison, and failure analysis.","/products/velum"],
  ["RHEN RESEARCH","Market evidence","Candidate outcomes, ADS shadow scoring, strategy research, adaptive shadow validation, and live/offline comparison.","/products/rhen"]
];

export default function ResearchHub() {
  const { data, loading, error } = useLiveTrading(10000);
  const research = data?.research;
  const decisions = research?.completed_decisions || [];
  const questions = research?.active_questions || [];
  const outcomes = research?.evidence?.candidate_forward_outcomes || [];
  const outcomeCount = outcomes.reduce((sum, row) => sum + Number(row.count || 0), 0);

  return (
    <div className="company-page research-hub">
      <section className="company-page-hero">
        <span>RESEARCH</span>
        <h1>Research that records what failed as carefully as what survived.</h1>
        <p>ANEVUM separates hypotheses, development evidence, validation, production authorization, and live measurement. The public surface exposes sanitized state without turning unfinished work into claims.</p>
      </section>

      <section className="company-section no-top-border">
        <div className="research-program-grid">
          {programs.map(([name,category,description,href]) => <Link key={name} to={href}><span>{category}</span><strong>{name}</strong><p>{description}</p><i>OPEN ↗</i></Link>)}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>CANONICAL STATE</span><h2>Current research evidence.</h2><p>{error || (loading ? "Loading sanitized research state…" : "Read from the same durable evidence surface used by the existing public research system.")}</p></header>
        <div className="company-proof-grid">
          <article><span>STATUS</span><strong>{research?.current_status || "UNAVAILABLE"}</strong><p>{research?.current_focus || "No current public focus is recorded."}</p></article>
          <article><span>FORWARD OUTCOMES</span><strong>{outcomeCount || "—"}</strong><p>Recorded candidate-outcome rows across published horizons and statuses.</p></article>
          <article><span>ACTIVE QUESTIONS</span><strong>{questions.length}</strong><p>Questions remain questions until evidence and methodology support a conclusion.</p></article>
          <article><span>DURABLE DECISIONS</span><strong>{decisions.length}</strong><p>Sanitized research decisions retained in the current public feed.</p></article>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>METHOD</span><h2>Evidence moves through gates.</h2></header>
        <div className="research-ladder">
          {["QUESTION","HYPOTHESIS","DEVELOPMENT","VALIDATION","PROMOTION REVIEW","LIVE MEASUREMENT"].map((item,index) => <div key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong></div>)}
        </div>
        <div className="research-boundary-copy">
          <p>Passing one stage does not silently grant authority in the next. Research may inform a proposal; live behavior changes only through explicit production controls.</p>
          <Link to="/products/graen">View GRAEN methodology →</Link>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>RECENT DECISIONS</span><h2>Recorded conclusions.</h2></header>
        <div className="research-decision-list">
          {decisions.length ? decisions.slice(0,6).map((decision,index) => (
            <article key={decision.decision_key || String(index)}>
              <span>{String(decision.status || "RECORDED").replaceAll("_"," ")}</span>
              <div><strong>{decision.subject || "Research decision"}</strong><p>{decision.conclusion || "No public conclusion recorded."}</p></div>
              <b>{decision.methodology_version || "CANONICAL"}</b>
            </article>
          )) : <div className="research-empty">No sanitized durable decisions are currently available.</div>}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>EPISTEMIC BOUNDARY</span><h2>What the site will not convert into a claim.</h2></header>
        <div className="boundary-grid">
          <article><strong>Conjecture ≠ proof</strong><p>Open mathematical ideas remain explicitly unproved.</p></article>
          <article><strong>Forecast ≠ certainty</strong><p>Predictions remain measurable probabilistic or descriptive research objects.</p></article>
          <article><strong>Replay ≠ live performance</strong><p>Simulation and counterfactual results are never merged into the live record.</p></article>
          <article><strong>Research ≠ authorization</strong><p>Research output does not bypass RHEN's live execution and risk boundaries.</p></article>
        </div>
      </section>
    </div>
  );
}
