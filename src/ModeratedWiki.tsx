import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, BookOpenText, Bookmark, Check, Clock3, FilePlus2, History, LockKeyhole, PenLine, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { Link } from "./ui";
import { displayIdentity, loadSession, loadSharedIdentity, syncCurrentUser, type MemberSession } from "./memberClient";
import {
  FALLBACK_WIKI_CATEGORIES,
  WikiBackendUnavailable,
  isWikiAdmin,
  loadMyWikiSubmissions,
  loadPendingWikiSubmissions,
  loadPublishedWikiPages,
  loadWikiArticle,
  loadWikiCategories,
  loadWikiSaveIds,
  reviewWikiSubmission,
  setWikiSaved,
  slugifyWikiTitle,
  submitWikiEdit,
  submitWikiPage,
  type WikiArticle,
  type WikiCategory,
  type WikiPage,
  type WikiSubmission,
} from "./wikiClient";

const WIKI_HOST = "wiki.anevum.com";

function onWikiHost() {
  return typeof window !== "undefined" && window.location.hostname.toLowerCase() === WIKI_HOST;
}

function wikiHref(path = "") {
  const normalized = path ? `/${path.replace(/^\//, "")}` : "";
  return onWikiHost() ? normalized || "/" : `/wiki${normalized}`;
}

function mainWikiHref(path = "") {
  const normalized = path ? `/${path.replace(/^\//, "")}` : "";
  return `https://anevum.com/wiki${normalized}`;
}

function rhenlinkHref() {
  return onWikiHost() ? "https://anevum.com/rhenlink" : "/rhenlink";
}

function useWikiMember() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  const [sharedIdentity, setSharedIdentity] = useState(() => loadSharedIdentity());

  useEffect(() => {
    const sync = () => {
      setSession(loadSession());
      setSharedIdentity(loadSharedIdentity());
    };
    window.addEventListener("anevum-member-session", sync);
    if (session) syncCurrentUser(session).then((next) => next && setSession(next)).catch(() => undefined);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, []);

  return {
    session,
    identity: session ? displayIdentity(session) : sharedIdentity ? { handle: sharedIdentity.handle, displayName: sharedIdentity.displayName } : { handle: "", displayName: "" },
    admin: isWikiAdmin(session),
  };
}

export function CommunityWikiHeader() {
  const { session, identity, admin } = useWikiMember();
  return (
    <header className="community-wiki-header">
      <div className="community-wiki-header-inner">
        <Link href={wikiHref()} className="community-wiki-brand">
          <BookOpenText size={19} strokeWidth={1.45} />
          <span><strong>WIKI.ANEVUM</strong><small>PUBLIC COLLABORATIVE ENCYCLOPEDIA</small></span>
        </Link>
        <nav aria-label="Wiki navigation" className="community-wiki-nav">
          <Link href={wikiHref()}>MAIN PAGE</Link>
          {onWikiHost() ? <a href={mainWikiHref("new")}>CONTRIBUTE</a> : <Link href={wikiHref("new")}>CONTRIBUTE</Link>}
          {session ? (onWikiHost() ? <a href={mainWikiHref("saved")}>SAVED</a> : <Link href={wikiHref("saved")}>SAVED</Link>) : null}
          {admin ? (onWikiHost() ? <a href={mainWikiHref("admin")}>ADMIN</a> : <Link href={wikiHref("admin")}>ADMIN</Link>) : null}
          {session ? <Link href={rhenlinkHref()} className="community-wiki-member"><UserRound size={12} /> @{identity.handle || "member"}</Link> : <Link href={rhenlinkHref()} className="community-wiki-member"><UserRound size={12} /> RHENLINK</Link>}
          <a href="https://anevum.com" className="community-wiki-exit">ANEVUM.COM ↗</a>
        </nav>
      </div>
    </header>
  );
}

function WikiBackendNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`wiki-backend-notice ${compact ? "compact" : ""}`} role="status">
      <LockKeyhole size={15} />
      <span><strong>PUBLICATION DATABASE PENDING</strong><small>The wiki interface is live, but submissions cannot persist until the checked-in Supabase migration is applied.</small></span>
    </div>
  );
}

function WikiMarkdown({ body }: { body: string }) {
  const nodes: ReactNode[] = [];
  const lines = body.replace(/\r/g, "").split("\n");
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    nodes.push(<p key={`p-${nodes.length}`}>{paragraph.join(" ")}</p>);
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(<ul key={`ul-${nodes.length}`}>{bullets.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>);
    bullets = [];
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
      return;
    }
    if (line.startsWith("### ")) {
      flushParagraph(); flushBullets(); nodes.push(<h3 key={`h3-${nodes.length}`}>{line.slice(4)}</h3>); return;
    }
    if (line.startsWith("## ")) {
      flushParagraph(); flushBullets(); nodes.push(<h2 key={`h2-${nodes.length}`}>{line.slice(3)}</h2>); return;
    }
    if (line.startsWith("# ")) {
      flushParagraph(); flushBullets(); nodes.push(<h2 key={`h1-${nodes.length}`}>{line.slice(2)}</h2>); return;
    }
    if (line.startsWith("- ")) {
      flushParagraph(); bullets.push(line.slice(2)); return;
    }
    if (line.startsWith("> ")) {
      flushParagraph(); flushBullets(); nodes.push(<blockquote key={`q-${nodes.length}`}>{line.slice(2)}</blockquote>); return;
    }
    flushBullets();
    paragraph.push(line);
  });
  flushParagraph();
  flushBullets();
  return <div className="community-wiki-prose">{nodes}</div>;
}

export function ModeratedWikiHome() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [categories, setCategories] = useState<WikiCategory[]>(FALLBACK_WIKI_CATEGORIES);
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("query") || "");
  const [backendReady, setBackendReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const { session, identity } = useWikiMember();

  useEffect(() => {
    Promise.all([loadPublishedWikiPages(), loadWikiCategories()])
      .then(([nextPages, nextCategories]) => { setPages(nextPages); setCategories(nextCategories); setBackendReady(true); })
      .catch((error) => { if (error instanceof WikiBackendUnavailable) setBackendReady(false); else console.error(error); })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? pages.filter((page) => `${page.title} ${page.summary} ${page.category_id}`.toLowerCase().includes(value)) : pages;
  }, [pages, query]);

  return (
    <main className="community-wiki-page">
      <section className="community-wiki-hero">
        <div className="wiki-grid-field" aria-hidden="true" />
        <div className="community-wiki-hero-copy">
          <p className="wiki-overline">WIKI.ANEVUM / PUBLIC KNOWLEDGE</p>
          <h1>A living encyclopedia.<br /><em>Published by review.</em></h1>
          <p>Anyone with a RHENLINK can propose a page or edit. Nothing becomes public until an ANEVUM administrator approves it. The private Canon Wiki remains the internal source authority.</p>
          <div className="wiki-hero-actions">
            {onWikiHost() ? <a className="wiki-primary-action" href={mainWikiHref("new")}><FilePlus2 size={15} /> PROPOSE A PAGE</a> : <Link className="wiki-primary-action" href={wikiHref("new")}><FilePlus2 size={15} /> PROPOSE A PAGE</Link>}
            {session ? <span className="wiki-member-state"><UserRound size={13} /> @{identity.handle || "member"}</span> : <Link href={rhenlinkHref()} className="wiki-member-state">CREATE RHENLINK</Link>}
          </div>
        </div>
        <div className="wiki-public-state"><span>PUBLISHED PAGES</span><strong>{pages.length}</strong><small>{backendReady ? "ADMIN-APPROVED PUBLIC RECORD" : "DATABASE INITIALIZATION REQUIRED"}</small></div>
      </section>

      <section className="community-wiki-shell">
        {!backendReady ? <WikiBackendNotice /> : null}
        <div className="wiki-search-row">
          <label className="community-wiki-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search published pages..." aria-label="Search WIKI.ANEVUM" />{query ? <button type="button" onClick={() => setQuery("")}><X size={14} /></button> : null}</label>
          <span>{loading ? "LOADING" : `${visible.length} RESULT${visible.length === 1 ? "" : "S"}`}</span>
        </div>

        <div className="wiki-category-grid">
          {categories.map((category) => {
            const count = pages.filter((page) => page.category_id === category.id).length;
            return <article key={category.id} className="wiki-category-card"><span>{String(category.sort_order).padStart(2, "0")}</span><h2>{category.label}</h2><p>{category.description}</p><small>{count} PUBLISHED</small></article>;
          })}
        </div>

        {loading ? <div className="wiki-empty-public"><Clock3 size={22} /><h2>Resolving the public record.</h2></div> : visible.length ? (
          <section className="wiki-published-index">
            <header><div><span>PUBLIC INDEX</span><h2>Published pages</h2></div><small>Every visible revision has passed administrator review.</small></header>
            <div className="wiki-page-list">{visible.map((page) => <Link key={page.id} href={wikiHref(page.slug)} className="wiki-page-row"><div><span>{page.category_id}</span><strong>{page.title}</strong><p>{page.summary}</p></div><ArrowRight size={16} /></Link>)}</div>
          </section>
        ) : (
          <section className="wiki-empty-public">
            <BookOpenText size={26} strokeWidth={1.35} />
            <span>PUBLIC INDEX / 000</span>
            <h2>{query ? "No published page matches this search." : "The public wiki starts blank."}</h2>
            <p>{query ? "Try another term or propose the page if it belongs in the public encyclopedia." : "Pages enter WIKI.ANEVUM only through proposal, review and administrator approval. No legacy canon has been silently preloaded."}</p>
            {!query ? (onWikiHost() ? <a href={mainWikiHref("new")} className="wiki-primary-action">PROPOSE THE FIRST PAGE <ArrowRight size={14} /></a> : <Link href={wikiHref("new")} className="wiki-primary-action">PROPOSE THE FIRST PAGE <ArrowRight size={14} /></Link>) : null}
          </section>
        )}
      </section>
    </main>
  );
}

