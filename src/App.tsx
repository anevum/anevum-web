import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { capture } from "./analytics";
import { publicObjects, type PublicObject } from "./publicObjects";

const primaryNav = [
  ["STORIES", "/stories"],
  ["EXPLORE", "/explore"],
  ["LIVE", "/live"],
  ["ARCHIVE", "/archive"],
  ["LATTICE", "/lattice"],
] as const;

const utilityNav = [
  ["TRANSMISSIONS", "/transmissions"],
  ["STORE", "/store"],
  ["ABOUT", "/about"],
] as const;

function AnevumMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function TrackedLink({
  href,
  event,
  properties,
  className,
  children,
}: {
  href: string;
  event: string;
  properties?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => capture(event, { destination: href, ...properties })}
    >
      {children}
    </a>
  );
}

function Header({ onSearch }: { onSearch: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="ANEVUM home">
          <AnevumMark />
          <span className="brand-word">ANEVUM</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryNav.map(([label, href]) => (
            <a key={label} href={href}>{label}</a>
          ))}
        </nav>

        <div className="topbar-actions">
          <nav className="utility-nav" aria-label="Utility navigation">
            {utilityNav.map(([label, href]) => (
              <a key={label} href={href}>{label}</a>
            ))}
          </nav>
          <button className="icon-button" onClick={onSearch} aria-label="Search released ANEVUM objects">
            <Search size={17} />
          </button>
          <a className="account-link" href="/account">ACCOUNT</a>
          <button
            className="mobile-menu-button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {[...primaryNav, ...utilityNav, ["ACCOUNT", "/account"] as const].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <button onClick={() => { setMenuOpen(false); onSearch(); }}>
            SEARCH
          </button>
        </nav>
      )}
    </>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return publicObjects;
    return publicObjects.filter((item) =>
      `${item.title} ${item.type} ${item.summary}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search public ANEVUM records">
      <button className="search-backdrop" aria-label="Close search" onClick={onClose} />
      <div className="search-panel">
        <div className="search-panel-head">
          <div>
            <p className="kicker">RELEASED OBJECT SEARCH</p>
            <h2>Search ANEVUM</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close search"><X size={18} /></button>
        </div>
        <label className="search-input-wrap">
          <Search size={17} />
          <input
            autoFocus
            value={query}
            onChange={(event) => { setQuery(event.target.value); capture("search_used", { query: event.target.value }); }}
            placeholder="Search released public objects"
          />
        </label>
        <div className="search-results">
          {results.map((item) => (
            <a key={item.id} href={item.route} className="search-result">
              <span>{item.type}</span>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
              <ArrowRight size={15} />
            </a>
          ))}
          {results.length === 0 && <p className="empty-state">No released public object matches that search.</p>}
        </div>
      </div>
    </div>
  );
}

function FirstVisitReveal() {
  const [visible, setVisible] = useState(false);
  const [wordmarkVisible, setWordmarkVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.localStorage.getItem("anevum:first-visit-reveal") === "seen";
    if (reduced || seen) return;

    setVisible(true);
    const wordmarkTimer = window.setTimeout(() => setWordmarkVisible(true), 420);
    const closeTimer = window.setTimeout(() => {
      window.localStorage.setItem("anevum:first-visit-reveal", "seen");
      setVisible(false);
    }, 1900);

    return () => {
      window.clearTimeout(wordmarkTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  if (!visible) return null;

  const skip = () => {
    window.localStorage.setItem("anevum:first-visit-reveal", "seen");
    setVisible(false);
  };

  return (
    <div className={`first-reveal ${wordmarkVisible ? "reveal-wordmark" : ""}`}>
      <div className="reveal-center">
        <AnevumMark />
        <div className="reveal-copy">
          <strong>ANEVUM</strong>
          <span>STORIES // WORLDS // RECORDS // LIFE</span>
        </div>
      </div>
      <button onClick={skip}>SKIP</button>
    </div>
  );
}

const byId = (id: string) => publicObjects.find((item) => item.id === id)!;

function StartCard({ object, action }: { object: PublicObject; action: string }) {
  return (
    <TrackedLink
      href={object.route}
      event="home_object_opened"
      properties={{ object_id: object.id, object_type: object.type, source_section: "start_here" }}
      className="start-card"
    >
      <div className="start-card-top">
        <span>{object.type}</span>
        <span className="release-dot" />
      </div>
      <h3>{object.title.replace("LATTICE / IREN // ORDINARY LIFE", "LATTICE / IREN")}</h3>
      <p>{object.summary}</p>
      <span className="start-card-action">{action} <ArrowRight size={14} /></span>
    </TrackedLink>
  );
}

function HomePage() {
  const serein = byId("place.serein-skygate");
  const talin = byId("person.talin-vel");
  const roads = byId("science.roads-skygates");
  const latticeIren = byId("transmission.lattice-iren-ordinary-life");

  return (
    <main>
      <section className="hero section-pad">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="kicker">CURRENT SIGNAL</p>
            <h1 className="locked-hero-title">ANEVUM <span>// INITIAL PUBLIC STATE</span></h1>
            <p className="hero-statement">Stories. Worlds. Records. A place inside them.</p>
            <p className="hero-lede">Read the stories. Explore the worlds. Build a life inside the universe.</p>
            <div className="hero-actions">
              <TrackedLink href="/explore" event="home_explore_clicked" className="primary-button">
                EXPLORE <ArrowRight size={16} />
              </TrackedLink>
              <TrackedLink href="/stories" event="home_stories_clicked" className="text-link">STORIES</TrackedLink>
              <TrackedLink href="/lattice" event="home_lattice_clicked" className="text-link blue-text">ENTER LATTICE</TrackedLink>
            </div>
          </div>

          <div className="signal-stage" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="relational-core">
              <span /><span /><span /><span /><span /><span /><span /><span /><span />
            </div>
          </div>
        </div>
      </section>

      <section className="stories-section section-pad">
        <div className="story-panel pure-structure">
          <div className="story-atmosphere" />
          <div className="story-copy wide-story-copy">
            <p className="kicker">FOUNDING STORY UNIVERSE</p>
            <div className="story-wordmark">TRANSCOSMIC</div>
            <h2>Human civilization already spans connected worlds.</h2>
            <p>
              Roads move people between paired endpoints. Skygates turn those connections into ordinary infrastructure.
              LATTICE carries identity and information across the network. IREN helps people plan, translate, learn,
              research and coordinate without governing their choices.
            </p>
            <p>TRANSCOSMIC begins here: inside the mature civilization, before the reader knows how the first door was built.</p>
            <p className="closing-line">Explore the present. Discover the history later.</p>
            <TrackedLink href="/stories/transcosmic" event="story_present_opened" className="primary-button muted">
              ENTER THE PRESENT <ArrowRight size={16} />
            </TrackedLink>
          </div>
          <div className="story-object relational-figure" aria-hidden="true">
            <div className="figure-ring figure-ring-a" />
            <div className="figure-ring figure-ring-b" />
            <div className="figure-axis" />
          </div>
        </div>
      </section>

      <section className="present-section section-pad">
        <div className="section-heading">
          <div>
            <p className="kicker">CURRENT STORY WORLD</p>
            <h2>THE TRANSCOSMIC PRESENT</h2>
          </div>
          <p>Human civilization already spans connected worlds. The story begins after the impossible became infrastructure.</p>
        </div>
        <div className="present-copy-grid">
          <p>
            The first public story doorway begins with ordinary life: families, jobs, schools, transit, maintenance,
            arguments and inherited systems inside a civilization that no longer remembers the Road as impossible.
          </p>
          <div>
            <p>The first question is not how humanity built it. It is what people become after they inherit it.</p>
            <TrackedLink href="/stories/transcosmic" event="story_present_opened" className="inline-action">
              ENTER THE PRESENT <ArrowRight size={15} />
            </TrackedLink>
          </div>
        </div>
      </section>

      <section className="start-section section-pad">
        <div className="section-heading compact-heading">
          <div>
            <p className="kicker">START HERE</p>
            <h2>A PLACE. A PERSON. THE SYSTEMS AROUND THEM.</h2>
          </div>
        </div>
        <div className="start-grid">
          <StartCard object={serein} action="ENTER SEREIN SKYGATE" />
          <StartCard object={talin} action="ACCESS TALIN VEL" />
          <StartCard object={roads} action="HOW THE NETWORK MOVES" />
          <StartCard object={latticeIren} action="ENTER THE NETWORK" />
        </div>
      </section>

      <section className="explore-section section-pad">
        <div className="explorer-window">
          <div className="explorer-copy">
            <p className="kicker">EXPLORE</p>
            <h2>MOVE THROUGH THE RELEASED UNIVERSE.</h2>
            <p>Explore approved public canon spatially instead of reading a flat index. Begin at Serein Skygate. Move outward only as the public record opens.</p>
            <div className="breadcrumb">RHEL SYSTEM <span>→</span> VEYRA <span>→</span> SEREIN SKYGATE</div>
            <TrackedLink href="/explore" event="home_explore_clicked" className="primary-button muted">
              OPEN EXPLORER <ArrowRight size={16} />
            </TrackedLink>
          </div>
          <div className="explorer-map" aria-label="Explorer preview with Serein Skygate selected">
            <div className="map-orbit" />
            <div className="map-node selected-node"><span>SEREIN SKYGATE</span></div>
            <div className="map-mask" />
          </div>
        </div>
      </section>

      <section className="archive-section section-pad">
        <div className="section-heading compact-heading">
          <div>
            <p className="kicker">ARCHIVE</p>
            <h2>OPEN RECORDS</h2>
          </div>
        </div>
        <div className="archive-list">
          {[serein, talin, roads].map((item) => (
            <a key={item.id} href={item.route} className="archive-row">
              <span>{item.type}</span>
              <strong>{item.title}</strong>
              <ArrowRight size={15} />
            </a>
          ))}
        </div>
        <a className="inline-action archive-open" href="/archive">OPEN ARCHIVE <ArrowRight size={15} /></a>
      </section>

      <section className="transmission-section section-pad">
        <div className="transmission-card">
          <p className="kicker">TRANSMISSION 00</p>
          <h2>ENTER ANEVUM // TRANSCOSMIC</h2>
          <p className="transmission-body">The present comes first. The history is still there.</p>
          <p className="closing-line">Explore the present. Discover the history later.</p>
          <TrackedLink href="/transmissions/enter-anevum-transcosmic" event="transmission_opened" className="primary-button muted">
            OPEN TRANSMISSION <ArrowRight size={16} />
          </TrackedLink>
        </div>
      </section>

      <section className="lattice-section section-pad">
        <div className="lattice-field" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => <span key={index} />)}
        </div>
        <div className="lattice-copy">
          <p className="kicker">LATTICE // MEMBER LAYER</p>
          <h2>YOUR IDENTITY INSIDE ANEVUM.</h2>
          <p>
            LATTICE will connect identity, saves, collection, rooms and future persistent experiences across ANEVUM.
            Public member access is not open in this foundation build.
          </p>
          <a className="primary-button blue" href="/lattice">VIEW LATTICE</a>
        </div>
      </section>

      <section className="about-strip section-pad">
        <p>ANEVUM is the public home for stories, worlds, records and interactive experiences created by Devon Akins. TRANSCOSMIC is its founding story universe.</p>
        <a href="/about">ABOUT ANEVUM <ArrowRight size={15} /></a>
      </section>
    </main>
  );
}

function ObjectRoute({ object }: { object: PublicObject }) {
  return (
    <main className="route-page section-pad">
      <div className="route-geometry" aria-hidden="true"><span /><span /></div>
      <div className="route-copy">
        <p className="kicker">{object.type} // PUBLIC RECORD</p>
        <h1>{object.title}</h1>
        <p>{object.summary}</p>
        {object.id === "story.transcosmic-present" && (
          <p className="route-secondary">The story begins after the impossible became infrastructure.</p>
        )}
        <a className="inline-action" href="/">RETURN TO ANEVUM <ArrowRight size={15} /></a>
      </div>
    </main>
  );
}

function TruthStateRoute({ label, headline, body }: { label: string; headline: string; body: string }) {
  return (
    <main className="route-page section-pad truth-route">
      <div className="route-copy">
        <p className="kicker">{label}</p>
        <h1>{headline}</h1>
        <p>{body}</p>
        <a className="inline-action" href="/">RETURN TO ANEVUM <ArrowRight size={15} /></a>
      </div>
    </main>
  );
}

function ArchiveRoute() {
  const archiveItems = publicObjects.filter((item) => ["PLACE", "PERSON", "SCIENCE"].includes(item.type));
  return (
    <main className="route-page route-list-page section-pad">
      <div className="route-copy wide-route-copy">
        <p className="kicker">ARCHIVE</p>
        <h1>OPEN RECORDS</h1>
        <p>Only released public objects appear here.</p>
        <div className="archive-list route-list">
          {archiveItems.map((item) => (
            <a key={item.id} href={item.route} className="archive-row">
              <span>{item.type}</span><strong>{item.title}</strong><ArrowRight size={15} />
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

function StoriesRoute() {
  return <ObjectRoute object={byId("story.transcosmic-present")} />;
}

function TransmissionsRoute() {
  const transmissions = publicObjects.filter((item) => item.type === "TRANSMISSION" || item.type === "IN-UNIVERSE RECORD");
  return (
    <main className="route-page route-list-page section-pad">
      <div className="route-copy wide-route-copy">
        <p className="kicker">TRANSMISSIONS</p>
        <h1>PUBLIC SIGNALS</h1>
        <div className="archive-list route-list">
          {transmissions.map((item) => (
            <a key={item.id} href={item.route} className="archive-row">
              <span>{item.type}</span><strong>{item.title}</strong><ArrowRight size={15} />
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

function RouteContent() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const object = publicObjects.find((item) => item.route === path);
  if (object) return <ObjectRoute object={object} />;

  switch (path) {
    case "/": return <HomePage />;
    case "/stories": return <StoriesRoute />;
    case "/explore": return <ObjectRoute object={byId("place.serein-skygate")} />;
    case "/archive": return <ArchiveRoute />;
    case "/transmissions": return <TransmissionsRoute />;
    case "/lattice":
      return <TruthStateRoute label="LATTICE // MEMBER LAYER" headline="YOUR IDENTITY INSIDE ANEVUM." body="LATTICE will connect identity, saves, collection, rooms and future persistent experiences across ANEVUM. Public member access is not open in this foundation build." />;
    case "/live":
      return <TruthStateRoute label="LIVE" headline="LIVE // DEVELOPMENT ACCESS NOT OPEN." body="This route exists in the application shell, but no playable persistent loop is public yet." />;
    case "/store":
      return <TruthStateRoute label="STORE" headline="STORE // NOT OPEN." body="No prices, inventory, checkout or purchase actions are presented until a real product path exists." />;
    case "/account":
      return <TruthStateRoute label="ACCOUNT" headline="IDENTITY ACCESS IS NOT OPEN." body="This route is reserved for the real account and identity system. No account state or sign-in success is fabricated." />;
    case "/about":
      return <TruthStateRoute label="ABOUT ANEVUM" headline="STORIES. WORLDS. RECORDS. INTERACTIVE EXPERIENCES." body="ANEVUM is the public home for stories, worlds, records and interactive experiences created by Devon Akins. TRANSCOSMIC is its founding story universe." />;
    default:
      return <TruthStateRoute label="ANEVUM" headline="PUBLIC RECORD NOT AVAILABLE." body="This route does not resolve to a released public object in the foundation build." />;
  }
}

function Footer() {
  return (
    <footer className="footer section-pad">
      <div>
        <a className="brand footer-brand" href="/">
          <AnevumMark />
          <span className="brand-word">ANEVUM</span>
        </a>
        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="/stories">STORIES</a>
          <a href="/explore">EXPLORE</a>
          <a href="/archive">ARCHIVE</a>
          <a href="/transmissions">TRANSMISSIONS</a>
          <a href="/lattice">LATTICE</a>
          <a href="/about">ABOUT</a>
          <a href="/live">LIVE</a>
          <a href="/store">STORE</a>
        </nav>
      </div>
      <div className="footer-meta">
        <span>© 2026 ANEVUM</span>
        <span>INITIAL PUBLIC STATE</span>
      </div>
    </footer>
  );
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grain" />
      <FirstVisitReveal />
      <Header onSearch={() => setSearchOpen(true)} />
      <RouteContent />
      <Footer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
