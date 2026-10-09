import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import CommonsShell from "../components/CommonsShell";

type Topic = {
  id: string; title: string; body: string; author: string; createdAt: string;
  kind: "question" | "research_note"; subject: string; hidden?: boolean;
};
type Comment = { id: string; body: string; author: string; createdAt: string; hidden?: boolean };
type Thread = { topic: Topic; comments: Comment[]; canModerate: boolean };

function dateLabel(value: string) {
  const timestamp = Date.parse(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(timestamp) ? "" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(timestamp);
}

export default function CommonsTopic() {
  const { id } = useParams<{ id: string }>();
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<{ itemType: "topic" | "comment"; itemId: string } | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportAcknowledgment, setReportAcknowledgment] = useState("");
  const authenticated = availability === "available" && Boolean(session?.user);

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid research record.");
    const response = await fetch("/api/member/commons/topics/" + id, { cache: "no-store", signal });
    if (!response.ok) throw new Error(response.status === 403 ? "Commons invitation required." : response.status === 404 ? "This research record is unavailable." : "Could not load this record.");
    const payload = await response.json() as Thread;
    if (!signal?.aborted) setThread(payload);
  }, [id]);

  useEffect(() => {
    setThread(null); setError("");
    if (!authenticated) { setLoading(false); return; }
    const abort = new AbortController();
    setLoading(true);
    void reload(abort.signal).catch(err => {
      if (!abort.signal.aborted) setError(err instanceof Error ? err.message : "Could not load the record.");
    }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [authenticated, session?.user?.id, reload]);

  async function sendComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thread || pending) return;
    setPending(true); setError("");
    try {
      const response = await fetch("/api/member/commons/topics/" + id + "/comments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text })
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Could not publish reply.");
      await reload(); setText("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not publish reply."); }
    finally { setPending(false); }
  }

  async function moderate(type: "topic" | "comment", itemId: string, hidden: boolean) {
    if (!thread?.canModerate || pending) return;
    setPending(true); setError("");
    try {
      const endpoint = type === "topic" ? "/api/member/commons/topics/" : "/api/member/commons/comments/";
      const response = await fetch(endpoint + itemId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden })
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Moderation action failed.");
      await reload();
    } catch (err) { setError(err instanceof Error ? err.message : "Moderation action failed."); }
    finally { setPending(false); }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportTarget || pending) return;
    setPending(true); setError(""); setReportAcknowledgment("");
    try {
      const response = await fetch("/api/member/commons/reports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reportTarget, reason: reportReason })
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Report could not be submitted.");
      setReportTarget(null);
      setReportAcknowledgment("Report received for private moderator review.");
    } catch (err) { setError(err instanceof Error ? err.message : "Report could not be submitted."); }
    finally { setPending(false); }
  }

  return <CommonsShell identity={authenticated ? session?.user?.name || session?.user?.email : undefined} role={thread?.canModerate ? "moderator" : null}>
    <div className="commons-thread">
      <Link className="commons-back" to="/commons">← Back to Commons</Link>
      {!authenticated && !(availability === "checking" || isPending) ? <section className="commons-state-panel"><h1>Sign in to open research.</h1><p>Commons discussions are available to admitted members.</p><Link className="commons-action" to="/sign-in">Sign in →</Link></section>
      : loading || availability === "checking" || isPending ? <p role="status" className="commons-state-panel">Loading research record…</p>
      : thread ? <>
        <article className="commons-thread-primary">
          <div className="commons-topic-meta"><span>{thread.topic.kind === "question" ? "QUESTION" : "RESEARCH NOTE"}</span><span>{thread.topic.subject}</span><time dateTime={thread.topic.createdAt}>{dateLabel(thread.topic.createdAt)}</time></div>
          <h1>{thread.topic.title}</h1>
          <p className="commons-byline">Posted by {thread.topic.author}</p>
          {thread.topic.hidden && <p className="commons-mod-notice">Hidden from contributors — visible to moderators.</p>}
          <div className="commons-body">{thread.topic.body}</div>
          {thread.canModerate && <button className="commons-moderate" type="button" disabled={pending} onClick={() => void moderate("topic", thread.topic.id, !thread.topic.hidden)}>{thread.topic.hidden ? "Restore topic" : "Hide topic"}</button>}
          {!thread.topic.hidden && <button className="commons-moderate" type="button" disabled={pending} onClick={() => { setReportTarget({ itemType: "topic", itemId: thread.topic.id }); setReportReason("spam"); }}>Report topic</button>}
        </article>
        <section aria-labelledby="commons-discussion">
          <div className="commons-list-header"><h2 id="commons-discussion">Discussion ({thread.comments.length})</h2></div>
          {thread.comments.length ? <div className="commons-comment-list">{thread.comments.map(comment => <article className="commons-comment" key={comment.id}>
            <div className="commons-comment-heading"><strong>{comment.author}</strong><time dateTime={comment.createdAt}>{dateLabel(comment.createdAt)}</time></div>
            {comment.hidden && <p className="commons-mod-notice">Hidden from contributors</p>}
            <p>{comment.body}</p>
            {thread.canModerate && <button className="commons-moderate" type="button" disabled={pending} onClick={() => void moderate("comment", comment.id, !comment.hidden)}>{comment.hidden ? "Restore reply" : "Hide reply"}</button>}
            {!comment.hidden && <button className="commons-moderate" type="button" disabled={pending} onClick={() => { setReportTarget({ itemType: "comment", itemId: comment.id }); setReportReason("spam"); }}>Report reply</button>}
          </article>)}</div> : <p className="commons-empty">There are no replies yet.</p>}
        </section>
        {reportTarget && <form className="commons-composer" onSubmit={event => void submitReport(event)}>
          <h3>Report this {reportTarget.itemType === "topic" ? "topic" : "reply"}</h3>
          <p>Choose the reason. Reports are private to Commons moderators and do not automatically remove content.</p>
          <label>Reason<select value={reportReason} onChange={event => setReportReason(event.target.value)}>
            <option value="spam">Spam or solicitation</option>
            <option value="harassment">Harassment</option>
            <option value="privacy">Private or sensitive information</option>
            <option value="misleading_claims">Misleading performance claims</option>
            <option value="other">Other community safety concern</option>
          </select></label>
          <div className="commons-form-actions">
            <button className="commons-action" type="submit" disabled={pending}>{pending ? "Sending…" : "Send report"}</button>
            <button className="commons-moderate" type="button" disabled={pending} onClick={() => setReportTarget(null)}>Cancel</button>
          </div>
        </form>}
        {reportAcknowledgment && <p className="commons-mod-notice" role="status">{reportAcknowledgment}</p>}
        {!thread.topic.hidden && <form className="commons-composer" onSubmit={event => void sendComment(event)}>
          <h3>Contribute to this research</h3>
          <label>Your reply<textarea value={text} onChange={event => setText(event.target.value)} required minLength={3} maxLength={1500} rows={5} placeholder="Ask a useful question, challenge an assumption, or add evidence…" /></label>
          <div className="commons-form-actions"><button className="commons-action" type="submit" disabled={pending}>{pending ? "Saving…" : "Post reply"}</button><span>Up to 20 replies per day</span></div>
        </form>}
      </> : null}
      {error && <p className="commons-error" role="alert">{error}</p>}
    </div>
  </CommonsShell>;
}
