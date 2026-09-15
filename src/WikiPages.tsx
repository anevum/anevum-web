import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Bookmark, Check, ExternalLink, LogIn, LogOut, Search, UserRound } from "lucide-react";
import { publicObjects, getPublicObjectBySlug, searchPublicObjects, type PublicObject } from "./publicObjects";
import { getWikiDetail } from "./wikiDetails";
import { getWikiSections } from "./wikiSupplement";
import { CanonVisual } from "./CanonVisuals";
import { Link, SyncStamp, navigate } from "./ui";
import {
  displayIdentity,
  loadSession,
  memberBackend,
  signIn,
  signOut,
  signUp,
  type MemberSession,
} from "./memberClient";
import { loadWikiSaves, onWikiSavesChange, toggleWikiSave, wikiSavePersistence } from "./wikiMember";

const WIKI_HOST = "wiki.anevum.com";

function onWikiHost() {
  return typeof window !== "undefined" && window.location.hostname.toLowerCase() === WIKI_HOST;
}

function wikiHomeHref() {
  return onWikiHost() ? "/" : "/wiki";
}

function wikiHref(record: PublicObject) {
  return onWikiHost() ? record.sourceRoute : record.route;
}

function rhenlinkHref(returnPath?: string) {
  const base = "/rhenlink";
  return returnPath ? `${base}?return=${encodeURIComponent(returnPath)}` : base;
}

function headingId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function useWikiMember() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  const [saved, setSaved] = useState<string[]>(() => loadWikiSaves(loadSession()));

  useEffect(() => {
    const syncSession = () => {
      const next = loadSession();
      setSession(next);
      setSaved(loadWikiSaves(next));
    };
    const syncSaves = () => setSaved(loadWikiSaves(loadSession()));
    window.addEventListener("anevum-member-session", syncSession);
    const removeSaveListener = onWikiSavesChange(syncSaves);
    return () => {
      window.removeEventListener("anevum-member-session", syncSession);
      removeSaveListener();
    };
  }, []);

  return { session, setSession, saved, setSaved, identity: displayIdentity(session) };
}

const sectionCounts = {
  ALL: publicObjects.length,
  UNIVERSE: publicObjects.filter((record) => record.section === "UNIVERSE").length,
  ATLAS: publicObjects.filter((record) => record.section === "ATLAS").length,
  ARCHIVE: publicObjects.filter((record) => record.section === "ARCHIVE").length,
};

export function WikiHeader() {
  const { session, saved, identity } = useWikiMember();
  return (
    <header className="wiki-site-header">
      <div className="wiki-site-header-inner">
        <Link href={wikiHomeHref()} className="wiki-site-brand">
          <span className="wiki-site-wordmark">WIKI.ANEVUM</span>
          <span className="wiki-site-subtitle">PUBLIC CANON ENCYCLOPEDIA</span>
        </Link>
        <nav className="wiki-site-utilities" aria-label="Wiki utilities">
          <Link href={wikiHomeHref()} className="wiki-utility-link">MAIN PAGE</Link>
          {session ? (
            <>
              <Link href="/saved" className="wiki-utility-link wiki-rhenlink-state"><Bookmark size={12} /> SAVED {saved.length}</Link>
              <Link href="/rhenlink" className="wiki-utility-link wiki-rhenlink-state"><UserRound size={12} /> @{identity.handle || "member"}</Link>
            </>
          ) : (
            <Link href="/rhenlink" className="wiki-utility-link wiki-rhenlink-state"><UserRound size={12} /> RHENLINK</Link>
          )}
          <a href="https://anevum.com" className="wiki-utility-link">ANEVUM.COM <ExternalLink size={11} /></a>
        </nav>
      </div>
    </header>
  );
}

