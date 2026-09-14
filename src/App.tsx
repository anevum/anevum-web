import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import {
  featuredPublicObjects,
  getPublicObjectBySlug,
  publicObjects,
  searchPublicObjects,
  type PublicObject,
} from "./publicObjects";

const primaryNav = [
  ["STORIES", "/stories"],
  ["WIKI", "/wiki"],
  ["LATTICE", "/lattice"],
  ["TRANSMISSIONS", "/transmissions"],
  ["STORE", "/store"],
] as const;

const utilityNav = [
  ["SEARCH", "/search"],
  ["RHENLINK", "/rhenlink"],
] as const;

type LinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
};

function navigate(href: string) {
  if (window.location.pathname === href) return;
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function SiteLink({ href, className, children, onNavigate }: LinkProps) {
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

function AnevumMark() {
  return (
    <span className="anevum-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function Header({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="site-header">
        <SiteLink href="/" className="brand" onNavigate={() => setOpen(false)}>
          <AnevumMark />
          <span>ANEVUM</span>
        </SiteLink>

        <nav className="desktop-primary" aria-label="Primary navigation">
          {primaryNav.map(([label, href]) => (
            <SiteLink
              key={href}
              href={href}
              className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : undefined}
            >
              {label}
            </SiteLink>
          ))}
        </nav>

        <nav className="desktop-utility" aria-label="Utilities">
          {utilityNav.map(([label, href]) => (
            <SiteLink
              key={href}
              href={href}
              className={pathname === href ? "active" : undefined}
            >
              {label === "SEARCH" ? <Search size={14} aria-hidden="true" /> : null}
              {label}
            </SiteLink>
          ))}
        </nav>

        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {open ? (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {[...primaryNav, ...utilityNav].map(([label, href]) => (
            <SiteLink key={href} href={href} onNavigate={() => setOpen(false)}>
              <span>{label}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </SiteLink>
          ))}
        </nav>
      ) : null}
    </>
  );
}

function PageIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="intro-copy">{body}</p>
    </section>
  );
}

function RecordCard({ record }: { record: PublicObject }) {
  return (
    <SiteLink href={record.route} className="record-card">
      <div className="record-card-topline">
        <span>{record.section}</span>
        <span>{record.renderMode}</span>
      </div>
      <div>
        <p className="eyebrow">{record.type}</p>
        <h3>{record.title}</h3>
        <p>{record.summary}</p>
      </div>
      <div className="record-card-action">
        <span>OPEN RECORD</span>
        <ArrowRight size={16} aria-hidden="true" />
      </div>
    </SiteLink>
  );
}

function RecordGrid({ records }: { records: PublicObject[] }) {
  if (!records.length) {
    return <div className="record-empty">No released record matches this search.</div>;
  }

  return (
    <div className="record-grid">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} />
      ))}
    </div>
  );
}

function FrontDoor() {
  return (
    <main>
      <section className="front-hero">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">ANEVUM / STORY UNIVERSE</p>
          <h1>Stories first.<br />A universe beyond the page.</h1>
          <p>
            Enter through the current story, then move outward into the released record,
            the connected universe, and the identity that follows you through it.
          </p>
          <div className="hero-actions">
            <SiteLink href="/stories/reply" className="button primary">ENTER REPLY</SiteLink>
            <SiteLink href="/wiki" className="button secondary">ENTER THE UNIVERSE</SiteLink>
          </div>
        </div>
      </section>

      <section className="reply-feature section-frame">
        <div className="section-label">CURRENT STORY</div>
        <div className="reply-grid">
          <div>
            <p className="eyebrow">BOOK I</p>
            <h2>REPLY</h2>
          </div>
          <div className="feature-copy">
            <p>
              The current story at the center of ANEVUM. The public experience begins with
              opening-state orientation and expands only as canon is cleared for release.
            </p>
            <SiteLink href="/stories/reply" className="text-link">OPEN STORY <ArrowRight size={15} /></SiteLink>
          </div>
        </div>
      </section>

      <section className="universe-section section-frame">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE UNIVERSE</p>
            <h2>Knowledge and relationship.</h2>
          </div>
          <p>Two public depths, built from one released canon layer.</p>
        </div>

        <div className="depth-grid">
          <SiteLink href="/wiki" className="depth-card wiki-card">
            <span className="card-index">01</span>
            <div>
              <p className="eyebrow">WIKI.ANEVUM</p>
              <h3>The canonical universe.</h3>
              <p>Search and read the released record.</p>
            </div>
            <ArrowRight aria-hidden="true" />
          </SiteLink>

          <SiteLink href="/lattice" className="depth-card lattice-card">
            <span className="card-index">02</span>
            <div>
              <p className="eyebrow">LATTICE.ANEVUM</p>
              <h3>The universe as a place.</h3>
              <p>Follow relationships between released people, worlds, events, and ideas.</p>
            </div>
            <ArrowRight aria-hidden="true" />
          </SiteLink>
        </div>
      </section>

      <section className="released-preview section-frame">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RELEASED RECORD</p>
            <h2>What is public now.</h2>
          </div>
          <SiteLink href="/wiki" className="text-link">OPEN WIKI <ArrowRight size={15} /></SiteLink>
        </div>
        <RecordGrid records={featuredPublicObjects.slice(0, 4)} />
      </section>

      <section className="from-anevum section-frame">
        <div>
          <p className="eyebrow">FROM ANEVUM</p>
          <h2>Transmissions from the work.</h2>
        </div>
        <SiteLink href="/transmissions" className="text-link">VIEW TRANSMISSIONS <ArrowRight size={15} /></SiteLink>
      </section>
    </main>
  );
}

