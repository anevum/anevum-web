import { Link } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import { fieldNotes } from "../data/fieldNotes";
import { currentRhenRelease } from "../data/releases";
import { publicProducts } from "../data/products";

function readableDate(value: string) {
  const date = new Date(value + "T12:00:00");
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function HomeCompany() {
  const products = publicProducts();
  const rhen = products.find((product) => product.slug === "rhen");
  const otherProjects = products.filter((product) => product.slug !== "rhen");
  const notes = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const release = currentRhenRelease();

  return (
    <div className="studio-home truth-home workshop-home">
      <section className="workshop-hero" aria-labelledby="workshop-heading">
        <p className="workshop-kicker">Independent software &amp; experiments</p>
        <h1 id="workshop-heading">A place for things I build.</h1>
        <p className="workshop-intro-copy">
          I make software to solve problems, explore ideas, and learn how things work.
          ANEVUM is where I share the projects and what I learn while building them.
        </p>
        <div className="workshop-actions">
          <Link className="workshop-primary-link" to="/products">Explore projects <span aria-hidden="true">→</span></Link>
          <Link className="workshop-secondary-link" to="/field-notes">Read Field Notes</Link>
        </div>
      </section>

      {rhen ? (
        <section className="workshop-section workshop-current" aria-labelledby="workshop-current-heading">
          <div className="workshop-section-heading">
            <div>
              <p className="workshop-section-eyebrow">Current project</p>
              <h2 id="workshop-current-heading">What I’m working on</h2>
            </div>
            <Link to="/products">All projects <span aria-hidden="true">→</span></Link>
          </div>
          <article className="workshop-featured-project">
            <div className="workshop-featured-main">
              <div className="workshop-project-identity">
                <SystemIcon system="RHEN" size="md" />
                <div>
                  <h3>RHEN</h3>
                  <span>Markets &amp; research · {rhen.lifecycle}</span>
                </div>
              </div>
              <p>I'm rebuilding RHEN around reproducible research and private member trading workspaces. Legacy real-money execution has been suspended while the new foundation is developed.</p>
              <div className="workshop-project-links">
                <Link to={rhen.routes.home}>View RHEN <span aria-hidden="true">→</span></Link>
                {rhen.routes.evidence ? <Link to={rhen.routes.evidence}>Public evidence</Link> : null}
              </div>
            </div>
            <div className="workshop-project-facts" aria-label="Current RHEN details">
              <dl>
                <div><dt>Latest registered release</dt><dd>{release.version}</dd></div>
                <div><dt>Current scope</dt><dd>U.S. equities and ETFs</dd></div>
                <div><dt>Results</dt><dd>Under evaluation</dd></div>
              </dl>
              <Link to={rhen.routes.releases || rhen.routes.home}>Release history <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        </section>
      ) : null}

      {otherProjects.length > 0 ? (
        <section className="workshop-section" aria-labelledby="workshop-more-heading">
          <div className="workshop-section-heading">
            <div><p className="workshop-section-eyebrow">More projects</p><h2 id="workshop-more-heading">Other things I’ve made</h2></div>
          </div>
          <div className="workshop-project-list">
            {otherProjects.map((product) => (
              <Link key={product.slug} to={product.routes.home} className="workshop-project-row">
                <strong>{product.name}</strong>
                <span>{product.oneLine}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="workshop-section" aria-labelledby="workshop-notes-heading">
        <div className="workshop-section-heading">
          <div>
            <p className="workshop-section-eyebrow">From the workbench</p>
            <h2 id="workshop-notes-heading">Recent notes</h2>
          </div>
          <Link to="/field-notes">All Field Notes <span aria-hidden="true">→</span></Link>
        </div>
        {notes.length ? (
          <div className="workshop-note-list">
            {notes.map((note) => (
              <Link key={note.slug} className="workshop-note-row" to={"/field-notes/" + note.slug}>
                <time dateTime={note.date}>{readableDate(note.date)}</time>
                <div>
                  <span className="workshop-note-type">{note.type}</span>
                  <h3>{note.title}</h3>
                  <p>{note.summary}</p>
                </div>
                <span className="workshop-row-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : <p className="workshop-empty">No published notes yet.</p>}
        <div className="workshop-update-link">
          <span>Want the shorter version?</span>
          <Link to="/feed">See the latest updates <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="workshop-endnote" aria-label="About ANEVUM">
        <p>Some projects are useful now. Others are experiments. I’d rather show what’s actually being built than pretend everything is finished.</p>
        <Link to="/about">A little more about ANEVUM <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
