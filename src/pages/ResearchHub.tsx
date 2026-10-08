import { Link } from "react-router-dom";
import { fieldNotes } from "../data/fieldNotes";

export default function ResearchHub() {
  const notes = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date));
  const [lead, ...rest] = notes;

  return (
    <div className="studio-page studio-notes-page">
      <section className="studio-page-hero">
        <span>FIELD NOTES</span>
        <h1>The useful part of building in public is showing what did not work.</h1>
        <p>
          Field Notes are the working record behind ANEVUM: research, engineering changes, releases, mistakes,
          dead ends, and the evidence used to decide what happens next.
        </p>
      </section>

      {lead ? (
        <section className="studio-note-feature">
          <div className="studio-note-feature-meta"><span>LATEST NOTE</span><time>{lead.date}</time></div>
          <div className="studio-note-feature-copy">
            <span>{lead.type} / {lead.status}</span>
            <h2>{lead.title}</h2>
            <p>{lead.summary}</p>
            <Link to={`/research/${lead.slug}`}>Read the note →</Link>
          </div>
          <div className="studio-note-feature-aside">
            <span>READ TIME</span><strong>{lead.readMinutes} MIN</strong>
            <span>SYSTEMS</span><strong>{lead.systems.join(" / ")}</strong>
          </div>
        </section>
      ) : null}

      <section className="studio-section">
        <header className="studio-section-heading"><span>RECENT</span><div><h2>Build log, not marketing archive.</h2><p>Most of the current record is RHEN because RHEN is the current flagship project. Future products will live in the same journal.</p></div></header>
        <div className="studio-note-list">
          {rest.map((note, index) => (
            <Link key={note.slug} to={`/research/${note.slug}`}>
              <span className="studio-note-index">{String(index + 2).padStart(2,"0")}</span>
              <div><header><time>{note.date}</time><span>{note.type}</span></header><h3>{note.title}</h3><p>{note.summary}</p></div>
              <aside><span>{note.readMinutes} MIN</span><b>↗</b></aside>
            </Link>
          ))}
        </div>
      </section>

      <section className="studio-page-cta">
        <span>METHOD</span>
        <h2>Write down what the system believed before the outcome is known.</h2>
        <p>That principle matters for markets, experiments, and product decisions. Evidence is more useful when it cannot be rewritten after the fact.</p>
        <Link to="/products/rhen">See how RHEN applies it →</Link>
      </section>
    </div>
  );
}
