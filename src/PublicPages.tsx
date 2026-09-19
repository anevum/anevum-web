import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Eye, Orbit, Search, Sparkles } from "lucide-react";
import { Button, Link, navigate } from "./ui";
import { BrandArt, type BrandArtVariant } from "./BrandArt";
import { publicObjects } from "./publicObjects";

const releaseInterestHref = (source: string) => `/rhenlink?intent=reply-release&source=${encodeURIComponent(source)}`;

const homeSurfaces: Array<{ label: string; note: string; href: string; variant: BrandArtVariant; number: string }> = [
  { number: "01", label: "STORIES", note: "Begin with the work itself. REPLY is Publication 001 and the first doorway into ANEVUM.", href: "/stories", variant: "signal" },
  { number: "02", label: "EXPLORE", note: "Follow connections among released places, people, institutions, technologies, and events.", href: "/explore", variant: "relations" },
  { number: "03", label: "ARCHIVE", note: "Search the deeper public record without crossing the boundary into private canon.", href: "/archive", variant: "archive" },
  { number: "04", label: "LATTICE", note: "Carry your identity and discoveries through the persistent member layer.", href: "/lattice", variant: "identity" },
];

function BookMonolith({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`public-book-stage${compact ? " compact" : ""}`} aria-label="REPLY book presentation">
      <div className="public-book-orbit" aria-hidden="true"><i /><i /><i /></div>
      <div className="public-book-object"><span>THE TRANSCOSMIC / BOOK ONE</span><strong>REPLY</strong><small>DEVON AKINS</small></div>
    </div>
  );
}

export function FrontDoor() {
  return (
    <main className="public-experience public-home">
      <section className="public-home-hero" aria-labelledby="anevum-title">
        <BrandArt variant="horizon" className="public-home-art" label="An abstract horizon opening into a field of stars" />
        <div className="public-home-measure" aria-hidden="true"><span>ANE / 001</span><i /><i /><i /><i /></div>
        <div className="public-home-copy">
          <p className="public-kicker">INDEPENDENT PUBLISHER · STORY UNIVERSE</p>
          <h1 id="anevum-title">ANEVUM</h1>
          <p className="public-manifesto">A universe in story.</p>
          <p className="public-deck">Original science fiction built outward from finished books—into a living public record, a relational universe, and a lasting connection with readers.</p>
          <div className="public-actions"><Button href="/stories/reply">ENTER THROUGH REPLY</Button><Button href="/explore" quiet>EXPLORE ANEVUM</Button></div>
        </div>
        <div className="public-home-status"><span>NOW ENTERING</span><strong>PUBLICATION 001</strong><small>REPLY · APPROACHING PUBLICATION</small></div>
      </section>

      <section className="public-sequence" aria-label="Enter ANEVUM">
        {homeSurfaces.map((surface) => (
          <Link href={surface.href} key={surface.href} className="public-sequence-card">
            <BrandArt variant={surface.variant} />
            <div><span>{surface.number}</span><h2>{surface.label}</h2><p>{surface.note}</p><b>ENTER <ArrowRight size={15} /></b></div>
          </Link>
        ))}
      </section>

      <section className="public-reply-feature">
        <div className="public-reply-copy">
          <p className="public-kicker">PUBLICATION 001 · THE TRANSCOSMIC / BOOK ONE</p>
          <h2>REPLY</h2>
          <p className="public-byline">A NOVEL BY DEVON AKINS</p>
          <p className="public-pull">A measurement that should be ordinary opens a larger universe.</p>
          <p>REPLY is ANEVUM’s first publication: a human-scale science-fiction story about contact, work, family, intelligence, possibility, and belonging.</p>
          <div className="public-actions"><Button href="/the-book">DISCOVER THE BOOK</Button><Button href={releaseInterestHref("anevum-home")} quiet>GET RELEASE UPDATES</Button></div>
          <div className="public-release-line"><i /><span>Paperback files submitted · digital eProof pending</span></div>
        </div>
        <BookMonolith />
      </section>

      <section className="public-principle">
        <span>STORY → DISCOVERY → DEPTH → RELATIONSHIP</span>
        <h2>The books remain the center.</h2>
        <p>ANEVUM expands only where the published story makes room for it. Explore relationships, read the released record, then use RHENLINK to keep your place as the universe grows.</p>
        <div className="public-principle-links"><Link href="/wiki">READ THE PUBLIC WIKI <ArrowRight size={15} /></Link><Link href="/rhenlink">UNDERSTAND RHENLINK <ArrowRight size={15} /></Link></div>
      </section>
    </main>
  );
}

export function Stories() {
  return (
    <main className="public-experience public-route">
      <section className="public-route-hero stories-hero"><BrandArt variant="signal" /><div><p className="public-kicker">ANEVUM / STORIES</p><h1>The story is the first door.</h1><p>Every public layer begins with the work itself. REPLY is the current story and the first publication from ANEVUM.</p></div></section>
      <section className="public-story-index">
        <Link href="/stories/reply" className="public-story-card"><div className="public-story-number">001</div><div><span>THE TRANSCOSMIC / BOOK ONE</span><h2>REPLY</h2><p>Devon Akins</p><small>APPROACHING PUBLICATION</small></div><BookMonolith compact /><ArrowRight size={24} /></Link>
      </section>
    </main>
  );
}

