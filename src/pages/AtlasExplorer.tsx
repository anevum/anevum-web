import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/atlas-explorer.css";

/**
 * Editorial allowlist for the Anevum reader-preview only.
 *
 * These four opening-state summaries are separately reviewed reader-facing
 * derivatives, not live data from the private Transcosmic Canon Wiki. Additions
 * require source, Website Ready, spoiler window and publishing-queue clearance.
 * Never fetch private wiki records or infer publicity from a calendar date.
 */
const ROOT = "/design/original-works";
const ATLAS = ROOT + "/atlas";
const REPLY = ROOT + "/reply";
const UNIVERSE = ROOT + "/transcosmic";

const entries = [
  {
    id: "01", slug: "ovara", title: "Ovara", category: "World",
    subtitle: "Helor System",
    summary: "A technologically mature human world with 29 sovereign states. REPLY begins in Merva, within the Kesra Basin.",
    detail: "The people of Ovara have their own histories, institutions, work and unanswered questions. In REPLY, an anomalous measurement must be investigated, documented and challenged without deciding an entire world's future in advance.",
    keywords: "Merva Kesra Basin measurement evidence"
  },
  {
    id: "02", slug: "nali-solan", title: "Nali Solan", category: "Person",
    subtitle: "Merva · Ovara",
    summary: "A 29-year-old precision instrumentation specialist who refuses to dismiss evidence that familiar explanations cannot resolve.",
    detail: "Nali's professional world depends on reliable records and reproducible measurement. Preserving an unresolved result is the beginning of a scientific and profoundly human question.",
    keywords: "instrumentation specialist calibration science"
  },
  {
    id: "03", slug: "neral", title: "Neral", category: "World",
    subtitle: "Irsen System",
    summary: "A sovereign, inhabited human world linked with Veyra by mature Road infrastructure, with its own history and culture.",
    detail: "Road travel has become an established part of ordinary life for a civilization connected across worlds. This does not make Neral a colony of Veyra, nor erase Neral's separate political and cultural identity.",
    keywords: "Irsen Veyra Road connected independence"
  },
  {
    id: "04", slug: "veyra", title: "Veyra", category: "World",
    subtitle: "Connected civilization",
    summary: "An established human world where travel to Neral through an engineered Road belongs to everyday infrastructure.",
    detail: "Mature Road systems rely on engineering, maintenance and institutions. The lives of people on Veyra still revolve around ordinary choices, labor, relationships and civic obligations.",
    keywords: "Neral Road Serein connected engineering"
  }
] as const;

type Category = "All" | "World" | "Person";

function Directory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const results = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("en");
    return entries.filter(record =>
      (category === "All" || record.category === category) &&
      (!term || [record.title, record.subtitle, record.summary, record.keywords]
        .join(" ").toLocaleLowerCase("en").includes(term))
    );
  }, [search, category]);
  const reset = () => { setSearch(""); setCategory("All"); };

  return <section className="ow-page ow-container ow-atlas-explorer" aria-labelledby="ow-atlas-title">
    <p className="ow-eyebrow">The Transcosmic / Reader Atlas</p>
    <h1 id="ow-atlas-title">A universe<br /><em>worth knowing.</em></h1>
    <p className="ow-page-lead">A curated opening-state introduction. The complete internal encyclopedia includes stories and events that have not been released to readers.</p>
    <div className="ow-atlas-toolbar">
      <div className="ow-atlas-search" role="search" aria-label="Search the Reader Atlas">
        <label htmlFor="ow-atlas-query">Find a record</label>
        <input id="ow-atlas-query" type="search" autoComplete="off"
          maxLength={80} placeholder="Search worlds, people, places…"
          value={search} onChange={e => setSearch(e.currentTarget.value)} />
      </div>
      <div className="ow-atlas-filters" role="group" aria-label="Filter by entry type">
        {(["All", "World", "Person"] as const).map(option => <button
          key={option} type="button" aria-pressed={category === option}
          onClick={() => setCategory(option)}
        >{option === "All" ? "All records" : option === "World" ? "Worlds" : "People"}</button>)}
      </div>
    </div>
    <p className="ow-atlas-results" role="status" aria-live="polite" aria-atomic="true">
      {results.length} {results.length === 1 ? "record" : "records"} in this reader-safe selection
    </p>
    {results.length ? <div className="ow-atlas-grid">
      {results.map(record => <Link key={record.slug} className="ow-atlas-card"
        aria-label={"Read " + record.title + " — " + record.category}
        to={ATLAS + "/" + record.slug}>
        <span className="ow-atlas-number">{record.id}</span>
        <span className="ow-atlas-card-body">
          <span className="ow-card-kicker">{record.category} · {record.subtitle}</span>
          <strong className="ow-atlas-title">{record.title}</strong>
          <span className="ow-atlas-summary">{record.summary}</span>
          <span className="ow-atlas-open">Read entry <span aria-hidden="true">↗</span></span>
        </span>
      </Link>)}
    </div> : <div className="ow-atlas-empty" role="region" aria-label="No matching Atlas entries">
      <h2>No matching records.</h2>
      <p>Only reviewed, opening-state records appear in this preview. Change your search or reset the selection.</p>
      <button type="button" onClick={reset}>Show all records</button>
    </div>}
    <div className="ow-atlas-note">
      <span className="ow-note-icon" aria-hidden="true">○</span>
      <p><strong>A spoiler-conscious archive.</strong> This is a curated reader preview, not an unrestricted mirror of the private story bible. Every additional record requires a new editorial and canon release decision.</p>
    </div>
    <div className="ow-actions">
      <Link className="ow-action" to={REPLY}>Start with REPLY <span aria-hidden="true" className="ow-action-arrow">↗</span></Link>
    </div>
  </section>;
}

