import { Link, Navigate, useParams } from "react-router-dom";
import { fieldNoteBySlug } from "../data/fieldNotes";

export default function FieldNoteDetail() {
  const { slug } = useParams();
  const note = fieldNoteBySlug(slug);
  if (!note) return <Navigate to="/research" replace />;

  return (
    <div className="company-page field-note-detail">
      <section className="field-note-hero">
        <Link to="/research" className="field-note-back">← FIELD NOTES</Link>
        <div className="field-note-meta">
          <span>{note.date}</span>
          <span>{note.type}</span>
          <b>{note.status}</b>
        </div>
        <h1>{note.title}</h1>
        <p>{note.summary}</p>
        <div className="field-note-systems">
          {note.systems.map((system) => <span key={system}>{system}</span>)}
        </div>
      </section>

      <section className="field-note-body">
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

      <section className="field-note-footer">
        <div>
          <span>PUBLIC ENGINEERING RECORD</span>
          <p>Field Notes document current work, decisions, failures, and system changes. They are not substitutes for formal validation evidence or live performance records.</p>
        </div>
        <Link to="/research">Return to Field Notes →</Link>
      </section>
    </div>
  );
}
