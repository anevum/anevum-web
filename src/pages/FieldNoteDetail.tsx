import { Link, Navigate, useParams } from "react-router-dom";
import { RhenSystemChip } from "../components/company/RhenModuleGlyph";
import { fieldNoteBySlug } from "../data/fieldNotes";

export default function FieldNoteDetail() {
  const { slug } = useParams();
  const note = fieldNoteBySlug(slug);
  if (!note) return <Navigate to="/field-notes" replace />;

  return (
    <article className="studio-page field-note-detail workshop-note-detail">
      <header className="workshop-note-heading">
        <Link to="/field-notes" className="workshop-note-back">← All Field Notes</Link>
        <div className="workshop-note-metadata">
          <time dateTime={note.date}>{note.date}</time>
          <span>{note.type}</span>
          <span>{note.readMinutes} min read</span>
        </div>
        <h1>{note.title}</h1>
        <p>{note.summary}</p>
        <div className="workshop-note-chips" aria-label="Related projects and systems">
          {note.systems.map((system) => <RhenSystemChip key={system} system={system} />)}
        </div>
        <p className="workshop-note-status">Recorded status: {note.status}</p>
      </header>

      <div className="workshop-note-article">
        {note.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph, index) => <p key={section.heading + "-" + index}>{paragraph}</p>)}
          </section>
        ))}
      </div>

      <section className="workshop-note-method" aria-label="Reproduction notes">
        <details>
          <summary>
            <span>REPRODUCE / CHALLENGE THIS NOTE</span>
            <strong>Read the method and limitations</strong>
          </summary>
          <div className="workshop-note-method-content">
            <h2>{note.reproduce.question}</h2>
            <h3>Inputs</h3>
            <ul>{note.reproduce.inputs.map((value) => <li key={value}>{value}</li>)}</ul>
            <h3>Method</h3>
            <ol>{note.reproduce.method.map((value) => <li key={value}>{value}</li>)}</ol>
            <h3>Checks</h3>
            <ul>{note.reproduce.checks.map((value) => <li key={value}>{value}</li>)}</ul>
            <h3>Expected result</h3>
            <p>{note.reproduce.expected}</p>
            <h3>Limitations</h3>
            <ul>{note.reproduce.limits.map((value) => <li key={value}>{value}</li>)}</ul>
          </div>
        </details>
      </section>

      <footer className="workshop-note-end">
        <p>These are development records, not claims that a trading strategy is profitable or a test result will repeat.</p>
        <Link to="/field-notes">← Back to Field Notes</Link>
      </footer>
    </article>
  );
}
