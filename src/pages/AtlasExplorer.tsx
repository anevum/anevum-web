import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { entries, relationships, type ReaderCategory } from "../data/transcosmic-reader-preview";
import "../styles/atlas-explorer.css";

/**
 * Editorial allowlist for the Anevum reader-preview only.
 *
 * Eight opening-state summaries are curated reader-facing
 * derivatives, not live data from the private Transcosmic Canon Wiki. Additions
 * require source, Website Ready, spoiler window and publishing-queue clearance.
 * Never fetch private wiki records or infer publicity from a calendar date.
 */
const ROOT = "/design/original-works";
const ATLAS = ROOT + "/atlas";
const REPLY = ROOT + "/reply";
const UNIVERSE = ROOT + "/transcosmic";

/**
 * Reader entries come only from the reviewed, build-time-validated manifest.
 * Never fetch private wiki records, publish raw Canon Wiki blocks, or infer
 * release permission from a date. The JSON manifest is review-only forever:
 * future public publication requires a separately approved projection.
 *
 * Reader relationships are explicit, non-transitive editorial associations.
 * Ovara is NOT part of the established Veyra–Neral Road network.
 */
function NetworkOverview() {
  return <section className="ow-atlas-relations" aria-labelledby="ow-atlas-relations-title">
    <div className="ow-atlas-relations-heading">
      <div>
        <p className="ow-card-kicker">Opening-state orientation</p>
        <h2 id="ow-atlas-relations-title">A universe of different starting points.</h2>
      </div>
      <p>A person and her home world. Two other worlds already joined by established infrastructure.</p>
    </div>
    <div className="ow-atlas-relations-grid">
      <div className="ow-atlas-cluster">
        <span className="ow-atlas-cluster-label">Ovara / Independent context</span>
        <div className="ow-atlas-cluster-pair">
          <Link to={ATLAS + "/ovara"}><strong>Ovara</strong><span>World</span></Link>
          <span className="ow-atlas-connection">Home of</span>
          <Link to={ATLAS + "/nali-solan"}><strong>Nali Solan</strong><span>Person</span></Link>
        </div>
      </div>
      <div className="ow-atlas-cluster">
        <span className="ow-atlas-cluster-label">Veyra – Neral / Mature network</span>
        <div className="ow-atlas-cluster-pair">
          <Link to={ATLAS + "/veyra"}><strong>Veyra</strong><span>World</span></Link>
          <span className="ow-atlas-connection">Established Road</span>
          <Link to={ATLAS + "/neral"}><strong>Neral</strong><span>World</span></Link>
        </div>
      </div>
    </div>
    <p className="ow-atlas-relations-caption">
      These contexts are not joined here: at the opening of REPLY, Ovara is not part of the Veyra–Neral Road connection. The diagram is a reading guide, not a literal map.
    </p>
  </section>;
}

type Category = "All" | ReaderCategory;

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
    <NetworkOverview />
    <div className="ow-atlas-toolbar">
      <div className="ow-atlas-search" role="search" aria-label="Search the Reader Atlas">
        <label htmlFor="ow-atlas-query">Find a record</label>
        <input id="ow-atlas-query" type="search" autoComplete="off"
          maxLength={80} placeholder="Search worlds, people, places, technology…"
          value={search} onChange={e => setSearch(e.currentTarget.value)} />
      </div>
      <div className="ow-atlas-filters" role="group" aria-label="Filter by entry type">
        {(["All", "World", "Person", "Place", "Infrastructure"] as const).map(option => <button
          key={option} type="button" aria-pressed={category === option}
          onClick={() => setCategory(option)}
        >{option === "All" ? "All records" : option === "World" ? "Worlds" : option === "Person" ? "People" : option === "Place" ? "Places" : "Infrastructure"}</button>)}
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
    <section className="ow-atlas-related" aria-labelledby="ow-atlas-related-title">
      <p className="ow-card-kicker">Follow the connection</p>
      <h2 id="ow-atlas-related-title">Related records</h2>
      <div className="ow-atlas-related-grid">
        {relationships[record.slug].map(related => <Link
          key={related.slug} to={ATLAS + "/" + related.slug}
          className="ow-atlas-related-link"
        >
          <span>{related.relation}</span>
          <strong>{related.label}</strong>
          <span aria-hidden="true">↗</span>
        </Link>)}
      </div>
    </section>
    <div className="ow-actions ow-atlas-detail-actions">
      <Link className="ow-action" to={ATLAS}>Back to Atlas <span className="ow-action-arrow" aria-hidden="true">↗</span></Link>
      <Link className="ow-action ow-action-outline" to={REPLY}>Discover REPLY <span className="ow-action-arrow" aria-hidden="true">↗</span></Link>
    </div>
  </section>;
}

export default function AtlasExplorer({ slug }: { slug?: string }) {
  return slug === undefined ? <Directory /> : <Detail slug={slug} />;
}