function WikiSidebar({ record, activeSection = "ALL", onSection }: { record?: PublicObject; activeSection?: string; onSection?: (value: string) => void }) {
  const detail = record ? getWikiDetail(record.slug) : undefined;
  const sections = record ? getWikiSections(record.slug, detail?.sections || []) : [];
  const { session, saved, identity } = useWikiMember();
  const coreRecords = ["merva", "ovara", "neral", "veyra", "connected-worlds"]
    .map((slug) => getPublicObjectBySlug(slug))
    .filter(Boolean) as PublicObject[];

  return (
    <aside className="wiki-sidebar">
      <div className="wiki-sidebar-group">
        <span className="wiki-sidebar-label">NAVIGATION</span>
        <Link href={wikiHomeHref()} className="wiki-sidebar-link">Main page</Link>
        <Link href={`${wikiHomeHref()}#all-records`} className="wiki-sidebar-link">All released records</Link>
      </div>

      <div className="wiki-sidebar-group">
        <span className="wiki-sidebar-label">BROWSE</span>
        {(["ALL", "UNIVERSE", "ATLAS", "ARCHIVE"] as const).map((value) => (
          onSection ? (
            <button key={value} type="button" className={`wiki-sidebar-link wiki-sidebar-button ${activeSection === value ? "active" : ""}`} onClick={() => onSection(value)}>
              <span>{value === "ALL" ? "All records" : value.charAt(0) + value.slice(1).toLowerCase()}</span>
              <small>{sectionCounts[value]}</small>
            </button>
          ) : (
            <Link key={value} href={`${wikiHomeHref()}#all-records`} className="wiki-sidebar-link">
              <span>{value === "ALL" ? "All records" : value.charAt(0) + value.slice(1).toLowerCase()}</span>
              <small>{sectionCounts[value]}</small>
            </Link>
          )
        ))}
      </div>

      {record && sections.length ? (
        <div className="wiki-sidebar-group wiki-toc">
          <span className="wiki-sidebar-label">CONTENTS</span>
          <a href="#overview" className="wiki-sidebar-link">Overview</a>
          {sections.map((section, index) => (
            <a key={`${section.title}-${index}`} href={`#${headingId(section.title)}`} className="wiki-sidebar-link">
              <span>{index + 1}. {section.title}</span>
            </a>
          ))}
        </div>
      ) : null}

      {!record ? (
        <div className="wiki-sidebar-group">
          <span className="wiki-sidebar-label">CORE RECORDS</span>
          {coreRecords.map((item) => <Link key={item.id} href={wikiHref(item)} className="wiki-sidebar-link">{item.title}</Link>)}
        </div>
      ) : null}

      <div className="wiki-sidebar-group wiki-rhenlink-sidebar">
        <span className="wiki-sidebar-label">RHENLINK</span>
        {session ? (
          <>
            <Link href="/rhenlink" className="wiki-sidebar-link"><span>@{identity.handle || "member"}</span><small>active</small></Link>
            <Link href="/saved" className="wiki-sidebar-link"><span>Saved records</span><small>{saved.length}</small></Link>
          </>
        ) : (
          <Link href={rhenlinkHref(record ? wikiHref(record) : wikiHomeHref())} className="wiki-sidebar-link"><span>Sign in / create</span><small>RHENLINK</small></Link>
        )}
      </div>

      <div className="wiki-sidebar-source">
        <span>CANON AUTHORITY</span>
        <p>Live Transcosmic Canon Wiki + Website Publishing Queue.</p>
      </div>
    </aside>
  );
}

