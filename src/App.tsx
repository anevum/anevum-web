import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleDot,
  Compass,
  Menu,
  Network,
  Radio,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

const navItems = [
  { label: "Stories", href: "#stories" },
  { label: "Explore", href: "#explore" },
  { label: "Archive", href: "#archive" },
  { label: "Transmissions", href: "#transmissions" },
  { label: "Store", href: "#store" },
];

const portals = [
  {
    eyebrow: "READ",
    title: "Stories",
    copy: "Enter ANEVUM through narrative first. TRANSCOSMIC is the founding series, with the current era presented before deeper historical cycles.",
    icon: BookOpen,
    href: "#stories",
  },
  {
    eyebrow: "EXPLORE",
    title: "Worlds in relation",
    copy: "Move through systems, worlds, institutions, places, science and history as connected objects instead of disconnected wiki pages.",
    icon: Compass,
    href: "#explore",
  },
  {
    eyebrow: "RECORD",
    title: "Archive",
    copy: "Public records, diagrams, visual material and historical objects appear only after they pass the release gate.",
    icon: CircleDot,
    href: "#archive",
  },
  {
    eyebrow: "BELONG",
    title: "LATTICE",
    copy: "One persistent member identity for saving records, building a library, collecting milestones and participating in the network.",
    icon: Network,
    href: "#lattice",
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grain" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="ANEVUM home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-word">ANEVUM</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="topbar-actions">
          <button className="icon-button" aria-label="Search ANEVUM">
            <Search size={17} />
          </button>
          <a className="lattice-button" href="#lattice">
            Enter LATTICE
          </a>
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
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
          <a href="#lattice" onClick={() => setMenuOpen(false)}>
            Enter LATTICE
          </a>
        </nav>
      )}

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="kicker">ANEVUM // PUBLIC ACCESS</p>
              <h1>
                Stories are the heart.
                <span>Everything else lets you go deeper.</span>
              </h1>
              <p className="hero-lede">
                ANEVUM is a doorway into connected stories, worlds, science, history,
                art and records. Read the fiction. Follow the relationships. Explore the
                reality around it. Keep your place through LATTICE.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#stories">
                  Enter the stories <ArrowRight size={16} />
                </a>
                <a className="text-link" href="#explore">
                  Explore ANEVUM
                </a>
              </div>
            </div>

            <div className="signal-stage" aria-label="Current ANEVUM signal">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="signal-core">
                <div className="signal-index">01</div>
                <div>
                  <p className="signal-label">CURRENT SIGNAL</p>
                  <h2>TRANSCOSMIC</h2>
                  <p>
                    The founding series inside ANEVUM. Public material is being opened in
                    controlled layers while the first mature-era book is in production.
                  </p>
                </div>
                <a href="#stories" className="signal-link">
                  Open signal <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>

          <div className="hero-footer">
            <span>READ</span>
            <i />
            <span>EXPLORE</span>
            <i />
            <span>LIVE</span>
            <i />
            <span>BELONG</span>
          </div>
        </section>

        <section className="portal-section section-pad" id="explore">
          <div className="section-heading">
            <div>
              <p className="kicker">ONE REALITY // MULTIPLE WAYS IN</p>
              <h2>Start wherever curiosity catches.</h2>
            </div>
            <p>
              The website should feel like a living setting, not a list of products and not
              a signup wall. Every surface eventually points back to the stories.
            </p>
          </div>

          <div className="portal-grid">
            {portals.map(({ eyebrow, title, copy, icon: Icon, href }) => (
              <a className="portal-card" href={href} key={title}>
                <div className="portal-card-top">
                  <span className="portal-icon">
                    <Icon size={19} />
                  </span>
                  <span className="portal-index">{eyebrow}</span>
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
                <span className="card-arrow">
                  <ArrowRight size={17} />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="stories-section section-pad" id="stories">
          <div className="story-panel">
            <div className="story-atmosphere" />
            <div className="story-copy">
              <p className="kicker">FOUNDING SERIES</p>
              <div className="story-wordmark">TRANSCOSMIC</div>
              <h2>A civilization already in motion.</h2>
              <p>
                The public entry point begins in the mature Transcosmic era rather than at
                the oldest event in the timeline. The deeper origin history remains part of
                the same world, but it does not have to explain itself first.
              </p>
              <div className="story-actions">
                <button className="primary-button muted" type="button">
                  Series record in preparation
                </button>
              </div>
            </div>
            <div className="story-object" aria-hidden="true">
              <div className="world world-shadow" />
              <div className="world-light" />
              <div className="world-line" />
            </div>
          </div>
        </section>

        <section className="archive-section section-pad" id="archive">
          <div className="section-heading compact-heading">
            <div>
              <p className="kicker">PUBLIC RECORD SYSTEM</p>
              <h2>The Archive only shows what is cleared to exist publicly.</h2>
            </div>
            <p>
              Canon and public release are separate. A record can be true inside ANEVUM and
              still remain withheld until its text, visuals and spoiler state are ready.
            </p>
          </div>

          <div className="record-window">
            <div className="record-header">
              <div>
                <span className="status-dot" />
                RELEASE GATE ACTIVE
              </div>
              <span>PUBLIC OBJECT MODEL // 0.1</span>
            </div>
            <div className="record-body">
              <div className="record-geometry" aria-hidden="true">
                <span className="record-ring ring-a" />
                <span className="record-ring ring-b" />
                <span className="record-node node-a" />
                <span className="record-node node-b" />
                <span className="record-node node-c" />
              </div>
              <div className="record-copy">
                <span>OBJECT RELATION</span>
                <h3>One source of truth. Many ways to encounter it.</h3>
                <p>
                  The same approved object can later appear in Explore, Archive, a story
                  reference, search, a saved collection or a LATTICE room without creating
                  competing versions of canon.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="lower-grid section-pad">
          <article className="lower-card" id="transmissions">
            <Radio size={22} />
            <p className="kicker">TRANSMISSIONS</p>
            <h2>Follow what is changing.</h2>
            <p>
              Development notes, visual releases, announcements and public project signals
              live here without pretending unfinished material is canon.
            </p>
            <a href="#top">
              Transmission system coming next <ArrowRight size={15} />
            </a>
          </article>

          <article className="lower-card" id="store">
            <ShoppingBag size={22} />
            <p className="kicker">ANEVUM STORE</p>
            <h2>Physical work belongs to the same world.</h2>
            <p>
              Books, editions, apparel, prints and artifacts will live under ANEVUM. Commerce
              stays secondary until the public world and the book production are ready.
            </p>
            <span className="disabled-link">Store not yet open</span>
          </article>
        </section>

        <section className="lattice-section section-pad" id="lattice">
          <div className="lattice-field" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="lattice-copy">
            <p className="kicker">LATTICE // MEMBER LAYER</p>
            <h2>Your place persists.</h2>
            <p>
              LATTICE is the identity and community layer inside ANEVUM: profile, wall, saved
              records, library, collection, notifications and earned progression. It should
              feel like belonging to the world, not joining another social feed.
            </p>
            <button className="primary-button blue" type="button">
              LATTICE access in development
            </button>
          </div>
        </section>
      </main>

      <footer className="footer section-pad">
        <div className="brand footer-brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-word">ANEVUM</span>
        </div>
        <p>Stories, worlds, records and the people who enter them.</p>
        <div className="footer-meta">
          <span>© 2026 ANEVUM</span>
          <span>PUBLIC SYSTEM // BUILD 0.1</span>
        </div>
      </footer>
    </div>
  );
}
