import { Link, Navigate, useParams } from "react-router-dom";
import SystemIcon, { SystemChip } from "../components/company/SystemIcon";
import { fieldNoteBySlug } from "../data/fieldNotes";

function ReproductionGuide({ note }: { note: NonNullable<ReturnType<typeof fieldNoteBySlug>> }) {
  return (
    <details className="reproduction-guide" open>
      <summary>
        <span>REPRODUCE THIS WORK</span>
        <strong>{note.reproduce.question}</strong>
        <i>METHOD + CHECKS</i>
      </summary>
      <div className="reproduction-guide-grid">
        <section>
          <span>INPUTS</span>
          <ol>{note.reproduce.inputs.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
        <section>
          <span>METHOD</span>
          <ol>{note.reproduce.method.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
        <section>
          <span>VERIFY</span>
          <ol>{note.reproduce.checks.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
        <section className="reproduction-guide-outcome">
          <span>EXPECTED RESULT</span>
          <p>{note.reproduce.expected}</p>
          <span>LIMITS</span>
          <ul>{note.reproduce.limits.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>
    </details>
  );
}

export default function FieldNoteDetail() {
  const { slug } = useParams();
  const note = fieldNoteBySlug(slug);
  if (!note) return <Navigate to="/research" replace />;

  return (
    <div className="company-page field-note-detail field-note-article">
      <section className="field-note-hero editorial-note-hero">
        <Link to="/research" className="field-note-back">← FIELD NOTES</Link>
        <div className="editorial-note-heading">
          <div className="editorial-note-icon-stack">
            {note.systems.map((system) => <SystemIcon key={system} system={system} size="sm" />)}
          </div>
          <div>
            <div className="field-note-meta">
              <span>{note.date}</span>
              <span>{note.type}</span>
              <span>{note.readMinutes} MIN READ</span>
              <b>{note.status}</b>
            </div>
            <h1>{note.title}</h1>
            <p>{note.summary}</p>
            <div className="field-note-systems">{note.systems.map((system) => <SystemChip key={system} system={system} />)}</div>
          </div>
        </div>
      </section>

      <main className="field-note-reading-layout">
        <article className="field-note-prose">
          {note.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <ReproductionGuide note={note} />
        </article>

        <aside className="field-note-reading-rail">
          <div>
            <span>FIELD NOTE</span>
            <strong>{note.type}</strong>
          </div>
          <div>
            <span>STATUS</span>
            <strong>{note.status}</strong>
          </div>
          <div>
            <span>SYSTEMS</span>
            <div className="field-note-rail-icons">{note.systems.map((system) => <SystemIcon key={system} system={system} size="xs" />)}</div>
          </div>
          <p>Narrative explains the decision. The reproduction guide records the minimum inputs, method, verification checks, expected result, and limits.</p>
        </aside>
      </main>

      <section className="field-note-footer editorial-note-footer">
        <div>
          <span>PUBLIC ENGINEERING RECORD</span>
          <p>Field Notes document current work and the method required to inspect or reproduce it. Formal validation evidence and live performance remain separate records.</p>
        </div>
        <Link to="/research">More Field Notes →</Link>
      </section>
    </div>
  );
}