function Stories() {
  return (
    <main className="route-shell">
      <PageIntro
        eyebrow="STORIES"
        title="The stories are the doorway."
        body="ANEVUM begins with REPLY. The story remains the primary entrance; the Wiki and Lattice reveal only the universe material already cleared for public release."
      />
      <SiteLink href="/stories/reply" className="route-feature">
        <span>BOOK I</span>
        <strong>REPLY</strong>
        <ArrowRight aria-hidden="true" />
      </SiteLink>
    </main>
  );
}

function Reply() {
  const storyRecords = publicObjects.filter((record) =>
    ["ovara", "merva", "neral", "serein-skygate"].includes(record.slug),
  );

  return (
    <main className="route-shell story-shell">
      <PageIntro
        eyebrow="ANEVUM / BOOK I"
        title="REPLY"
        body="REPLY opens across Veyran and Ovaran viewpoints. This public surface remains inside the pre-release disclosure window and contains only opening-state, spoiler-safe orientation."
      />
      <div className="story-placeholder" aria-hidden="true" />
      <section className="story-records">
        <div className="record-section-heading">
          <p className="eyebrow">OPENING-STATE RECORDS</p>
          <h2>Enter the world without leaving the safe window.</h2>
        </div>
        <RecordGrid records={storyRecords} />
      </section>
    </main>
  );
}

function WikiHome() {
  const [query, setQuery] = useState("");
  const records = useMemo(() => searchPublicObjects(query), [query]);

  return (
    <main className="route-shell wiki-shell">
      <PageIntro
        eyebrow="WIKI.ANEVUM"
        title="The known record."
        body="People. Worlds. Places. Events. Ideas. Only records cleared through ANEVUM's public release gates appear here."
      />
      <label className="record-search">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Search the released record"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the released record"
        />
        <span>{records.length} RECORDS</span>
      </label>
      <section className="wiki-records">
        <div className="record-section-heading compact">
          <p className="eyebrow">PUBLIC NOW</p>
          <h2>{query ? "Search results." : "Released records."}</h2>
        </div>
        <RecordGrid records={records} />
      </section>
    </main>
  );
}

function WikiRecord({ slug }: { slug: string }) {
  const record = getPublicObjectBySlug(slug);

  if (!record) {
    return (
      <main className="route-shell record-shell">
        <PageIntro
          eyebrow="WIKI.ANEVUM / RECORD"
          title="Nothing is released here."
          body="No public record exists at this route. Unreleased and restricted canon is not exposed by fallback labels or private-source metadata."
        />
        <SiteLink href="/wiki" className="button secondary">RETURN TO WIKI</SiteLink>
      </main>
    );
  }

  return (
    <main className="route-shell record-shell">
      <section className="record-detail-hero">
        <div>
          <p className="eyebrow">WIKI.ANEVUM / {record.section}</p>
          <h1>{record.title}</h1>
        </div>
        <div className="record-status">
          <span>{record.type}</span>
          <span>{record.renderMode}</span>
          <span>{record.spoilerLevel}</span>
          <span>{record.publicWindow}</span>
        </div>
      </section>
      <div className="record-detail-grid">
        <p className="record-summary">{record.summary}</p>
        <aside>
          <p className="eyebrow">PUBLICATION STATE</p>
          <dl>
            <div><dt>Window</dt><dd>{record.publicWindow}</dd></div>
            <div><dt>REPLY gate</dt><dd>{record.replyGate}</dd></div>
            <div><dt>Render</dt><dd>{record.renderMode}</dd></div>
            <div><dt>Spoiler level</dt><dd>{record.spoilerLevel}</dd></div>
          </dl>
        </aside>
      </div>
      <div className="record-actions">
        <SiteLink href="/lattice" className="button secondary">EXPLORE CONNECTIONS</SiteLink>
        <SiteLink href="/wiki" className="text-link">BACK TO WIKI <ArrowRight size={15} /></SiteLink>
      </div>
    </main>
  );
}

