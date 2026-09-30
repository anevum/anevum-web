import { Link } from "react-router-dom";
import SystemIcon, { SystemChip } from "../components/company/SystemIcon";
import type { SystemName } from "../components/company/SystemMark";
import { fieldNotes } from "../data/fieldNotes";
import { useLiveTrading } from "../hooks/useLiveTrading";

const programs: { name: SystemName; category: string; description: string; href: string }[] = [
  { name: "GRAEN", category: "Mathematical validation", description: "Falsification, dependence, multiplicity, robustness, and promotion methodology.", href: "/products/graen" },
  { name: "NOSTRA", category: "Forecasting", description: "Regime inference, forward horizons, uncertainty, outcomes, and calibration.", href: "/products/nostra" },
  { name: "VELUM", category: "Replay & counterfactual", description: "Historical reconstruction, simulation, friction assumptions, and failure analysis.", href: "/products/velum" },
  { name: "RHEN", category: "Market evidence", description: "Candidate outcomes, execution evidence, strategy research, and live/offline comparison.", href: "/products/rhen" }
];

export default function ResearchHub() {
  const { data, loading, error } = useLiveTrading(10000);
  const research = data?.research;
  const decisions = research?.completed_decisions || [];
  const questions = research?.active_questions || [];
  const outcomes = research?.evidence?.candidate_forward_outcomes || [];
  const outcomeCount = outcomes.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const [lead, ...rest] = fieldNotes;

  return (
    <div className="company-page research-hub field-notes-page field-notes-editorial">
      <section className="company-page-hero field-notes-hero editorial-hero">
        <div>
          <span>FIELD NOTES / ENGINEERING JOURNAL</span>
          <h1>The work, written to be understood and reproduced.</h1>
          <p>Architecture changes, research decisions, repairs, failures, and releases from ANEVUM. Each note keeps the narrative readable and the reproduction protocol explicit.</p>
        </div>
        <div className="editorial-hero-links">
          <Link to="/case-studies">Case Studies</Link>
          <Link to="/architecture">Architecture</Link>
          <Link to="/performance">Live Evidence</Link>
        </div>
      </section>

      <section className="company-section no-top-border editorial-lead-section">
        <header className="company-section-head compact-head">
          <span>LATEST</span>
          <h2>Current field note.</h2>
        </header>
        <Link className="field-note-lead" to={"/research/" + lead.slug}>
          <div className="field-note-lead-visual">
            <div className="field-note-lead-icons">
              {lead.systems.map((system) => <SystemIcon key={system} system={system} size="md" />)}
            </div>
            <span>{lead.type} / {lead.status}</span>
          </div>
          <div className="field-note-lead-copy">
            <div className="field-note-deck-meta"><time>{lead.date}</time><span>{lead.readMinutes} MIN READ</span></div>
            <h2>{lead.title}</h2>
            <p>{lead.summary}</p>
            <div className="field-note-chip-row">{lead.systems.map((system) => <SystemChip key={system} system={system} />)}</div>
            <strong>READ FIELD NOTE →</strong>
          </div>
        </Link>
      </section>

      <section className="company-section editorial-stream-section">
        <header className="company-section-head compact-head">
          <span>RECENT</span>
          <h2>Development record.</h2>
          <p>Written like a journal, not an archive browser. Open any note for the full method and reproduction checklist.</p>
        </header>
        <div className="field-note-stream">
          {rest.map((note) => (
            <Link key={note.slug} to={"/research/" + note.slug} className="field-note-story">
              <SystemIcon system={note.systems[0]} size="sm" />
              <div className="field-note-story-copy">
                <div className="field-note-deck-meta"><time>{note.date}</time><span>{note.type}</span><span>{note.readMinutes} MIN</span></div>
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
                <div className="field-note-chip-row">{note.systems.map((system) => <SystemChip key={system} system={system} />)}</div>
              </div>
              <div className="field-note-story-state"><span>{note.status}</span><i>↗</i></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section research-pulse-section">
        <header className="company-section-head compact-head">
          <span>RESEARCH PULSE</span>
          <h2>What the evidence says now.</h2>
          <p>{error || (loading ? "Loading sanitized research state…" : "A compact view of the durable public research surface.")}</p>
        </header>
        <div className="research-pulse-grid">
          <article><span>STATUS</span><strong>{research?.current_status || "UNAVAILABLE"}</strong><p>{research?.current_focus || "No public focus is recorded."}</p></article>
          <article><span>FORWARD OUTCOMES</span><strong>{outcomeCount || "—"}</strong><p>Published candidate-outcome rows.</p></article>
          <article><span>OPEN QUESTIONS</span><strong>{questions.length}</strong><p>Questions still awaiting sufficient evidence.</p></article>
          <article><span>DURABLE DECISIONS</span><strong>{decisions.length}</strong><p>Retained research conclusions and gate decisions.</p></article>
        </div>
      </section>

      <section className="company-section editorial-programs-section">
        <header className="company-section-head compact-head">
          <span>PROGRAMS</span>
          <h2>Where the formal work lives.</h2>
          <p>Field Notes explain the work. These systems own the underlying evidence roles and authority boundaries.</p>
        </header>
        <div className="research-program-grid research-program-grid-icons">
          {programs.map((program) => (
            <Link key={program.name} to={program.href}>
              <SystemIcon system={program.name} size="md" />
              <span>{program.category}</span>
              <strong>{program.name}</strong>
              <p>{program.description}</p>
              <i>OPEN SYSTEM ↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section editorial-method-section">
        <div className="editorial-method-card">
          <div>
            <span>METHOD</span>
            <h2>Evidence has to cross explicit gates.</h2>
            <p>A note can describe an idea, implementation, failure, or result. It does not silently turn research into production authority.</p>
          </div>
          <div className="research-ladder">
            {["QUESTION","HYPOTHESIS","DEVELOPMENT","VALIDATION","PROMOTION REVIEW","LIVE MEASUREMENT"].map((item,index) => <div key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong></div>)}
          </div>
          <Link to="/products/graen">Read the GRAEN methodology →</Link>
        </div>
      </section>
    </div>
  );
}