function Detail({ slug }: { slug: string }) {
  const record = entries.find(item => item.slug === slug);
  if (!record) return <section className="ow-page ow-container ow-atlas-detail" aria-labelledby="ow-atlas-missing">
    <p className="ow-eyebrow">Reader Atlas / Unknown record</p>
    <h1 id="ow-atlas-missing">Record unavailable.</h1>
    <p className="ow-page-lead">No public-reader record exists at this address. Private and unreleased records are never exposed by guessing a URL.</p>
    <Link className="ow-action" to={ATLAS}>Return to Atlas <span className="ow-action-arrow" aria-hidden="true">↗</span></Link>
  </section>;
  return <section className="ow-page ow-container ow-atlas-detail" aria-labelledby="ow-atlas-detail-heading">
    <div className="ow-breadcrumb">
      <Link to={UNIVERSE}>The Transcosmic</Link>
      <span aria-hidden="true">/</span>
      <Link to={ATLAS}>The Atlas</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{record.title}</span>
    </div>
    <p className="ow-eyebrow">Reader Atlas / {record.category}</p>
    <h1 id="ow-atlas-detail-heading">{record.title}<span className="ow-atlas-detail-index"> / {record.id}</span></h1>
    <p className="ow-page-lead">{record.summary}</p>
    <div className="ow-atlas-detail-layout">
      <div className="ow-atlas-detail-copy">
        <span className="ow-card-kicker">Opening-state introduction</span>
        <h2>Before the story changes.</h2>
        <p>{record.detail}</p>
        <p className="ow-atlas-source-note">Reader orientation only. This entry does not include plot outcomes, unreleased stories or internal encyclopedia notes.</p>
      </div>
      <aside className="ow-atlas-detail-aside" aria-label="Atlas record information">
        <p className="ow-card-kicker">Record information</p>
        <dl>
          <div><dt>Type</dt><dd>{record.category}</dd></div>
          <div><dt>Context</dt><dd>{record.subtitle}</dd></div>
          <div><dt>Disclosure</dt><dd>Opening-state only</dd></div>
          <div><dt>Availability</dt><dd>Design preview · not published</dd></div>
        </dl>
      </aside>
    </div>
    <div className="ow-actions ow-atlas-detail-actions">
      <Link className="ow-action" to={ATLAS}>Back to Atlas <span className="ow-action-arrow" aria-hidden="true">↗</span></Link>
      <Link className="ow-action ow-action-outline" to={REPLY}>Discover REPLY <span className="ow-action-arrow" aria-hidden="true">↗</span></Link>
    </div>
  </section>;
}

export default function AtlasExplorer({ slug }: { slug?: string }) {
  return slug === undefined ? <Directory /> : <Detail slug={slug} />;
}