function Lattice() {
  return (
    <main className="route-shell lattice-shell">
      <PageIntro
        eyebrow="LATTICE.ANEVUM"
        title="The universe as a place."
        body="A relational field for moving through the released universe. Only publication-cleared records can become nodes."
      />
      <div className="lattice-stage" aria-hidden="true">
        <span className="node node-a" />
        <span className="node node-b" />
        <span className="node node-c" />
        <span className="node node-focus"><i /></span>
        <span className="trace trace-a" />
        <span className="trace trace-b" />
        <span className="trace trace-c" />
      </div>
      <section className="lattice-record-strip">
        <div className="record-section-heading compact">
          <p className="eyebrow">RELEASED NODES</p>
          <h2>Start from a real record.</h2>
        </div>
        <div className="lattice-links">
          {featuredPublicObjects.slice(0, 6).map((record) => (
            <SiteLink key={record.id} href={record.route}>
              <span>{record.type}</span>
              <strong>{record.title}</strong>
              <ArrowRight size={15} aria-hidden="true" />
            </SiteLink>
          ))}
        </div>
      </section>
    </main>
  );
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchPublicObjects(query), [query]);

  return (
    <main className="route-shell search-shell-page">
      <PageIntro
        eyebrow="SEARCH"
        title="Search ANEVUM."
        body="Search currently indexes the released public record. Restricted and unpublished canon never appears as a fallback result."
      />
      <label className="search-field-shell active-search">
        <Search size={18} />
        <input
          aria-label="Search ANEVUM"
          placeholder="Search released records"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <section className="search-results">
        <div className="record-section-heading compact">
          <p className="eyebrow">{query ? "MATCHES" : "INDEX"}</p>
          <h2>{results.length} released records.</h2>
        </div>
        <RecordGrid records={results} />
      </section>
    </main>
  );
}

function Transmissions() {
  return (
    <main className="route-shell">
      <PageIntro
        eyebrow="TRANSMISSIONS"
        title="From ANEVUM."
        body="Editorial transmissions, development notes, and outward-facing company communication will live here."
      />
    </main>
  );
}

function Store() {
  return (
    <main className="route-shell">
      <PageIntro
        eyebrow="STORE"
        title="Objects from ANEVUM."
        body="The permanent commerce route is established. No inventory, price, or checkout claim appears until a real product is sale-ready."
      />
    </main>
  );
}

function Rhenlink() {
  return (
    <main className="route-shell rhenlink-shell">
      <PageIntro
        eyebrow="RHENLINK"
        title="Your persistent identity."
        body="Profile, Saved, Collections, progress, and other member systems will appear here only when backed by the existing verified member backend."
      />
    </main>
  );
}

function NotFound() {
  return (
    <main className="route-shell">
      <PageIntro
        eyebrow="404"
        title="Nothing is published here."
        body="This route is not part of the current public ANEVUM surface."
      />
      <SiteLink href="/" className="button secondary">RETURN HOME</SiteLink>
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
  if (pathname.startsWith("/wiki/")) return <WikiRecord slug={decodeURIComponent(pathname.slice(6))} />;
  if (pathname === "/lattice") return <Lattice />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/transmissions") return <Transmissions />;
  if (pathname === "/store") return <Store />;
  if (pathname === "/rhenlink") return <Rhenlink />;
  return <NotFound />;
}

const titleForPath = (pathname: string) => {
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
};

export default function App() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return (
    <div className="site-root">
      <Header pathname={pathname} />
      <RouteView pathname={pathname} />
      <footer className="site-footer">
        <SiteLink href="/" className="footer-brand"><AnevumMark /> ANEVUM</SiteLink>
        <span>BOOKS • KNOWLEDGE • DISCOVERY • BELONGING</span>
        <span>DEVON AKINS</span>
      </footer>
    </div>
  );
}