export function ModeratedWikiArticle({ slug }: { slug: string }) {
  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const { session } = useWikiMember();

  useEffect(() => {
    loadWikiArticle(slug).then(setArticle).catch((error) => { if (error instanceof WikiBackendUnavailable) setBackendReady(false); else console.error(error); }).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!session || !article) return;
    loadWikiSaveIds().then((ids) => setSaved(ids.includes(article.page.id))).catch(() => undefined);
  }, [session, article?.page.id]);

  async function toggleSave() {
    if (!article || !session || saveBusy) return;
    setSaveBusy(true);
    const next = !saved;
    setSaved(next);
    try { await setWikiSaved(article.page.id, next); } catch { setSaved(!next); }
    setSaveBusy(false);
  }

  if (loading) return <main className="community-wiki-page"><section className="wiki-empty-public"><Clock3 size={22} /><h2>Loading page.</h2></section></main>;
  if (!backendReady) return <main className="community-wiki-page"><section className="community-wiki-shell"><WikiBackendNotice /><WikiMissing slug={slug} /></section></main>;
  if (!article) return <WikiMissing slug={slug} />;

  const { page, revision, history } = article;
  return (
    <main className="community-wiki-page wiki-article-page">
      <article className="wiki-article-shell">
        <header className="wiki-article-header">
          <p className="wiki-overline">{page.category_id.toUpperCase()} / APPROVED PUBLIC RECORD</p>
          <h1>{revision.title}</h1>
          <p className="wiki-article-summary">{revision.summary}</p>
          <div className="wiki-article-meta"><span>REVISION {String(revision.revision_no).padStart(3, "0")}</span><span>PUBLISHED {new Date(page.published_at || revision.created_at).toLocaleDateString()}</span><span>ADMIN APPROVED</span></div>
          <div className="wiki-article-actions">
            {session ? <button type="button" onClick={toggleSave} className={`wiki-save-button ${saved ? "active" : ""}`} disabled={saveBusy}><Bookmark size={14} fill={saved ? "currentColor" : "none"} /> {saved ? "SAVED" : "SAVE"}</button> : <Link href={rhenlinkHref()} className="wiki-save-button"><Bookmark size={14} /> SAVE WITH RHENLINK</Link>}
            {onWikiHost() ? <a href={mainWikiHref(`${page.slug}/edit`)} className="wiki-edit-button"><PenLine size={14} /> PROPOSE EDIT</a> : <Link href={wikiHref(`${page.slug}/edit`)} className="wiki-edit-button"><PenLine size={14} /> PROPOSE EDIT</Link>}
          </div>
        </header>
        <WikiMarkdown body={revision.body_md} />
        <footer className="wiki-history-panel">
          <div><History size={15} /><span>REVISION HISTORY</span></div>
          {history.map((item) => <div key={item.id} className="wiki-history-row"><strong>R{String(item.revision_no).padStart(3, "0")}</strong><span>{new Date(item.created_at).toLocaleString()}</span><p>{item.change_summary || "Approved revision"}</p></div>)}
        </footer>
      </article>
    </main>
  );
}