function WikiSearch({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <label className="wiki-native-search">
      <Search size={15} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search WIKI.ANEVUM" aria-label="Search released canon" />
      {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
    </label>
  );
}

function WikiRecordRow({ record }: { record: PublicObject }) {
  return (
    <Link href={wikiHref(record)} className="wiki-record-row">
      <div className="wiki-record-row-title">
        <strong>{record.title}</strong>
        <span>{record.type}</span>
      </div>
      <p>{record.summary}</p>
      <div className="wiki-record-row-meta">
        <span>{record.section}</span>
        <span>{record.renderMode}</span>
        <span>{record.spoilerLevel}</span>
      </div>
    </Link>
  );
}

function WikiPortal({ title, description, section, onSelect }: { title: string; description: string; section: "UNIVERSE" | "ATLAS" | "ARCHIVE"; onSelect: (value: string) => void }) {
  const count = sectionCounts[section];
  return (
    <button type="button" className="wiki-portal" onClick={() => onSelect(section)}>
      <span>{title}</span>
      <p>{description}</p>
      <small>{count} released {count === 1 ? "record" : "records"}</small>
    </button>
  );
}

export function WikiHome() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("ALL");
  const { session, saved, identity } = useWikiMember();
  const results = useMemo(() => searchPublicObjects(query, section), [query, section]);
  const lead = getPublicObjectBySlug("merva")!;

  function selectSection(value: string) {
    setSection(value);
    requestAnimationFrame(() => document.getElementById("all-records")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className="wiki-native-page">
      <div className="wiki-native-layout">
        <WikiSidebar activeSection={section} onSection={selectSection} />

        <div className="wiki-native-content">
          <header className="wiki-main-page-header">
            <div>
              <p className="wiki-kicker">WIKI.ANEVUM</p>
              <h1>Main Page</h1>
              <p className="wiki-main-deck">The released reference encyclopedia for the ANEVUM universe.</p>
            </div>
            <SyncStamp />
          </header>

          <WikiSearch query={query} setQuery={setQuery} />

          {session ? (
            <div className="wiki-member-strip"><UserRound size={14} /><span>RHENLINK</span><strong>@{identity.handle || "member"}</strong><Link href="/saved">{saved.length} saved {saved.length === 1 ? "record" : "records"}</Link></div>
          ) : (
            <div className="wiki-member-strip"><UserRound size={14} /><span>RHENLINK</span><strong>Make the Wiki yours.</strong><Link href={rhenlinkHref(wikiHomeHref())}>Sign in or create a link</Link></div>
          )}

          <div className="wiki-home-columns">
            <section className="wiki-box wiki-featured-article">
              <div className="wiki-box-title"><span>Featured article</span><small>{lead.type}</small></div>
              <div className="wiki-featured-layout">
                <div className="wiki-featured-visual"><CanonVisual record={lead} /></div>
                <div>
                  <h2><Link href={wikiHref(lead)}>{lead.title}</Link></h2>
                  <p>{lead.summary}</p>
                  <Link href={wikiHref(lead)} className="wiki-inline-link">Read full record →</Link>
                </div>
              </div>
            </section>

            <section className="wiki-box wiki-about-box">
              <div className="wiki-box-title"><span>About this wiki</span><small>PUBLIC CANON</small></div>
              <p>WIKI.ANEVUM is a reader-facing encyclopedia, not a mirror of ANEVUM's private canon workspace. A record appears here only after its source and publication state clear the current public release gates.</p>
              <dl className="wiki-stat-list">
                <div><dt>Released records</dt><dd>{publicObjects.length}</dd></div>
                <div><dt>Universe</dt><dd>{sectionCounts.UNIVERSE}</dd></div>
                <div><dt>Atlas</dt><dd>{sectionCounts.ATLAS}</dd></div>
                <div><dt>Archive</dt><dd>{sectionCounts.ARCHIVE}</dd></div>
              </dl>
            </section>
          </div>

          <section className="wiki-box wiki-browse-box">
            <div className="wiki-box-title"><span>Browse the encyclopedia</span><small>BY RECORD FAMILY</small></div>
            <div className="wiki-portals">
              <WikiPortal title="Universe" description="People, technology, institutions, science and civilization." section="UNIVERSE" onSelect={selectSection} />
              <WikiPortal title="Atlas" description="Worlds, cities, regions, moons and inhabited infrastructure." section="ATLAS" onSelect={selectSection} />
              <WikiPortal title="Archive" description="Released historical records, facilities and events." section="ARCHIVE" onSelect={selectSection} />
            </div>
          </section>

          <section className="wiki-record-index" id="all-records">
            <div className="wiki-index-heading">
              <div><p className="wiki-kicker">PUBLIC INDEX</p><h2>{section === "ALL" ? "All released records" : `${section.charAt(0) + section.slice(1).toLowerCase()} records`}</h2></div>
              <span>{results.length} entries</span>
            </div>
            {query ? <p className="wiki-search-state">Showing results for <strong>{query}</strong>.</p> : null}
            <div className="wiki-record-list">
              {results.length ? results.map((record) => <WikiRecordRow key={record.id} record={record} />) : <p className="wiki-no-results">No released record matches this search.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function RecordContents({ slug }: { slug: string }) {
  const detail = getWikiDetail(slug);
  const sections = getWikiSections(slug, detail?.sections || []);
  if (!sections.length) return null;
  return (
    <div className="wiki-article-sections">
      {sections.map((section, index) => (
        <section key={`${section.title}-${index}`} id={headingId(section.title)} className="wiki-article-section">
          <h2><span>{index + 1}</span>{section.title}</h2>
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        </section>
      ))}
    </div>
  );
}

function WikiSaveControl({ record }: { record: PublicObject }) {
  const { session, saved, setSaved } = useWikiMember();
  const active = saved.includes(record.id);
  if (!session) {
    return <Link href={rhenlinkHref(wikiHref(record))} className="wiki-save-control"><Bookmark size={13} /> SAVE WITH RHENLINK</Link>;
  }
  return (
    <button
      type="button"
      className={`wiki-save-control ${active ? "active" : ""}`}
      onClick={() => setSaved(toggleWikiSave(session, record.id))}
      aria-pressed={active}
    >
      {active ? <Check size={13} /> : <Bookmark size={13} />}
      {active ? "SAVED TO RHENLINK" : "SAVE TO RHENLINK"}
    </button>
  );
}

function WikiInfobox({ record }: { record: PublicObject }) {
  const detail = getWikiDetail(record.slug);
  const { session } = useWikiMember();
  return (
    <aside className="wiki-infobox">
      <div className="wiki-infobox-title">{record.title}</div>
      <div className="wiki-infobox-visual"><CanonVisual record={record} /></div>
      <div className="wiki-infobox-caption">Publication-safe visual study · {record.visualStatus.toLowerCase()}</div>
      <dl>
        {record.facts?.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
        <div><dt>Type</dt><dd>{record.type}</dd></div>
        <div><dt>Section</dt><dd>{record.section}</dd></div>
        <div><dt>Render mode</dt><dd>{record.renderMode}</dd></div>
        <div><dt>Spoiler level</dt><dd>{record.spoilerLevel}</dd></div>
        {detail ? <div><dt>Source state</dt><dd>{detail.sourceState}</dd></div> : null}
      </dl>
      {detail ? <div className="wiki-infobox-source"><span>{detail.sourceLabel}</span></div> : null}
      <div className="wiki-infobox-member">
        <WikiSaveControl record={record} />
        {session ? <small>{wikiSavePersistence.label}. Cloud sync is pending member-database verification.</small> : <small>Sign in with RHENLINK to keep a reading list on this device.</small>}
      </div>
    </aside>
  );
}

export function WikiRecord({ slug }: { slug: string }) {
  const record = getPublicObjectBySlug(slug);
  if (!record) return <WikiMissing />;
  const detail = getWikiDetail(slug);
  const sections = getWikiSections(slug, detail?.sections || []);
  const neighbors = publicObjects.filter((item) => item.id !== record.id && (item.section === record.section || item.type === record.type)).slice(0, 5);

  return (
    <main className="wiki-native-page wiki-record-page-native">
      <div className="wiki-native-layout">
        <WikiSidebar record={record} />

        <article className="wiki-native-content wiki-article">
          <nav className="wiki-breadcrumbs" aria-label="Breadcrumb">
            <Link href={wikiHomeHref()}><ArrowLeft size={12} /> Main page</Link>
            <span>/</span>
            <span>{record.section.charAt(0) + record.section.slice(1).toLowerCase()}</span>
            <span>/</span>
            <span>{record.title}</span>
          </nav>

          <header className="wiki-article-header">
            <p className="wiki-kicker">{record.section} · {record.type}</p>
            <h1>{record.title}</h1>
            <div className="wiki-article-status">
              <span>{record.renderMode}</span>
              <span>{record.spoilerLevel}</span>
              <span>PUBLIC CANON</span>
              <span>{sections.length} SECTIONS</span>
            </div>
          </header>

          <div className="wiki-article-grid">
            <div className="wiki-article-body">
              <section id="overview" className="wiki-article-lead">
                <p>{detail?.lead || record.summary}</p>
              </section>

              <RecordContents slug={slug} />

              {!sections.length ? (
                <section className="wiki-article-section">
                  <h2>Overview</h2>
                  <p>{record.summary}</p>
                  <p>This record is currently published at {record.renderMode.toLowerCase()} depth. Additional private source material is not projected into the public Wiki.</p>
                </section>
              ) : null}

              <section className="wiki-publication-boundary">
                <h2>Publication boundary</h2>
                <p>{record.publicNote}</p>
              </section>
            </div>

            <WikiInfobox record={record} />
          </div>

          <section className="wiki-related-records">
            <div className="wiki-index-heading"><div><p className="wiki-kicker">SEE ALSO</p><h2>Related released records</h2></div></div>
            <div className="wiki-related-list">
              {neighbors.map((item) => (
                <Link key={item.id} href={wikiHref(item)}>
                  <strong>{item.title}</strong>
                  <span>{item.type}</span>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

function safeReturnPath() {
  if (typeof window === "undefined") return wikiHomeHref();
  const value = new URLSearchParams(window.location.search).get("return") || "";
  return value.startsWith("/") && !value.startsWith("//") ? value : wikiHomeHref();
}

export function WikiRhenlink() {
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const { session, setSession, identity, saved } = useWikiMember();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const returnPath = safeReturnPath();

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      const next = await signIn(String(form.get("email") || ""), String(form.get("password") || ""));
      setSession(next);
      navigate(returnPath);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const handle = String(form.get("handle") || "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_]{2,20}$/.test(handle)) {
      setStatus("Handles use 3–21 lowercase letters, numbers, or underscores.");
      setBusy(false);
      return;
    }
    try {
      const result = await signUp({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
        handle,
        displayName: String(form.get("displayName") || ""),
      });
      if (result.status === "signed-in") {
        setSession(result.session);
        navigate(returnPath);
      } else {
        setStatus("Account created. Confirm your email, then return here to sign in.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create RHENLINK.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setSession(null);
    setStatus("Signed out from WIKI.ANEVUM.");
    setBusy(false);
  }

  return (
    <main className="wiki-native-page">
      <div className="wiki-native-layout">
        <WikiSidebar />
        <section className="wiki-native-content wiki-member-page">
          <p className="wiki-kicker">RHENLINK / WIKI.ANEVUM</p>
          <h1>{session ? "Wiki identity" : "Connect your RHENLINK"}</h1>
          <p className="wiki-member-deck">RHENLINK is the member identity layer used by ANEVUM and LATTICE. On the Wiki it gives released records a persistent member context: saved reading, collections and later achievement/history features.</p>

          {session ? (
            <div className="wiki-member-account">
              <div className="wiki-member-account-id"><UserRound size={30} /><div><strong>{identity.displayName || "Member"}</strong><span>@{identity.handle || "member"}</span><small>{session.user.email}</small></div></div>
              <dl><div><dt>Saved records</dt><dd>{saved.length}</dd></div><div><dt>Current persistence</dt><dd>{wikiSavePersistence.label}</dd></div><div><dt>Cloud member state</dt><dd>Awaiting database verification</dd></div></dl>
              <div className="wiki-member-actions"><Link href="/saved" className="wiki-small-action"><Bookmark size={13} /> View saved records</Link><button type="button" className="wiki-small-action" onClick={handleSignOut} disabled={busy}><LogOut size={13} /> Sign out</button></div>
            </div>
          ) : (
            <div className="wiki-auth-shell">
              <div className="wiki-auth-tabs"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>SIGN IN</button><button type="button" className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>CREATE RHENLINK</button></div>
              {!memberBackend.configured ? <div className="wiki-auth-blocked"><strong>Member backend connection required.</strong><p>The Wiki integration is installed, but account creation and sign-in remain disabled until the existing ANEVUM Supabase project's public publishable key is present in the production build.</p></div> : null}
              {mode === "signin" ? (
                <form className="wiki-auth-form" onSubmit={handleSignIn}>
                  <label>Email<input name="email" type="email" required autoComplete="email" /></label>
                  <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
                  <button type="submit" disabled={busy || !memberBackend.configured}>{busy ? "SIGNING IN..." : "SIGN IN"}<LogIn size={13} /></button>
                </form>
              ) : (
                <form className="wiki-auth-form" onSubmit={handleCreate}>
                  <label>Display name<input name="displayName" required autoComplete="name" /></label>
                  <label>RHENLINK handle<input name="handle" required autoCapitalize="none" autoCorrect="off" placeholder="yourname" /></label>
                  <label>Email<input name="email" type="email" required autoComplete="email" /></label>
                  <label>Password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
                  <button type="submit" disabled={busy || !memberBackend.configured}>{busy ? "CREATING..." : "CREATE RHENLINK"}<UserRound size={13} /></button>
                </form>
              )}
              {status ? <p className="wiki-auth-status" role="status">{status}</p> : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function WikiSaved() {
  const { session, saved, identity } = useWikiMember();
  const records = publicObjects.filter((record) => saved.includes(record.id));
  return (
    <main className="wiki-native-page">
      <div className="wiki-native-layout">
        <WikiSidebar />
        <section className="wiki-native-content wiki-saved-page">
          <p className="wiki-kicker">RHENLINK / READING LIST</p>
          <h1>Saved records</h1>
          {!session ? (
            <div className="wiki-empty-saved"><p>Sign in with RHENLINK to build a Wiki reading list.</p><Link href={rhenlinkHref("/saved")} className="wiki-small-action"><UserRound size={13} /> Connect RHENLINK</Link></div>
          ) : (
            <>
              <p className="wiki-saved-deck">@{identity.handle || "member"} · {records.length} saved {records.length === 1 ? "record" : "records"} · {wikiSavePersistence.label.toLowerCase()}</p>
              {records.length ? <div className="wiki-record-list">{records.map((record) => <WikiRecordRow key={record.id} record={record} />)}</div> : <div className="wiki-empty-saved"><p>No records saved yet. Open any article and choose “Save to RHENLINK.”</p><Link href={wikiHomeHref()} className="wiki-small-action">Browse the Wiki</Link></div>}
              <p className="wiki-persistence-note">{wikiSavePersistence.detail}</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export function WikiMissing() {
  return (
    <main className="wiki-native-page">
      <div className="wiki-native-layout">
        <WikiSidebar />
        <section className="wiki-native-content wiki-missing">
          <p className="wiki-kicker">WIKI.ANEVUM</p>
          <h1>Page not released</h1>
          <p>The public Wiki does not fall back to private canon when a route is unavailable.</p>
          <Link href={wikiHomeHref()} className="wiki-small-action">Return to main page</Link>
        </section>
      </div>
    </main>
  );
}
