import { Link } from "react-router-dom";
import PageIntro from "../components/PageIntro";

const groups = [
  {
    label: "SYSTEMS",
    items: [
      ["Automated Capital System", "Current market observation, risk, execution, telemetry, and review architecture.", "/work"],
      ["ANEVUM Web", "GitHub, React, Cloudflare Workers, Railway PostgreSQL, routing, and deployment.", "/work"],
      ["Cloudflare Access", "Identity and permission boundary for private Command.", "/command"],
      ["Command", "Private operational visibility into the active capital system.", "/command"]
    ]
  },
  {
    label: "WORK",
    items: [
      ["Projects", "The current project index and state of each substantial build.", "/work"],
      ["Experiments", "Hypotheses, methods, evidence, and next actions.", "/lab"],
      ["Record", "Chronological and quantitative evidence.", "/record"],
      ["Notes", "Working ideas, research threads, and design decisions.", "/notes"]
    ]
  },
  {
    label: "ARCHIVE",
    items: [
      ["The Transcosmic", "REPLY, worldbuilding, publishing development, and the earlier creative ANEVUM identity.", "/wiki/archive/transcosmic"]
    ]
  }
];

export default function Wiki() {
  return (
    <>
      <PageIntro kicker="WIKI" title="The map beneath the work.">
        <p>
          The Wiki is ANEVUM's structured reference layer. It answers what a system is, how pieces
          relate, what is current, and what has moved into history.
        </p>
      </PageIntro>

      <section className="content-section wiki-state">
        <article><span>ACTIVE</span><strong>Current source of truth</strong><p>Material describing what ANEVUM is building, operating, or testing now.</p></article>
        <article><span>FUTURE</span><strong>Defined, not active</strong><p>Ideas with a place in the system but no claim on present attention.</p></article>
        <article><span>ARCHIVE</span><strong>Preserved, not current</strong><p>Earlier work remains recoverable without competing with active information.</p></article>
      </section>

      <section className="content-section wiki-browser">
        {groups.map((group) => (
          <div className="wiki-group" key={group.label}>
            <div className="wiki-group-label">{group.label}</div>
            <div className="wiki-links">
              {group.items.map(([title, copy, route]) => (
                <Link to={route} key={title}>
                  <div><strong>{title}</strong><p>{copy}</p></div>
                  <span>↗</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="archive-rule">
        <div><span>OPERATING RULE</span><h2>Keep history. Keep the present clean.</h2></div>
        <p>
          A change in direction should create an explicit archive boundary. It should not require
          deleting useful work, and it should not leave obsolete material mixed into active pages.
        </p>
      </section>
    </>
  );
}
