import { Link } from "react-router-dom";
import { fieldNotes } from "../data/fieldNotes";

export default function ResearchHub() {
  const notes = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date));
  const [latest, ...older] = notes;

  return (
    <div className="studio-page studio-notes-page workshop-notes">
      <header className="workshop-page-intro">
        <p className="workshop-kicker">FIELD NOTES</p>
        <h1>Notes from building things.</h1>
        <p>Working through ideas usually means getting something wrong first. These notes document actual experiments, decisions, releases, and things I learned along the way.</p>
      </header>

      {latest && (
        <section className="workshop-section workshop-latest-note">
          <div className="workshop-section-heading">
            <div><p className="workshop-section-eyebrow">Most recent</p><h2>Latest Field Note</h2></div>
          </div>
          <article>
            <p className="workshop-note-type">{latest.date} · {latest.type}</p>
            <h3><Link to={"/field-notes/" + latest.slug}>{latest.title}</Link></h3>
            <p>{latest.summary}</p>
            <Link to={"/field-notes/" + latest.slug}>Read the note →</Link>
          </article>
        </section>
      )}

      <section className="workshop-section" aria-labelledby="workshop-all-notes">
        <div className="workshop-section-heading">
          <div><p className="workshop-section-eyebrow">Archive</p><h2 id="workshop-all-notes">Earlier work</h2></div>
          <span className="workshop-notes-count">{notes.length} published notes</span>
        </div>
        <div className="workshop-note-list">
          {older.map((note) => (
            <Link key={note.slug} className="workshop-note-row" to={"/field-notes/" + note.slug}>
              <time dateTime={note.date}>{note.date}</time>
              <div>
                <span className="workshop-note-type">{note.type}</span>
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
              </div>
              <span className="workshop-row-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
          {!older.length && <p className="workshop-empty">More notes will appear here when published.</p>}
        </div>
      </section>
      <p className="workshop-notes-ending">RHEN is the current focus. Future projects will have their own records here too.</p>
    </div>
  );
}
