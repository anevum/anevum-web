import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Layers3, Map, Search } from "lucide-react";
import { publicObjects, getPublicObjectBySlug, searchPublicObjects } from "./publicObjects";
import { getWikiDetail } from "./wikiDetails";
import { Button, Link, RecordCard, SyncStamp, VisualArt } from "./ui";

function TypeIndex({ onSelect }: { onSelect: (value: string) => void }) {
  const entries = [
    ["WORLDS", "PLANET", "Planetary records and inhabited worlds"],
    ["PLACES", "SETTLEMENT", "Cities, regions, facilities and gate-cities"],
    ["PEOPLE", "PERSON", "Released character and historical-person records"],
    ["SYSTEMS", "TECHNOLOGY", "Infrastructure, interfaces and engineered systems"],
    ["SCIENCE", "THEORY", "Scientific and conceptual records"],
    ["ARCHIVE", "ARCHIVE", "Released historical fragments and events"],
  ] as const;

  return (
    <div className="wiki-type-index">
      {entries.map(([label, query, description], index) => (
        <button type="button" key={label} onClick={() => onSelect(query)}>
          <span className="wiki-type-number">0{index + 1}</span>
          <span className="wiki-type-mark" aria-hidden="true"><i /><i /></span>
          <strong>{label}</strong>
          <small>{description}</small>
        </button>
      ))}
    </div>
  );
}

export function WikiHome() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("ALL");
  const results = useMemo(() => searchPublicObjects(query, section), [query, section]);
  const lead = getPublicObjectBySlug("merva")!;
  const featured = ["merva", "ovara", "neral", "connected-worlds", "veyra", "ione"]
    .map((slug) => getPublicObjectBySlug(slug))
    .filter(Boolean);

  return (
    <main className="wiki-page production-wiki">
      <section className="wiki-hero production-wiki-hero">
        <VisualArt visualKey="serein" />
        <div className="wiki-hero-texture" aria-hidden="true" />
        <div className="wiki-hero-copy">
          <p className="eyebrow">WIKI.ANEVUM / PUBLIC CANON</p>
          <h1>The known record.</h1>
          <p className="wiki-hero-deck">People. Worlds. Places. Events. Ideas.</p>
          <p className="wiki-hero-intro">A reader-facing encyclopedia built from the live Transcosmic Canon Wiki. Only records that clear the current publication gates appear here.</p>
          <label className="wiki-search production-wiki-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the released universe..." aria-label="Search released canon" />
          </label>
        </div>
        <SyncStamp />
      </section>

      <section className="section wiki-index-section">
        <div className="section-head compact-head">
          <div><p className="eyebrow">EXPLORE BY TYPE</p><h2>Different paths through one record.</h2></div>
          <p>The public Wiki is not a mirror of the private workspace. It is the deliberately released layer of the universe.</p>
        </div>
        <TypeIndex onSelect={(value) => { setQuery(value); window.scrollTo({ top: 1040, behavior: "smooth" }); }} />
      </section>

      <section className="section wiki-feature-stage">
        <div className="wiki-feature-image"><VisualArt visualKey={lead.visualKey} /></div>
        <div className="wiki-feature-copy">
          <span className="meta">FEATURED / {lead.type}</span>
          <h2>{lead.title}</h2>
          <p>{lead.summary}</p>
          <div className="wiki-feature-metadata"><span>FULL PUBLIC RECORD</span><span>REPLY ERA</span><span>OPENING STATE</span></div>
          <Button href={lead.route}>OPEN MERVA</Button>
        </div>
      </section>

      <section className="section wiki-browser production-wiki-browser">
        <div className="wiki-filterbar">
          <div className="filter-tabs">
            {["ALL", "UNIVERSE", "ATLAS", "ARCHIVE"].map((value) => <button type="button" key={value} className={section === value ? "active" : ""} onClick={() => setSection(value)}>{value}</button>)}
          </div>
          <span>{results.length} RELEASED RECORDS</span>
        </div>
        {query ? <div className="wiki-query-state"><span>FILTER</span><strong>{query}</strong><button type="button" onClick={() => setQuery("")}>CLEAR</button></div> : null}
        <div className="record-grid wiki-grid">{results.map((record) => <RecordCard key={record.id} record={record} />)}</div>
      </section>

      <section className="section wiki-featured-row">
        <div className="section-head compact-head"><div><p className="eyebrow">CORE PUBLIC RECORDS</p><h2>Start with the worlds around REPLY.</h2></div><Button href="/lattice" quiet>MOVE THROUGH LATTICE</Button></div>
        <div className="wiki-core-strip">{featured.map((record) => record ? <RecordCard key={record.id} record={record} compact /> : null)}</div>
      </section>
    </main>
  );
}