export function WikiContributionPage({ editSlug }: { editSlug?: string }) {
  const editing = Boolean(editSlug);
  const { session, identity } = useWikiMember();
  const [categories, setCategories] = useState<WikiCategory[]>(FALLBACK_WIKI_CATEGORIES);
  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState("universe");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [backendReady, setBackendReady] = useState(true);
  const [mine, setMine] = useState<WikiSubmission[]>([]);

  useEffect(() => {
    loadWikiCategories().then(setCategories).catch(() => undefined);
    if (editing && editSlug) {
      loadWikiArticle(editSlug).then((next) => {
        setArticle(next);
        if (next) { setTitle(next.revision.title); setSlug(next.page.slug); setCategoryId(next.revision.category_id); setSummary(next.revision.summary); setBody(next.revision.body_md); }
      }).catch((error) => { if (error instanceof WikiBackendUnavailable) setBackendReady(false); });
    }
    if (session) loadMyWikiSubmissions().then(setMine).catch((error) => { if (error instanceof WikiBackendUnavailable) setBackendReady(false); });
  }, [editSlug, session?.user.id]);

  function updateTitle(value: string) {
    setTitle(value);
    if (!editing && !slugTouched) setSlug(slugifyWikiTitle(value));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setStatus("Use a lowercase URL slug with letters, numbers and hyphens only."); return; }
    if (editing && !article) { setStatus("The published page could not be resolved."); return; }
    setBusy(true); setStatus("");
    try {
      if (editing && article) await submitWikiEdit(article.page, { title, categoryId, summary, body, changeSummary });
      else await submitWikiPage({ slug, title, categoryId, summary, body, changeSummary });
      setStatus("Proposal submitted. It is now pending ANEVUM administrator review.");
      setMine(await loadMyWikiSubmissions());
    } catch (error) {
      if (error instanceof WikiBackendUnavailable) { setBackendReady(false); setStatus(error.message); }
      else setStatus(error instanceof Error ? error.message : "Could not submit proposal.");
    } finally { setBusy(false); }
  }

  if (!session) {
    return <main className="community-wiki-page"><section className="wiki-contribution-gate"><UserRound size={28} /><span>RHENLINK REQUIRED</span><h1>Contribute under your persistent identity.</h1><p>Public reading is open. New pages and edits require a signed-in RHENLINK so every proposal has an attributable contributor and review history.</p><a href={rhenlinkHref()} className="wiki-primary-action">SIGN IN / CREATE RHENLINK <ArrowRight size={14} /></a></section></main>;
  }

  return (
    <main className="community-wiki-page">
      <section className="wiki-contribution-layout">
        <div className="wiki-contribution-intro"><span className="wiki-overline">{editing ? "PROPOSE EDIT" : "PROPOSE NEW PAGE"}</span><h1>{editing ? `Improve ${article?.page.title || editSlug}.` : "Add to the public record."}</h1><p>Your proposal never overwrites the public wiki directly. An ANEVUM administrator reviews it first. Approved proposals become permanent revisions.</p><div className="wiki-contributor-id"><UserRound size={15} /><span>@{identity.handle || "member"}</span></div>{!backendReady ? <WikiBackendNotice compact /> : null}</div>
        <form className="wiki-editor-form" onSubmit={submit}>
          <label>TITLE<input value={title} onChange={(event) => updateTitle(event.target.value)} required /></label>
          <label>PUBLIC SLUG<div className="wiki-slug-input"><span>/</span><input value={slug} onChange={(event) => { setSlugTouched(true); setSlug(slugifyWikiTitle(event.target.value)); }} required disabled={editing} /></div></label>
          <label>CATEGORY<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
          <label>SUMMARY<textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} maxLength={500} required /></label>
          <label>ARTICLE BODY <small>Markdown-style headings, paragraphs, lists and blockquotes are supported.</small><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={20} required /></label>
          <label>CHANGE SUMMARY<textarea value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} rows={3} placeholder={editing ? "What changed and why?" : "Why should this page exist in the public wiki?"} required /></label>
          <button type="submit" className="wiki-submit-button" disabled={busy || !backendReady}>{busy ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}<ArrowRight size={14} /></button>
          {status ? <p className="wiki-form-status" role="status">{status}</p> : null}
        </form>
      </section>
      <section className="wiki-my-submissions"><header><span>YOUR CONTRIBUTIONS</span><strong>{mine.length}</strong></header>{mine.length ? mine.map((item) => <div key={item.id} className="wiki-submission-row"><span>{item.submission_type === "new_page" ? "NEW PAGE" : "EDIT"}</span><strong>{item.proposed_title}</strong><small className={`status-${item.status}`}>{item.status.replace("_", " ")}</small>{item.review_note ? <p>{item.review_note}</p> : null}</div>) : <p>No proposals yet.</p>}</section>
    </main>
  );
}

