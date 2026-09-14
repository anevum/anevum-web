import { useEffect, useState } from "react";
import { ArrowRight, Menu, Search, X } from "lucide-react";

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
              The public front door into ANEVUM. This shell is ready for the final approved
              synopsis, release state, art, and reader actions in the next story build pass.
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
        body="Generation 1 begins with REPLY. This route shell is ready for the final story index composition."
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
  return (
    <main className="route-shell story-shell">
      <PageIntro
        eyebrow="ANEVUM / BOOK I"
        title="REPLY"
        body="Permanent story-detail route established. Final art, approved public synopsis, availability, and released-universe handoffs will be implemented in the story pass."
      />
      <div className="story-placeholder" aria-hidden="true" />
    </main>
  );
}

function WikiHome() {
  return (
    <main className="route-shell wiki-shell">
      <PageIntro
        eyebrow="WIKI.ANEVUM"
        title="The canonical universe."
        body="A public reference layer for publication-cleared people, worlds, locations, technologies, events, objects, and concepts."
      />
      <div className="wiki-search-shell">
        <Search size={18} />
        <span>SEARCH THE RELEASED RECORD</span>
      </div>
      <div className="skeleton-grid" aria-label="Future released record regions">
        <div><span>FEATURED RECORDS</span></div>
        <div><span>RECENTLY RELEASED</span></div>
        <div><span>BROWSE BY TYPE</span></div>
      </div>
    </main>
  );
}

function WikiRecord({ slug }: { slug: string }) {
  return (
    <main className="route-shell record-shell">
      <PageIntro
        eyebrow="WIKI.ANEVUM / RECORD"
        title="Record route ready."
        body={`Dynamic public-record route established for “${slug || "record"}”. No fictional content is populated until the release-gated public object layer is connected.`}
      />
    </main>
  );
}

function Lattice() {
  return (
    <main className="route-shell lattice-shell">
      <PageIntro
        eyebrow="LATTICE.ANEVUM"
        title="The universe as a place."
        body="A relational field for moving through the released universe. The graph, focus panel, and record handoffs will be built against the shared public object model."
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
    </main>
  );
}

function SearchPage() {
  return (
    <main className="route-shell search-shell-page">
      <PageIntro
        eyebrow="SEARCH"
        title="Search ANEVUM."
        body="This permanent route will search only released public stories, records, and transmissions."
      />
      <label className="search-field-shell">
        <Search size={18} />
        <input aria-label="Search ANEVUM" placeholder="Search" disabled />
      </label>
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
        body="The permanent commerce route is established. No inventory, price, or checkout claim will appear until a real product is sale-ready."
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
  if (pathname.startsWith("/wiki")) return "WIKI — ANEVUM";
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
        <span>STORIES / UNIVERSE / IDENTITY</span>
        <span>DEVON AKINS</span>
      </footer>
    </div>
  );
}
