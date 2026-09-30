import { Link, Navigate, useParams } from "react-router-dom";
import { fieldNoteBySlug, fieldNoteReadingMinutes } from "../data/fieldNotes";

function formatFieldNoteDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date + "T12:00:00"));
}

export default function FieldNoteDetail() {
  const { slug } = useParams();
  const note = fieldNoteBySlug(slug);
  if (!note) return <Navigate to="/research" replace />;

  const readingMinutes = fieldNoteReadingMinutes(note);

  return (
    <div className="company-page field-note-detail field-note-detail-v2">
      <section className="field-note-hero field-note-hero-v2">
        <Link to="/research" className="field-note-back">← FIELD NOTES</Link>
        <div className="field-note-meta">
          <time>{formatFieldNoteDate(note.date)}</time>
          <span>{note.type}</span>
          <b>{note.status}</b>
          <span>{readingMinutes} MIN READ</span>
        </div>
        <h1>{note.title}</h1>
        <p className="field-note-dek">{note.summary}</p>
        <div className="field-note-byline">
          <span>ANEVUM FIELD NOTES</span>
          <p>Public development record · Evidence and limitations stated separately</p>
        </div>
      </section>

      <div className="field-note-layout">
        <article className="field-note-body field-note-body-v2">
          {note.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}

          <section className="field-note-reproducibility" id="reproduce">
            <header>
              <span>REPRODUCIBILITY</span>
              <h2>How to audit this note.</h2>
              <p>
                These checks describe the evidence needed to reproduce the public claim without
                exposing private execution credentials or protected operator state.
              </p>
            </header>
            <div className="field-note-repro-grid">
              <div>
                <span>INPUTS</span>
                <ol>
                  {note.reproducibility.inputs.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
              <div>
                <span>PROCEDURE</span>
                <ol>
                  {note.reproducibility.procedure.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
              <div>
                <span>EXPECTED RESULT</span>
                <ol>
                  {note.reproducibility.expected.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
            </div>
          </section>
        </article>

        <aside className="field-note-sidebar" aria-label="Field note facts">
          <div className="field-note-sidebar-card">
            <span>AT A GLANCE</span>
            <dl>
              <div><dt>Published</dt><dd>{formatFieldNoteDate(note.date)}</dd></div>
              <div><dt>Record</dt><dd>{note.type}</dd></div>
              <div><dt>Status</dt><dd>{note.status}</dd></div>
              <div><dt>Evidence basis</dt><dd>{note.evidenceBasis}</dd></div>
            </dl>
          </div>

          <div className="field-note-sidebar-card">
            <span>SYSTEMS</span>
            <div className="field-note-systems">
              {note.systems.map((system) => <span key={system}>{system}</span>)}
            </div>
          </div>

          <div className="field-note-sidebar-card field-note-limitations">
            <span>LIMITATIONS</span>
            <ul>
              {note.limitations.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <a href="#reproduce" className="field-note-audit-link">Jump to reproducibility ↓</a>
        </aside>
      </div>

      <section className="field-note-footer field-note-footer-v2">
        <div>
          <span>PUBLIC DEVELOPMENT RECORD</span>
          <p>Field Notes document current work, decisions, failures, and system changes. They do not replace formal validation evidence or broker-derived live performance records.</p>
        </div>
        <Link to="/research">Return to Field Notes →</Link>
      </section>
    </div>
  );
}