export function ExplorePage() {
  const featured = publicObjects.filter((record) => record.publicWindow === "NOW").slice(0, 7);
  return (
    <main className="public-experience public-route">
      <section className="public-route-hero explore-hero"><BrandArt variant="relations" /><div><p className="public-kicker">ANEVUM / EXPLORE</p><h1>Nothing exists alone.</h1><p>Move through the public universe by relation rather than hierarchy. Every path below leads only to material already released through the public record.</p></div></section>
      <section className="public-constellation" aria-label="Featured public records">
        <div className="constellation-core"><Orbit size={28} /><strong>ANEVUM</strong><span>PUBLIC FIELD</span></div>
        {featured.map((record, index) => <Link href={record.route} className={`constellation-node node-${index + 1}`} key={record.id}><span>{record.type}</span><strong>{record.title}</strong><small>{record.section}</small></Link>)}
      </section>
      <section className="public-route-cta"><div><p className="public-kicker">RELATIONAL VIEW</p><h2>Continue in LATTICE.</h2><p>LATTICE connects public records to your RHENLINK identity and preserves the member systems that already work.</p></div><Button href="/lattice">OPEN LATTICE</Button></section>
    </main>
  );
}

export function ArchivePage() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get("query") || "");
  const [section, setSection] = useState("ALL");
  const records = useMemo(() => publicObjects.filter((record) => {
    const text = `${record.title} ${record.type} ${record.section} ${record.summary}`.toLowerCase();
    return (section === "ALL" || record.section === section) && text.includes(query.trim().toLowerCase());
  }), [query, section]);
  const sections = ["ALL", ...Array.from(new Set(publicObjects.map((record) => record.section)))];
  return (
    <main className="public-experience public-route public-archive">
      <section className="public-archive-head"><div><p className="public-kicker">ANEVUM / ARCHIVE</p><h1>The released record.</h1></div><p>Search and filter publication-safe records. The Archive does not surface unresolved, superseded, future-book, or private canon.</p></section>
      <section className="archive-controls" aria-label="Archive controls"><label><Search size={18} /><span className="sr-only">Search records</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the public record" /></label><div>{sections.map((value) => <button className={section === value ? "active" : ""} type="button" key={value} onClick={() => setSection(value)}>{value}</button>)}</div></section>
      <section className="archive-results" aria-live="polite">
        <div className="archive-count"><span>{String(records.length).padStart(2, "0")} RECORDS</span><small>PUBLIC PROJECTION · CURRENT SITE BASELINE</small></div>
        {records.map((record) => <Link href={record.route} className="archive-record" key={record.id}><span>{record.section}</span><div><small>{record.type}</small><h2>{record.title}</h2><p>{record.summary}</p></div><ArrowRight size={18} /></Link>)}
        {!records.length ? <div className="archive-empty"><Eye size={22} /><h2>No released record matches.</h2><p>Try a broader term or another section.</p></div> : null}
      </section>
    </main>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); navigate(query.trim() ? `/archive?query=${encodeURIComponent(query.trim())}` : "/archive"); }
  return <main className="public-experience public-search"><section><p className="public-kicker">SEARCH ANEVUM</p><h1>Find a signal.</h1><p>Search resolves through the publication-safe Archive and public Wiki. Private canon never appears in results or suggestions.</p><form onSubmit={submit}><label><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="People, places, institutions, technologies…" aria-label="Search ANEVUM" /></label><button type="submit">SEARCH <ArrowRight size={16} /></button></form></section></main>;
}

export function Transmissions() {
  return <main className="public-experience public-route"><section className="public-route-hero transmission-hero"><BrandArt variant="signal" /><div><p className="public-kicker">ANEVUM / TRANSMISSIONS</p><h1>From the work in progress.</h1><p>Publication progress, essays, production notes, and future announcements will collect here when they are ready to be public.</p></div></section><section className="public-empty-state"><Eye size={26} /><span>CHANNEL STATE / OPEN</span><h2>No public transmissions yet.</h2><p>The surface is ready. It will not be filled with invented news.</p><Button href={releaseInterestHref("transmissions")} quiet>GET REPLY UPDATES</Button></section></main>;
}

export function Store() {
  return <main className="public-experience public-route"><section className="public-route-hero store-hero"><BrandArt variant="horizon" /><div><p className="public-kicker">ANEVUM / OBJECTS + PUBLICATIONS</p><h1>Things from the universe.</h1><p>The Store opens around real books, editions, art, and objects. Nothing appears for sale before its details and destination are verified.</p></div></section><section className="public-store-object"><BookMonolith compact /><div><span>PUBLICATION 001</span><h2>REPLY</h2><p>Paperback files are submitted to IngramSpark and processing toward the digital eProof. Retailer, price, and purchase links will appear only after verification.</p><div className="public-store-status"><i /><strong>APPROACHING PUBLICATION</strong></div><Button href={releaseInterestHref("store")} quiet>GET RELEASE UPDATES</Button></div></section><section className="public-empty-state latent"><Sparkles size={24} /><span>OBJECT REGISTER</span><h2>Further objects remain latent.</h2><p>OBJ-0001 and later objects will appear only when they are genuinely ready.</p></section></main>;
}

export function NotFound() {
  return <main className="public-experience public-route"><section className="public-empty-state"><span>404 / SIGNAL LOST</span><h1>Nothing is published here.</h1><p>Unreleased routes do not fall through to private material.</p><Button href="/" quiet>RETURN HOME</Button></section></main>;
}
