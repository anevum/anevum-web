import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/reply-reading-room.css";

/**
 * Editorial design-only signal studies, not manuscript excerpts.
 * All text is derived from pre-release-safe descriptions already used in the
 * original-works studio preview; no private canon pages or unreleased prose.
 * This route does not expose a publication API or any download/share action.
 */
const ROOT = "/design/original-works";
const studies = [
  {
    id: "01",
    key: "evidence",
    tab: "Evidence",
    line: "A measurement survives.",
    body: "On Ovara, a precision instrumentation specialist refuses to erase a result that ordinary explanations cannot account for. The evidence must stand up to another look.",
    note: "An unresolved result is a beginning, not a conclusion.",
    subject: "Follow the investigator",
    link: ROOT + "/atlas/nali-solan"
  },
  {
    id: "02",
    key: "ovara",
    tab: "The world",
    line: "The world was already here.",
    body: "Ovara has cities, public institutions, families, technical work, and questions of its own. The story begins with people living their lives—not waiting for a visitor to give them a future.",
    note: "Merva is one place where this ordinary life can be seen.",
    subject: "Walk through Merva",
    link: ROOT + "/atlas/merva"
  },
  {
    id: "03",
    key: "connection",
    tab: "The other side",
    line: "Elsewhere, distance is infrastructure.",
    body: "For the people of Veyra and Neral, mature two-ended Road travel belongs to everyday life. That familiar connection is not a route to Ovara at the opening of REPLY.",
    note: "Different starting points. No promise of a known destination.",
    subject: "Understand the Open Road",
    link: ROOT + "/atlas/open-road"
  }
] as const;

type StudyIndex = 0 | 1 | 2;

export default function ReplyReadingRoom() {
  const [index, setIndex] = useState<StudyIndex>(0);
  const study = studies[index];
  return <section className="ow-page ow-container ow-reading-room" aria-labelledby="ow-room-title">
    <nav className="ow-breadcrumb" aria-label="Breadcrumb">
      <Link to={ROOT + "/works"}>Works</Link>
      <span aria-hidden="true">/</span>
      <Link to={ROOT + "/reply"}>REPLY</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Signal studies</span>
    </nav>

    <p className="ow-eyebrow">REPLY / Editorial preview / 001</p>
    <h1 id="ow-room-title">Three signals.<br/><em>One beginning.</em></h1>
    <p className="ow-page-lead">An introduction to the questions behind REPLY, without revealing what happens after them.</p>
    <p className="ow-room-disclaimer" role="note">
      Creative teaser studies for design review only. These are <strong>not excerpts from the novel</strong>,
      not an approved promotional release, and not a statement of book availability.
    </p>

    <div className="ow-room-stage">
      <div className="ow-room-index" role="group" aria-label="Choose an opening-state signal">
        {studies.map((entry, i) => <button
          key={entry.key}
          className={"ow-room-index-button" + (index === i ? " is-current" : "")}
          type="button"
          aria-pressed={index === i}
          onClick={() => setIndex(i as StudyIndex)}
        >
          <span>{entry.id}</span>
          <strong>{entry.tab}</strong>
          <span className="ow-room-index-chevron" aria-hidden="true">↗</span>
        </button>)}
      </div>

      <div className="ow-room-card" aria-live="polite" aria-atomic="true" key={study.key}>
        <span className="ow-room-corner ow-room-corner-top" aria-hidden="true" />
        <span className="ow-room-corner ow-room-corner-bottom" aria-hidden="true" />
        <div className="ow-room-card-top">
          <span>TRANSCOSMIC / ORIENTATION</span>
          <span>{study.id} / 03</span>
        </div>
        <div className="ow-room-card-body">
          <p className="ow-room-kicker">Study {study.id} · {study.tab}</p>
          <h2>{study.line}</h2>
          <p>{study.body}</p>
          <div className="ow-room-note">{study.note}</div>
        </div>
        <div className="ow-room-card-bottom">
          <span>Opening-state material only</span>
          <Link to={study.link}>{study.subject}<span aria-hidden="true"> ↗</span></Link>
        </div>
      </div>
    </div>

    <div className="ow-room-footer">
      <p>These studies deliberately stop before plot outcomes. The revised book text and publishing status require separate author approval.</p>
      <Link className="ow-action ow-action-outline" to={ROOT + "/reply"}>
        Back to REPLY <span className="ow-action-arrow" aria-hidden="true">↗</span>
      </Link>
    </div>
  </section>;
}
