import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import { publicObjects, getPublicObjectBySlug, searchPublicObjects, type PublicObject } from "./publicObjects";
import { getWikiDetail } from "./wikiDetails";
import { CanonVisual } from "./CanonVisuals";
import { Link, SyncStamp } from "./ui";

const WIKI_HOST = "wiki.anevum.com";

function onWikiHost() {
  return typeof window !== "undefined" && window.location.hostname.toLowerCase() === WIKI_HOST;
}

function wikiHomeHref() {
  return onWikiHost() ? "/" : "/wiki";
}

function wikiHref(record: PublicObject) {
  return onWikiHost() ? record.sourceRoute : record.route;
}

function headingId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const sectionCounts = {
  ALL: publicObjects.length,
  UNIVERSE: publicObjects.filter((record) => record.section === "UNIVERSE").length,
  ATLAS: publicObjects.filter((record) => record.section === "ATLAS").length,
  ARCHIVE: publicObjects.filter((record) => record.section === "ARCHIVE").length,
};

export function WikiHeader() {
  return (
    <header className="wiki-site-header">
      <div className="wiki-site-header-inner">
        <Link href={wikiHomeHref()} className="wiki-site-brand">
          <span className="wiki-site-wordmark">WIKI.ANEVUM</span>
          <span className="wiki-site-subtitle">PUBLIC CANON ENCYCLOPEDIA</span>
        </Link>
        <nav className="wiki-site-utilities" aria-label="Wiki utilities">
          <Link href={wikiHomeHref()} className="wiki-utility-link">MAIN PAGE</Link>
          <a href="https://anevum.com" className="wiki-utility-link">ANEVUM.COM <ExternalLink size={11} /></a>
        </nav>
      </div>
    </header>
  );
}

function WikiSidebar({ record, activeSection = "ALL", onSection }: { record?: PublicObject; activeSection?: string; onSection?: (value: string) => void }) {
  const detail = record ? getWikiDetail(record.slug) : undefined;
  const coreRecords = ["merva", "ovara", "neral", "veyra", "connected-worlds"]
    .map((slug) => getPublicObjectBySlug(slug))
    .filter(Boolean) as PublicObject[];

  return (
    <aside className="wiki-sidebar">
      <div className="wiki-sidebar-group">
        <span className="wiki-sidebar-label">NAVIGATION</span>
        <Link href={wikiHomeHref()} className="wiki-sidebar-link">Main page</Link>
        <a href="#all-records" className="wiki-sidebar-link">All released records</a>
      </div>

      <div className="wiki-sidebar-group">
        <span className="wiki-sidebar-label">BROWSE</span>
        {(["ALL", "UNIVERSE", "ATLAS", "ARCHIVE"] as const).map((value) => (
          onSection ? (
            <button key={value} type="button" className={`wiki-sidebar-link wiki-sidebar-button ${activeSection === value ? "active" : ""}`} onClick={() => onSection(value)}>
              <span>{value === "ALL" ? "All records" : value.charAt(0) + value.slice(1).toLowerCase()}</span>
              <small>{sectionCounts[value]}</small>
            </button>
          ) : (
            <Link key={value} href={`${wikiHomeHref()}#all-records`} className="wiki-sidebar-link">
              <span>{value === "ALL" ? "All records" : value.charAt(0) + value.slice(1).toLowerCase()}</span>
              <small>{sectionCounts[value]}</small>
            </Link>
          )
        ))}
      </div>

      {record && detail ? (
        <div className="wiki-sidebar-group wiki-toc">
          <span className="wiki-sidebar-label">CONTENTS</span>
          <a href="#overview" className="wiki-sidebar-link">Overview</a>
          {detail.sections.map((section, index) => (
            <a key={section.title} href={`#${headingId(section.title)}`} className="wiki-sidebar-link">
              <span>{index + 1}. {section.title}</span>
            </a>
          ))}
        </div>
      ) : null}

      {!record ? (
        <div className="wiki-sidebar-group">
          <span className="wiki-sidebar-label">CORE RECORDS</span>
          {coreRecords.map((item) => <Link key={item.id} href={wikiHref(item)} className="wiki-sidebar-link">{item.title}</Link>)}
        </div>
      ) : null}

      <div className="wiki-sidebar-source">
        <span>CANON AUTHORITY</span>
        <p>Live Transcosmic Canon Wiki + Website Publishing Queue.</p>
      </div>
    </aside>
  );
}

