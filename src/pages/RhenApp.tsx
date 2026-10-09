import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import PublicEvidenceSnapshot from "../components/PublicEvidenceSnapshot";
import { currentRhenRelease } from "../data/releases";
import { fieldNotes } from "../data/fieldNotes";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import RhenDraft from "./RhenDraft";

type RhenSection = "overview" | "account" | "setup" | "evidence" | "research" | "updates";
const nav: { id: RhenSection; label: string; path: string }[] = [
  { id: "overview", label: "Overview", path: "/apps/rhen" },
  { id: "account", label: "My brokerage", path: "/apps/rhen/account" },
  { id: "setup", label: "My bot settings", path: "/apps/rhen/setup" },
  { id: "evidence", label: "Evidence", path: "/apps/rhen/evidence" },
  { id: "research", label: "Research", path: "/apps/rhen/research" },
  { id: "updates", label: "Updates", path: "/apps/rhen/updates" }
];

export default function RhenApp() {
  const location = useLocation();
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [operator, setOperator] = useState(false);
  const [brokerage, setBrokerage] = useState<{ integration: string; connectionAvailable: boolean; accountConnected: boolean; paperTradingEnabled: boolean; liveTradingEnabled: boolean; depositsEnabled: boolean; withdrawalsEnabled: boolean; account?: { ending: string } | null } | null>(null);
  const [brokerError, setBrokerError] = useState(false);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const release = currentRhenRelease();
  const segment = location.pathname.split("/")[3] || "overview";
  const section: RhenSection = ["overview", "account", "setup", "evidence", "research", "updates"].includes(segment) ? segment as RhenSection : "overview";

  useEffect(() => {
    if (!session?.user || availability !== "available") return;
    let alive = true;
    void fetch("/api/command/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((value: { command_admin?: boolean } | null) => { if (alive) setOperator(value?.command_admin === true); })
      .catch(() => { if (alive) setOperator(false); });
    return () => { alive = false; };
  }, [session?.user, availability]);

  useEffect(() => {
    if (!session?.user || availability !== "available" || section !== "account") return;
    const controller = new AbortController();
    setBrokerage(null); setBrokerError(false);
    void fetch("/api/member/brokerage", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(value => { if (!controller.signal.aborted) setBrokerage(value); })
      .catch(() => { if (!controller.signal.aborted) setBrokerError(true); });
    return () => controller.abort();
  }, [session?.user?.id, availability, section]);

  async function disconnectLiveBroker() {
    if (!session?.user || availability !== "available" || connectBusy || !brokerage?.accountConnected) return;
    setConnectBusy(true); setConnectMessage("");
    try {
      const response = await fetch("/api/member/alpaca/live/disconnect", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Live brokerage disconnect failed.");
      setBrokerage(null);
      const current = await fetch("/api/member/brokerage", { cache: "no-store" });
      if (!current.ok) throw new Error("Could not verify disconnected account.");
      setBrokerage(await current.json());
      setConnectMessage(payload.message || "Account disconnected.");
    } catch (error) {
      setConnectMessage(error instanceof Error ? error.message : "Live brokerage disconnect failed.");
    } finally { setConnectBusy(false); }
  }

  if (availability === "checking" || isPending) return <div className="member-page"><p role="status">Opening RHEN…</p></div>;
  if (availability !== "available") return <div className="member-page"><h1>RHEN workspace is not open yet.</h1><p>Public RHEN research and evidence remain available.</p><Link to="/products/rhen">Explore RHEN</Link></div>;
  if (!session?.user) return <div className="member-page"><h1>RHEN</h1><p>Sign in to use your ANEVUM workspace. Public project research is available without an account.</p><Link to="/sign-in">Sign in</Link><span> · </span><Link to="/products/rhen">View public RHEN</Link></div>;

  const notes = [...fieldNotes].filter((note) => note.systems.includes("RHEN"))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return (
    <div className="member-app">
      <header className="member-app-topbar">
        <Link to="/command">Command</Link>
        <div className="member-app-name"><SystemIcon system="RHEN" size="sm" /><strong>RHEN</strong></div>
        <Link to="/me/settings" aria-label="Account settings">Account</Link>
      </header>
      <div className="member-app-layout">
        <aside className="member-app-sidebar">
          <span>APPLICATION</span>
          <h1>RHEN</h1>
          <p>Markets and research</p>
          <nav aria-label="RHEN workspace">
            {nav.map(({id,label,path}) =>
              <Link key={id} to={path} aria-current={section === id ? "page" : undefined} className={section === id ? "active" : ""}>{label}</Link>
            )}
          </nav>
          {operator && <div className="member-app-operator"><span>PRIVATE OPERATOR</span><Link to="/command/rhen/operate">RHEN Terminal</Link></div>}
        </aside>
        <main className="member-app-content">
          <p className="workshop-kicker">RHEN / {section}</p>
          {section === "overview" && <>
            <h2>Your RHEN workspace</h2>
            <p>RHEN Cloud is being built for individually owned brokerage accounts and personal algorithm settings. For now you can review research and prepare your own limits; no member live order placement is active.</p>
            <dl className="member-app-facts">
              <div><dt>Registered release</dt><dd>{release.version}</dd></div>
              <div><dt>Live trading scope</dt><dd>Long U.S. equities and ETFs</dd></div>
              <div><dt>Options</dt><dd>Research only</dd></div>
              <div><dt>Profitability</dt><dd>Not established</dd></div>
            </dl>
            <Link to="/apps/rhen/evidence">View real evidence →</Link>
          </>}
          {section === "account" && <>
            <h2>Your brokerage workspace</h2>
            <p>This account will connect to your own Alpaca account, not ANEVUM's company trading bot. Live trading is the development target; order placement remains separately gated.</p>
            <section className="member-app-ready">
              <p className="workshop-kicker">Alpaca Connect / live account</p>
              <h3>{brokerage?.accountConnected ? "Your Alpaca account is linked" : brokerage?.connectionAvailable ? "Connect your live Alpaca account" : "Account linking awaits Alpaca approval"}</h3>
              <p>Only the official Alpaca OAuth permission screen can authorize a brokerage connection. ANEVUM never asks for your broker API keys here.</p>
              {brokerage?.accountConnected && <p>Verified account ending in {brokerage.account?.ending || "••••"}. This connection does not automatically authorize algorithmic trades.</p>}
              {!brokerage?.accountConnected && <Link to="/apps/rhen/connect" className="commons-action">Review Alpaca access disclosure</Link>}
              {brokerage?.accountConnected && <button type="button" className="commons-moderate" disabled={connectBusy} onClick={() => void disconnectLiveBroker()}>{connectBusy ? "Disconnecting…" : "Disconnect brokerage"}</button>}
              {connectMessage && <p role="status">{connectMessage}</p>}
            </section>
            {brokerError ? <p role="alert">Brokerage capability status could not be verified.</p> : !brokerage ? <p role="status">Checking capabilities…</p> : brokerage.liveTradingEnabled || brokerage.paperTradingEnabled || brokerage.depositsEnabled || brokerage.withdrawalsEnabled ? <p role="alert">Unexpected trading or money movement capability. Do not use this workspace.</p> : <dl className="member-app-readiness"><div><dt>Alpaca live linking</dt><dd>{brokerage.accountConnected ? "Linked" : brokerage.connectionAvailable ? "Available" : "Awaiting approval"}</dd></div><div><dt>Personal live bot</dt><dd>Not armed</dd></div><div><dt>Paper trial</dt><dd>Not required for planned live enrollment</dd></div><div><dt>Funding and withdrawals</dt><dd>Not supported</dd></div></dl>}
            <p>Automated live orders require Alpaca approval, approved security and regulatory gates, verified account-level limits, and your explicit activation. No live order path is available through this member page today.</p>
            <Link to="/apps/rhen/setup">Create a non-executing bot draft</Link><span> · </span><Link to="/apps/rhen/evidence">Explore verified RHEN evidence</Link>
          </>}
          {section === "setup" && <RhenDraft key={session.user.id} />}
          {section === "evidence" && <>
            <h2>Public evidence</h2>
            <p>Measured output from the privacy-safe RHEN feed. Missing or stale sources are shown as unavailable, never replaced with invented values.</p>
            <PublicEvidenceSnapshot />
            <Link to="/products/rhen/evidence">Detailed evidence and limitations →</Link>
          </>}
          {section === "research" && <>
            <h2>Research record</h2>
            <p>What has been tested, changed, or ruled out. Research does not automatically change live trading authority.</p>
            <div className="member-notes">
              {notes.filter((note) => note.type === "RESEARCH" || note.type === "SYSTEMS").map((note) =>
                <Link key={note.slug} to={"/field-notes/" + note.slug}><time>{note.date}</time><strong>{note.title}</strong></Link>
              )}
            </div>
          </>}
          {section === "updates" && <>
            <h2>RHEN updates</h2>
            <p>Actual release records and published build notes.</p>
            <div className="member-notes">{notes.map((note) =>
              <Link key={note.slug} to={"/field-notes/" + note.slug}><time>{note.date}</time><strong>{note.title}</strong></Link>
            )}</div>
            <Link to="/products/rhen/releases">Complete release history →</Link>
          </>}
        </main>
      </div>
    </div>
  );
}

