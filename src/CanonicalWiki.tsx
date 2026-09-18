import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bookmark, BookOpenText, Database, Orbit, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { CANON_PROJECTION_SYNC, getCanonProjectionRecord } from "./canonProjection";
import { displayIdentity, loadSession, type MemberSession } from "./memberClient";
import {
  loadPublishedWikiPages,
  loadWikiArticle,
  loadWikiCategories,
  loadWikiSaveIds,
  setWikiSaved,
  wikiCanonState,
  type WikiArticle,
  type WikiCategory,
  type WikiPage,
} from "./wikiClient";

function useWikiIdentity() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener("anevum-member-session", sync);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, []);
  return session;
}

function stateClass(value: string) {
  return `state-${value.toLowerCase().replace(/[^a-z]+/g, "-")}`;
}

export function CanonicalWikiHome() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("query") || "");
  const [loading, setLoading] = useState(true);
  const session = useWikiIdentity();
  const identity = displayIdentity(session);

  useEffect(() => {
    Promise.all([loadPublishedWikiPages(), loadWikiCategories()])
      .then(([nextPages, nextCategories]) => {
        setPages(nextPages);
        setCategories(nextCategories);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return pages;
    return pages.filter((page) => `${page.title} ${page.summary} ${page.category_id} ${wikiCanonState(page)}`.toLowerCase().includes(value));
  }, [pages, query]);

  return (
    <main className="community-wiki-page canonical-wiki-page">
      <section className="community-wiki-hero canonical-wiki-hero">
        <div className="wiki-grid-field" aria-hidden="true" />
        <div className="community-wiki-hero-copy">
          <p className="wiki-overline">WIKI.ANEVUM / CANONICAL RELEASE PROJECTION</p>
          <h1>The live record.<br /><em>Released deliberately.</em></h1>
          <p>WIKI.ANEVUM is the browser-safe publication surface of the live Transcosmic Canon Wiki. Canon lifecycle and website release state stay separate: only records cleared by the Website Publishing Queue appear here.</p>
          <div className="canonical-wiki-actions">
            <a className="wiki-primary-action" href="/lattice"><Orbit size={15} /> OPEN LATTICE</a>
            {session ? <a className="wiki-member-state" href="https://anevum.com/rhenlink"><UserRound size={13} /> @{identity.handle || "member"}</a> : <a className="wiki-member-state" href="https://anevum.com/rhenlink">CREATE RHENLINK</a>}
          </div>
        </div>
        <div className="wiki-public-state canonical-wiki-public-state">
          <span>RELEASED RECORDS</span>
          <strong>{pages.length || CANON_PROJECTION_SYNC.queueCount}</strong>
          <small>LIVE WIKI + PUBLISHING QUEUE / {CANON_PROJECTION_SYNC.syncedAt}</small>
        </div>
      </section>

      <section className="community-wiki-shell canonical-wiki-shell">
        <div className="canonical-wiki-authority">
          <Database size={16} />
          <div><span>AUTHORITY</span><strong>{CANON_PROJECTION_SYNC.source}</strong></div>
          <p>Working, unresolved, exploratory, superseded and archived material is not promoted into current product truth by this surface.</p>
        </div>

        <div className="wiki-search-row">
          <label className="community-wiki-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search released Wiki records..." aria-label="Search released ANEVUM Wiki records" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button> : null}
          </label>
          <span>{loading ? "RESOLVING" : `${visible.length} RECORD${visible.length === 1 ? "" : "S"}`}</span>
        </div>

        <div className="wiki-category-grid">
          {categories.map((category) => {
            const count = pages.filter((page) => page.category_id === category.id).length;
            return (
              <article key={category.id} className="wiki-category-card">
                <span>{String(category.sort_order).padStart(2, "0")}</span>
                <h2>{category.label}</h2>
                <p>{category.description}</p>
                <small>{count} RELEASED</small>
              </article>
            );
          })}
        </div>

        {!loading && visible.length ? (
          <section className="wiki-published-index canonical-wiki-index">
            <header>
              <div><span>PUBLIC RELEASE INDEX</span><h2>Wiki-cleared records</h2></div>
              <small>CANON STATUS IS PRESERVED · RELEASE STATE IS INDEPENDENT</small>
            </header>
            <div className="wiki-page-list">
              {visible.map((page) => {
                const state = wikiCanonState(page);
                return (
                  <a key={page.id} href={`/${encodeURIComponent(page.slug)}`} className="wiki-page-row canonical-wiki-row">
                    <div>
                      <span>{page.category_id} / {state}</span>
                      <strong>{page.title}</strong>
                      <p>{page.summary}</p>
                    </div>
                    <em className={`canonical-state-badge ${stateClass(state)}`}>{state}</em>
                    <ArrowRight size={16} />
                  </a>
                );
              })}
            </div>
          </section>
        ) : !loading ? (
          <section className="wiki-empty-public">
            <BookOpenText size={26} strokeWidth={1.35} />
            <span>RELEASE INDEX / NO MATCH</span>
            <h2>No released record matches this search.</h2>
            <p>Changing a search does not change canon or release state. Try another released term.</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export function CanonicalWikiArticle({ slug }: { slug: string }) {
  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const session = useWikiIdentity();
  const record = getCanonProjectionRecord(slug);

  useEffect(() => {
    loadWikiArticle(slug).then(setArticle).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!session || !article) return;
    loadWikiSaveIds().then((ids) => setSaved(ids.includes(article.page.id))).catch(() => undefined);
  }, [session, article?.page.id]);

  async function toggleSave() {
    if (!session || !article || saveBusy) return;
    setSaveBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      await setWikiSaved(article.page.id, next);
    } catch {
      setSaved(!next);
    } finally {
      setSaveBusy(false);
    }
  }

  if (loading) {
    return <main className="community-wiki-page"><section className="wiki-empty-public"><Database size={22} /><h2>Resolving released Wiki record.</h2></section></main>;
  }

  if (!article || !record) {
    return (
      <main className="community-wiki-page">
        <section className="wiki-empty-public">
          <BookOpenText size={24} />
          <span>RELEASE RECORD / UNAVAILABLE</span>
          <h2>This record is not in the current public release projection.</h2>
          <p>Its absence does not imply that no private Wiki record exists. It means this route is not cleared for current product exposure.</p>
          <a href="/" className="wiki-primary-action">RETURN TO WIKI <ArrowRight size={14} /></a>
        </section>
      </main>
    );
  }

  const { page } = article;
  const state = wikiCanonState(page);

  return (
    <main className="community-wiki-page wiki-article-page canonical-wiki-article">
      <article className="wiki-article-shell">
        <header className="wiki-article-header canonical-wiki-article-header">
          <p className="wiki-overline">{page.category_id.toUpperCase()} / RELEASED WIKI RECORD</p>
          <h1>{page.title}</h1>
          <p className="wiki-article-summary">{page.summary}</p>
          <div className="canonical-wiki-record-meta">
            <span className={`canonical-state-badge ${stateClass(state)}`}>CANON / {state}</span>
            <span>FREEZE / {record.freezeState}</span>
            <span>RENDER / {record.renderMode}</span>
            <span>SPOILER / {record.spoilerLevel}</span>
          </div>
          <div className="canonical-wiki-actions">
            {session ? (
              <button type="button" onClick={toggleSave} className={`wiki-save-button ${saved ? "active" : ""}`} disabled={saveBusy}>
                <Bookmark size={14} fill={saved ? "currentColor" : "none"} /> {saved ? "SAVED TO RHENLINK" : "SAVE TO RHENLINK"}
              </button>
            ) : <a href="https://anevum.com/rhenlink" className="wiki-save-button"><Bookmark size={14} /> SAVE WITH RHENLINK</a>}
            <a href="/lattice" className="wiki-edit-button"><Orbit size={14} /> VIEW IN LATTICE</a>
          </div>
        </header>

        <section className="canonical-wiki-body">
          <div className="canonical-wiki-section">
            <span>PUBLIC RECORD</span>
            <h2>{page.title}</h2>
            <p>{record.summary}</p>
          </div>

          <div className="canonical-wiki-section canonical-wiki-boundary">
            <span>PUBLICATION BOUNDARY</span>
            <h2>What this release permits.</h2>
            <p>{record.publicNote}</p>
          </div>

          {record.facts?.length ? (
            <dl className="canonical-wiki-facts">
              {record.facts.map(([label, value]) => <div key={`${label}-${value}`}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          ) : null}

          <div className="canonical-wiki-provenance">
            <ShieldCheck size={19} />
            <div>
              <span>PROVENANCE</span>
              <strong>{CANON_PROJECTION_SYNC.source}</strong>
              <p>This page is a browser-safe release projection, not an independent lore record. Source route: <code>{record.sourceRoute}</code>. Projection synchronized {CANON_PROJECTION_SYNC.syncedAt}.</p>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