function WikiSearch({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <label className="wiki-native-search">
      <Search size={15} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search WIKI.ANEVUM" aria-label="Search released canon" />
      {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
    </label>
  );
}

function WikiRecordRow({ record }: { record: PublicObject }) {
  return (
    <Link href={wikiHref(record)} className="wiki-record-row">
      <div className="wiki-record-row-title">
        <strong>{record.title}</strong>
        <span>{record.type}</span>
      </div>
      <p>{record.summary}</p>
      <div className="wiki-record-row-meta">
        <span>{record.section}</span>
        <span>{record.renderMode}</span>
        <span>{record.spoilerLevel}</span>
      </div>
    </Link>
  );
}

function WikiPortal({ title, description, section, onSelect }: { title: string; description: string; section: "UNIVERSE" | "ATLAS" | "ARCHIVE"; onSelect: (value: string) => void }) {
  const count = sectionCounts[section];
  return (
    <button type="button" className="wiki-portal" onClick={() => onSelect(section)}>
      <span>{title}</span>
      <p>{description}</p>
      <small>{count} released {count === 1 ? "record" : "records"}</small>
    </button>
  );
}

export function WikiHome() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("ALL");
  const results = useMemo(() => searchPublicObjects(query, section), [query, section]);
  const lead = getPublicObjectBySlug("merva")!;

  function selectSection(value: string) {
    setSection(value);
    requestAnimationFrame(() => document.getElementById("all-records")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className="wiki-native-page">
      <div className="wiki-native-layout">
        <WikiSidebar activeSection={section} onSection={selectSection} />

        <div className="wiki-native-content">
          <header className="wiki-main-page-header">
            <div>
              <p className="wiki-kicker">WIKI.ANEVUM</p>
              <h1>Main Page</h1>
              <p className="wiki-main-deck">The released reference encyclopedia for the ANEVUM universe.</p>
            </div>
            <SyncStamp />
          </header>

          <WikiSearch query={query} setQuery={setQuery} />

          <div className="wiki-home-columns">
            <section className="wiki-box wiki-featured-article">
              <div className="wiki-box-title"><span>Featured article</span><small>{lead.type}</small></div>
              <div className="wiki-featured-layout">
                <div className="wiki-featured-visual"><CanonVisual record={lead} /></div>
                <div>
                  <h2><Link href={wikiHref(lead)}>{lead.title}</Link></h2>
                  <p>{lead.summary}</p>
                  <Link href={wikiHref(lead)} className="wiki-inline-link">Read full record →</Link>
                </div>
              </div>
            </section>

            <section className="wiki-box wiki-about-box">
              <div className="wiki-box-title"><span>About this wiki</span><small>PUBLIC CANON</small></div>
              <p>WIKI.ANEVUM is a reader-facing encyclopedia, not a mirror of ANEVUM's private canon workspace. A record appears here only after its source and publication state clear the current public release gates.</p>
              <dl className="wiki-stat-list">
                <div><dt>Released records</dt><dd>{publicObjects.length}</dd></div>
                <div><dt>Universe</dt><dd>{sectionCounts.UNIVERSE}</dd></div>
                <div><dt>Atlas</dt><dd>{sectionCounts.ATLAS}</dd></div>
                <div><dt>Archive</dt><dd>{sectionCounts.ARCHIVE}</dd></div>
              </dl>
            </section>
          </div>

          <section className="wiki-box wiki-browse-box">
            <div className="wiki-box-title"><span>Browse the encyclopedia</span><small>BY RECORD FAMILY</small></div>
            <div className="wiki-portals">
              <WikiPortal title="Universe" description="People, technology, institutions, science and civilization." section="UNIVERSE" onSelect={selectSection} />
              <WikiPortal title="Atlas" description="Worlds, cities, regions, moons and inhabited infrastructure." section="ATLAS" onSelect={selectSection} />
              <WikiPortal title="Archive" description="Released historical records, facilities and events." section="ARCHIVE" onSelect={selectSection} />
            </div>
          </section>

          <section className="wiki-record-index" id="all-records">
            <div className="wiki-index-heading">
              <div><p className="wiki-kicker">PUBLIC INDEX</p><h2>{section === "ALL" ? "All released records" : `${section.charAt(0) + section.slice(1).toLowerCase()} records`}</h2></div>
              <span>{results.length} entries</span>
            </div>
            {query ? <p className="wiki-search-state">Showing results for <strong>{query}</strong>.</p> : null}
            <div className="wiki-record-list">
              {results.length ? results.map((record) => <WikiRecordRow key={record.id} record={record} />) : <p className="wiki-no-results">No released record matches this search.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function RecordContents({ slug }: { slug: string }) {
  const detail = getWikiDetail(slug);
  if (!detail) return null;
  return (
    <div className="wiki-article-sections">
      {detail.sections.map((section, index) => (
        <section key={section.title} id={headingId(section.title)} className="wiki-article-section">
          <h2><span>{index + 1}</span>{section.title}</h2>
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        </section>
      ))}
    </div>
  );
}

function WikiInfobox({ record }: { record: PublicObject }) {
  const detail = getWikiDetail(record.slug);
  return (
    <aside className="wiki-infobox">
      <div className="wiki-infobox-title">{record.title}</div>
      <div className="wiki-infobox-visual"><CanonVisual record={record} /></div>
      <div className="wiki-infobox-caption">Publication-safe visual study · {record.visualStatus.toLowerCase()}</div>
      <dl>
        {record.facts?.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
        <div><dt>Type</dt><dd>{record.type}</dd></div>
        <div><dt>Section</dt><dd>{record.section}</dd></div>
        <div><dt>Render mode</dt><dd>{record.renderMode}</dd></div>
        <div><dt>Spoiler level</dt><dd>{record.spoilerLevel}</dd></div>
        {detail ? <div><dt>Source state</dt><dd>{detail.sourceState}</dd></div> : null}
      </dl>
      {detail ? <div className="wiki-infobox-source"><span>{detail.sourceLabel}</span></div> : null}
    </aside>
  );
}

export function WikiRecord({ slug }: { slug: string }) {
  const record = getPublicObjectBySlug(slug);
  if (!record) return <WikiMissing />;
  const detail = getWikiDetail(slug);
  const neighbors = publicObjects.filter((item) => item.id !== record.id && (item.section === record.section || item.type === record.type)).slice(0, 5);

  return (
    <main className="wiki-native-page wiki-record-page-native">
      <div className="wiki-native-layout">
        <WikiSidebar record={record} />

        <article className="wiki-native-content wiki-article">
          <nav className="wiki-breadcrumbs" aria-label="Breadcrumb">
            <Link href={wikiHomeHref()}><ArrowLeft size={12} /> Main page</Link>
            <span>/</span>
            <span>{record.section.charAt(0) + record.section.slice(1).toLowerCase()}</span>
            <span>/</span>
            <span>{record.title}</span>
          </nav>

          <header className="wiki-article-header">
            <p className="wiki-kicker">{record.section} · {record.type}</p>
            <h1>{record.title}</h1>
            <div className="wiki-article-status">
              <span>{record.renderMode}</span>
              <span>{record.spoilerLevel}</span>
              <span>PUBLIC CANON</span>
            </div>
          </header>

          <div className="wiki-article-grid">
            <div className="wiki-article-body">
              <section id="overview" className="wiki-article-lead">
                <p>{detail?.lead || record.summary}</p>
              </section>

              <RecordContents slug={slug} />

              {!detail ? (
                <section className="wiki-article-section">
                  <h2>Overview</h2>
                  <p>{record.summary}</p>
                  <p>This record is currently published at {record.renderMode.toLowerCase()} depth. Additional private source material is not projected into the public Wiki.</p>
                </section>
              ) : null}

              <section className="wiki-publication-boundary">
                <h2>Publication boundary</h2>
                <p>{record.publicNote}</p>
              </section>
            </div>

            <WikiInfobox record={record} />
          </div>

          <section className="wiki-related-records">
            <div className="wiki-index-heading"><div><p className="wiki-kicker">SEE ALSO</p><h2>Related released records</h2></div></div>
            <div className="wiki-related-list">
              {neighbors.map((item) => (
                <Link key={item.id} href={wikiHref(item)}>
                  <strong>{item.title}</strong>
                  <span>{item.type}</span>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

export function WikiMissing() {
  return (
    <main className="wiki-native-page">
      <div className="wiki-native-layout">
        <WikiSidebar />
        <section className="wiki-native-content wiki-missing">
          <p className="wiki-kicker">WIKI.ANEVUM</p>
          <h1>Page not released</h1>
          <p>The public Wiki does not fall back to private canon when a route is unavailable.</p>
          <Link href={wikiHomeHref()} className="wiki-small-action">Return to main page</Link>
        </section>
      </div>
    </main>
  );
}