function RecordContents({ slug }: { slug: string }) {
  const detail = getWikiDetail(slug);
  if (!detail) return null;
  return (
    <div className="wiki-prose-sections">
      {detail.sections.map((section, index) => (
        <section key={section.title} className="wiki-prose-section">
          <span className="wiki-section-index">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          </div>
        </section>
      ))}
    </div>
  );
}

function RecordRail({ slug }: { slug: string }) {
  const record = getPublicObjectBySlug(slug)!;
  const detail = getWikiDetail(slug);
  return (
    <aside className="wiki-record-rail">
      <div className="wiki-rail-block">
        <span className="rail-label">RECORD</span>
        <dl>
          <div><dt>Type</dt><dd>{record.type}</dd></div>
          <div><dt>Section</dt><dd>{record.section}</dd></div>
          <div><dt>Render</dt><dd>{record.renderMode}</dd></div>
          <div><dt>Window</dt><dd>{record.publicWindow}</dd></div>
          <div><dt>Visual</dt><dd>{record.visualStatus}</dd></div>
        </dl>
      </div>
      {detail ? <div className="wiki-rail-block source-state"><span className="rail-label">SOURCE STATE</span><strong>{detail.sourceState}</strong><small>{detail.sourceLabel}</small></div> : null}
      <Button href="/lattice">EXPLORE CONNECTIONS</Button>
      <Button href="/rhenlink" quiet>SAVE WITH RHENLINK</Button>
    </aside>
  );
}

export function WikiRecord({ slug }: { slug: string }) {
  const record = getPublicObjectBySlug(slug);
  if (!record) return <WikiMissing />;
  const detail = getWikiDetail(slug);
  const neighbors = publicObjects.filter((item) => item.id !== record.id && (item.section === record.section || item.type === record.type)).slice(0, 4);

  return (
    <main className="record-page production-record-page">
      <section className="record-hero production-record-hero">
        <VisualArt visualKey={record.visualKey} label={`Public visual treatment for ${record.title}`} />
        <div className="record-hero-grain" aria-hidden="true" />
        <div className="record-hero-copy">
          <Link href="/wiki" className="back"><ArrowLeft size={14} /> WIKI.ANEVUM</Link>
          <p className="eyebrow">{record.section} / {record.type}</p>
          <h1>{record.title}</h1>
          <p className="record-deck">{detail?.lead || record.summary}</p>
          <div className="badges"><span>{record.renderMode}</span><span>{record.spoilerLevel}</span>{detail ? <span>LIVE WIKI SOURCE</span> : null}</div>
        </div>
        <div className="record-hero-index"><span>{record.section}</span><strong>{record.id.toUpperCase()}</strong></div>
      </section>

      <div className="record-subnav">
        <span><BookOpen size={14} /> ARTICLE</span>
        <span><Layers3 size={14} /> CONNECTED RECORDS</span>
        <span><Map size={14} /> VISUAL RECORD</span>
      </div>

      <section className="section wiki-record-layout">
        <article className="wiki-record-article">
          <div className="wiki-record-lead">
            <p className="eyebrow">PUBLIC CANON</p>
            <h2>{detail?.lead || record.summary}</h2>
          </div>
          {record.facts?.length ? <div className="fact-grid editorial-facts">{record.facts.map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div> : null}
          <RecordContents slug={slug} />
          {!detail ? <div className="wiki-curated-summary"><p>{record.summary}</p><p>This record is currently published at {record.renderMode.toLowerCase()} depth. Additional private source material is not projected into the public Wiki.</p></div> : null}
          <div className="publication-note production-publication-note"><span>PUBLICATION BOUNDARY</span><p>{record.publicNote}</p></div>
        </article>
        <RecordRail slug={slug} />
      </section>

      <section className="section related production-related">
        <div className="section-head compact-head"><div><p className="eyebrow">CONNECTED PUBLIC RECORDS</p><h2>Continue through the universe.</h2></div><Button href="/lattice" quiet>OPEN LATTICE</Button></div>
        <div className="record-grid four">{neighbors.map((item) => <RecordCard key={item.id} record={item} />)}</div>
      </section>
    </main>
  );
}

export function WikiMissing() {
  return (
    <main className="route-main">
      <section className="section empty-state"><span>WIKI.ANEVUM</span><h1>Nothing is released here.</h1><p>The public Wiki does not fall back to private canon when a route is unavailable.</p><Button href="/wiki" quiet>RETURN TO WIKI</Button></section>
    </main>
  );
}
