import { useState, type FormEvent } from "react";
import { Eye, Search, Sparkles } from "lucide-react";
import { Button, Link, VisualArt, navigate } from "./ui";
import { HomePortalRail } from "./ExperienceChrome";

export function FrontDoor() {
  return (
    <main className="production-home">
      <section className="home-hero production-home-hero">
        <VisualArt visualKey="connected" className="home-hero-art" />
        <div className="home-veil" />
        <div className="home-hero-lines" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">ANEVUM / STORIES FIRST</p>
          <h1>A universe in story.<br /><em>A story in everything.</em></h1>
          <p>Books at the center. Knowledge, discovery and belonging expanding outward through deliberately published work.</p>
          <div className="actions"><Button href="/stories/reply">DISCOVER REPLY</Button><Button href="/wiki" quiet>OPEN WIKI</Button></div>
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
          <p>The first published doorway into ANEVUM. The public story surface remains spoiler-safe while the book is in production.</p>
          <div className="actions"><Button href="/stories/reply">DISCOVER THE BOOK</Button><span className="production-state">IN PRODUCTION</span></div>
        </div>
        <div className="book-visual production-book-visual">
          <VisualArt visualKey="grainit" className="book-scene" />
          <div className="book-shell"><span>THE TRANSCOSMIC / BOOK ONE</span><strong>REPLY</strong><small>DEVON AKINS</small></div>
          <div className="book-visual-caption">STORY FIRST. THE WORLD OPENS OUTWARD.</div>
        </div>
      </section>

      <section className="section two-doors production-two-doors">
        <div className="section-head"><div><p className="eyebrow">THE UNIVERSE</p><h2>Read it. Then move through it.</h2></div><p>WIKI is now the moderated public encyclopedia. LATTICE remains the relational universe surface built around published material and RHENLINK identity.</p></div>
        <div className="door-grid">
          <Link href="/wiki" className="door-card"><VisualArt visualKey="veyra" /><div><span>KNOWLEDGE</span><h3>WIKI.ANEVUM</h3><p>A public encyclopedia that begins blank. Members propose pages and edits; administrators decide what becomes published.</p><b>OPEN WIKI</b></div></Link>
          <Link href="/lattice" className="door-card"><VisualArt visualKey="connected" /><div><span>DISCOVERY</span><h3>LATTICE.ANEVUM</h3><p>Move through ANEVUM spatially and establish your persistent identity with RHENLINK.</p><b>ENTER LATTICE</b></div></Link>
        </div>
      </section>

      <section className="section released-strip production-released-strip">
        <div className="section-head"><div><p className="eyebrow">PUBLIC KNOWLEDGE</p><h2>Nothing is published by accident.</h2></div><p>The new WIKI does not mirror private canon automatically. Every public page enters through proposal, administrator review and permanent revision history.</p></div>
        <div className="wide-feature production-wide-feature"><VisualArt visualKey="connected" /><div><p className="eyebrow">WIKI GENERATION 1</p><h3>Start from zero.</h3><p>The encyclopedia can grow deliberately without exposing private development material or treating old hard-coded records as permanent infrastructure.</p><Button href="/wiki" quiet>ENTER THE WIKI</Button></div></div>
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
  return (
    <main className="route-main production-reply-page">
      <section className="reply-hero production-reply-hero"><VisualArt visualKey="road" /><div className="reply-hero-copy"><p className="eyebrow">THE TRANSCOSMIC / BOOK ONE</p><h1>REPLY</h1><p className="byline">DEVON AKINS</p><p className="story-lead">Humanity receives a reply.</p><p>The story page remains intentionally inside the public opening-state window while the manuscript and release package are in production.</p><div className="actions"><Button href="/wiki">OPEN THE PUBLIC WIKI</Button><Button href="/lattice" quiet>OPEN LATTICE</Button></div></div></section>
      <section className="section"><div className="section-head"><div><p className="eyebrow">PUBLIC REFERENCE</p><h2>The wiki now grows by approval.</h2></div><p>Story-facing reference pages will appear only after they are proposed and accepted into WIKI.ANEVUM. Private canon is not exposed as filler.</p></div><div className="actions"><Button href="/wiki">OPEN WIKI</Button><Button href="/wiki/new" quiet>PROPOSE A PAGE</Button></div></section>
    </main>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/wiki?query=${encodeURIComponent(value)}` : "/wiki");
  }
  return (
    <main className="search-page production-search-page">
      <section className="section search-shell">
        <p className="eyebrow">SEARCH.ANEVUM</p>
        <h1>Find what is public.</h1>
        <p className="search-deck">Universe reference search now resolves through the moderated public Wiki. Private canon never appears in search results or autocomplete.</p>
        <form onSubmit={submit}><label className="search-big"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search published wiki pages..." aria-label="Search ANEVUM" /></label><div className="actions"><button type="submit" className="button native">SEARCH WIKI</button></div></form>
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
