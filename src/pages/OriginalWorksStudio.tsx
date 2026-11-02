import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "../components/Mark";
import AtlasExplorer from "./AtlasExplorer";
import ReplyReadingRoom from "./ReplyReadingRoom";
import "../styles/original-works-preview.css";

/**
 * Anevum original-works studio redesign — isolated visual-review surface.
 *
 * This route is intentionally NOT the public homepage yet. It uses only curated
 * pre-release canon already approved for reader orientation and does not fetch,
 * serialize, or expose the private Notion canon database.
 *
 * The submitted REPLY edition and the author's upcoming revision are separate
 * production states. No availability, purchase, or release-date claim is made.
 */
const ROOT = "/design/original-works";

const PATH = {
  home: ROOT,
  works: ROOT + "/works",
  reply: ROOT + "/reply",
  reading: ROOT + "/reply/reading-room",
  transcosmic: ROOT + "/transcosmic",
  atlas: ROOT + "/atlas",
  journal: ROOT + "/journal",
  about: ROOT + "/about"
} as const;

type Page = keyof typeof PATH;

const NAV: ReadonlyArray<{ page: Page; label: string }> = [
  { page: "works", label: "Works" },
  { page: "transcosmic", label: "Transcosmic" },
  { page: "atlas", label: "The Atlas" },
  { page: "journal", label: "Journal" },
  { page: "about", label: "About" }
];

function currentPage(pathname: string): Page | "atlas-detail" | "not-found" {
  if (pathname.startsWith(PATH.atlas + "/")) return "atlas-detail";
  const exact = (Object.entries(PATH) as Array<[Page, string]>)
    .find(([, path]) => pathname === path || pathname === path + "/");
  return exact?.[0] || "not-found";
}

function LinkAction({
  to, children, secondary = false
}: {
  to: string; children: ReactNode; secondary?: boolean;
}) {
  return <Link className={"ow-action" + (secondary ? " ow-action-outline" : "")} to={to}>
    <span>{children}</span><span aria-hidden="true" className="ow-action-arrow">↗</span>
  </Link>;
}

function Wordmark() {
  return <Link className="ow-brand" to={PATH.home} aria-label="Anevum studio preview home">
    <span className="ow-brand-mark" aria-hidden="true"><Mark /></span>
    <span className="ow-brand-type">Anevum</span>
  </Link>;
}

function SignalScene({ compact = false }: { compact?: boolean }) {
  // Deliberately abstract editorial geometry, not a literal Skygate or cover.
  return <div className={"ow-scene" + (compact ? " ow-scene-compact" : "")} aria-hidden="true">
    <span className="ow-scene-lattice" />
    <span className="ow-scene-orbit ow-scene-orbit-outer" />
    <span className="ow-scene-orbit ow-scene-orbit-mid" />
    <span className="ow-scene-orbit ow-scene-orbit-inner" />
    <span className="ow-scene-vertical" />
    <span className="ow-scene-signal" />
    <span className="ow-scene-node" />
    <span className="ow-scene-horizon" />
  </div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="ow-eyebrow">{children}</p>;
}

function StudioHome() {
  return <>
    <section className="ow-hero" aria-labelledby="ow-hero-title">
      <SignalScene />
      <div className="ow-hero-copy">
        <Eyebrow>An independent studio of original works</Eyebrow>
        <h1 id="ow-hero-title">Somewhere,<br /><em>someone</em><br />answered.</h1>
        <p className="ow-intro">A story begins with evidence nobody can dismiss. Explore <cite>REPLY</cite>, the first novel in The Transcosmic.</p>
        <div className="ow-actions">
          <LinkAction to={PATH.reply}>Discover REPLY</LinkAction>
          <LinkAction to={PATH.transcosmic} secondary>Enter the universe</LinkAction>
        </div>
      </div>
      <div className="ow-hero-marker" aria-hidden="true">
        <span>FIRST WORK / 001</span>
        <strong>REPLY</strong>
        <span>THE TRANSCOSMIC</span>
      </div>
      <p className="ow-scene-note">Conceptual studio artwork · not a canon depiction</p>
    </section>
    <section className="ow-home-grid ow-container" aria-label="Explore the studio">
      <Link to={PATH.reply} className="ow-feature ow-feature-book">
        <span className="ow-feature-index">01 / THE FIRST WORK</span>
        <strong>REPLY</strong>
        <span>One anomalous measurement. A response from beyond a world.</span>
        <span className="ow-feature-link">Explore the novel <span aria-hidden="true">↗</span></span>
      </Link>
      <Link to={PATH.atlas} className="ow-feature">
        <span className="ow-feature-index">02 / THE UNIVERSE</span>
        <strong>The Atlas</strong>
        <span>Discover the worlds, people, and everyday realities of The Transcosmic.</span>
        <span className="ow-feature-link">Open the archive <span aria-hidden="true">↗</span></span>
      </Link>
      <Link to={PATH.journal} className="ow-feature">
        <span className="ow-feature-index">03 / THE PROCESS</span>
        <strong>Studio Journal</strong>
        <span>Notes on authorship, scientific imagination, worldbuilding, and revision.</span>
        <span className="ow-feature-link">Inside the studio <span aria-hidden="true">↗</span></span>
      </Link>
    </section>
    <section className="ow-quote ow-container" aria-labelledby="ow-quote-title">
      <Eyebrow>Why this world exists</Eyebrow>
      <h2 id="ow-quote-title">The extraordinary matters most when it changes an ordinary life.</h2>
      <p>Science, history, relationships, and the worlds between them: the work is built to hold up to a closer look.</p>
    </section>
  </>;
}

