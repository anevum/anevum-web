import { Link } from "react-router-dom";
import { fieldNotes } from "../data/fieldNotes";
import { useLiveTrading } from "../hooks/useLiveTrading";

const programs = [
  ["GRAEN","Mathematical validation","Selection bias, multiplicity, dependence, falsification, simulation design, and promotion methodology.","/products/graen"],
  ["NOSTRA","Forecasting","Regime inference, prediction state, forward horizons, uncertainty, post-event outcomes, and calibration.","/products/nostra"],
  ["VELUM","Replay & counterfactual","Historical reconstruction, broker-isolated replay, friction assumptions, counterfactual comparison, and failure analysis.","/products/velum"],
  ["RHEN","Market evidence","Candidate outcomes, execution evidence, strategy research, adaptive validation, and live/offline comparison.","/products/rhen"]
];

export default function ResearchHub() {
  const { data, loading, error } = useLiveTrading(10000);
  const research = data?.research;
  const decisions = research?.completed_decisions || [];
  const questions = research?.active_questions || [];
  const outcomes = research?.evidence?.candidate_forward_outcomes || [];
  const outcomeCount = outcomes.reduce((sum, row) => sum + Number(row.count || 0), 0);

  return (
    <div className="company-page research-hub field-notes-page">
      <section className="company-page-hero field-notes-hero">
        <span>FIELD NOTES / PUBLIC ENGINEERING RECORD</span>
        <h1>Building in public, including the parts that fail.</h1>
        <p>Progress reports, architecture changes, research results, releases, failures, and operating lessons from ANEVUM. Formal evidence remains distinct from narrative updates.</p>
        <div className="field-notes-hero-links"><Link to="/case-studies">Case Studies →</Link><Link to="/architecture">System Architecture →</Link><Link to="/performance">Live Evidence →</Link></div>
      </section>

      <section className="company-section no-top-border">
        <header className="company-section-head"><span>LATEST NOTES</span><h2>Development record.</h2><p>Chronological notes about work actually performed on the systems.</p></header>
        <div className="field-note-index">
          {fieldNotes.map((note, index) => (
            <Link key={note.slug} to={"/research/" + note.slug}>
              <span className="field-note-index-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="field-note-index-copy">
                <header><span>{note.date}</span><b>{note.type}</b><i>{note.status}</i></header>
                <strong>{note.title}</strong>
                <p>{note.summary}</p>
              </div>
              <div className="field-note-index-systems">{note.systems.map((system) => <span key={system}>{system}</span>)}</div>
              <i className="field-note-index-arrow">↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>RESEARCH PROGRAMS</span><h2>Where formal evidence is produced.</h2><p>Field Notes explain the work. These programs own the underlying research roles and boundaries.</p></header>
        <div className="research-program-grid">
          {programs.map(([name,category,description,href]) => <Link key={name} to={href}><span>{category}</span><strong>{name}</strong><p>{description}</p><i>OPEN ↗</i></Link>)}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>CANONICAL STATE</span><h2>Current research evidence.</h2><p>{error || (loading ? "Loading sanitized research state…" : "Read from the durable public research evidence surface.")}</p></header>
        <div className="company-proof-grid">
          <article><span>STATUS</span><strong>{research?.current_status || "UNAVAILABLE"}</strong><p>{research?.current_focus || "No current public focus is recorded."}</p></article>
          <article><span>FORWARD OUTCOMES</span><strong>{outcomeCount || "—"}</strong><p>Recorded candidate-outcome rows across published horizons and statuses.</p></article>
          <article><span>ACTIVE QUESTIONS</span><strong>{questions.length}</strong><p>Questions remain questions until evidence and methodology support a conclusion.</p></article>
          <article><span>DURABLE DECISIONS</span><strong>{decisions.length}</strong><p>Sanitized research decisions retained in the current public feed.</p></article>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>EVIDENCE GATES</span><h2>Research does not silently become production.</h2></header>
        <div className="research-ladder">{["QUESTION","HYPOTHESIS","DEVELOPMENT","VALIDATION","PROMOTION REVIEW","LIVE MEASUREMENT"].map((item,index) => <div key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong></div>)}</div>
        <div className="research-boundary-copy"><p>Passing one stage does not grant authority in the next. Research may support a proposal; live behavior changes only through explicit production controls.</p><Link to="/products/graen">GRAEN methodology →</Link></div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>RECENT CANONICAL DECISIONS</span><h2>Conclusions retained as evidence.</h2></header>
        <div className="research-decision-list">
          {decisions.length ? decisions.slice(0,6).map((decision,index) => <article key={decision.decision_key || String(index)}><span>{String(decision.status || "RECORDED").replaceAll("_"," ")}</span><div><strong>{decision.subject || "Research decision"}</strong><p>{decision.conclusion || "No public conclusion recorded."}</p></div><b>{decision.methodology_version || "CANONICAL"}</b></article>) : <div className="research-empty">No sanitized durable decisions are currently available.</div>}
        </div>
      </section>
    </div>
  );
}
