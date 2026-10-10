import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

const DISCLOSURE_VERSION = "alpaca-review-paper-v1";
type Status = {
  connectionAvailable: boolean;
  accountConnected: boolean;
  liveTradingEnabled: boolean;
  paperTradingEnabled: boolean;
  account?: { ending: string; environment: "paper" } | null;
};

export default function RhenReviewConnect() {
  const { data: session, isPending } = memberAuthClient.useSession();
  const availability = useMemberAvailability();
  const navigate = useNavigate();
  const signedIn = availability === "available" && !!session?.user;
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(null);
    setAcknowledged(false);
    if (!signedIn) return;
    const controller = new AbortController();
    setLoading(true);
    void fetch("/api/member/brokerage", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async result => {
        if (!result.ok) throw Error("Connection readiness unavailable.");
        return await result.json() as Status;
      })
      .then(value => {
        if (!controller.signal.aborted) setStatus(value);
      })
      .catch(() => { if (!controller.signal.aborted) setError("Could not verify your brokerage connection."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [signedIn, session?.user?.id]);

  const canAuthorize = signedIn && !isPending && !loading &&
    status?.connectionAvailable === true && status.accountConnected === false && !working;

  async function start() {
    if (!canAuthorize || !acknowledged) return;
    setWorking(true); setError("");
    try {
      const result = await fetch("/api/member/alpaca/review/start", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: true, disclosureVersion: DISCLOSURE_VERSION })
      });
      const payload = await result.json() as { authorizeUrl?: string; message?: string };
      if (!result.ok) throw Error(payload.message || "Authorization unavailable.");
      const target = new URL(payload.authorizeUrl || "");
      if (target.origin !== "https://app.alpaca.markets" ||
          target.pathname !== "/oauth/authorize" ||
          target.searchParams.get("env") !== "paper" ||
          target.searchParams.has("scope"))
        throw Error("The brokerage authorization URL did not meet the review-only policy.");
      window.location.assign(target.href);
    } catch {
      setError("The paper-account authorization could not be started. No brokerage connection was made.");
      setWorking(false);
    }
  }

  async function disconnect() {
    if (!status?.accountConnected || working || !signedIn) return;
    setWorking(true); setError("");
    try {
      const result = await fetch("/api/member/alpaca/review/disconnect", {
        method: "POST", credentials: "same-origin"
      });
      if (!result.ok) throw Error("Could not disconnect.");
      setStatus(value => value ? { ...value, accountConnected: false, account: null } : value);
      setAcknowledged(false);
    } catch {
      setError("Could not remove the connection. Please try again.");
    } finally { setWorking(false); }
  }

  const ready = signedIn && status?.connectionAvailable === true;
  return <section className="rhen-review" aria-labelledby="rhen-review-title">
    <header className="rhen-review-header">
      <div>
        <p className="rhen-review-kicker">RHEN / BROKERAGE INTEGRATION</p>
        <h1 id="rhen-review-title">Connect your own brokerage account</h1>
        <p>This page prepares an independently authorized, read-only paper-account connection for Alpaca's application review. No order submission, live trading, deposits or withdrawals are available.</p>
      </div>
      <Link to="/apps/rhen/account">Back to my brokerage</Link>
    </header>
    <p className="rhen-review-state" role="status">
      {isPending || availability === "checking" || loading ? "Checking member access…"
        : !signedIn ? "Sign in to a private ANEVUM account before connecting."
        : status?.accountConnected ? "Paper account connected — read-only review"
        : ready ? "Paper connection available for authorized staging review"
        : "Brokerage linking is not enabled in this environment."}
    </p>
    {!signedIn && <Link className="rhen-review-link" to="/sign-in">Sign in to ANEVUM</Link>}
    {status?.accountConnected && <section className="rhen-review-connected" aria-label="Verified paper account">
      <h2>Private paper account connection</h2>
      <p>Connected account ending {status.account?.ending || "—"}. This records a real provider authorization. Trading permission is not enabled.</p>
      <button type="button" onClick={() => void disconnect()} disabled={!signedIn || working}>Disconnect my account</button>
    </section>}
    <div className="rhen-review-disclosure" aria-label="Brokerage authorization disclosure">
      <p className="rhen-review-kicker">REQUIRED AUTHORIZATION DISCLOSURE</p>
      <h2>Authorize RHEN by ANEVUM</h2>
      <p>By allowing RHEN by ANEVUM to access your Alpaca account, you are granting RHEN by ANEVUM access to your account information and authorization to place transactions in your account at your direction.</p>
      <p>Alpaca does not warrant or guarantee that RHEN by ANEVUM will work as advertised or expected. Before authorizing, learn more about <Link to="/products/rhen">RHEN by ANEVUM</Link>.</p>
      <p className="rhen-review-scope"><strong>This review implementation requests read-only access to a paper account.</strong> It does not request order placement permission. Any future trading functionality requires a separate review and authorization.</p>
    </div>
    <label className="rhen-review-check">
      <input type="checkbox" checked={acknowledged}
        disabled={!canAuthorize} onChange={event => setAcknowledged(event.target.checked)}/>
      <span>I have read and understand the brokerage disclosure. I choose whether to continue to the broker's separate authorization screen.</span>
    </label>
    <div className="rhen-review-actions">
      <button type="button" className="rhen-review-deny" disabled={working}
        onClick={() => navigate("/apps/rhen/account")}>Deny / go back</button>
      <button type="button" className="rhen-review-allow" disabled={!canAuthorize || !acknowledged}
        onClick={() => void start()}>{working ? "Opening brokerage…" : "Allow and continue to brokerage"}</button>
    </div>
    {error && <p role="alert" className="rhen-review-error">{error}</p>}
    <p className="rhen-review-foot">Only your signed-in member account can start or view this connection. RHEN's original owner-only operator console remains separate. <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link></p>
  </section>;
}
