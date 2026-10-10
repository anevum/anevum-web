import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import { currentRhenRelease } from "../data/releases";
import { fieldNotes } from "../data/fieldNotes";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import RhenDraft from "./RhenDraft";
import { parsePrivateFoundationWorkspace, type FoundationWorkspaceState } from "../contracts/anevum-foundation";

type RhenSection = "overview" | "account" | "setup" | "evidence" | "research" | "updates";
const nav: { id: RhenSection; label: string; path: string }[] = [
  { id: "overview", label: "Overview", path: "/apps/rhen" },
  { id: "account", label: "My brokerage", path: "/apps/rhen/account" },
  { id: "setup", label: "Bot draft", path: "/apps/rhen/setup" },
  { id: "evidence", label: "Evidence", path: "/apps/rhen/evidence" },
  { id: "research", label: "Research", path: "/apps/rhen/research" },
  { id: "updates", label: "Updates", path: "/apps/rhen/updates" }
];

export default function RhenApp() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  if (availability === "checking" || isPending) return <div className="member-page"><p role="status">Opening RHEN…</p></div>;
  if (availability !== "available") return <div className="member-page"><h1>RHEN workspace is not open yet.</h1><p>Public RHEN research and evidence remain available.</p><Link to="/products/rhen">Explore RHEN</Link></div>;
  if (!session?.user) return <div className="member-page"><h1>RHEN</h1><p>Sign in to use your ANEVUM workspace. Public project research is available without an account.</p><Link to="/sign-in">Sign in</Link><span> · </span><Link to="/products/rhen">View public RHEN</Link></div>;
  // A different authenticated identity gets a new state tree before rendering.
  // Abort old reads and discard old operator, workspace, draft and broker state.
  return <RhenMemberWorkspace key={session.user.id} memberId={session.user.id} />;
}

