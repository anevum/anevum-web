import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RhenMark from "../components/RhenMark";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import "../styles/rhen-connect.css";

const DISCLOSURE_VERSION = "alpaca-live-v1";

type BrokerageStatus = {
  connectionAvailable: boolean;
  accountConnected: boolean;
  liveTradingEnabled: boolean;
  account?: { ending: string } | null;
};

export default function RhenConnect() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [broker, setBroker] = useState<BrokerageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user || availability !== "available") return;
    const controller = new AbortController();
    setBroker(null);
    setLoading(true);
    void fetch("/api/member/brokerage", { cache: "no-store", signal: controller.signal })
      .then(async result => {
        if (!result.ok) throw new Error("Broker connection status is unavailable.");
        return result.json() as Promise<BrokerageStatus>;
      })
      .then(result => { if (!controller.signal.aborted) setBroker(result); })
      .catch(() => { if (!controller.signal.aborted) setError("Broker connection status is unavailable."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session?.user?.id, availability]);

  async function authorize() {
    if (!session?.user || busy || !broker?.connectionAvailable || broker.accountConnected || !acknowledged) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/member/alpaca/live/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: true, disclosureVersion: DISCLOSURE_VERSION })
      });
      const result = await response.json() as { authorizeUrl?: string; message?: string };
      if (!response.ok) throw new Error(result.message || "Authorization is unavailable.");
      const target = new URL(result.authorizeUrl || "");
      if (target.origin !== "https://app.alpaca.markets" || target.pathname !== "/oauth/authorize") {
        throw new Error("Broker authorization destination did not match Alpaca.");
      }
      window.location.assign(target.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authorization is unavailable.");
      setBusy(false);
    }
  }

  if (availability === "checking" || isPending) return <main className="member-page"><p role="status">Checking RHEN access…</p></main>;
  if (availability !== "available") return <main className="member-page"><h1>RHEN member access is not available yet.</h1><Link to="/products/rhen">About RHEN</Link></main>;
  if (!session?.user) return <main className="member-page"><h1>Sign in to connect your brokerage.</h1><Link to="/sign-in">Sign in</Link></main>;

  const canContinue = broker?.connectionAvailable === true && broker.accountConnected === false;
  return (
    <main className="rhen-connect-page">
      <header className="rhen-connect-topbar">
        <Link className="rhen-connect-brand" to="/apps/rhen/account"><RhenMark decorative /><span>RHEN <small>BY ANEVUM</small></span></Link>
        <Link to="/apps/rhen/account">Back to my brokerage</Link>
      </header>
      <section className="rhen-connect-layout" aria-labelledby="rhen-connect-title">
        <div className="rhen-connect-intro">
          <p className="rhen-connect-eyebrow">ALPACA CONNECT / YOUR OWN ACCOUNT</p>
          <h1 id="rhen-connect-title">Connect your Alpaca account</h1>
          <p>Review the access RHEN by ANEVUM requests before continuing to Alpaca. Your brokerage account remains in your name. Connecting does not start automated trading.</p>
          <p className="rhen-connect-readiness">{broker?.accountConnected ? "Account already connected" : canContinue ? "Authorization available" : loading ? "Checking authorization availability" : "Application approval pending — connections disabled"}</p>
          <p className="rhen-connect-links"><Link to="/products/rhen">Learn about RHEN</Link><span aria-hidden="true"> · </span><Link to="/terms">Terms</Link><span aria-hidden="true"> · </span><Link to="/privacy">Privacy</Link></p>
        </div>
        <div className="rhen-connect-consent">
          <section className="rhen-connect-disclosure" aria-label="Alpaca Connect authorization disclosure">
            <p className="rhen-connect-eyebrow">REQUIRED BROKER ACCESS DISCLOSURE</p>
            <h2>Authorize RHEN by ANEVUM</h2>
            <p>By allowing RHEN by ANEVUM to access your Alpaca account, you are granting RHEN by ANEVUM access to your account information and authorization to place transactions in your account at your direction. Alpaca does not warrant or guarantee that RHEN by ANEVUM will work as advertised or expected. Before authorizing, learn more about <Link to="/products/rhen">RHEN by ANEVUM</Link>.</p>
          </section>
          <label className="rhen-connect-ack">
            <input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} disabled={!canContinue || busy} />
            <span>I understand that granting account access can include trading permissions. I choose whether to authorize RHEN at Alpaca.</span>
          </label>
          <button type="button" className="rhen-connect-submit" disabled={!canContinue || !acknowledged || busy} onClick={() => void authorize()}>
            {busy ? "Opening Alpaca…" : "Continue to Alpaca"}
          </button>
          {error && <p role="alert" className="rhen-connect-error">{error}</p>}
          <p className="rhen-connect-footnote">Live algorithmic order placement is not enabled for members. Approval, account controls and separate activation are required.</p>
        </div>
      </section>
    </main>
  );
}