function WorksPage() {
  return <section className="ow-page ow-container" aria-labelledby="ow-works-title">
    <Eyebrow>01 / Original works</Eyebrow>
    <h1 id="ow-works-title">Stories worth<br /><em>building worlds for.</em></h1>
    <p className="ow-page-lead">Anevum creates original stories and the experiences that grow from them. We begin with one work, rather than a catalogue of promises.</p>
    <Link to={PATH.reply} className="ow-work-card">
      <span className="ow-work-art" aria-hidden="true"><span className="ow-work-line" /><strong>REPLY</strong><small>BOOK ONE · THE TRANSCOSMIC</small></span>
      <span className="ow-work-body">
        <span className="ow-card-kicker">Flagship novel · Author revision active</span>
        <strong>REPLY</strong>
        <span>On Ovara, an instrumentation specialist refuses to dismiss a result she cannot explain. What follows reaches beyond her world.</span>
        <span className="ow-read-more">View the work <span aria-hidden="true">↗</span></span>
      </span>
    </Link>
    <p className="ow-fineprint">Cover above is a typographic design study; the previously approved cover master will be integrated only after asset verification.</p>
  </section>;
}

function ReplyPage() {
  return <section className="ow-page ow-container ow-reply-page" aria-labelledby="ow-reply-title">
    <div className="ow-breadcrumb"><Link to={PATH.works}>Works</Link><span aria-hidden="true">/</span><span>REPLY</span></div>
    <div className="ow-reply-layout">
      <div className="ow-reply-copy">
        <Eyebrow>The Transcosmic · Book One</Eyebrow>
        <h1 id="ow-reply-title" className="ow-book-heading">REPLY</h1>
        <p className="ow-authorship">A novel by Devon Akins</p>
        <p className="ow-page-lead">A measurement survives every explanation that should have removed it. On Ovara, a worker refuses to erase the evidence.</p>
        <p>The reply comes from people already living across worlds—human societies with their own histories, institutions, work, families, and questions about the future. Discovery offers new possibilities without deciding what anyone must do with their life.</p>
        <div className="ow-edition" role="note">
          <span className="ow-edition-dot" aria-hidden="true" />
          <div><strong>Author revision in progress</strong><p>The existing paperback submission is preserved while the text is revisited. Revised-edition availability and retailer information are not yet confirmed.</p></div>
        </div>
        <div className="ow-actions">
          <LinkAction to={PATH.reading}>Explore the signal studies</LinkAction>
          <LinkAction to={PATH.transcosmic} secondary>Explore the universe</LinkAction>
          <LinkAction to={PATH.atlas} secondary>Browse the Atlas</LinkAction>
        </div>
      </div>
      <div className="ow-book-stage">
        <div className="ow-book-concept" role="img" aria-label="Typographic design study of REPLY, not its final cover">
          <div className="ow-book-spine" aria-hidden="true" />
          <div className="ow-book-face">
            <span>THE TRANSCOSMIC · BOOK ONE</span>
            <strong>REPLY</strong>
            <span>DEVON AKINS</span>
          </div>
        </div>
        <p>Typographic study · Approved cover art to be restored</p>
      </div>
    </div>
  </section>;
}

function TranscosmicPage() {
  return <section className="ow-page ow-container" aria-labelledby="ow-transcosmic-title">
    <Eyebrow>02 / A living universe</Eyebrow>
    <h1 id="ow-transcosmic-title">The<br /><em>Transcosmic.</em></h1>
    <p className="ow-page-lead">A human future at extraordinary scale, where engineering has made distant worlds reachable and ordinary lives remain anything but simple.</p>
    <div className="ow-universe-panel">
      <SignalScene compact />
      <div className="ow-universe-copy">
        <span className="ow-card-kicker">Opening-state reader orientation</span>
        <h2>Different worlds. Real boundaries.</h2>
        <p>Veyra and Neral are already joined by mature Road infrastructure. Ovara is another human world, with its own independent scientific and political life. <cite>REPLY</cite> begins with a question—not a conquest.</p>
        <Link className="ow-text-link" to={PATH.atlas}>Explore the public Atlas <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
    <section className="ow-world-strip" aria-label="Reader-safe world introductions">
      <div><span>01 / OVARA</span><strong>Evidence</strong><p>An independent world of complex societies, measurement, and discovery.</p></div>
      <div><span>02 / VEYRA</span><strong>Continuity</strong><p>A mature civilization in which connections between worlds are everyday infrastructure.</p></div>
      <div><span>03 / NERAL</span><strong>Difference</strong><p>A sovereign, distinct world connected to Veyra without being absorbed by it.</p></div>
    </section>
  </section>;
}

