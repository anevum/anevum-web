import { Link } from "react-router-dom";
import { RhenRhenSystemChip, RhenSystemGlyph } from "../components/company/RhenModuleGlyph";
import type { SystemName } from "../components/company/SystemMark";
import { fieldNotes } from "../data/fieldNotes";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { ageText, displayState, publicSystem } from "../lib/system-display";

const programs: { name: SystemName; category: string; description: string; href: string }[] = [
  { name:"GRAEN", category:"Strategy discovery", description:"Bounded candidate generation, chronological development/validation/holdout evidence, multiplicity control, falsification, and paper-only promotion.", href:"/architecture" },
  { name:"NOSTRA", category:"Forecasting", description:"Regime inference, prediction state, forward horizons, uncertainty, post-event outcomes, and calibration without execution authority.", href:"/architecture" },
  { name:"VELUM", category:"Independent verification", description:"Broker-isolated replay, LOW/BASE/HIGH friction stress, execution-delay stress, counterfactual comparison, and failure analysis.", href:"/architecture" },
  { name:"RHEN", category:"Execution evidence", description:"Market observations, live and paper lane evidence, reconciliation, candidate outcomes, and normalized production records.", href:"/live" }
];

export default function ResearchHub() {
  const { data, loading, error, now } = useLiveTrading(10000);
  const research = data?.research;
  const decisions = research?.completed_decisions || [];
  const questions = research?.active_questions || [];
  const outcomes = research?.evidence?.candidate_forward_outcomes || [];
  const outcomeCount = outcomes.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const [lead, ...rest] = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date));
  const leadSystems = lead?.systems || [];
  const graen = publicSystem("GRAEN", data, now, Boolean(error));
  const velum = publicSystem("VELUM", data, now, Boolean(error));
  const rhen = publicSystem("RHEN", data, now, Boolean(error));
  const validation = data?.crypto_shadow_validation;
  const activeStrategy = data?.active_strategy?.version_id || data?.active_strategy?.strategy_name || "UNAVAILABLE";

  return (
    <div className="company-page research-hub field-notes-page">
      <section className="company-page-hero field-notes-hero field-notes-hero-editorial">
        <div>
          <span>FIELD NOTES / PUBLIC ENGINEERING RECORD</span>
          <h1>What ANEVUM is learning while it is being built.</h1>
          <p>Engineering changes, research results, rejected hypotheses, and operating lessons—written to be readable first and reproducible when the detail matters. Research can earn forward-paper status, but it cannot silently become live execution authority.</p>
        </div>
        <div className="field-notes-hero-links">
          <Link to="/live">Live Evidence →</Link>
          <Link to="/architecture">Architecture →</Link>
          <Link to="/releases">Releases →</Link>
        </div>
      </section>

      <section className="company-section no-top-border field-notes-live-state" aria-label="Current public research evidence">
        <header className="company-section-head field-notes-live-head">
          <span>CURRENT RESEARCH</span>
          <h2>What the research system is doing now.</h2>
          <p>
            Live, sanitized evidence from RHEN. GRAEN research and VELUM replay are observable here,
            while candidate parameters and protected operator controls remain private.
          </p>
        </header>

        <div className="research-live-shell">
          <article className="research-live-primary">
            <header>
              <div className="research-live-identity">
                <RhenSystemGlyph system="GRAEN" size="md" />
                <div>
                  <span>GRAEN / CURRENT FOCUS</span>
                  <strong>{displayState(research?.current_status || graen.activityState)}</strong>
                </div>
              </div>
              <small>{ageText(research?.last_updated_at || graen.observedAt, now)}</small>
            </header>

            <h3>{research?.current_focus || "No current public research focus is recorded."}</h3>
            <p>{graen.activity}</p>

            <div className="research-live-metrics">
              <div><span>ACTIVE QUESTIONS</span><strong>{questions.length}</strong></div>
              <div><span>DURABLE DECISIONS</span><strong>{decisions.length}</strong></div>
              <div><span>FORWARD OUTCOMES</span><strong>{outcomeCount || "—"}</strong></div>
              <div><span>NEXT DIRECTION</span><strong>{research?.next_direction?.subject || "NOT RECORDED"}</strong></div>
            </div>
          </article>

          <div className="research-live-secondary">
            <article>
              <header><RhenSystemGlyph system="VELUM" size="sm" /><span>VELUM / VERIFICATION</span></header>
              <strong>{displayState(velum.activityState)}</strong>
              <p>{velum.activity}</p>
            </article>

            <article>
              <header><RhenSystemGlyph system="GRAEN" size="sm" /><span>PUBLISHED VALIDATION SAMPLE</span></header>
              <strong>{displayState(validation?.status)}</strong>
              <div className="research-validation-progress">
                <div>
                  <span>Completed exits</span>
                  <b>{validation?.counts?.exits ?? "—"}</b>
                  <small>{validation?.progress?.completed_trades_pct == null ? "No progress reported" : validation.progress.completed_trades_pct.toFixed(1) + "% of public target"}</small>
                </div>
                <div>
                  <span>Independent days</span>
                  <b>{validation?.counts?.independent_day_blocks ?? "—"}</b>
                  <small>{validation?.progress?.independent_days_pct == null ? "No progress reported" : validation.progress.independent_days_pct.toFixed(1) + "% of public target"}</small>
                </div>
              </div>
            </article>

            <article className="research-authority-card">
              <header><RhenSystemGlyph system="RHEN" size="sm" /><span>PRODUCTION AUTHORITY</span></header>
              <strong>{activeStrategy}</strong>
              <p>{rhen.activity}</p>
              <small>Research and replay cannot automatically replace the production strategy or grant live broker authority.</small>
            </article>
          </div>
        </div>
      </section>

      {lead ? (
        <section className="company-section no-top-border field-notes-lead-section">
          <Link to={"/research/" + lead.slug} className="field-notes-lead">
            <div className="field-notes-lead-art" aria-hidden="true">
              <div className="field-notes-lead-icons">
                {leadSystems.slice(0,4).map((system, index) => (
                  <RhenSystemGlyph key={system} system={system} size={index === 0 ? "lg" : "md"} />
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
                {leadSystems.map((system) => <RhenSystemChip key={system} system={system} />)}
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
                <RhenSystemGlyph system={note.systems[0]} size="md" />
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
                {note.systems.map((system) => <RhenSystemGlyph key={system} system={system} size="xs" />)}
              </div>
              <span className="field-notes-story-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section field-notes-programs-section">
        <header className="company-section-head">
          <span>RESEARCH PROGRAMS</span>
          <h2>Follow the system behind the note.</h2>
          <p>Field Notes explain the work. GRAEN discovers and challenges candidates, VELUM verifies them independently, NOSTRA measures forecast state, and RHEN owns execution evidence. Candidate-stage details remain private until they have a deliberately sanitized public projection.</p>
        </header>
        <div className="research-program-grid research-program-grid-icons">
          {programs.map((program) => (
            <Link key={program.name} to={program.href} className={"research-program-card program-" + program.name.toLowerCase()}>
              <RhenSystemGlyph system={program.name} size="lg" />
              <span>{program.category}</span>
              <strong>{program.name}</strong>
              <p>{program.description}</p>
              <i>OPEN MODULE ↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section field-notes-method-section">
        <div className="field-notes-method-copy">
          <span>HOW TO READ THESE</span>
          <h2>Narrative first. Evidence before promotion.</h2>
          <p>Each Field Note separates the readable account from the procedure needed to reproduce or challenge it. The canonical BTC path is bounded research → chronological validation → independent VELUM replay → forward paper → ELIGIBLE_FOR_REVIEW. No automated research state grants live authority.</p>
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
