import { useState, type FormEvent } from "react";
import { Eye, Search, Sparkles } from "lucide-react";
import { Button, Link, VisualArt, navigate } from "./ui";
import { HomePortalRail } from "./ExperienceChrome";

const homeSurfaces = [
  { label: "STORIES", note: "Books, characters, and the narrative beyond.", href: "/stories", visual: "road" as const },
  { label: "WIKI", note: "The public record. Knowledge published deliberately.", href: "/wiki", visual: "deep-three" as const },
  { label: "LATTICE", note: "A living map of connection and discovery.", href: "/lattice", visual: "connected" as const },
  { label: "RHENLINK", note: "Your persistent identity across ANEVUM.", href: "/rhenlink", visual: "person" as const },
] as const;

export function FrontDoor() {
  return (
    <main className="production-home reference-home">
      <section className="home-hero production-home-hero reference-home-hero">
        <VisualArt visualKey="connected" className="home-hero-art" />
        <div className="home-veil" />
        <div className="home-hero-lines" aria-hidden="true" />
        <div className="hero-copy reference-hero-copy">
          <p className="eyebrow">WELCOME TO ANEVUM</p>
          <h1>Stories create<br /><em>worlds.</em></h1>
          <p>Books at the center. Knowledge, discovery, identity, and a larger universe opening outward from the story.</p>
          <div className="actions"><Button href="/stories/reply">DISCOVER REPLY</Button><Button href="/lattice" quiet>ENTER THE UNIVERSE</Button></div>
        </div>
        <HomePortalRail />
        <div className="hero-caption"><span>A UNIVERSE IN STORY.</span><b>A STORY IN EVERYTHING.</b></div>
      </section>

      <section className="reference-surface-band" aria-label="Explore ANEVUM">
        {homeSurfaces.map((surface) => (
          <Link href={surface.href} key={surface.href} className="reference-surface-card">
            <VisualArt visualKey={surface.visual} />
            <div><span>EXPLORE</span><h2>{surface.label}</h2><p>{surface.note}</p><b>↗</b></div>
          </Link>
        ))}
      </section>

      <section className="story-feature section production-story-feature reference-reply-feature">
        <div className="story-feature-copy">
          <p className="eyebrow">THE TRANSCOSMIC / BOOK ONE</p>
          <h2>REPLY</h2>
          <p className="byline">DEVON AKINS</p>
          <p className="story-lead">Humanity receives a reply.</p>
          <p>The first published doorway into ANEVUM. Story first; everything beyond it exists to deepen the experience rather than replace it.</p>
          <div className="actions"><Button href="/stories/reply">DISCOVER THE BOOK</Button><span className="production-state">IN PRODUCTION</span></div>
        </div>
        <div className="book-visual production-book-visual">
          <VisualArt visualKey="grainit" className="book-scene" />
          <div className="book-shell"><span>THE TRANSCOSMIC / BOOK ONE</span><strong>REPLY</strong><small>DEVON AKINS</small></div>
          <div className="book-visual-caption">A STORY ABOUT A LARGER TOMORROW.</div>
        </div>
      </section>

      <section className="section two-doors production-two-doors reference-two-doors">
        <div className="section-head"><div><p className="eyebrow">THE UNIVERSE</p><h2>Read it. Then move through it.</h2></div><p>WIKI is the public knowledge surface. LATTICE is the relational universe surface. RHENLINK carries identity between them.</p></div>
        <div className="door-grid">
          <Link href="/wiki" className="door-card"><VisualArt visualKey="deep-three" /><div><span>KNOWLEDGE</span><h3>WIKI.ANEVUM</h3><p>A moderated public encyclopedia built through proposal, review, and permanent revision history.</p><b>OPEN WIKI</b></div></Link>
          <Link href="/lattice" className="door-card"><VisualArt visualKey="connected" /><div><span>DISCOVERY</span><h3>LATTICE.ANEVUM</h3><p>Move through published ANEVUM material as relationships, places, stories, and connections.</p><b>ENTER LATTICE</b></div></Link>
        </div>
      </section>

      <section className="section released-strip production-released-strip reference-system-state">
        <div className="section-head"><div><p className="eyebrow">PUBLICATION DISCIPLINE</p><h2>Nothing is published by accident.</h2></div><p>The live Canon Wiki remains private source authority. Public ANEVUM surfaces expose only deliberately released material.</p></div>
        <div className="wide-feature production-wide-feature"><VisualArt visualKey="connected" /><div><p className="eyebrow">ANEVUM GENERATION 1</p><h3>One universe. Distinct surfaces.</h3><p>Stories, knowledge, discovery, identity, and operations now share one underlying React system while keeping the visual role of each surface clear.</p><Button href="/lattice" quiet>EXPLORE THE SYSTEM</Button></div></div>
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
      <section className="section"><div className="section-head"><div><p className="eyebrow">PUBLIC REFERENCE</p><h2>The wiki grows by approval.</h2></div><p>Story-facing reference pages appear only after they are proposed and accepted into WIKI.ANEVUM. Private canon is never exposed as filler.</p></div><div className="actions"><Button href="/wiki">OPEN WIKI</Button><Button href="/wiki/new" quiet>PROPOSE A PAGE</Button></div></section>
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
        <h1>Search a wider universe.</h1>
        <p className="search-deck">Search resolves through the moderated public Wiki. Private canon never appears in results or autocomplete.</p>
        <form onSubmit={submit}><label className="search-big"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search published wiki pages..." aria-label="Search ANEVUM" /></label><div className="actions"><button type="submit" className="button native">SEARCH WIKI</button></div></form>
      </section>
    </main>
  );
}

export function Transmissions() {
  return (
    <main className="route-main">
      <section className="route-hero production-route-hero"><VisualArt visualKey="event" /><div><p className="eyebrow">ANEVUM TRANSMISSIONS</p><h1>Ideas travel farther here.</h1><p>Studio updates, release notes, development material, and deliberately published company transmissions will live here as they are released.</p></div></section>
      <section className="section empty-state"><Eye size={26} /><span>CURRENT PUBLIC STATE</span><h2>No released transmissions yet.</h2><p>The channel is ready without pretending there is already an archive.</p></section>
    </main>
  );
}

export function Store() {
  return (
    <main className="route-main">
      <section className="route-hero production-route-hero"><VisualArt visualKey="grainit" /><div><p className="eyebrow">ANEVUM STORE</p><h1>More than things.</h1><p>Books, art, and physical objects appear here only when the product, artwork, price, fulfillment, and sale state are real.</p></div></section>
      <section className="section empty-state"><Sparkles size={26} /><span>RELEASE REGISTER</span><h2>Physical releases remain in production.</h2></section>
    </main>
  );
}

export function NotFound() {
  return <main className="route-main"><section className="section empty-state"><span>404</span><h1>Nothing is published here.</h1><p>Unreleased routes do not fall through to private material.</p><Button href="/" quiet>RETURN HOME</Button></section></main>;
}
