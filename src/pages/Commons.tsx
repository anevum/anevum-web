import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import CommonsShell from "../components/CommonsShell";
import { fieldNotes } from "../data/fieldNotes";

type Topic = {
  id: string; kind: "question" | "research_note"; subject: string;
  title: string; body: string; author: string; commentCount: number; createdAt: string;
};
type CommonsState = {
  available: boolean;
  status: "preparing" | "invite_only" | "active";
  role: "contributor" | "moderator" | null;
  topics: Topic[];
};
type CommonsReport = { id: string; topicId: string; topicTitle: string;
  itemType: "topic" | "comment"; reason: string; createdAt: string };
const subjects = [
  { id: "markets", label: "Market research" },
  { id: "algorithms", label: "Algorithms" },
  { id: "software", label: "Software" },
  { id: "mathematics", label: "Mathematics" }
];
const RULE_SET_TEMPLATE = `Research hypothesis:

Market, timeframe, and data source:

Exact entry rule:

Exact exit rule and position/risk limits:

Sample dates, transaction costs, and trade count:

Development / validation / untouched holdout:

Results and adverse conditions (include losses):

What would falsify this idea?

Specific question for other researchers:`;

function dateLabel(value: string) {
  const valueMs = Date.parse(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(valueMs) ? "" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(valueMs);
}

export default function Commons() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [query] = useSearchParams();
  const [state, setState] = useState<CommonsState | null>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<CommonsReport[]>([]);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [composer, setComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kind, setKind] = useState<"question" | "research_note">("question");
  const [subject, setSubject] = useState("algorithms");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const authenticated = availability === "available" && Boolean(session?.user);
  const identity = session?.user?.name || session?.user?.email || undefined;

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/member/commons", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Commons could not be loaded.");
    const next = await response.json() as CommonsState;
    if (signal?.aborted) return;
    setState(next);
    if (next.available && next.role === "moderator") {
      const queue = await fetch("/api/member/commons/reports", { cache: "no-store", signal });
      if (!queue.ok) throw new Error("Moderator reports could not be loaded.");
      const payload = await queue.json() as { reports: CommonsReport[] };
      if (!signal?.aborted) setReports(payload.reports);
    } else {
      setReports([]);
    }
  }, []);

  useEffect(() => {
    setState(null);
    setReports([]);
    setError("");
    if (!authenticated) return;
    const abort = new AbortController();
    setLoading(true);
    void load(abort.signal).catch(() => {
      if (!abort.signal.aborted) setError("Commons is temporarily unavailable. Please retry.");
    }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [authenticated, session?.user?.id, load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state?.available || submitting) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/member/commons/topics", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, subject, title, body })
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Submission failed.");
      await load();
      setTitle(""); setBody(""); setComposer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally { setSubmitting(false); }
  }

  async function reviewReport(reportId: string) {
    if (state?.role !== "moderator" || reviewing) return;
    setReviewing(reportId); setError("");
    try {
      const response = await fetch("/api/member/commons/reports/" + reportId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed: true })
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Review could not be recorded.");
      setReports(previous => previous.filter(report => report.id !== reportId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review could not be recorded.");
    } finally { setReviewing(null); }
  }

  const filter = query.get("kind");
  const selectedKind = filter === "question" || filter === "research_note" ? filter : "all";
  const topics = state?.topics?.filter(item => selectedKind === "all" || item.kind === selectedKind) || [];
  const notes = [...fieldNotes].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);

  useEffect(() => {
    if (query.get("template") !== "ruleset" || !state?.available) return;
    setKind("research_note");
    setSubject("algorithms");
    setBody(previous => previous || RULE_SET_TEMPLATE);
    setComposer(true);
  }, [query.get("template"), state?.available]);

  function startRuleSetReview() {
    if (!state?.available) return;
    setComposer(true);
    setKind("research_note");
    setSubject("algorithms");
    setBody(previous => previous || RULE_SET_TEMPLATE);
  }

  return <CommonsShell identity={authenticated ? identity : undefined} role={state?.role}>
    <div className="commons-heading">
      <p className="commons-eyebrow">ANEVUM / COMMONS</p>
      <h1>Research is better when it's shared.</h1>
      <p>Explore questions, document ideas, and build a useful record of what has been tested. A small research space attached to working software.</p>
    </div>
    {!authenticated ? (
      <section className="commons-state-panel">
        <span className="commons-eyebrow">Member access</span>
        <h2>{availability === "checking" || isPending ? "Checking account availability…" : "Enter Commons"}</h2>
        <p>Sign in with your ANEVUM account to enter your research workspace. Participation is currently limited to invited testers.</p>
        <Link className="commons-action" to="/sign-in">Sign in or create an account →</Link>
      </section>
    ) : loading && !state ? (
      <p role="status" className="commons-state-panel">Loading your research space…</p>
    ) : state?.status === "preparing" ? (
      <section className="commons-state-panel">
        <span className="commons-eyebrow">Commons beta</span>
        <h2>Research space in preparation</h2>
        <p>Your ANEVUM account is active. Commons contributions are not available yet. Your RHEN workspace, published research and member settings remain separate and accessible.</p>
        <Link to="/command">Open Command →</Link>
      </section>
    ) : state?.status === "invite_only" ? (
      <section className="commons-state-panel">
        <span className="commons-eyebrow">Controlled beta</span>
        <h2>Participation is invitation-only.</h2>
        <p>You've entered the ANEVUM member application. We're keeping Commons small while testing account isolation, research quality and moderation. No payment is required to participate once invited.</p>
        <a href="mailto:devon@anevum.com?subject=ANEVUM%20Commons%20beta%20interest">Request a beta invitation →</a>
      </section>
    ) : state?.available ? (<>
      <section className="commons-ruleset-intro" aria-label="Strategy research worksheet">
        <div><p className="commons-eyebrow">RESEARCH WORKSHOP</p>
          <h2>Have a rule set worth testing?</h2>
          <p>Describe the entry, exit, costs, sample, and evidence so others can challenge your reasoning. This starts a research note, not a trade or a signal subscription.</p></div>
        <div className="commons-ruleset-intro-actions">
          <button type="button" className="commons-action" onClick={startRuleSetReview}>Use rule-set worksheet</button>
          <Link to="/learn">Learn the research method →</Link>
        </div>
      </section>
      <div className="commons-list-header">
        <div>
          <p className="commons-eyebrow">Member contributions</p>
          <h2>Research activity</h2>
        </div>
        <button className="commons-action" type="button" onClick={() => setComposer(open => !open)} aria-expanded={composer}>
          {composer ? "Close editor" : "Start a contribution"}
        </button>
      </div>
      {composer && <form className="commons-composer" onSubmit={event => void submit(event)}>
        <h3>Start with a specific question or hypothesis.</h3>
        <p>Posts are visible to admitted Commons members. Do not share account information, private strategies, or broker credentials.</p>
        <div className="commons-form-grid">
          <label>Contribution type<select value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="question">Question</option><option value="research_note">Research note</option></select></label>
          <label>Subject<select value={subject} onChange={event => setSubject(event.target.value)}>{subjects.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        </div>
        <label>Title<input value={title} onChange={event => setTitle(event.target.value)} minLength={8} maxLength={120} required placeholder="What are you investigating?" /></label>
        <label>Details<textarea value={body} onChange={event => setBody(event.target.value)} minLength={30} maxLength={3000} rows={6} required placeholder="Describe the assumptions, evidence, or problem clearly…" /></label>
        <div className="commons-form-actions"><button type="submit" className="commons-action" disabled={submitting}>{submitting ? "Saving…" : "Publish to Commons"}</button><span>Maximum 3 new topics per day</span></div>
      </form>}
      <nav className="commons-filters" aria-label="Research filters">
        <Link aria-current={selectedKind === "all" ? "page" : undefined} className={selectedKind === "all" ? "selected" : ""} to="/commons">All research</Link>
        <Link aria-current={selectedKind === "question" ? "page" : undefined} className={selectedKind === "question" ? "selected" : ""} to="/commons?kind=question">Questions</Link>
        <Link aria-current={selectedKind === "research_note" ? "page" : undefined} className={selectedKind === "research_note" ? "selected" : ""} to="/commons?kind=research_note">Research notes</Link>
      </nav>
      {topics.length ? <div className="commons-topic-list">{topics.map(topic => <article className="commons-topic" key={topic.id}>
        <div className="commons-topic-meta"><span>{topic.kind === "question" ? "QUESTION" : "RESEARCH NOTE"}</span><span>{topic.subject.replace("_", " ")}</span><time dateTime={topic.createdAt}>{dateLabel(topic.createdAt)}</time></div>
        <h3><Link to={"/commons/topic/" + topic.id}>{topic.title}</Link></h3>
        <p>{topic.body.length > 230 ? topic.body.slice(0,230) + "…" : topic.body}</p>
        <footer><span>By {topic.author}</span><Link to={"/commons/topic/" + topic.id}>{topic.commentCount} {topic.commentCount === 1 ? "reply" : "replies"} · Open discussion →</Link></footer>
      </article>)}</div> : <section className="commons-empty">
        <h3>{state.topics.length && selectedKind !== "all" ? "No research in this category yet." : "The research record starts here."}</h3>
        <p>{state.topics.length && selectedKind !== "all" ? "Try another filter or contribute a question." : "No Commons contributions have been published yet. Start with a question worth investigating."}</p>
      </section>}
      {state.role === "moderator" && <section className="commons-composer" aria-label="Private moderator report queue">
        <div className="commons-list-header"><h2>Reports awaiting review</h2></div>
        {reports.length ? reports.map(report => <article className="commons-topic" key={report.id}>
          <div className="commons-topic-meta"><span>{report.itemType.toUpperCase()}</span><span>{report.reason.replaceAll("_", " ")}</span><time dateTime={report.createdAt}>{dateLabel(report.createdAt)}</time></div>
          <h3><Link to={"/commons/topic/" + report.topicId}>{report.topicTitle}</Link></h3>
          <p>Review the reported content and use the thread's moderation controls if action is necessary.</p>
          <button type="button" className="commons-moderate" disabled={reviewing !== null} onClick={() => void reviewReport(report.id)}>{reviewing === report.id ? "Saving…" : "Mark reviewed"}</button>
        </article>) : <p className="commons-empty">No open reports.</p>}
      </section>}
      <p className="commons-research-note">Community posts are exploratory contributions, not verified trading signals or investment advice. Nothing here changes RHEN's live trading rules.</p>
    </>) : null}
    {error && <div className="commons-error" role="alert">{error} <button type="button" onClick={() => void load().then(() => setError("")).catch(() => setError("Retry failed."))}>Retry</button></div>}
    {state?.available ? null : <section className="commons-public-record">
      <div className="commons-list-header"><div><p className="commons-eyebrow">Published research</p><h2>From the ANEVUM record</h2></div><Link to="/field-notes">All Field Notes →</Link></div>
      {notes.map(note => <Link className="commons-public-note" key={note.slug} to={"/field-notes/" + note.slug}><span>{note.date}</span><strong>{note.title}</strong><span aria-hidden="true">→</span></Link>)}
    </section>}
  </CommonsShell>;
}
