import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CircleUserRound,
  Menu,
  Search,
  Share2,
  X,
} from "lucide-react";
import {
  featuredPublicObjects,
  getPublicObjectBySlug,
  publicObjects,
  searchPublicObjects,
  type PublicObject,
} from "./publicObjects";

const primaryNav = [
  ["STORIES", "/stories"],
  ["UNIVERSE", "/wiki"],
  ["TRANSMISSIONS", "/transmissions"],
  ["STORE", "/store"],
] as const;

const utilityNav = [
  ["SEARCH", "/search"],
  ["RHENLINK", "/rhenlink"],
] as const;

type SiteLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
};

function navigate(href: string) {
  if (window.location.pathname === href) return;
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function SiteLink({ href, className, children, onNavigate }: SiteLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(href);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

function AnevumWordmark() {
  return (
    <span className="locked-wordmark">
      <span className="locked-wordmark-main">ANEVUM</span>
      <span className="locked-wordmark-sub">
        STORIES&nbsp;&nbsp; WORLDS&nbsp;&nbsp; PEOPLE&nbsp;&nbsp; CONNECTIONS
      </span>
    </span>
  );
}

function ProductBar({ pathname }: { pathname: string }) {
  const isWiki = pathname.startsWith("/wiki");
  const isLattice = pathname === "/lattice";
  const isSearch = pathname === "/search";

  if (!isWiki && !isLattice && !isSearch) return null;

  const identity = isWiki
    ? "WIKI.ANEVUM"
    : isLattice
      ? "LATTICE.ANEVUM"
      : "SEARCH.ANEVUM";
  const subtitle = isWiki
    ? "THE CANONICAL UNIVERSE"
    : isLattice
      ? "THE UNIVERSE AS A PLACE"
      : "FIND WHAT CONNECTS US";

  return (
    <div className="product-bar">
      <div className="product-identity">
        <strong>{identity}</strong>
        <span>{subtitle}</span>
      </div>
      <div className="product-search-shell" aria-hidden="true">
        <Search size={15} />
        <span>Search the universe...</span>
      </div>
      <div className="product-utilities">
        {isLattice ? (
          <SiteLink href="/lattice">EXPLORE</SiteLink>
        ) : (
          <SiteLink href="/wiki">BROWSE</SiteLink>
        )}
        <SiteLink href="/wiki">WORLDS</SiteLink>
        <SiteLink href="/rhenlink" className="product-rhenlink">
          <CircleUserRound size={20} /> <span>RHENLINK</span>
        </SiteLink>
      </div>
    </div>
  );
}

function Header({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="locked-header">
        <div className="locked-header-main">
          <SiteLink href="/" className="locked-brand" onNavigate={() => setOpen(false)}>
            <AnevumWordmark />
          </SiteLink>

          <div className="locked-manifesto">
            <strong>A UNIVERSE IN STORY, A STORY IN EVERYTHING.</strong>
            <span>
              BOOKS&nbsp;&nbsp;·&nbsp;&nbsp; KNOWLEDGE&nbsp;&nbsp;·&nbsp;&nbsp;
              DISCOVERY&nbsp;&nbsp;·&nbsp;&nbsp; BELONGING
            </span>
          </div>

          <nav className="locked-nav" aria-label="Primary navigation">
            {primaryNav.map(([label, href]) => (
              <SiteLink
                key={href}
                href={href}
                className={
                  pathname === href || pathname.startsWith(`${href}/`) ? "active" : undefined
                }
              >
                {label}
              </SiteLink>
            ))}
            <SiteLink href="/search" className="nav-icon">
              <Search size={17} />
              <span className="sr-only">Search</span>
            </SiteLink>
            <SiteLink href="/rhenlink" className="nav-rhenlink">
              <CircleUserRound size={20} /> <span>RHENLINK</span>
            </SiteLink>
          </nav>

          <button
            className="locked-menu-toggle"
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <ProductBar pathname={pathname} />
      </header>

      {open ? (
        <nav className="locked-mobile-menu" aria-label="Mobile navigation">
          {[...primaryNav, ...utilityNav].map(([label, href]) => (
            <SiteLink key={href} href={href} onNavigate={() => setOpen(false)}>
              <span>{label}</span>
              <ArrowRight size={16} />
            </SiteLink>
          ))}
        </nav>
      ) : null}
    </>
  );
}

function CosmicScene({
  variant = "world",
  className = "",
}: {
  variant?: "world" | "wiki" | "lattice" | "quiet";
  className?: string;
}) {
  return (
    <div className={`cosmic-scene cosmic-${variant} ${className}`} aria-hidden="true">
      <span className="cosmic-stars" />
      <span className="cosmic-planet" />
      <span className="cosmic-moon moon-a" />
      <span className="cosmic-moon moon-b" />
      <span className="cosmic-horizon" />
      <span className="cosmic-ridge ridge-a" />
      <span className="cosmic-ridge ridge-b" />
    </div>
  );
}

function BookMockup() {
  return (
    <div className="book-stage" aria-hidden="true">
      <div className="book-shadow" />
      <div className="book-object">
        <div className="book-cover-space" />
        <span className="book-kicker">THE TRANSCOSMIC / BOOK ONE</span>
        <strong>REPLY</strong>
        <span className="book-author">DEVON AKINS</span>
      </div>
    </div>
  );
}

function LockedButton({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <SiteLink href={href} className={`locked-button ${secondary ? "secondary" : ""}`}>
      <span>{children}</span>
      <ArrowRight size={15} />
    </SiteLink>
  );
}

function RecordCard({ record, compact = false }: { record: PublicObject; compact?: boolean }) {
  return (
    <SiteLink href={record.route} className={`locked-record-card ${compact ? "compact" : ""}`}>
      <div className="record-art" aria-hidden="true">
        <span className="record-orb" />
      </div>
      <div className="locked-record-content">
        <span className="record-type">{record.type}</span>
        <h3>{record.title}</h3>
        {!compact ? <p>{record.summary}</p> : null}
      </div>
      <ArrowRight size={17} className="record-arrow" />
    </SiteLink>
  );
}

function FrontDoor() {
  return (
    <main className="locked-home">
      <section className="home-hero">
        <CosmicScene variant="world" />
        <div className="home-hero-copy">
          <p className="locked-eyebrow">STORIES WITH WORLDS</p>
          <h1>Inside them.</h1>
          <p className="locked-deck">
            Books at the center.
            <br />A universe beyond the page.
          </p>
          <div className="locked-actions">
            <LockedButton href="/stories/reply">DISCOVER REPLY</LockedButton>
            <LockedButton href="/wiki" secondary>
              ENTER THE UNIVERSE
            </LockedButton>
          </div>
        </div>
        <div className="hero-side-note">
          WORLDS ENDURE.
          <br />STORIES EXPAND.
          <br />PEOPLE BELONG.
        </div>
      </section>

      <section className="front-story-section locked-section">
        <CosmicScene variant="quiet" className="story-scene" />
        <div className="front-story-copy">
          <p className="locked-eyebrow">THE TRANSCOSMIC / BOOK ONE</p>
          <h2>REPLY</h2>
          <p className="story-author">Devon Akins</p>
          <div className="short-rule" />
          <p className="story-tagline">Humanity receives a reply.</p>
          <p className="story-safe-copy">
            The current story at the center of ANEVUM. Public material remains inside the
            spoiler-safe release window.
          </p>
          <div className="locked-actions">
            <LockedButton href="/stories/reply">DISCOVER THE BOOK</LockedButton>
            <span className="release-state">RELEASE IN DEVELOPMENT</span>
          </div>
        </div>
        <BookMockup />
      </section>

      <section className="universe-door locked-section">
        <div className="locked-section-heading">
          <div>
            <p className="locked-eyebrow">THE UNIVERSE</p>
            <h2>The story does not end at the page.</h2>
          </div>
          <p>Two ways in. One released record.</p>
        </div>
        <div className="universe-door-grid">
          <SiteLink href="/wiki" className="universe-door-card wiki-door">
            <CosmicScene variant="wiki" />
            <div>
              <h3>WIKI</h3>
              <strong>Read the universe.</strong>
              <p>
                Canonical records, histories, places, people and ideas cleared for public
                release.
              </p>
              <span>
                OPEN WIKI <ArrowRight size={15} />
              </span>
            </div>
          </SiteLink>
          <SiteLink href="/lattice" className="universe-door-card lattice-door">
            <CosmicScene variant="lattice" />
            <div>
              <h3>LATTICE</h3>
              <strong>Move through it.</strong>
              <p>
                Follow released records spatially and move between the parts of the universe
                already public.
              </p>
              <span>
                ENTER LATTICE <ArrowRight size={15} />
              </span>
            </div>
          </SiteLink>
        </div>
      </section>

      <section className="from-anevum-locked locked-section">
        <div className="locked-section-heading">
          <div>
            <p className="locked-eyebrow">FROM ANEVUM</p>
            <h2>The work as it becomes public.</h2>
          </div>
          <LockedButton href="/transmissions" secondary>
            TRANSMISSIONS
          </LockedButton>
        </div>
        <div className="studio-grid">
          <SiteLink href="/stories/reply" className="studio-card">
            <span>STORY</span>
            <strong>REPLY</strong>
            <p>Follow the current public story surface.</p>
          </SiteLink>
          <SiteLink href="/wiki" className="studio-card">
            <span>KNOWLEDGE</span>
            <strong>Released record</strong>
            <p>Browse what has cleared publication.</p>
          </SiteLink>
          <SiteLink href="/lattice" className="studio-card">
            <span>DISCOVERY</span>
            <strong>Building LATTICE</strong>
            <p>The universe as a navigable place.</p>
          </SiteLink>
        </div>
      </section>
    </main>
  );
}

function Stories() {
  return (
    <main className="locked-route">
      <section className="route-hero cinematic-route-hero">
        <CosmicScene variant="quiet" />
        <div className="route-hero-copy">
          <p className="locked-eyebrow">STORIES</p>
          <h1>Stories with worlds inside them.</h1>
          <p>
            ANEVUM begins with REPLY. The story remains the doorway; the public universe expands
            only through released canon.
          </p>
        </div>
      </section>
      <section className="locked-section">
        <SiteLink href="/stories/reply" className="story-index-card">
          <div>
            <span>THE TRANSCOSMIC / BOOK ONE</span>
            <h2>REPLY</h2>
            <p>Devon Akins</p>
          </div>
          <BookMockup />
          <ArrowRight size={24} />
        </SiteLink>
      </section>
    </main>
  );
}

function Reply() {
  const storyRecords = publicObjects.filter((record) =>
    ["ovara", "merva", "neral", "serein-skygate"].includes(record.slug),
  );

  return (
    <main className="locked-route reply-locked-page">
      <section className="reply-locked-hero">
        <CosmicScene variant="quiet" />
        <SiteLink href="/stories" className="back-link">
          <ArrowLeft size={15} /> ALL STORIES
        </SiteLink>
        <div className="reply-locked-copy">
          <p className="locked-eyebrow">THE TRANSCOSMIC / BOOK ONE</p>
          <h1>REPLY</h1>
          <p className="reply-author">Devon Akins</p>
          <div className="short-rule" />
          <p className="reply-tagline">Humanity receives a reply.</p>
          <p className="reply-description">
            The public story page is deliberately limited to opening-state, spoiler-safe
            orientation while the book remains in production.
          </p>
          <div className="locked-actions">
            <LockedButton href="/wiki">EXPLORE RELEASED RECORDS</LockedButton>
            <span className="release-state">PRE-RELEASE</span>
          </div>
        </div>
        <BookMockup />
      </section>

      <section className="reply-overview locked-section">
        <div className="section-tabs" aria-hidden="true">
          <span className="active">OVERVIEW</span>
          <span>UNIVERSE CONNECTIONS</span>
          <span>UPDATES</span>
        </div>
        <div className="reply-overview-grid">
          <div>
            <p className="locked-eyebrow">A STORY ABOUT A LARGER TOMORROW.</p>
            <h2>Enter through the story. Move outward only when the record is ready.</h2>
          </div>
          <aside>
            <span>STORY DETAILS</span>
            <dl>
              <div><dt>Series</dt><dd>The Transcosmic</dd></div>
              <div><dt>Book</dt><dd>One</dd></div>
              <div><dt>Title</dt><dd>REPLY</dd></div>
              <div><dt>Author</dt><dd>Devon Akins</dd></div>
              <div><dt>State</dt><dd>In production</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="reply-connections locked-section">
        <div className="locked-section-heading">
          <div>
            <p className="locked-eyebrow">EXPLORE THE UNIVERSE</p>
            <h2>Released records connected to the opening state.</h2>
          </div>
        </div>
        <div className="locked-record-grid">
          {storyRecords.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      </section>
    </main>
  );
}

function WikiHome() {
  const [query, setQuery] = useState("");
  const records = useMemo(() => searchPublicObjects(query), [query]);
  const types = useMemo(
    () => Array.from(new Set(publicObjects.map((record) => record.type))).slice(0, 9),
    [],
  );

  return (
    <main className="locked-route wiki-locked-page">
      <section className="wiki-hero">
        <CosmicScene variant="wiki" />
        <div className="wiki-hero-copy">
          <p className="locked-eyebrow">WIKI.ANEVUM</p>
          <h1>The known record.</h1>
          <p>People. Worlds. Places. Events. Ideas.</p>
          <p className="wiki-intro">
            The canonical public reference for ANEVUM. Only material that has cleared the
            release gates appears here.
          </p>
          <label className="locked-search-box">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the universe..."
              aria-label="Search the released record"
            />
            <ArrowRight size={18} />
          </label>
        </div>
        <div className="hero-side-note">
          REAL WORLDS.
          <br />VERIFIED RECORDS.
          <br />A WIDER STORY.
        </div>
      </section>

      <section className="wiki-types locked-section">
        <div className="locked-section-heading slim">
          <div><p className="locked-eyebrow">EXPLORE BY TYPE</p></div>
          <p>Different paths. A connected universe.</p>
        </div>
        <div className="type-grid">
          {types.map((type) => (
            <button key={type} type="button" onClick={() => setQuery(type)} className="type-card">
              <span className="type-symbol" aria-hidden="true" />
              <span>{type}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="wiki-featured locked-section">
        <div className="locked-section-heading slim">
          <div>
            <p className="locked-eyebrow">{query ? "SEARCH RESULTS" : "FEATURED RECORDS"}</p>
          </div>
          <p>{records.length} released records available.</p>
        </div>
        <div className="locked-record-grid featured-grid">
          {records.slice(0, 4).map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      </section>

      <section className="wiki-release locked-section">
        <div className="release-list-panel">
          <p className="locked-eyebrow">RELEASED RECORD</p>
          <div className="release-list">
            {records.slice(0, 7).map((record) => (
              <RecordCard key={record.id} record={record} compact />
            ))}
          </div>
        </div>
        <div className="continuing-record-card">
          <CosmicScene variant="quiet" />
          <div>
            <p className="locked-eyebrow">A CONTINUING RECORD.</p>
            <h2>The public canon expands as work is cleared for release.</h2>
            <LockedButton href="/wiki" secondary>EXPLORE ALL RECORDS</LockedButton>
          </div>
        </div>
      </section>
    </main>
  );
}

function WikiRecord({ slug }: { slug: string }) {
  const record = getPublicObjectBySlug(slug);

  if (!record) {
    return (
      <main className="locked-route">
        <section className="empty-route locked-section">
          <p className="locked-eyebrow">WIKI.ANEVUM / RECORD</p>
          <h1>Nothing is released here.</h1>
          <p>No public record exists at this route. Unreleased and restricted canon is not exposed.</p>
          <LockedButton href="/wiki" secondary>RETURN TO WIKI</LockedButton>
        </section>
      </main>
    );
  }

  return (
    <main className="locked-route wiki-record-page">
      <section className="record-locked-hero">
        <CosmicScene variant="wiki" />
        <div className="record-breadcrumb">
          WIKI.ANEVUM&nbsp;&nbsp;›&nbsp;&nbsp; {record.section}&nbsp;&nbsp;›&nbsp;&nbsp; {record.title}
        </div>
        <div className="record-locked-title">
          <p className="locked-eyebrow">{record.type}</p>
          <h1>{record.title}</h1>
          <p>{record.summary}</p>
          <div className="record-badges">
            <span>{record.renderMode}</span>
            <span>{record.spoilerLevel}</span>
            <span>{record.publicWindow}</span>
          </div>
        </div>
        <div className="record-hero-actions">
          <button type="button"><Share2 size={15} /> SHARE</button>
          <button type="button"><Bookmark size={15} /> SAVE TO RHENLINK</button>
        </div>
      </section>

      <section className="record-body locked-section">
        <div className="record-body-main">
          <p className="locked-eyebrow">ABOUT {record.title.toUpperCase()}</p>
          <h2>{record.summary}</h2>
          <div className="record-public-note">
            <strong>PUBLICATION BOUNDARY</strong>
            <p>
              This page contains only the currently released rendering. Private source material
              and unreleased relationships remain absent.
            </p>
          </div>
        </div>
        <aside className="record-facts-panel">
          <p className="locked-eyebrow">RECORD STATE</p>
          <dl>
            <div><dt>Type</dt><dd>{record.type}</dd></div>
            <div><dt>Section</dt><dd>{record.section}</dd></div>
            <div><dt>Render</dt><dd>{record.renderMode}</dd></div>
            <div><dt>Spoiler level</dt><dd>{record.spoilerLevel}</dd></div>
            <div><dt>Window</dt><dd>{record.publicWindow}</dd></div>
          </dl>
          <LockedButton href="/lattice" secondary>EXPLORE CONNECTIONS</LockedButton>
        </aside>
      </section>
    </main>
  );
}

function Lattice() {
  const nodes = featuredPublicObjects.slice(0, 7);
  const [selectedSlug, setSelectedSlug] = useState(nodes[0]?.slug ?? "");
  const selected = getPublicObjectBySlug(selectedSlug) ?? nodes[0];

  return (
    <main className="locked-route lattice-locked-page">
      <section className="lattice-title-band">
        <CosmicScene variant="lattice" />
        <div>
          <h1>LATTICE.ANEVUM</h1>
          <p>THE UNIVERSE AS A PLACE.</p>
        </div>
        <span>
          WORLDS CONNECT.
          <br />STORIES EXPAND.
          <br />PEOPLE BELONG.
        </span>
      </section>

      <section className="lattice-workspace">
        <div className="lattice-canvas">
          <div className="lattice-field-note">
            REAL RECORDS.
            <br />PUBLIC CONNECTION SPACE.
            <br />A LIVING UNIVERSE.
          </div>
          <div className="lattice-orbits" aria-hidden="true"><span /><span /><span /></div>
          {nodes.map((record, index) => (
            <button
              key={record.id}
              type="button"
              className={`lattice-node lattice-node-${index} ${selected?.slug === record.slug ? "selected" : ""}`}
              onClick={() => setSelectedSlug(record.slug)}
            >
              <span className="node-orb" aria-hidden="true" />
              <strong>{record.title}</strong>
              <small>{record.type}</small>
            </button>
          ))}
          <div className="lattice-controls" aria-hidden="true"><span>+</span><span>−</span><span>◎</span></div>
        </div>

        <aside className="lattice-inspector">
          <div className="inspector-art"><span className="inspector-world" /></div>
          <p className="locked-eyebrow">FOCUS</p>
          <h2>{selected?.title}</h2>
          <span className="inspector-type">{selected?.type}</span>
          <p>{selected?.summary}</p>
          {selected ? <LockedButton href={selected.route}>OPEN RECORD</LockedButton> : null}
          <LockedButton href="/rhenlink" secondary>SAVE TO RHENLINK</LockedButton>
          <div className="inspector-list">
            <p className="locked-eyebrow">RELEASED NODES</p>
            {nodes.map((record) => (
              <button type="button" key={record.id} onClick={() => setSelectedSlug(record.slug)}>
                <span>{record.title}</span>
                <small>{record.type}</small>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchPublicObjects(query), [query]);

  return (
    <main className="locked-route search-locked-page">
      <section className="search-hero">
        <CosmicScene variant="quiet" />
        <div className="search-hero-copy">
          <p className="locked-eyebrow">SEARCH A WIDER UNIVERSE.</p>
          <h1>Stories, records, people, places, and the connections that bring them to life.</h1>
          <label className="search-major-box">
            <Search size={25} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search released records"
              aria-label="Search ANEVUM"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={22} />
              </button>
            ) : null}
            <span aria-hidden="true"><ArrowRight size={22} /></span>
          </label>
        </div>
      </section>
      <section className="search-results-locked locked-section">
        <div className="locked-section-heading slim">
          <div><p className="locked-eyebrow">SEARCH RESULTS</p></div>
          <p>{results.length} released records.</p>
        </div>
        <div className="search-result-list">
          {results.map((record) => (
            <RecordCard key={record.id} record={record} compact />
          ))}
        </div>
      </section>
    </main>
  );
}

function Transmissions() {
  return (
    <main className="locked-route transmissions-page">
      <section className="transmissions-hero">
        <CosmicScene variant="quiet" />
        <div>
          <p className="locked-eyebrow">ANEVUM TRANSMISSIONS</p>
          <h1>Ideas travel farther here.</h1>
          <p>
            Studio updates, releases, development notes and outward-facing company communication
            will live here as they are actually published.
          </p>
        </div>
      </section>
      <section className="transmission-empty locked-section">
        <p className="locked-eyebrow">CURRENT PUBLIC STATE</p>
        <h2>No released transmissions yet.</h2>
        <p>The structure is ready. It will not invent dates, announcements or articles before they exist.</p>
      </section>
    </main>
  );
}

function Store() {
  return (
    <main className="locked-route store-page">
      <section className="route-hero cinematic-route-hero">
        <CosmicScene variant="quiet" />
        <div className="route-hero-copy">
          <p className="locked-eyebrow">ANEVUM STORE</p>
          <h1>Objects from the universe.</h1>
          <p>No inventory, price or checkout claim appears until a real product is sale-ready.</p>
        </div>
      </section>
    </main>
  );
}

function Rhenlink() {
  return (
    <main className="locked-route rhenlink-locked-page">
      <section className="rhenlink-stage">
        <CosmicScene variant="world" />
        <div className="rhenlink-card">
          <div className="rhenlink-heading">
            <h1>RHENLINK</h1>
            <p>YOUR PERSISTENT IDENTITY</p>
          </div>
          <div className="identity-card">
            <div className="identity-avatar" aria-hidden="true"><span /></div>
            <div>
              <p className="locked-eyebrow">MEMBER LAYER</p>
              <h2>Identity follows you through ANEVUM.</h2>
              <p>
                The visual shell is established. Real profile, Saved, Collections, progress and
                achievements remain unavailable until the existing member backend is verified and
                connected.
              </p>
            </div>
          </div>
          <div className="rhenlink-modules">
            {["Saved", "Collections", "Discovery History", "Story Progress", "Achievements", "Preferences"].map((label) => (
              <div key={label}>
                <span>{label}</span>
                <small>NOT CONNECTED IN PREVIEW</small>
                <ArrowRight size={16} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function NotFound() {
  return (
    <main className="locked-route">
      <section className="empty-route locked-section">
        <p className="locked-eyebrow">404</p>
        <h1>Nothing is published here.</h1>
        <p>This route is not part of the current public ANEVUM surface.</p>
        <LockedButton href="/" secondary>RETURN HOME</LockedButton>
      </section>
    </main>
  );
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return pathname;
}

function RouteView({ pathname }: { pathname: string }) {
  if (pathname === "/") return <FrontDoor />;
  if (pathname === "/stories") return <Stories />;
  if (pathname === "/stories/reply") return <Reply />;
  if (pathname === "/wiki") return <WikiHome />;
  if (pathname.startsWith("/wiki/")) {
    return <WikiRecord slug={decodeURIComponent(pathname.slice(6))} />;
  }
  if (pathname === "/lattice") return <Lattice />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/transmissions") return <Transmissions />;
  if (pathname === "/store") return <Store />;
  if (pathname === "/rhenlink") return <Rhenlink />;
  return <NotFound />;
}

function titleForPath(pathname: string) {
  if (pathname === "/") return "ANEVUM";
  if (pathname === "/stories") return "Stories — ANEVUM";
  if (pathname === "/stories/reply") return "REPLY — ANEVUM";
  if (pathname.startsWith("/wiki/")) {
    const record = getPublicObjectBySlug(decodeURIComponent(pathname.slice(6)));
    return record ? `${record.title} — WIKI.ANEVUM` : "WIKI — ANEVUM";
  }
  if (pathname === "/wiki") return "WIKI — ANEVUM";
  if (pathname === "/lattice") return "LATTICE — ANEVUM";
  if (pathname === "/search") return "Search — ANEVUM";
  if (pathname === "/transmissions") return "Transmissions — ANEVUM";
  if (pathname === "/store") return "Store — ANEVUM";
  if (pathname === "/rhenlink") return "RHENLINK — ANEVUM";
  return "ANEVUM";
}

export default function App() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return (
    <div className="site-root locked-site-root">
      <Header pathname={pathname} />
      <RouteView pathname={pathname} />
      <footer className="locked-footer">
        <span>ANEVUM</span>
        <span>STORIES CREATE WORLDS. PEOPLE BRING THEM TO LIFE.</span>
        <span>DEVON AKINS</span>
      </footer>
    </div>
  );
}
