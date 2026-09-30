import { Link, Navigate, useParams } from "react-router-dom";
import SystemIcon, { SystemChip } from "../components/company/SystemIcon";
import { fieldNoteBySlug } from "../data/fieldNotes";

export default function FieldNoteDetail() {
  const { slug } = useParams();
  const note = fieldNoteBySlug(slug);
  if (!note) return <Navigate to="/research" replace />;

  return (
    <div className="company-page field-note-detail field-note-detail-editorial">
      <section className="field-note-hero field-note-hero-editorial">
        <Link to="/research" className="field-note-back">← FIELD NOTES</Link>
        <div className="field-note-hero-grid">
          <div className="field-note-hero-copy">
            <div className="field-note-meta">
              <span>{note.date}</span>
              <span>{note.type}</span>
              <span>{note.readMinutes} MIN READ</span>
              <b>{note.status}</b>
            </div>
            <h1>{note.title}</h1>
            <p>{note.summary}</p>
            <div className="field-note-systems">
              {note.systems.map((system) => <SystemChip key={system} system={system} />)}
            </div>
          </div>
          <aside className="field-note-hero-icon" aria-label={"Primary system: " + note.systems[0]}>
            <SystemIcon system={note.systems[0]} size="lg" />
            <span>PRIMARY SYSTEM</span>
            <strong>{note.systems[0]}</strong>
          </aside>
        </div>
      </section>

      <main className="field-note-reading">
        <section className="field-note-body field-note-body-editorial">
          {note.sections.map((section, index) => (
            <article key={section.heading}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{section.heading}</h2>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </article>
          ))}
        </section>

        <aside className="field-note-reading-rail">
          <div className="field-note-rail-card">
            <span>AT A GLANCE</span>
            <strong>{note.type}</strong>
            <p>{note.status}</p>
            <div>{note.systems.map((system) => <SystemIcon key={system} system={system} size="xs" />)}</div>
          </div>
          <div className="field-note-rail-card">
            <span>REPRODUCIBILITY</span>
            <strong>Procedure included</strong>
            <p>Inputs, method, checks, expected result, and limitations are retained below.</p>
          </div>
        </aside>
      </main>

      <section className="field-note-reproduce-wrap">
        <details className="field-note-reproduce">
          <summary>
            <div>
              <span>REPRODUCE / CHALLENGE THIS NOTE</span>
              <strong>Open the complete method</strong>
            </div>
            <i aria-hidden="true">+</i>
          </summary>
          <div className="field-note-reproduce-body">
            <div className="reproduce-question">
              <span>QUESTION</span>
              <h2>{note.reproduce.question}</h2>
            </div>

            <div className="reproduce-grid">
              <section>
                <span>INPUTS</span>
                <ul>{note.reproduce.inputs.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section>
                <span>METHOD</span>
                <ol>{note.reproduce.method.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>
              <section>
                <span>CHECKS</span>
                <ul>{note.reproduce.checks.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section>
                <span>EXPECTED RESULT</span>
                <p>{note.reproduce.expected}</p>
              </section>
              <section className="reproduce-limits">
                <span>LIMITS</span>
                <ul>{note.reproduce.limits.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            </div>
          </div>
        </details>
      </section>

      <section className="field-note-footer field-note-footer-editorial">
        <div>
          <span>PUBLIC ENGINEERING RECORD</span>
          <p>Field Notes document current work and its reproducibility context. Formal validation evidence and broker-derived live performance remain separate records.</p>
        </div>
        <Link to="/research">Return to Field Notes →</Link>
      </section>
    </div>
  );
}
