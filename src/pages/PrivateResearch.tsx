import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import CommonsShell from "../components/CommonsShell";
import "../styles/private-research.css";

type Draft = { id: string; kind: string; title: string; researchQuestion: string; method: string; sources: string; uncertainty: string; result: string; version: number; updatedAt: string };
type DraftInput = Pick<Draft, "kind" | "title" | "researchQuestion" | "method" | "sources" | "uncertainty" | "result">;
const blank: DraftInput = { kind: "hypothesis", title: "", researchQuestion: "", method: "", sources: "", uncertainty: "unknown", result: "" };
const types = ["question", "hypothesis", "experiment", "replication", "review", "correction"];

export default function PrivateResearch() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [form, setForm] = useState<DraftInput>({ ...blank });
  const [selected, setSelected] = useState<Draft | null>(null);
  const [status, setStatus] = useState("checking");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const authenticated = availability === "available" && Boolean(session?.user);
  async function load(signal?: AbortSignal) {
    const response = await fetch("/api/member/research/drafts", { cache: "no-store", signal });
    if (response.status === 503) { setStatus("unavailable"); return; }
    if (!response.ok) throw new Error("Your notebook could not be loaded.");
    const result = await response.json() as { drafts: Draft[] };
    if (!signal?.aborted) { setDrafts(result.drafts); setStatus("ready"); }
  }
  useEffect(() => {
    if (!authenticated) { setStatus("checking"); return; }
    const controller = new AbortController();
    void load(controller.signal).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [authenticated, session?.user?.id]);
  const set = (field: keyof DraftInput, value: string) => setForm(previous => ({ ...previous, [field]: value }));
  function edit(draft: Draft) {
    setSelected(draft);
    setForm({ kind: draft.kind, title: draft.title, researchQuestion: draft.researchQuestion, method: draft.method, sources: draft.sources, uncertainty: draft.uncertainty, result: draft.result });
    setNotice("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/member/research/drafts" + (selected ? "/" + selected.id : ""), {
        method: selected ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(selected ? { expectedVersion: selected.version } : {}) })
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Save failed.");
      await load();
      setSelected(null); setForm({ ...blank }); setNotice("Private research record saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Save failed."); }
    finally { setBusy(false); }
  }
  async function remove(draft: Draft) {
    if (!window.confirm("Permanently delete this private research record and its revisions?")) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/member/research/drafts/" + draft.id, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this record.");
      await load(); setSelected(null); setForm({ ...blank }); setNotice("Record deleted.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Delete failed."); }
    finally { setBusy(false); }
  }
  return <CommonsShell identity={authenticated ? session?.user?.name || session?.user?.email : undefined}>
    <section className="private-notebook">
      <p className="commons-eyebrow">COMMONS 2.0 / MY RESEARCH</p>
      <h1>Private research notebook</h1>
      <p>Keep hypotheses, experiments, sources, uncertainty and revisions in your own account. Your drafts are not public posts, trading signals or instructions to RHEN.</p>
      {!authenticated ? <div className="commons-state-panel"><h2>Sign in to continue</h2><Link to="/sign-in">Account access →</Link></div>
        : status === "checking" || isPending ? <p role="status">Checking notebook availability…</p>
        : status === "unavailable" ? <div className="commons-state-panel"><h2>Notebook coming to Commons</h2><p>Your account is unaffected. Private research storage has not been activated.</p><Link to="/learn">Read free lessons →</Link></div>
        : status === "error" ? <p role="alert">Notebook could not be loaded. Reload the page to retry.</p>
        : <>
          <div className="private-notebook-layout">
            <section className="private-notebook-list" aria-label="My private research">
              <h2>My drafts ({drafts.length}/12)</h2>
              {drafts.length ? drafts.map(draft => <article key={draft.id}>
                <span className="commons-eyebrow">{draft.kind} · version {draft.version}</span>
                <h3>{draft.title}</h3><p>{draft.researchQuestion}</p>
                <div className="private-notebook-actions"><button type="button" onClick={() => edit(draft)}>Edit</button><button type="button" disabled={busy} onClick={() => void remove(draft)}>Delete</button></div>
              </article>) : <p>No saved drafts yet.</p>}
              <button className="commons-action" type="button" onClick={() => { setSelected(null); setForm({ ...blank }); }}>New research record</button>
            </section>
            <form className="private-notebook-editor" onSubmit={event => void save(event)}>
              <h2>{selected ? "Revise your research" : "Document an idea"}</h2>
              <label>Research type<select value={form.kind} onChange={event => set("kind", event.target.value)}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
              <label>Title<input required minLength={8} maxLength={120} value={form.title} onChange={event => set("title", event.target.value)} /></label>
              <label>Research question<textarea required minLength={10} maxLength={1200} value={form.researchQuestion} onChange={event => set("researchQuestion", event.target.value)} /></label>
              <label>Method and assumptions<textarea required minLength={20} maxLength={2000} rows={5} value={form.method} onChange={event => set("method", event.target.value)} /></label>
              <label>Sources and citations<textarea maxLength={1500} value={form.sources} onChange={event => set("sources", event.target.value)} /></label>
              <label>Uncertainty<select value={form.uncertainty} onChange={event => set("uncertainty", event.target.value)}>{["unknown", "low", "moderate", "high"].map(level => <option key={level}>{level}</option>)}</select></label>
              <label>Results, limitations or negative findings<textarea maxLength={1200} value={form.result} onChange={event => set("result", event.target.value)} /></label>
              <p>Private to your account. Saving creates a revision history; publishing is unavailable.</p>
              <button className="commons-action" type="submit" disabled={busy}>{busy ? "Saving…" : selected ? "Save revision" : "Save private draft"}</button>
            </form>
          </div>
        </>}
      {notice && <p role="status">{notice}</p>}
    </section>
  </CommonsShell>;
}