export function WikiAdminPage() {
  const { session, admin, identity } = useWikiMember();
  const [queue, setQueue] = useState<WikiSubmission[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");
  const [backendReady, setBackendReady] = useState(true);

  function reload() {
    if (!admin) return;
    loadPendingWikiSubmissions().then(setQueue).catch((error) => { if (error instanceof WikiBackendUnavailable) setBackendReady(false); else setStatus(error instanceof Error ? error.message : "Could not load moderation queue."); });
  }
  useEffect(reload, [admin, session?.user.id]);

  async function review(item: WikiSubmission, decision: "approved" | "rejected" | "changes_requested") {
    setBusyId(item.id); setStatus("");
    try { await reviewWikiSubmission(item.id, decision, notes[item.id] || ""); setStatus(`${item.proposed_title}: ${decision.replace("_", " ")}.`); reload(); }
    catch (error) { if (error instanceof WikiBackendUnavailable) setBackendReady(false); else setStatus(error instanceof Error ? error.message : "Review action failed."); }
    finally { setBusyId(""); }
  }

  if (!session || !admin) return <main className="community-wiki-page"><section className="wiki-contribution-gate"><ShieldCheck size={28} /><span>ADMINISTRATION</span><h1>Wiki administrator access required.</h1><p>Publication authority is resolved from protected Supabase app metadata, not editable profile metadata.</p><Link href={wikiHref()} className="wiki-primary-action">RETURN TO WIKI</Link></section></main>;

  return (
    <main className="community-wiki-page wiki-admin-page">
      <section className="wiki-admin-header"><div><span>WIKI ADMINISTRATION</span><h1>Publication review.</h1><p>Signed in as @{identity.handle || "admin"}. Approval immediately creates or replaces the public revision.</p></div><div><strong>{queue.length}</strong><span>PENDING</span></div></section>
      {!backendReady ? <WikiBackendNotice /> : null}
      {status ? <p className="wiki-admin-status">{status}</p> : null}
      <section className="wiki-admin-queue">
        {queue.length ? queue.map((item) => <article key={item.id} className="wiki-review-card">
          <header><div><span>{item.submission_type.replace("_", " ")}</span><h2>{item.proposed_title}</h2></div><small>{new Date(item.created_at).toLocaleString()}</small></header>
          <div className="wiki-review-meta"><span>/{item.proposed_slug}</span><span>{item.category_id}</span><span>SUBMITTER {item.submitter_id.slice(0, 8)}</span></div>
          <p className="wiki-review-summary">{item.summary}</p>
          <div className="wiki-review-body"><WikiMarkdown body={item.body_md} /></div>
          <div className="wiki-review-change"><strong>CONTRIBUTOR NOTE</strong><p>{item.change_summary}</p></div>
          <label className="wiki-review-note">ADMIN NOTE<textarea value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} rows={3} /></label>
          <div className="wiki-review-actions"><button type="button" className="approve" disabled={busyId === item.id} onClick={() => review(item, "approved")}><Check size={14} /> APPROVE & PUBLISH</button><button type="button" disabled={busyId === item.id} onClick={() => review(item, "changes_requested")}><PenLine size={14} /> REQUEST CHANGES</button><button type="button" className="reject" disabled={busyId === item.id} onClick={() => review(item, "rejected")}><X size={14} /> REJECT</button></div>
        </article>) : <div className="wiki-empty-public"><ShieldCheck size={24} /><span>MODERATION QUEUE</span><h2>No proposals waiting for review.</h2></div>}
      </section>
    </main>
  );
}

