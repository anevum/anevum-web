import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { parsePrivateDraftResponse, type PrivateDraft } from "../member/private-rhen-draft-contract";

const FRESH = {
  label: "",
  maxOpenPositions: "1",
  maxTotalExposurePercent: "20",
  maxPositionPercent: "10"
};

/** Parent RHEN member workspace is keyed to Better Auth user.id. This view is
 * also key-scoped, and every request is aborted when that identity unmounts.
 */
export default function RhenDraft({ expectedMemberId }: { expectedMemberId: string }) {
  const [form, setForm] = useState(FRESH);
  const [existing, setExisting] = useState<PrivateDraft | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const scope = useRef<AbortController | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted) return;
    const response = await fetch("/api/member/rhen/draft", {
      method: "GET", credentials: "same-origin", cache: "no-store",
      redirect: "manual", signal
    });
    if (signal.aborted) return;
    if (response.status === 503) {
      setAvailable(false); setExisting(null); setForm(FRESH);
      return;
    }
    if (!response.ok) throw new Error("Your draft could not be loaded.");
    const state = parsePrivateDraftResponse(await response.json());
    if (signal.aborted) return;
    setAvailable(true);
    setExisting(state.draft);
    setForm(state.draft ? {
      label: state.draft.label,
      maxOpenPositions: String(state.draft.maxOpenPositions),
      maxTotalExposurePercent: String(state.draft.maxTotalExposurePercent),
      maxPositionPercent: String(state.draft.maxPositionPercent)
    } : FRESH);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    setForm(FRESH); setExisting(null); setAvailable(false);
    setError(""); setNotice(""); setLoading(true); setWorking(false);
    void load(controller.signal)
      .catch(() => { if (!controller.signal.aborted) {
        setAvailable(false); setExisting(null); setForm(FRESH);
        setError("Could not verify your private draft.");
      } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => {
      controller.abort();
      if (scope.current === controller) scope.current = null;
    };
  }, [expectedMemberId, load]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const controller = scope.current;
    if (!controller || controller.signal.aborted || !available || working) return;
    setWorking(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/member/rhen/draft", {
        method: "PUT", credentials: "same-origin", cache: "no-store",
        redirect: "manual", signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          // Compared to the verified session on the server, never used to choose a tenant.
          "X-ANEVUM-EXPECTED-MEMBER-ID": expectedMemberId
        },
        body: JSON.stringify({
          label: form.label.trim(),
          maxOpenPositions: Number(form.maxOpenPositions),
          maxTotalExposurePercent: Number(form.maxTotalExposurePercent),
          maxPositionPercent: Number(form.maxPositionPercent)
        })
      });
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error("Draft could not be saved. Check your session and limits.");
      const status = parsePrivateDraftResponse(await response.json(), true);
      if (controller.signal.aborted) return;
      setExisting(status.draft);
      setForm({
        label: status.draft!.label,
        maxOpenPositions: String(status.draft!.maxOpenPositions),
        maxTotalExposurePercent: String(status.draft!.maxTotalExposurePercent),
        maxPositionPercent: String(status.draft!.maxPositionPercent)
      });
      setNotice("Draft saved to your ANEVUM account. It does not run a bot.");
    } catch {
      if (!controller.signal.aborted) setError("Draft could not be saved or verified. No execution was authorized.");
    } finally { if (!controller.signal.aborted) setWorking(false); }
  };

  const remove = async () => {
    const controller = scope.current;
    if (!controller || controller.signal.aborted || !available || !existing || working) return;
    setWorking(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/member/rhen/draft", {
        method: "DELETE", credentials: "same-origin", cache: "no-store",
        redirect: "manual", signal: controller.signal,
        headers: { "X-ANEVUM-EXPECTED-MEMBER-ID": expectedMemberId }
      });
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error("Delete was not confirmed.");
      const status = parsePrivateDraftResponse(await response.json());
      if (status.draft !== null) throw new Error("Delete was not confirmed.");
      if (controller.signal.aborted) return;
      setExisting(null); setForm(FRESH);
      setNotice("Draft deleted.");
    } catch {
      if (!controller.signal.aborted) setError("Draft deletion could not be confirmed.");
    } finally { if (!controller.signal.aborted) setWorking(false); }
  };

  return (
    <section className="member-draft-workspace">
      <h2>Draft your RHEN setup.</h2>
      <p>This saves preferences for a possible personal RHEN bot. It is not a paper-trading engine, a strategy, a brokerage connection, or permission to place orders.</p>
      <div className="member-app-ready">
        <p className="workshop-kicker">Authority</p>
        <h3>Configuration only</h3>
        <p>Execution, broker access, deposits, withdrawals, and automatic strategy activation are not available to member drafts.</p>
      </div>
      {loading ? <p role="status">Checking your draft workspace…</p> : !available ? (
        <p role="status" className="member-financial-note">Personal RHEN draft settings are not enabled in this environment. You can still review <Link to="/apps/rhen/evidence">public RHEN evidence</Link>.</p>
      ) : (
        <>
          {existing && <p className="member-financial-note">Saved draft{existing.updatedAt ? " · Updated " + existing.updatedAt : ""}</p>}
          <form className="member-draft-form" onSubmit={(event) => void save(event)}>
            <div className="member-draft-field">
              <label htmlFor="draft-name">Draft name</label>
              <input id="draft-name" type="text" minLength={1} maxLength={48} required value={form.label} placeholder="My RHEN setup" disabled={working} onChange={event => setForm({ ...form, label: event.target.value })} />
            </div>
            <div className="member-draft-static">
              <div><span>Market scope</span><strong>U.S. equities and ETFs</strong></div>
              <div><span>Direction</span><strong>Long only</strong></div>
            </div>
            <p className="member-draft-caption">These are optional planning limits, not recommended allocation levels or live safeguards.</p>
            <div className="member-draft-fields">
              <div className="member-draft-field">
                <label htmlFor="draft-positions">Maximum simultaneous positions</label>
                <input id="draft-positions" type="number" inputMode="numeric" min={1} max={10} step={1} required disabled={working} value={form.maxOpenPositions} onChange={event => setForm({ ...form, maxOpenPositions: event.target.value })} />
              </div>
              <div className="member-draft-field">
                <label htmlFor="draft-total">Total allocation ceiling (%)</label>
                <input id="draft-total" type="number" inputMode="numeric" min={1} max={100} step={1} required disabled={working} value={form.maxTotalExposurePercent} onChange={event => setForm({ ...form, maxTotalExposurePercent: event.target.value })} />
              </div>
              <div className="member-draft-field">
                <label htmlFor="draft-single">Single position ceiling (%)</label>
                <input id="draft-single" type="number" inputMode="numeric" min={1} max={100} step={1} required disabled={working} value={form.maxPositionPercent} onChange={event => setForm({ ...form, maxPositionPercent: event.target.value })} />
              </div>
            </div>
            <div className="member-draft-actions">
              <button type="submit" disabled={working}>{working ? "Saving…" : "Save draft"}</button>
              {existing && <button type="button" disabled={working} className="member-draft-delete" onClick={() => void remove()}>Delete draft</button>}
            </div>
          </form>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert" className="member-alert">{error}</p>}
      <p className="member-financial-footnote">A saved draft does not control the operator's RHEN deployment. Member brokerage onboarding and live orders require independent release approvals.</p>
    </section>
  );
}
