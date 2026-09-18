import { ArrowRight, BookOpen, CircleUserRound, ExternalLink, Network, ShieldCheck } from "lucide-react";
import { LaunchTerminal } from "./LaunchTerminal";
import { PublicLegalStrip } from "./LegalPages";

const systems = [
  {
    label: "WIKI",
    title: "The canonical record.",
    copy: "The live ANEVUM Wiki is the source of truth for universe material. The public Wiki is a release-safe projection of records cleared for publication; it is not a second canon database.",
    href: "/wiki",
    external: true,
    icon: ShieldCheck,
  },
  {
    label: "LATTICE",
    title: "The relationships between released records.",
    copy: "Lattice turns publication-cleared Wiki records into a relational navigation surface. It can reveal connections between released material, but it does not create or override canon.",
    href: "/lattice",
    external: true,
    icon: Network,
  },
  {
    label: "RHENLINK",
    title: "One optional identity across ANEVUM.",
    copy: "RHENLINK keeps member progress, saves, achievements and release preferences together as ANEVUM expands. A RHENLINK is not required to read REPLY or browse the public launch site.",
    href: "/rhenlink",
    external: false,
    icon: CircleUserRound,
  },
] as const;

export function AboutPage() {
  return (
    <div className="about-page">
      <a className="launch-skip-link" href="#main-content">SKIP TO CONTENT</a>
      <LaunchTerminal />

      <header className="about-header">
        <a className="about-brand" href="/" aria-label="ANEVUM home">
          <strong>ANEVUM</strong>
          <small>A UNIVERSE IN STORY.</small>
        </a>
        <nav aria-label="About navigation">
          <a href="/the-book">THE BOOK</a>
          <a href="/store">STORE</a>
          <a href="/rhenlink">RHENLINK</a>
        </nav>
        <a className="about-reply-link" href="/">REPLY</a>
      </header>

      <main id="main-content">
        <section className="about-hero">
          <div className="about-hero-copy">
            <span>ANEVUM / ABOUT</span>
            <h1>Stories first.<br />A universe that stays coherent as it grows.</h1>
            <p>ANEVUM is an independent home for original stories and the systems that let those stories expand into a connected universe without replacing the books that began it.</p>
            <div className="about-actions">
              <a href="/the-book"><BookOpen size={15} /> BEGIN WITH REPLY <ArrowRight size={15} /></a>
              <a href="/wiki">OPEN THE WIKI <ExternalLink size={14} /></a>
            </div>
          </div>
          <div className="about-statement" aria-label="ANEVUM publishing principle">
            <small>THE PRINCIPLE</small>
            <strong>The story is the doorway.</strong>
            <p>Reference systems, maps, profiles and future participation exist to deepen the experience around finished work—not to make a reader learn a platform before they can enter the story.</p>
          </div>
        </section>

        <section className="about-reply-section">
          <div>
            <span>PUBLICATION 001</span>
            <h2>REPLY</h2>
            <p>REPLY is The Transcosmic Book One by Devon Akins and the first publication from ANEVUM. The current website is organized around that launch: discover the story, understand the book, follow its release, and then move outward into the released universe if you want to go further.</p>
          </div>
          <a href="/the-story">ENTER THE STORY <ArrowRight size={15} /></a>
        </section>

        <section className="about-systems-section" aria-labelledby="about-systems-title">
          <header>
            <span>ONE UNIVERSE / DIFFERENT FUNCTIONS</span>
            <h2 id="about-systems-title">The systems do different jobs.</h2>
            <p>ANEVUM does not maintain competing lore databases. Public systems resolve back to the canonical Wiki and its release controls.</p>
          </header>
          <div className="about-system-grid">
            {systems.map(({ label, title, copy, href, external, icon: Icon }) => (
              <article key={label}>
                <Icon size={19} strokeWidth={1.25} aria-hidden="true" />
                <span>{label}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <a href={href}>{label} {external ? <ExternalLink size={13} /> : <ArrowRight size={13} />}</a>
              </article>
            ))}
          </div>
        </section>

        <section className="about-canon-section">
          <div>
            <span>CANON / RELEASE</span>
            <h2>Canonical state and public release are separate decisions.</h2>
          </div>
          <div className="about-canon-copy">
            <p>The live Wiki tracks material through explicit lifecycle states, including Source-Locked, Locked, Canonical, Working, Unresolved, Exploratory, Superseded and Archived. Those states describe the record; they do not automatically make a record public.</p>
            <p>A separate publishing gate determines what the website may expose. That separation keeps Working or Superseded material from being presented as current public truth and lets future reveals happen deliberately.</p>
          </div>
        </section>

        <section className="about-founder-section">
          <span>WRITER / FOUNDER</span>
          <h2>Devon Akins</h2>
          <p>Devon Akins is the writer and founder of ANEVUM. His work follows extraordinary changes in civilization through familiar questions of love, family, purpose and belonging.</p>
          <a href="/the-book">OPEN REPLY <ArrowRight size={14} /></a>
        </section>
      </main>

      <footer className="about-footer">
        <a href="/"><strong>ANEVUM</strong><small>A UNIVERSE IN STORY.</small></a>
        <span><a href="/the-book">REPLY</a> · <a href="/store">STORE</a> · <a href="/rhenlink">RHENLINK</a></span>
      </footer>
      <PublicLegalStrip />
    </div>
  );
}
