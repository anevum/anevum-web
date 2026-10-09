import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

type Draft = {
  label: string;
  marketScope: "us_equities_etfs";
  direction: "long_only";
  maxOpenPositions: number;
  maxTotalExposurePercent: number;
  maxPositionPercent: number;
  updatedAt: string;
};
type DraftResponse = {
  available: boolean;
  draft: Draft | null;
  executionEnabled: false;
  brokerageConnected: false;
};

const FRESH = {
  label: "",
  maxOpenPositions: "1",
  maxTotalExposurePercent: "20",
  maxPositionPercent: "10"
};

export default function RhenDraft() {
  const [form, setForm] = useState(FRESH);
  const [existing, setExisting] = useState<Draft | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/member/rhen/draft", { cache: "no-store", signal });
    if (response.status === 503) {
      if (!signal?.aborted) { setAvailable(false); setExisting(null); }
      return;
    }
    if (!response.ok) throw new Error("Your draft could not be loaded.");
    const state = await response.json() as DraftResponse;
    if (signal?.aborted) return;
    if (!state.available || state.executionEnabled || state.brokerageConnected) {
      setAvailable(false);
      setExisting(null);
      throw new Error("Unexpected capability state. No settings are available.");
    }
    setAvailable(true);
    setExisting(state.draft);
    if (state.draft) setForm({
      label: state.draft.label,
      maxOpenPositions: String(state.draft.maxOpenPositions),
      maxTotalExposurePercent: String(state.draft.maxTotalExposurePercent),
      maxPositionPercent: String(state.draft.maxPositionPercent)
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void load(controller.signal)
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load draft."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!available || working) return;
    setWorking(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/member/rhen/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim(),
          maxOpenPositions: Number(form.maxOpenPositions),
          maxTotalExposurePercent: Number(form.maxTotalExposurePercent),
          maxPositionPercent: Number(form.maxPositionPercent)
        })
      });
      if (!response.ok) {
        const value = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(value?.message || "Draft could not be saved.");
      }
      const status = await response.json() as DraftResponse;
      if (!status.available || status.executionEnabled || status.brokerageConnected || !status.draft) {
        throw new Error("Unexpected response. Confirm draft status before continuing.");
      }
      setExisting(status.draft);
      setForm({
        label: status.draft.label,
        maxOpenPositions: String(status.draft.maxOpenPositions),
        maxTotalExposurePercent: String(status.draft.maxTotalExposurePercent),
        maxPositionPercent: String(status.draft.maxPositionPercent)
      });
      setNotice("Draft saved to your ANEVUM account. It does not run a bot.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Draft could not be saved.");
    } finally { setWorking(false); }
  };

  const remove = async () => {
    if (!available || !existing || working) return;
    setWorking(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/member/rhen/draft", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the draft.");
      setExisting(null); setForm(FRESH);
      setNotice("Draft deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete the draft.");
    } finally { setWorking(false); }
  };

  return (
    <section className="member-draft-workspace">
      <h2>Set up your personal RHEN bot</h2>
      <p>Choose your starting limits for a future live RHEN bot linked to your own brokerage account. Saving a configuration does not submit orders, activate a strategy, or connect your broker.</p>
      <div className="member-app-ready">
        <p className="workshop-kicker">Authority</p>
        <h3>Saved settings · Trading inactive</h3>
        <p>Your settings are private to your ANEVUM member account. When live member trading becomes available, these preferences can only restrict the separate operator-approved risk limits. They cannot override them.</p>
      </div>
      {loading ? <p role="status">Checking your draft workspace…</p> : !available ? (
        <p role="status" className="member-financial-note">Personal RHEN draft settings are not enabled in this environment. You can still review <Link to="/apps/rhen/evidence">public RHEN evidence</Link>.</p>
      ) : (
        <>
          {existing && <p className="member-financial-note">Saved draft{existing.updatedAt ? " · Updated " + existing.updatedAt : ""}</p>}
          <form className="member-draft-form" onSubmit={(event) => void save(event)}>
            <div className="member-draft-field">
              <label htmlFor="draft-name">Draft name</label>
              <input id="draft-name" type="text" minLength={1} maxLength={48} required value={form.label} placeholder="My RHEN setup" onChange={event => setForm({ ...form, label: event.target.value })} />
            </div>
            <div className="member-draft-static">
              <div><span>Market scope</span><strong>U.S. equities and ETFs</strong></div>
              <div><span>Direction</span><strong>Long only</strong></div>
            </div>
            <p className="member-draft-caption">Your personal limits are upper bounds, not recommendations. They remain planning values until Alpaca approval, broker verification, and a separately authorized live deployment. Actual limits may be stricter.</p>
            <div className="member-draft-fields">
              <div className="member-draft-field">
                <label htmlFor="draft-positions">Maximum simultaneous positions</label>
                <input id="draft-positions" type="number" inputMode="numeric" min={1} max={10} step={1} required value={form.maxOpenPositions} onChange={event => setForm({ ...form, maxOpenPositions: event.target.value })} />
              </div>
              <div className="member-draft-field">
                <label htmlFor="draft-total">Total allocation ceiling (%)</label>
                <input id="draft-total" type="number" inputMode="numeric" min={1} max={100} step={1} required value={form.maxTotalExposurePercent} onChange={event => setForm({ ...form, maxTotalExposurePercent: event.target.value })} />
              </div>
              <div className="member-draft-field">
                <label htmlFor="draft-single">Single position ceiling (%)</label>
                <input id="draft-single" type="number" inputMode="numeric" min={1} max={100} step={1} required value={form.maxPositionPercent} onChange={event => setForm({ ...form, maxPositionPercent: event.target.value })} />
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
      <p className="member-financial-footnote">These settings cannot control another member's bot or ANEVUM's private RHEN account. Member live orders require separate permissions and deployment approvals.</p>
    </section>
  );
}