function RhenMemberWorkspace({ memberId }: { memberId: string }) {
  const location = useLocation();
  const [operator, setOperator] = useState(false);
  const [brokerage, setBrokerage] = useState<{ integration: string; connectionAvailable: boolean; accountConnected: boolean; paperTradingEnabled: boolean; liveTradingEnabled: boolean; depositsEnabled: boolean; withdrawalsEnabled: boolean; account?: { ending: string; environment: string } | null } | null>(null);
  const [brokerError, setBrokerError] = useState(false);
  const [workspace, setWorkspace] = useState<FoundationWorkspaceState | null>(null);
  const [workspaceGate, setWorkspaceGate] = useState<"loading" | "off" | "ready" | "error">("loading");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const release = currentRhenRelease();
  const segment = location.pathname.split("/")[3] || "overview";
  const section: RhenSection = ["overview", "account", "setup", "evidence", "research", "updates"].includes(segment) ? segment as RhenSection : "overview";

  useEffect(() => {
    let alive = true;
    void fetch("/api/command/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((value: { command_admin?: boolean } | null) => { if (alive) setOperator(value?.command_admin === true); })
      .catch(() => { if (alive) setOperator(false); });
    return () => { alive = false; };
  }, [memberId]);

  useEffect(() => {
    setWorkspace(null);
    setWorkspaceGate("loading");
    const controller = new AbortController();
    void fetch("/api/member/rhen/workspace", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (response.status === 503) return null;
        if (!response.ok) throw new Error("Could not verify the private workspace.");
        return await response.json() as { available?: boolean; workspace?: unknown };
      })
      .then(value => {
        if (controller.signal.aborted) return;
        if (value === null) { setWorkspaceGate("off"); return; }
        if (value.available !== true || !Object.hasOwn(value, "workspace")) throw new Error("Invalid workspace response.");
        const parsed = value.workspace === null ? null : parsePrivateFoundationWorkspace(value.workspace, memberId);
        if (value.workspace !== null && (!parsed || parsed.engine_source !== "RHEN_NEXT" ||
          parsed.workspace_kind !== "MEMBER_PRIVATE" || parsed.execution_permission !== "NONE" ||
          parsed.broker_link_state !== "NOT_LINKED")) throw new Error("Unapproved workspace authority.");
        setWorkspace(parsed);
        setWorkspaceGate("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setWorkspaceGate("error"); });
    return () => controller.abort();
  }, [memberId]);

  useEffect(() => {
    if (section !== "account") return;
    const controller = new AbortController();
    setBrokerage(null); setBrokerError(false);
    void fetch("/api/member/brokerage", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(value => {
        if (controller.signal.aborted) return;
        if (!value || ![true, false].includes(value.connectionAvailable) ||
          ![true, false].includes(value.accountConnected) ||
          value.paperTradingEnabled !== false || value.liveTradingEnabled !== false ||
          value.depositsEnabled !== false || value.withdrawalsEnabled !== false ||
          (value.brokerWriteEnabled !== undefined && value.brokerWriteEnabled !== false) ||
          (value.accountConnected && (value.account?.environment !== "paper" ||
            typeof value.account?.ending !== "string" || !/^[a-zA-Z0-9-]{4}$/.test(value.account.ending)))) {
          throw new Error("Unexpected brokerage capability state.");
        }
        setBrokerage(value);
      })
      .catch(() => { if (!controller.signal.aborted) setBrokerError(true); });
    return () => controller.abort();
  }, [memberId, section]);

  const initializeWorkspace = async () => {
    if (workspaceGate !== "ready" || workspace || creatingWorkspace) return;
    setCreatingWorkspace(true);
    try {
      const response = await fetch("/api/member/rhen/workspace", {
        method: "POST", credentials: "same-origin", cache: "no-store"
      });
      if (!response.ok) throw new Error("Workspace creation unavailable.");
      const payload = await response.json() as { available?: boolean; workspace?: unknown };
      const parsed = parsePrivateFoundationWorkspace(payload.workspace, memberId);
      if (payload.available !== true || !parsed || parsed.workspace_kind !== "MEMBER_PRIVATE" ||
          parsed.engine_source !== "RHEN_NEXT" || parsed.execution_permission !== "NONE" ||
          parsed.broker_link_state !== "NOT_LINKED") throw new Error("Workspace proof failed.");
      setWorkspace(parsed);
    } catch {
      setWorkspaceGate("error");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const notes = [...fieldNotes].filter((note) => note.systems.includes("RHEN"))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return (
    <div className="member-app c2-rhen">
      <header className="member-app-topbar">
        <Link to="/command">Command</Link>
        <div className="member-app-name"><SystemIcon system="RHEN" size="sm" /><strong>RHEN</strong></div>
        <Link to="/me/settings" aria-label="Account settings">Account</Link>
      </header>
      <div className="member-app-layout">
        <aside className="member-app-sidebar">
          <span>APPLICATION</span>
          <h1>RHEN</h1>
          <p>Your private research workspace</p>
          <nav aria-label="RHEN workspace">
            {nav.map(({id,label,path}) =>
              <Link key={id} to={path} aria-current={section === id ? "page" : undefined} className={section === id ? "active" : ""}>{label}</Link>
            )}
          </nav>
          {operator && <div className="member-app-operator"><span>PRIVATE OPERATOR</span><Link to="/command/rhen/operate">RHEN Terminal</Link></div>}
        </aside>
        <section className="member-app-content" aria-label="RHEN workspace content">
          <p className="workshop-kicker">RHEN / {section}</p>
          <p className="c2-rhen-status" role="status"><strong>V5 development</strong> · Personal bots are not active. Paper account review, when available, does not enable trading.</p>
          {section === "overview" && <>
            <h2>Your RHEN workspace.</h2>
            <p>Keep your setup draft in your own ANEVUM account and explore published research. Your private settings belong to you. Public evidence and release notes are shared reading material.</p>
            <dl className="member-app-facts">
              <div><dt>Historical registered release</dt><dd>{release.version}</dd></div>
              <div><dt>Trading status</dt><dd>Suspended for V5 rebuild</dd></div>
              <div><dt>Options</dt><dd>Research only</dd></div>
              <div><dt>Profitability</dt><dd>Not established</dd></div>
            </dl>
            <section className="member-app-ready" aria-labelledby="rhen-v5-private-workspace">
              <p className="workshop-kicker">Private RHEN V5</p>
              <h3 id="rhen-v5-private-workspace">Your personal workspace</h3>
              {workspaceGate === "loading" ? <p role="status">Checking your private RHEN workspace…</p>
                : workspaceGate === "off" ? <p>V5 private workspace provisioning is not enabled in this environment.</p>
                : workspaceGate === "error" ? <p role="alert">Your private workspace could not be verified. No RHEN controls are available.</p>
                : workspace ? <>
                  <p>Your workspace is reserved under your authenticated ANEVUM account. Research, paper execution, and brokerage linking are not activated by creating a workspace. Check My brokerage for separate paper review availability.</p>
                  <dl className="member-app-facts">
                    <div><dt>Workspace</dt><dd><code>{workspace.workspace_id}</code></dd></div>
                    <div><dt>Research evidence</dt><dd>{workspace.evidence_state.replaceAll("_", " ")}</dd></div>
                    <div><dt>Broker review</dt><dd><Link to="/apps/rhen/account">Check my connection status</Link></dd></div>
                    <div><dt>Execution authority</dt><dd>None</dd></div>
                  </dl>
                </> : <>
                  <p>You can reserve a private RHEN workspace in this staging environment. This does not connect an Alpaca account or start a bot.</p>
                  <button type="button" disabled={creatingWorkspace} onClick={() => void initializeWorkspace()}>
                    {creatingWorkspace ? "Creating private workspace…" : "Create private workspace"}
                  </button>
                </>}
            </section>
            <div className="c2-rhen-actions"><Link to="/apps/rhen/setup">Open my setup draft</Link><Link to="/apps/rhen/account">My brokerage</Link><Link to="/apps/rhen/evidence">Read public evidence</Link></div>
          </>}
          {section === "account" && <>
            <h2>Your brokerage workspace</h2>
            <p>Each ANEVUM member controls only their own brokerage authorization. A separate read-only PAPER connection may become available in restricted staging for app review; live trading, deposits and withdrawals remain disabled.</p>
            <section className="member-app-ready"><p className="workshop-kicker">Personal brokerage</p>
              <h3>{brokerage?.accountConnected ? "Your paper account is connected" : brokerage?.connectionAvailable ? "Paper review authorization available" : "Not available yet"}</h3>
              <p>{brokerage?.accountConnected ? "Authenticated paper account ending " + (brokerage.account?.ending || "—") + ". No trading orders can be submitted through RHEN." : brokerage?.connectionAvailable ? "You may review the disclosure and independently connect your own paper account. Connection does not activate a trading bot." : "Member brokerage connections are not enabled in this environment."}</p>
              {(brokerage?.connectionAvailable || brokerage?.accountConnected) &&
                <Link to="/apps/rhen/connect">{brokerage.accountConnected ? "Manage paper connection" : "Review brokerage authorization"}</Link>}
            </section>
            {brokerError ? <p role="alert">Brokerage capability status could not be verified.</p> : !brokerage ? <p role="status">Checking capabilities…</p> :
              brokerage.paperTradingEnabled || brokerage.liveTradingEnabled || brokerage.depositsEnabled || brokerage.withdrawalsEnabled ?
                <p role="alert">Unexpected execution/funding capability. Financial controls remain unavailable.</p> :
                <dl className="member-app-readiness"><div><dt>Brokerage linking</dt><dd>{brokerage.accountConnected ? "Private paper account" : brokerage.connectionAvailable ? "Paper review only" : "Not enabled"}</dd></div><div><dt>Personal paper bot</dt><dd>Not enabled</dd></div><div><dt>Personal live bot</dt><dd>Not enabled</dd></div><div><dt>Funding and withdrawals</dt><dd>Not supported</dd></div></dl>}
            <p>Live member execution will require separate brokerage, regulatory, and security approval.</p>
            <Link to="/apps/rhen/setup">Create a non-executing bot draft</Link><span> · </span><Link to="/apps/rhen/evidence">Explore verified RHEN evidence</Link>
          </>}
          {section === "setup" && <RhenDraft key={memberId} />}
          {section === "evidence" && <>
            <h2>Public evidence</h2>
            <p>This is the shared research record, separate from your private workspace. The former live runtime has been retired for the V5 rebuild.</p>
            <section className="member-app-ready" data-evidence-state="SUSPENDED_FOR_REBUILD" aria-label="Public RHEN evidence status">
              <p className="workshop-kicker">SUSPENDED_FOR_REBUILD</p>
              <h3>Legacy live trading is suspended.</h3>
              <p>No current account curve, live positions or new trading results are available. Historical publications are retained; profitability has not been established.</p>
            </section>
            <Link to="/products/rhen/evidence">Detailed evidence and limitations →</Link>
          </>}
          {section === "research" && <>
            <h2>Research record</h2>
            <p>Published experiments, methods and decisions. These are public reading material; research does not activate your draft or grant trading authority.</p>
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
        </section>
      </div>
    </div>
  );
}

