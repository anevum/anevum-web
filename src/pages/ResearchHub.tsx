import { Link } from "react-router-dom";
import SystemIcon, { SystemChip } from "../components/company/SystemIcon";
import type { SystemName } from "../components/company/SystemMark";
import { fieldNotes } from "../data/fieldNotes";
import { useLiveTrading } from "../hooks/useLiveTrading";

const programs: { name: SystemName; category: string; description: string; href: string }[] = [
  { name:"GRAEN", category:"Mathematical validation", description:"Selection bias, multiplicity, dependence, falsification, simulation design, and promotion methodology.", href:"/products/graen" },
  { name:"NOSTRA", category:"Forecasting", description:"Regime inference, prediction state, forward horizons, uncertainty, post-event outcomes, and calibration.", href:"/products/nostra" },
  { name:"VELUM", category:"Replay & counterfactual", description:"Historical reconstruction, broker-isolated replay, friction assumptions, counterfactual comparison, and failure analysis.", href:"/products/velum" },
  { name:"RHEN", category:"Market evidence", description:"Candidate outcomes, execution evidence, strategy research, adaptive validation, and live/offline comparison.", href:"/products/rhen" }
];

export default function ResearchHub() {
  const { data, loading, error } = useLiveTrading(10000);
  const research = data?.research;
  const decisions = research?.completed_decisions || [];
  const questions = research?.active_questions || [];
  const outcomes = research?.evidence?.candidate_forward_outcomes || [];
  const outcomeCount = outcomes.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const [lead, ...rest] = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date));
  const leadSystems = lead?.systems || [];

  return (
    <div className="company-page research-hub field-notes-page">
      <section className="company-page-hero field-notes-hero field-notes-hero-editorial">
        <div>
          <span>FIELD NOTES / PUBLIC ENGINEERING RECORD</span>
          <h1>What ANEVUM is learning while it is being built.</h1>
          <p>Engineering changes, research results, failures, and operating lessons—written to be readable first and reproducible when the detail matters.</p>
        </div>
        <div className="field-notes-hero-links">
          <Link to="/case-studies">Case Studies →</Link>
          <Link to="/architecture">Architecture →</Link>
          <Link to="/performance">Live Evidence →</Link>
        </div>
      </section>

      {lead ? (
        <section className="company-section no-top-border field-notes-lead-section">
          <Link to={"/research/" + lead.slug} className="field-notes-lead">
            <div className="field-notes-lead-art" aria-hidden="true">
              <div className="field-notes-lead-icons">
                {leadSystems.slice(0,4).map((system, index) => (
                  <SystemIcon key={system} system={system} size={index === 0 ? "lg" : "md"} />
                ))}
              </div>
              <span>{lead.type}</span>
            </div>
            <div className="field-notes-lead-copy">
              <header>
                <span>LATEST FIELD NOTE</span>
                <time>{lead.date}</time>
              </header>
              <h2>{lead.title}</h2>
              <p>{lead.summary}</p>
              <div className="field-notes-lead-meta">
                <span>{lead.readMinutes} MIN READ</span>
                <span>{lead.status}</span>
              </div>
              <div className="field-notes-lead-systems">
                {leadSystems.map((system) => <SystemChip key={system} system={system} />)}
              </div>
              <strong>READ THE NOTE →</strong>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="company-section field-notes-stream-section">
        <header className="company-section-head field-notes-section-head">
          <span>RECENT</span>
          <h2>Development journal.</h2>
          <p>A chronological reading stream, not an archive cabinet. Open a note for the full narrative and its reproduction packet.</p>
        </header>
        <div className="field-notes-stream">
          {rest.map((note) => (
            <Link key={note.slug} to={"/research/" + note.slug} className="field-notes-story">
              <div className="field-notes-story-icon">
                <SystemIcon system={note.systems[0]} size="md" />
              </div>
              <div className="field-notes-story-copy">
                <header>
                  <time>{note.date}</time>
                  <span>{note.type}</span>
                  <i>{note.status}</i>
                </header>
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
                <footer>
                  <span>{note.readMinutes} MIN READ</span>
                  <span>{note.systems.length} SYSTEM{note.systems.length === 1 ? "" : "S"}</span>
                </footer>
              </div>
              <div className="field-notes-story-systems">
                {note.systems.map((system) => <SystemIcon key={system} system={system} size="xs" />)}
              </div>
              <span className="field-notes-story-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section field-notes-pulse">
        <header className="company-section-head">
          <span>RESEARCH PULSE</span>
          <h2>What the evidence surface says now.</h2>
          <p>{error || (loading ? "Loading sanitized research state…" : "A compact public-safe snapshot from the durable research surface.")}</p>
        </header>
        <div className="field-notes-pulse-grid">
          <article>
            <SystemIcon system="GRAEN" size="sm" />
            <div><span>STATUS</span><strong>{research?.current_status || "UNAVAILABLE"}</strong><p>{research?.current_focus || "No current public focus is recorded."}</p></div>
          </article>
          <article>
            <SystemIcon system="NOSTRA" size="sm" />
            <div><span>FORWARD OUTCOMES</span><strong>{outcomeCount || "—"}</strong><p>Recorded candidate-outcome rows across published horizons.</p></div>
          </article>
          <article>
            <SystemIcon system="GRAEN" size="sm" />
            <div><span>ACTIVE QUESTIONS</span><strong>{questions.length}</strong><p>Questions remain questions until methodology and evidence support a conclusion.</p></div>
          </article>
          <article>
            <SystemIcon system="IREN" size="sm" />
            <div><span>DURABLE DECISIONS</span><strong>{decisions.length}</strong><p>Sanitized conclusions retained in canonical state.</p></div>
          </article>
        </div>
      </section>

      <section className="company-section field-notes-programs-section">
        <header className="company-section-head">
          <span>RESEARCH PROGRAMS</span>
          <h2>Follow the system behind the note.</h2>
          <p>Field Notes explain the work. These systems own the underlying research, forecasting, replay, and market evidence.</p>
        </header>
        <div className="research-program-grid research-program-grid-icons">
          {programs.map((program) => (
            <Link key={program.name} to={program.href} className={"research-program-card program-" + program.name.toLowerCase()}>
              <SystemIcon system={program.name} size="lg" />
              <span>{program.category}</span>
              <strong>{program.name}</strong>
              <p>{program.description}</p>
              <i>OPEN SYSTEM ↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section field-notes-method-section">
        <div className="field-notes-method-copy">
          <span>HOW TO READ THESE</span>
          <h2>Narrative first. Reproduction detail on demand.</h2>
          <p>Each Field Note separates the readable account from the procedure needed to reproduce or challenge it. That keeps the journal approachable without hiding methodology, checks, assumptions, or limitations.</p>
        </div>
        <div className="field-notes-method-flow" aria-label="Field Note structure">
          {["READ","INSPECT","REPRODUCE","CHALLENGE"].map((item, index) => (
            <div key={item}><span>{String(index + 1).padStart(2,"0")}</span><strong>{item}</strong></div>
          ))}
        </div>
      </section>
    </div>
  );
}