function JournalPage() {
  return <section className="ow-page ow-container" aria-labelledby="ow-journal-title">
    <Eyebrow>03 / Studio Journal</Eyebrow>
    <h1 id="ow-journal-title">The work<br /><em>behind the worlds.</em></h1>
    <p className="ow-page-lead">Writing and worldbuilding are works in progress, not performances of constant activity. The journal will collect substantive, approved notes as they become ready.</p>
    <div className="ow-journal-panel">
      <span className="ow-card-kicker">Studio direction · November 2026</span>
      <h2>Returning to The Transcosmic</h2>
      <p>Anevum is returning to original works. REPLY leads the way: rereading the manuscript, strengthening the novel, and carefully reopening the reader-facing archive. This journal entry is a design preview, not a published announcement.</p>
      <Link className="ow-text-link" to={PATH.reply}>The flagship novel <span aria-hidden="true">↗</span></Link>
    </div>
  </section>;
}

function AboutPage() {
  return <section className="ow-page ow-container" aria-labelledby="ow-about-title">
    <Eyebrow>04 / About Anevum</Eyebrow>
    <h1 id="ow-about-title">Original work.<br /><em>Lasting worlds.</em></h1>
    <p className="ow-page-lead">Anevum is an independent creative studio founded by Devon Akins. We develop original stories and intellectual property with room to grow into interactive, visual, and physical experiences.</p>
    <div className="ow-about-divider" />
    <p>Our first major work is <cite>REPLY</cite>, Book One of The Transcosmic. The studio will grow through finished work, not an invented product catalogue or a platform that competes with the stories.</p>
    <div className="ow-actions"><LinkAction to={PATH.works}>Explore the works</LinkAction></div>
  </section>;
}

function PreviewNotFound() {
  return <section className="ow-page ow-container" aria-labelledby="ow-not-found-title">
    <Eyebrow>Studio preview / Unavailable</Eyebrow>
    <h1 id="ow-not-found-title">Page not found.</h1>
    <p className="ow-page-lead">This part of the design preview is not available.</p>
    <LinkAction to={PATH.home}>Return to studio</LinkAction>
  </section>;
}

export default function OriginalWorksStudio() {
  const { pathname } = useLocation();
  const page = currentPage(pathname);

  return <div className="ow-site" data-anevum-original-works-preview="true">
    <a className="ow-skip" href="#ow-main">Skip to content</a>
    <header className="ow-header">
      <div className="ow-header-inner">
        <Wordmark />
        <nav aria-label="Studio preview navigation" className="ow-navigation">
          {NAV.map(item => <Link
            key={item.page} to={PATH[item.page]}
            aria-current={(page === item.page || (page === "atlas-detail" && item.page === "atlas")) ? "page" : undefined}
            className={page === item.page || (page === "atlas-detail" && item.page === "atlas") ? "ow-nav-current" : ""}
          >{item.label}</Link>)}
        </nav>
      </div>
    </header>
    <main id="ow-main" tabIndex={-1}>
      {page === "home" && <StudioHome />}
      {page === "works" && <WorksPage />}
      {page === "reply" && <ReplyPage />}
      {page === "reading" && <ReplyReadingRoom />}
      {page === "transcosmic" && <TranscosmicPage />}
      {page === "atlas" && <AtlasExplorer />}
      {page === "atlas-detail" && <AtlasExplorer slug={pathname.slice(PATH.atlas.length + 1).replace(/\/$/, "")} />}
      {page === "journal" && <JournalPage />}
      {page === "about" && <AboutPage />}
      {page === "not-found" && <PreviewNotFound />}
    </main>
    <footer className="ow-footer">
      <div className="ow-footer-inner">
        <div><span className="ow-footer-name">Anevum</span><p>Original works. Imagined futures.</p></div>
        <div className="ow-footer-links">
          <Link to={PATH.works}>Works</Link>
          <Link to={PATH.atlas}>The Atlas</Link>
          <Link to={PATH.about}>About</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
        <span className="ow-preview-label">Design preview · Not a published release</span>
      </div>
    </footer>
  </div>;
}
