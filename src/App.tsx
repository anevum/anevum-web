import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CircleUserRound,
  Eye,
  Grid3X3,
  LogIn,
  LogOut,
  Menu,
  Search,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import {
  PUBLIC_SYNC,
  featuredPublicObjects,
  getPublicObjectBySlug,
  publicObjects,
  searchPublicObjects,
  type PublicObject,
  type VisualKey,
} from "./publicObjects";
import {
  displayIdentity,
  loadSession,
  memberBackend,
  signIn,
  signOut,
  signUp,
  type MemberSession,
} from "./memberClient";

const primaryNav = [
  ["STORIES", "/stories"],
  ["WIKI", "/wiki"],
  ["LATTICE", "/lattice"],
  ["TRANSMISSIONS", "/transmissions"],
  ["STORE", "/store"],
] as const;

type LinkProps = { href: string; className?: string; children: ReactNode; onNavigate?: () => void; ariaLabel?: string };

function navigate(href: string) {
  if (window.location.pathname !== href) window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function Link({ href, className, children, onNavigate, ariaLabel }: LinkProps) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(href);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i /><i /><i />
    </span>
  );
}

function Header({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="header-row">
        <Link href="/" className="brand" onNavigate={() => setOpen(false)}>
          <Mark />
          <span>ANEVUM</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryNav.map(([label, href]) => (
            <Link key={href} href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <Link href="/search" className="header-icon" ariaLabel="Search"><Search size={16} /></Link>
          <Link href="/rhenlink" className="rhenlink-pill"><CircleUserRound size={17} /><span>RHENLINK</span></Link>
          <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Menu">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {[...primaryNav, ["SEARCH", "/search"] as const, ["RHENLINK", "/rhenlink"] as const].map(([label, href]) => (
            <Link key={href} href={href} onNavigate={() => setOpen(false)}><span>{label}</span><ArrowRight size={15} /></Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

function VisualArt({ visualKey, className = "", label }: { visualKey: VisualKey; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  const isWorld = ["veyra", "ovara", "neral", "ione"].includes(visualKey);
  const isCity = ["merva", "serein", "cape", "continuance"].includes(visualKey);
  const isGate = ["skygate", "road", "connected"].includes(visualKey);
  const isField = ["grainit", "iren", "event", "deep-three"].includes(visualKey);

  return (
    <svg className={`visual-art ${className}`} viewBox="0 0 1200 760" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-space`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#050607" />
          <stop offset="0.5" stopColor="#0c1115" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <radialGradient id={`${id}-planet`} cx="35%" cy="28%" r="78%">
          <stop offset="0" stopColor="#b6c7d0" />
          <stop offset="0.2" stopColor="#526c75" />
          <stop offset="0.58" stopColor="#17282f" />
          <stop offset="1" stopColor="#050708" />
        </radialGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4da8ff" stopOpacity="0" />
          <stop offset="0.52" stopColor="#4da8ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#4da8ff" stopOpacity="0" />
        </linearGradient>
        <pattern id={`${id}-grain`} width="36" height="36" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="5" r="1" fill="#ece8de" fillOpacity="0.22" />
          <circle cx="29" cy="19" r="0.7" fill="#ece8de" fillOpacity="0.12" />
        </pattern>
        <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="18" /></filter>
      </defs>
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <rect width="1200" height="760" fill={`url(#${id}-grain)`} opacity="0.68" />
      <path d="M0 590 C250 500 405 545 620 515 C830 486 1010 420 1200 455 L1200 760 L0 760Z" fill="#080b0d" />
      <path d="M0 620 C260 570 415 600 640 575 C875 550 1000 500 1200 510" fill="none" stroke="#b79a5d" strokeOpacity="0.16" />

      {isWorld ? (
        <g>
          <circle cx="785" cy="330" r={visualKey === "ione" ? 215 : 300} fill={`url(#${id}-planet)`} />
          <ellipse cx="758" cy="272" rx="210" ry="85" fill="none" stroke="#d9e3e7" strokeOpacity="0.13" strokeWidth="10" transform="rotate(-13 758 272)" />
          <ellipse cx="725" cy="374" rx="225" ry="60" fill="none" stroke="#4da8ff" strokeOpacity="0.12" strokeWidth="7" transform="rotate(9 725 374)" />
          <circle cx="980" cy="120" r={visualKey === "ione" ? 36 : 29} fill="#b7bdc0" fillOpacity="0.56" />
          {visualKey !== "ione" ? <circle cx="985" cy="120" r="48" fill="none" stroke="#ece8de" strokeOpacity="0.08" /> : null}
        </g>
      ) : null}

      {isCity ? (
        <g>
          <path d="M115 608 L220 608 L220 422 L276 422 L276 608 L332 608 L332 495 L392 495 L392 608 L458 608 L458 340 L520 340 L520 608 L596 608 L596 450 L650 450 L650 608 L735 608 L735 260 L790 260 L790 608 L865 608 L865 408 L930 408 L930 608 L1020 608 L1020 476 L1090 476 L1090 608Z" fill="#10181c" stroke="#40505a" strokeOpacity="0.55" />
          <path d="M120 624 C320 554 496 680 694 604 C871 536 1015 610 1200 540" fill="none" stroke="#4da8ff" strokeOpacity="0.22" strokeWidth="11" />
          <path d="M440 340 L490 215 L540 340" fill="#121a1e" />
          {visualKey === "continuance" ? (
            <g><rect x="690" y="150" width="112" height="460" fill="#13191c" /><rect x="714" y="94" width="65" height="516" fill="#171f22" /><line x1="746" y1="80" x2="746" y2="15" stroke="#b79a5d" strokeOpacity="0.35" /></g>
          ) : null}
        </g>
      ) : null}

      {isGate ? (
        <g>
          <circle cx="760" cy="360" r="250" fill="none" stroke="#b7c4cb" strokeOpacity="0.18" strokeWidth="58" />
          <circle cx="760" cy="360" r="250" fill="none" stroke="#4da8ff" strokeOpacity="0.48" strokeWidth="2" strokeDasharray="8 16" />
          <circle cx="760" cy="360" r="178" fill="#071016" stroke="#d6e1e8" strokeOpacity="0.2" />
          <ellipse cx="760" cy="360" rx="108" ry="178" fill="none" stroke="#4da8ff" strokeOpacity="0.4" />
          <path d="M510 360 H1010" stroke={`url(#${id}-glass)`} strokeWidth="3" />
          <g fill="#cfd8dc" fillOpacity="0.44">
            {Array.from({ length: 18 }).map((_, i) => {
              const a = (i / 18) * Math.PI * 2;
              return <circle key={i} cx={760 + Math.cos(a) * 250} cy={360 + Math.sin(a) * 250} r="5" />;
            })}
          </g>
        </g>
      ) : null}

      {isField ? (
        <g>
          <circle cx="760" cy="365" r="260" fill="#4da8ff" fillOpacity="0.04" filter={`url(#${id}-blur)`} />
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={i} d={`M220 ${170 + i * 30} C420 ${70 + i * 24}, 640 ${260 + i * 12}, 1030 ${120 + i * 35}`} fill="none" stroke={i % 4 === 0 ? "#4da8ff" : "#c7ced2"} strokeOpacity={i % 4 === 0 ? 0.35 : 0.12} strokeWidth={i % 4 === 0 ? 2 : 1} />
          ))}
          {visualKey === "event" ? <path d="M300 550 L460 420 L570 470 L690 260 L820 370 L980 190" fill="none" stroke="#b79a5d" strokeOpacity="0.58" strokeWidth="2" /> : null}
          {visualKey === "deep-three" ? <g><circle cx="820" cy="430" r="118" fill="none" stroke="#ece8de" strokeOpacity="0.15" /><circle cx="820" cy="430" r="72" fill="none" stroke="#4da8ff" strokeOpacity="0.25" /></g> : null}
        </g>
      ) : null}

      {visualKey === "person" ? (
        <g>
          <circle cx="785" cy="250" r="120" fill="#1b2327" stroke="#7d929c" strokeOpacity="0.28" />
          <path d="M530 690 C545 502 634 412 785 412 C936 412 1025 505 1040 690Z" fill="#11181c" stroke="#5e737e" strokeOpacity="0.28" />
          <circle cx="785" cy="250" r="184" fill="none" stroke="#4da8ff" strokeOpacity="0.09" />
        </g>
      ) : null}

      <rect x="40" y="40" width="1120" height="680" fill="none" stroke="#ece8de" strokeOpacity="0.05" />
    </svg>
  );
}

function Button({ href, children, quiet = false }: { href: string; children: ReactNode; quiet?: boolean }) {
  return <Link href={href} className={`button ${quiet ? "quiet" : ""}`}><span>{children}</span><ArrowRight size={14} /></Link>;
}

function SyncStamp() {
  return (
    <div className="sync-stamp">
      <span>PUBLIC CANON PROJECTION</span>
      <strong>{PUBLIC_SYNC.count} RELEASED RECORDS</strong>
      <small>SYNCED {PUBLIC_SYNC.syncedAt}</small>
    </div>
  );
}

function RecordCard({ record, compact = false }: { record: PublicObject; compact?: boolean }) {
  return (
    <Link href={record.route} className={`record-card ${compact ? "compact" : ""}`}>
      {!compact ? <VisualArt visualKey={record.visualKey} className="record-card-art" /> : null}
      <div className="record-card-copy">
        <span className="meta">{record.section} / {record.type}</span>
        <h3>{record.title}</h3>
        {!compact ? <p>{record.summary}</p> : null}
        <span className="record-state">{record.renderMode} · {record.spoilerLevel}</span>
      </div>
      <ArrowRight size={16} className="record-arrow" />
    </Link>
  );
}

function FrontDoor() {
  const heroRecord = getPublicObjectBySlug("connected-worlds")!;
  return (
    <main>
      <section className="home-hero">
        <VisualArt visualKey="connected" className="home-hero-art" />
        <div className="home-veil" />
        <div className="hero-copy">
          <p className="eyebrow">ANEVUM / STORIES FIRST</p>
          <h1>A universe in story.<br /><em>A story in everything.</em></h1>
          <p>Books at the center. Knowledge, discovery and belonging expanding outward from what is actually released.</p>
          <div className="actions"><Button href="/stories/reply">DISCOVER REPLY</Button><Button href="/wiki" quiet>ENTER THE WIKI</Button></div>
        </div>
        <div className="hero-caption"><span>PUBLIC VISUAL LANGUAGE</span><b>THE TRANSCOSMIC</b></div>
      </section>

      <section className="story-feature section">
        <div className="story-feature-copy">
          <p className="eyebrow">THE TRANSCOSMIC / BOOK ONE</p>
          <h2>REPLY</h2>
          <p className="byline">DEVON AKINS</p>
          <p className="story-lead">Humanity receives a reply.</p>
          <p>The current story at the center of ANEVUM. Public material stays inside the spoiler-safe release boundary while the book is in production.</p>
          <Button href="/stories/reply">OPEN THE STORY</Button>
        </div>
        <div className="book-visual">
          <div className="book-shell"><span>THE TRANSCOSMIC</span><strong>REPLY</strong><small>DEVON AKINS</small></div>
          <VisualArt visualKey="grainit" className="book-scene" />
        </div>
      </section>

      <section className="section two-doors">
        <div className="section-head"><div><p className="eyebrow">THE UNIVERSE</p><h2>Read it. Then move through it.</h2></div><p>WIKI is the released record. LATTICE is the universe as a navigable place.</p></div>
        <div className="door-grid">
          <Link href="/wiki" className="door-card">
            <VisualArt visualKey="veyra" />
            <div><span>KNOWLEDGE</span><h3>WIKI.ANEVUM</h3><p>People, worlds, places, events and ideas — only after release clearance.</p><b>OPEN WIKI <ArrowRight size={14} /></b></div>
          </Link>
          <Link href="/lattice" className="door-card">
            <VisualArt visualKey="connected" />
            <div><span>DISCOVERY</span><h3>LATTICE.ANEVUM</h3><p>Follow the released universe relationally, then make the connection yours with RHENLINK.</p><b>ENTER LATTICE <ArrowRight size={14} /></b></div>
          </Link>
        </div>
      </section>

      <section className="section released-strip">
        <div className="section-head"><div><p className="eyebrow">CURRENTLY PUBLIC</p><h2>The record is no longer empty.</h2></div><SyncStamp /></div>
        <div className="record-grid four">
          {featuredPublicObjects.slice(0, 4).map((record) => <RecordCard key={record.id} record={record} />)}
        </div>
        <div className="wide-feature">
          <VisualArt visualKey={heroRecord.visualKey} />
          <div><p className="eyebrow">RELEASED CONTEXT</p><h3>{heroRecord.title}</h3><p>{heroRecord.summary}</p><Button href={heroRecord.route} quiet>READ THE RECORD</Button></div>
        </div>
      </section>
    </main>
  );
}

function Stories() {
  return (
    <main className="route-main">
      <section className="route-hero"><VisualArt visualKey="road" /><div><p className="eyebrow">STORIES</p><h1>The story is the front door.</h1><p>ANEVUM begins with REPLY. The world expands only where the released record supports it.</p></div></section>
      <section className="section story-index"><Link href="/stories/reply" className="story-index-card"><div><span>THE TRANSCOSMIC / BOOK ONE</span><h2>REPLY</h2><p>Devon Akins · In production</p></div><div className="mini-book">REPLY</div><ArrowRight /></Link></section>
    </main>
  );
}

function Reply() {
  const records = ["ovara", "merva", "neral", "serein-skygate"].map((slug) => getPublicObjectBySlug(slug)!).filter(Boolean);
  return (
    <main className="route-main">
      <section className="reply-hero"><VisualArt visualKey="road" /><div className="reply-hero-copy"><Link href="/stories" className="back"><ArrowLeft size={14} /> STORIES</Link><p className="eyebrow">THE TRANSCOSMIC / BOOK ONE</p><h1>REPLY</h1><p className="byline">DEVON AKINS</p><p className="story-lead">Humanity receives a reply.</p><p>The public page remains deliberately spoiler-safe while the manuscript is in production.</p><Button href="/wiki" quiet>EXPLORE RELEASED CANON</Button></div></section>
      <section className="section"><div className="section-head"><div><p className="eyebrow">CONNECTED RECORDS</p><h2>The world around the opening story.</h2></div><p>These records are drawn from the current public Notion release queue rather than an older fixed set.</p></div><div className="record-grid four">{records.map((r) => <RecordCard key={r.id} record={r} />)}</div></section>
    </main>
  );
}

function WikiHome() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("ALL");
  const results = useMemo(() => searchPublicObjects(query, section), [query, section]);
  const lead = getPublicObjectBySlug("merva")!;

  return (
    <main className="wiki-page">
      <section className="wiki-hero">
        <VisualArt visualKey="serein" />
        <div className="wiki-hero-copy"><p className="eyebrow">WIKI.ANEVUM</p><h1>The known record.</h1><p>People. Worlds. Places. Events. Ideas.</p><div className="wiki-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search released canon..." aria-label="Search released canon" /></div></div>
        <SyncStamp />
      </section>

      <section className="wiki-browser section">
        <div className="wiki-filterbar">
          <div className="filter-tabs">
            {["ALL", "UNIVERSE", "ATLAS", "ARCHIVE"].map((value) => <button key={value} className={section === value ? "active" : ""} onClick={() => setSection(value)}>{value}</button>)}
          </div>
          <span>{results.length} PUBLIC RECORDS</span>
        </div>
        <div className="wiki-lead">
          <VisualArt visualKey={lead.visualKey} />
          <div><span>FEATURED / {lead.type}</span><h2>{lead.title}</h2><p>{lead.summary}</p><Button href={lead.route}>OPEN RECORD</Button></div>
        </div>
        <div className="record-grid wiki-grid">{results.map((record) => <RecordCard key={record.id} record={record} />)}</div>
      </section>
    </main>
  );
}

function WikiRecord({ slug }: { slug: string }) {
  const record = getPublicObjectBySlug(slug);
  if (!record) return <NotFound />;
  const neighbors = publicObjects.filter((item) => item.section === record.section && item.id !== record.id).slice(0, 3);

  return (
    <main className="record-page">
      <section className="record-hero">
        <VisualArt visualKey={record.visualKey} label={`Visual study for ${record.title}`} />
        <div className="record-hero-copy"><Link href="/wiki" className="back"><ArrowLeft size={14} /> WIKI</Link><p className="eyebrow">{record.section} / {record.type}</p><h1>{record.title}</h1><p>{record.summary}</p><div className="badges"><span>{record.renderMode}</span><span>{record.spoilerLevel}</span><span>{record.visualStatus} VISUAL</span></div></div>
      </section>
      <section className="record-body section">
        <article>
          <p className="eyebrow">PUBLIC RECORD</p>
          <h2>{record.summary}</h2>
          {record.facts?.length ? <div className="fact-grid">{record.facts.map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div> : null}
          <div className="publication-note"><span>PUBLICATION BOUNDARY</span><p>{record.publicNote}</p></div>
          <p className="source-note">Notion remains the canon authority. This client contains only the publication-cleared projection and never queries private canon directly.</p>
        </article>
        <aside>
          <div className="record-aside-card"><span>PUBLICATION STATE</span><dl><div><dt>Render</dt><dd>{record.renderMode}</dd></div><div><dt>Spoiler</dt><dd>{record.spoilerLevel}</dd></div><div><dt>Window</dt><dd>{record.publicWindow}</dd></div><div><dt>Visual</dt><dd>{record.visualStatus}</dd></div></dl></div>
          <Button href="/lattice">EXPLORE IN LATTICE</Button>
          <Button href="/rhenlink" quiet>SAVE WITH RHENLINK</Button>
        </aside>
      </section>
      <section className="section related"><div className="section-head"><div><p className="eyebrow">MORE RELEASED {record.section}</p><h2>Continue through the record.</h2></div></div><div className="record-grid three">{neighbors.map((item) => <RecordCard key={item.id} record={item} />)}</div></section>
    </main>
  );
}

function Lattice() {
  const nodes = featuredPublicObjects.slice(0, 9);
  const [selected, setSelected] = useState(nodes[0]);
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener("anevum-member-session", sync);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, []);
  const identity = displayIdentity(session);

  return (
    <main className="lattice-page">
      <section className="lattice-intro">
        <VisualArt visualKey="connected" />
        <div><p className="eyebrow">LATTICE.ANEVUM</p><h1>The universe as a place.</h1><p>Move through released canon relationally. RHENLINK turns that exploration into a persistent member identity.</p><div className="actions">{session ? <Button href="/rhenlink">OPEN @{identity.handle || "RHENLINK"}</Button> : <Button href="/rhenlink">CLAIM YOUR RHENLINK</Button>}<Button href="/wiki" quiet>READ THE WIKI</Button></div></div>
      </section>
      <section className="lattice-workspace">
        <div className="graph-panel">
          <div className="graph-lines" aria-hidden="true"><span /><span /><span /><span /><span /></div>
          {nodes.map((record, index) => (
            <button key={record.id} className={`graph-node node-${index} ${selected.id === record.id ? "selected" : ""}`} onClick={() => setSelected(record)}>
              <i /><strong>{record.title}</strong><small>{record.type}</small>
            </button>
          ))}
          <div className="graph-legend"><Grid3X3 size={15} /><span>RELEASED OBJECT GRAPH</span></div>
        </div>
        <aside className="graph-inspector">
          <VisualArt visualKey={selected.visualKey} />
          <span className="meta">FOCUS / {selected.type}</span><h2>{selected.title}</h2><p>{selected.summary}</p><Button href={selected.route}>OPEN RECORD</Button>
          {!session ? <div className="lattice-join"><span>MAKE THE CONNECTION YOURS</span><p>Create a RHENLINK to establish persistent identity across ANEVUM and LATTICE.</p><Button href="/rhenlink">CREATE RHENLINK</Button></div> : <div className="lattice-join connected"><span>CONNECTED</span><strong>@{identity.handle || "member"}</strong><p>Your authenticated RHENLINK session is active in this browser.</p></div>}
        </aside>
      </section>
    </main>
  );
}

function Rhenlink() {
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const identity = displayIdentity(session);

  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener("anevum-member-session", sync);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const handle = String(form.get("handle") || "").trim().toLowerCase();
    const displayName = String(form.get("displayName") || "").trim();
    if (!/^[a-z0-9][a-z0-9_]{2,20}$/.test(handle)) { setStatus("RHENLINK handle must be 3–21 lowercase letters, numbers, or underscores."); setBusy(false); return; }
    try {
      const result = await signUp({ email, password, handle, displayName });
      if (result.status === "signed-in") { setSession(result.session); setStatus("RHENLINK created. Your authenticated member session is active."); }
      else setStatus("Account created. Check your email to confirm the address, then return here to sign in.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not create RHENLINK."); }
    finally { setBusy(false); }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const next = await signIn(String(form.get("email") || ""), String(form.get("password") || ""));
      setSession(next); setStatus("Signed in. RHENLINK session restored.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not sign in."); }
    finally { setBusy(false); }
  }

  async function handleSignOut() { setBusy(true); await signOut(); setSession(null); setStatus("Signed out."); setBusy(false); }

  return (
    <main className="rhenlink-page">
      <section className="rhenlink-hero"><VisualArt visualKey="connected" /><div><p className="eyebrow">RHENLINK</p><h1>Your persistent identity.</h1><p>One member identity across ANEVUM. LATTICE is where that identity becomes visible through discovery and later persistent member systems.</p></div></section>
      <section className="rhenlink-shell section">
        {session ? (
          <div className="identity-dashboard">
            <div className="identity-badge"><CircleUserRound size={34} /><span>CONNECTED RHENLINK</span></div>
            <h2>{identity.displayName || "Member"}</h2><p className="handle">@{identity.handle || "member"}</p><p>{session.user.email}</p>
            <div className="identity-modules"><div><span>SAVED</span><strong>—</strong><small>backend persistence not yet verified</small></div><div><span>COLLECTIONS</span><strong>—</strong><small>backend persistence not yet verified</small></div><div><span>ACHIEVEMENTS</span><strong>—</strong><small>backend persistence not yet verified</small></div></div>
            <div className="actions"><Button href="/lattice">ENTER LATTICE</Button><button type="button" className="button quiet native" onClick={handleSignOut} disabled={busy}><LogOut size={14} /> SIGN OUT</button></div>
          </div>
        ) : (
          <div className="auth-layout">
            <div className="auth-intro"><span className="meta">ACCOUNT → RHENLINK → LATTICE</span><h2>Claim the identity that follows you through ANEVUM.</h2><p>Registration uses the existing ANEVUM member Supabase project. The browser never receives a service-role key.</p><div className={`backend-state ${memberBackend.configured ? "ready" : "blocked"}`}><i />{memberBackend.configured ? "MEMBER AUTH CONFIGURED" : "PUBLIC MEMBER KEY NOT CONFIGURED IN THIS PREVIEW BUILD"}</div></div>
            <div className="auth-card">
              <div className="auth-tabs"><button className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>CREATE RHENLINK</button><button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>SIGN IN</button></div>
              {mode === "create" ? (
                <form onSubmit={handleCreate}>
                  <label>DISPLAY NAME<input name="displayName" required autoComplete="name" /></label>
                  <label>RHENLINK HANDLE<div className="handle-input"><span>@</span><input name="handle" required autoCapitalize="none" autoCorrect="off" placeholder="devon" /></div></label>
                  <label>EMAIL<input name="email" type="email" required autoComplete="email" /></label>
                  <label>PASSWORD<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
                  <button className="auth-submit" type="submit" disabled={busy || !memberBackend.configured}>{busy ? "CONNECTING..." : "CREATE RHENLINK"}<ArrowRight size={14} /></button>
                </form>
              ) : (
                <form onSubmit={handleSignIn}>
                  <label>EMAIL<input name="email" type="email" required autoComplete="email" /></label>
                  <label>PASSWORD<input name="password" type="password" required autoComplete="current-password" /></label>
                  <button className="auth-submit" type="submit" disabled={busy || !memberBackend.configured}>{busy ? "CONNECTING..." : "SIGN IN"}<LogIn size={14} /></button>
                </form>
              )}
              {status ? <p className="auth-status" role="status">{status}</p> : null}
              {!memberBackend.configured ? <p className="auth-config-note">The signup UI and Supabase Auth wiring are built. This preview still needs the existing project's public publishable/anon key supplied as <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in the Cloudflare build environment before real registration can be tested.</p> : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchPublicObjects(query), [query]);
  return <main className="search-page"><section className="section search-shell"><p className="eyebrow">SEARCH.ANEVUM</p><h1>Search only what is public.</h1><div className="search-big"><Search /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="World, person, place, idea..." /></div><div className="search-results">{results.map((record) => <RecordCard key={record.id} record={record} compact />)}</div></section></main>;
}

function Transmissions() {
  return <main className="route-main"><section className="route-hero"><VisualArt visualKey="event" /><div><p className="eyebrow">TRANSMISSIONS</p><h1>The channel exists. The fiction waits.</h1><p>No in-universe transmission is published until it is deliberately cleared for release.</p></div></section><section className="section empty-state"><Eye size={26} /><span>CURRENT PUBLIC STATE</span><h2>No released transmissions yet.</h2></section></main>;
}

function Store() {
  return <main className="route-main"><section className="route-hero"><VisualArt visualKey="grainit" /><div><p className="eyebrow">STORE</p><h1>Objects from the work.</h1><p>Nothing appears purchasable until the product, artwork, price, fulfillment and sale state are real.</p></div></section><section className="section empty-state"><Sparkles size={26} /><span>RELEASE REGISTER</span><h2>Physical releases remain in production.</h2></section></main>;
}

function NotFound() {
  return <main className="route-main"><section className="section empty-state"><span>404</span><h1>Nothing is published here.</h1><p>Unreleased routes do not expose private canon.</p><Button href="/" quiet>RETURN HOME</Button></section></main>;
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => { const sync = () => setPathname(window.location.pathname); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  return pathname;
}

function Route({ pathname }: { pathname: string }) {
  if (pathname === "/") return <FrontDoor />;
  if (pathname === "/stories") return <Stories />;
  if (pathname === "/stories/reply") return <Reply />;
  if (pathname === "/wiki") return <WikiHome />;
  if (pathname.startsWith("/wiki/")) return <WikiRecord slug={decodeURIComponent(pathname.slice(6))} />;
  if (pathname === "/lattice") return <Lattice />;
  if (pathname === "/rhenlink") return <Rhenlink />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/transmissions") return <Transmissions />;
  if (pathname === "/store") return <Store />;
  return <NotFound />;
}

function titleFor(pathname: string) {
  if (pathname === "/") return "ANEVUM";
  if (pathname.startsWith("/wiki/")) return `${getPublicObjectBySlug(decodeURIComponent(pathname.slice(6)))?.title || "WIKI"} — ANEVUM`;
  const name = pathname.split("/").filter(Boolean).pop() || "ANEVUM";
  return `${name.toUpperCase()} — ANEVUM`;
}

export default function App() {
  const pathname = usePathname();
  useEffect(() => { document.title = titleFor(pathname); }, [pathname]);
  return (
    <div className="app-shell">
      <Header pathname={pathname} />
      <Route pathname={pathname} />
      <footer className="site-footer"><span>ANEVUM</span><span>STORIES CREATE WORLDS. PEOPLE BRING THEM TO LIFE.</span><span>DEVON AKINS</span></footer>
    </div>
  );
}
