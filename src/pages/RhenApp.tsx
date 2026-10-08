import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import PublicEvidenceSnapshot from "../components/PublicEvidenceSnapshot";
import { currentRhenRelease } from "../data/releases";
import { fieldNotes } from "../data/fieldNotes";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

type RhenSection = "overview" | "evidence" | "research" | "updates";
const nav: { id: RhenSection; label: string; path: string }[] = [
  { id: "overview", label: "Overview", path: "/apps/rhen" },
  { id: "evidence", label: "Evidence", path: "/apps/rhen/evidence" },
  { id: "research", label: "Research", path: "/apps/rhen/research" },
  { id: "updates", label: "Updates", path: "/apps/rhen/updates" }
];

export default function RhenApp() {
  const location = useLocation();
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [operator, setOperator] = useState(false);
  const release = currentRhenRelease();
  const segment = location.pathname.split("/")[3] || "overview";
  const section: RhenSection = ["overview", "evidence", "research", "updates"].includes(segment) ? segment as RhenSection : "overview";

  useEffect(() => {
    if (!session?.user || availability !== "available") return;
    let alive = true;
    void fetch("/api/command/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((value: { command_admin?: boolean } | null) => { if (alive) setOperator(value?.command_admin === true); })
      .catch(() => { if (alive) setOperator(false); });
    return () => { alive = false; };
  }, [session?.user, availability]);

  if (availability === "checking" || isPending) return <div className="member-page"><p role="status">Opening RHEN…</p></div>;
  if (availability !== "available") return <div className="member-page"><h1>RHEN workspace is not open yet.</h1><p>Public RHEN research and evidence remain available.</p><Link to="/products/rhen">Explore RHEN</Link></div>;
  if (!session?.user) return <div className="member-page"><h1>RHEN</h1><p>Sign in to use your ANEVUM workspace. Public project research is available without an account.</p><Link to="/sign-in">Sign in</Link><span> · </span><Link to="/products/rhen">View public RHEN</Link></div>;

  const notes = [...fieldNotes].filter((note) => note.systems.includes("RHEN"))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return (
    <div className="member-app">
      <header className="member-app-topbar">
        <Link to="/me">Command</Link>
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
          {operator && <div className="member-app-operator"><span>PRIVATE OPERATOR</span><Link to="/apps/rhen/terminal/operate">RHEN Terminal</Link></div>}
        </aside>
        <main className="member-app-content">
          <p className="workshop-kicker">RHEN / {section}</p>
          {section === "overview" && <>
            <h2>Trading ideas, tested against evidence.</h2>
            <p>RHEN is my market research and execution project. This member workspace shows the same sanitized public evidence and research available on ANEVUM; it is not a personal brokerage account or a live trading control panel.</p>
            <dl className="member-app-facts">
              <div><dt>Registered release</dt><dd>{release.version}</dd></div>
              <div><dt>Live trading scope</dt><dd>Long U.S. equities and ETFs</dd></div>
              <div><dt>Options</dt><dd>Research only</dd></div>
              <div><dt>Profitability</dt><dd>Not established</dd></div>
            </dl>
            <Link to="/apps/rhen/evidence">View real evidence →</Link>
          </>}
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

