import { useMemo, useState } from "react";
import { Eye, Search, Sparkles } from "lucide-react";
import { featuredPublicObjects, getPublicObjectBySlug, searchPublicObjects } from "./publicObjects";
import { Button, Link, RecordCard, SyncStamp, VisualArt } from "./ui";
import { HomePortalRail } from "./ExperienceChrome";

export function FrontDoor() {
  const lead = getPublicObjectBySlug("merva")!;
  return (
    <main className="production-home">
      <section className="home-hero production-home-hero">
        <VisualArt visualKey="connected" className="home-hero-art" />
        <div className="home-veil" />
        <div className="home-hero-lines" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">ANEVUM / STORIES FIRST</p>
          <h1>A universe in story.<br /><em>A story in everything.</em></h1>
          <p>Books at the center. Knowledge, discovery and belonging expanding outward from what is actually released.</p>
          <div className="actions"><Button href="/stories/reply">DISCOVER REPLY</Button><Button href="/wiki" quiet>ENTER THE UNIVERSE</Button></div>
        </div>
        <HomePortalRail />
        <div className="hero-caption"><span>THE TRANSCOSMIC</span><b>BOOKS · KNOWLEDGE · DISCOVERY · BELONGING</b></div>
      </section>

      <section className="story-feature section production-story-feature">
        <div className="story-feature-copy">
          <p className="eyebrow">THE TRANSCOSMIC / BOOK ONE</p>
          <h2>REPLY</h2>
          <p className="byline">DEVON AKINS</p>
          <p className="story-lead">Humanity receives a reply.</p>
          <p>The first published doorway into ANEVUM. The public surface stays inside the current spoiler-safe opening state while the book is in production.</p>
          <div className="actions"><Button href="/stories/reply">DISCOVER THE BOOK</Button><span className="production-state">IN PRODUCTION</span></div>
        </div>
        <div className="book-visual production-book-visual">
          <VisualArt visualKey="grainit" className="book-scene" />
          <div className="book-shell"><span>THE TRANSCOSMIC / BOOK ONE</span><strong>REPLY</strong><small>DEVON AKINS</small></div>
          <div className="book-visual-caption">STORY FIRST. THE WORLD OPENS OUTWARD.</div>
        </div>
      </section>

      <section className="section two-doors production-two-doors">
        <div className="section-head"><div><p className="eyebrow">THE UNIVERSE</p><h2>Read it. Then move through it.</h2></div><p>WIKI is the public canonical record. LATTICE is the same released universe expressed relationally as a navigable place.</p></div>
        <div className="door-grid">
          <Link href="/wiki" className="door-card"><VisualArt visualKey="veyra" /><div><span>KNOWLEDGE</span><h3>WIKI.ANEVUM</h3><p>People, worlds, places, events and ideas released from the live canon system.</p><b>OPEN WIKI</b></div></Link>
          <Link href="/lattice" className="door-card"><VisualArt visualKey="connected" /><div><span>DISCOVERY</span><h3>LATTICE.ANEVUM</h3><p>Move through public records spatially and establish your persistent identity with RHENLINK.</p><b>ENTER LATTICE</b></div></Link>
        </div>
      </section>

      <section className="section released-strip production-released-strip">
        <div className="section-head"><div><p className="eyebrow">THE PUBLIC RECORD</p><h2>Canon you can enter now.</h2></div><SyncStamp /></div>
        <div className="record-grid four">{featuredPublicObjects.slice(0, 4).map((record) => <RecordCard key={record.id} record={record} />)}</div>
        <div className="wide-feature production-wide-feature"><VisualArt visualKey={lead.visualKey} /><div><p className="eyebrow">OPENING-STATE PLACE</p><h3>{lead.title}</h3><p>{lead.summary}</p><Button href={lead.route} quiet>READ THE RECORD</Button></div></div>
      </section>
    </main>
  );
}

export function Stories() {
  return (
    <main className="route-main">
      <section className="route-hero production-route-hero"><VisualArt visualKey="road" /><div><p className="eyebrow">STORIES</p><h1>The story is the front door.</h1><p>ANEVUM begins with REPLY. Everything beyond the book is designed to make the universe deeper without replacing the act of reading.</p></div></section>
      <section className="section story-index"><Link href="/stories/reply" className="story-index-card"><div><span>THE TRANSCOSMIC / BOOK ONE</span><h2>REPLY</h2><p>Devon Akins · In production</p></div><div className="mini-book">REPLY</div><span aria-hidden="true">→</span></Link></section>
    </main>
  );
}

export function Reply() {
  const records = ["ovara", "merva", "neral", "serein-skygate"].map((slug) => getPublicObjectBySlug(slug)).filter(Boolean);
  return (
    <main className="route-main production-reply-page">
      <section className="reply-hero production-reply-hero"><VisualArt visualKey="road" /><div className="reply-hero-copy"><p className="eyebrow">THE TRANSCOSMIC / BOOK ONE</p><h1>REPLY</h1><p className="byline">DEVON AKINS</p><p className="story-lead">Humanity receives a reply.</p><p>The story page remains intentionally inside the public opening-state window while the manuscript and release package are in production.</p><div className="actions"><Button href="/wiki">EXPLORE THE RELEASED WORLD</Button><Button href="/lattice" quiet>OPEN LATTICE</Button></div></div></section>
      <section className="section"><div className="section-head"><div><p className="eyebrow">AROUND THE OPENING STORY</p><h2>Released records, not spoilers.</h2></div><p>These are current publication-cleared records from the live canon system.</p></div><div className="record-grid four">{records.map((record) => record ? <RecordCard key={record.id} record={record} /> : null)}</div></section>
    </main>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchPublicObjects(query), [query]);
  return (
    <main className="search-page production-search-page">
      <section className="section search-shell">
        <p className="eyebrow">SEARCH.ANEVUM</p>
        <h1>Find what connects.</h1>
        <p className="search-deck">Search the released public record only. Private canon never appears in results, autocomplete or fallback states.</p>
        <label className="search-big"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="World, person, place, system, idea..." aria-label="Search ANEVUM" /></label>
        <div className="search-count">{results.length} PUBLIC RESULTS</div>
        <div className="search-results">{results.map((record) => <RecordCard key={record.id} record={record} compact />)}</div>
      </section>
    </main>
  );
}

export function Transmissions() {
  return (
    <main className="route-main">
      <section className="route-hero production-route-hero"><VisualArt visualKey="event" /><div><p className="eyebrow">TRANSMISSIONS</p><h1>From ANEVUM.</h1><p>Company updates, production notes and deliberately released transmissions will live here when they exist. Nothing is backfilled for appearance.</p></div></section>
      <section className="section empty-state"><Eye size={26} /><span>CURRENT PUBLIC STATE</span><h2>No released transmissions yet.</h2><p>The channel is ready without pretending there is already an archive.</p></section>
    </main>
  );
}

export function Store() {
  return (
    <main className="route-main">
      <section className="route-hero production-route-hero"><VisualArt visualKey="grainit" /><div><p className="eyebrow">ANEVUM STORE</p><h1>Objects from the work.</h1><p>Books and physical objects appear here only when the product, art, price, fulfillment and sale state are real.</p></div></section>
      <section className="section empty-state"><Sparkles size={26} /><span>RELEASE REGISTER</span><h2>Physical releases remain in production.</h2></section>
    </main>
  );
}

export function NotFound() {
  return <main className="route-main"><section className="section empty-state"><span>404</span><h1>Nothing is published here.</h1><p>Unreleased routes do not fall through to private material.</p><Button href="/" quiet>RETURN HOME</Button></section></main>;
}