export function WikiSavedPage() {
  const { session } = useWikiMember();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [backendReady, setBackendReady] = useState(true);

  useEffect(() => {
    if (!session) return;
    Promise.all([loadPublishedWikiPages(), loadWikiSaveIds()]).then(([all, ids]) => { setPages(all); setSavedIds(ids); }).catch((error) => { if (error instanceof WikiBackendUnavailable) setBackendReady(false); });
  }, [session?.user.id]);

  if (!session) return <main className="community-wiki-page"><section className="wiki-contribution-gate"><Bookmark size={27} /><span>SAVED PAGES</span><h1>Your wiki collection follows RHENLINK.</h1><a href={rhenlinkHref()} className="wiki-primary-action">SIGN IN TO RHENLINK</a></section></main>;
  const savedPages = pages.filter((page) => savedIds.includes(page.id));
  return <main className="community-wiki-page"><section className="community-wiki-shell">{!backendReady ? <WikiBackendNotice /> : null}<div className="wiki-published-index"><header><div><span>RHENLINK COLLECTION</span><h2>Saved pages</h2></div><small>{savedPages.length} SAVED</small></header><div className="wiki-page-list">{savedPages.length ? savedPages.map((page) => <Link key={page.id} href={wikiHref(page.slug)} className="wiki-page-row"><div><span>{page.category_id}</span><strong>{page.title}</strong><p>{page.summary}</p></div><ArrowRight size={16} /></Link>) : <div className="wiki-empty-public"><Bookmark size={22} /><h2>No saved wiki pages yet.</h2></div>}</div></div></section></main>;
}

export function WikiMissing({ slug }: { slug?: string }) {
  return <main className="community-wiki-page"><section className="wiki-contribution-gate"><BookOpenText size={27} /><span>NO PUBLISHED PAGE</span><h1>{slug ? `“${slug}” is not in the public wiki.` : "Nothing is published here."}</h1><p>A missing page is not filled from private canon automatically. It must be proposed and approved.</p>{onWikiHost() ? <a href={mainWikiHref("new")} className="wiki-primary-action">PROPOSE A PAGE <ArrowRight size={14} /></a> : <Link href={wikiHref("new")} className="wiki-primary-action">PROPOSE A PAGE <ArrowRight size={14} /></Link>}</section></main>;
}
