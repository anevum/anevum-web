import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { latestRhenRelease } from "../data/releases";
import "../styles/releases.css";

type RecordTab = "timeline" | "versions" | "evidence";

const tabs: [RecordTab, string, string][] = [
  ["timeline", "Timeline", "Research and report history"],
  ["versions", "Versions", "Sanitized live strategy history"],
  ["evidence", "Evidence", "What the public record contains"]
];

function dateLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function Record() {
  const [tab, setTab] = useState<RecordTab>("timeline");
  const { data, loading, error } = useLiveTrading(15000);
  const journal = data?.research?.journal || [];
  const versions = data?.strategy_history || [];
  const weekly = data?.research?.latest_weekly_summary;
  const terminal = data?.research?.completed_decisions || [];
  const next = data?.research?.next_direction;
  const latestRelease = latestRhenRelease();

  return (
    <section className="compact-page workspace-screen story-workspace record-story">
      <header className="workspace-heading story-heading">
        <div>
          <p className="compact-eyebrow">RHEN / PUBLIC RECORD</p>
          <h1>Record</h1>
          <p className="story-heading-copy">
            A sanitized history of system versions, canonical research decisions, report state, and evidence milestones. Capital, P&amp;L, symbols, fills, and trade history remain private.
          </p>
        </div>
        <div className="workspace-heading-status story-status">
          <div><small>ACTIVE</small><strong>{data?.active_strategy?.version_id || "UNRECORDED"}</strong></div>
          <div><small>WEEKLY</small><strong>{weekly?.completeness_state || "UNAVAILABLE"}</strong></div>
          <div><small>PUBLIC MODE</small><strong>SANITIZED</strong></div>
        </div>
      </header>

      <div className="workspace-layout story-layout">
        <aside className="workspace-tabs story-tabs" aria-label="Record sections">
          {tabs.map(([id, label, hint], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><small>{hint}</small></div>
            </button>
          ))}
        </aside>

        <div className="workspace-content story-content">
          <AnimatePresence mode="wait" initial={false}>
            {tab === "timeline" && (
              <motion.div className="workspace-view story-view" key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">CANONICAL PUBLIC TIMELINE</span><h2>What changed, without publishing the account.</h2></div>
                  <p>{error || (loading ? "Loading durable public history…" : "Newest canonical research/report milestones first.")}</p>
                </div>
                <div className="field-notes record-notes">
                  <div className="notes-line" aria-hidden="true" />
                  {journal.length ? journal.map((entry, index) => (
                    <article key={(entry.at || "") + (entry.type || "") + index}>
                      <div className="note-marker"><i /><span>{dateLabel(entry.at)}</span></div>
                      <div className="note-body">
                        <small>{String(journal.length - index).padStart(2, "0")}</small>
                        <strong>{entry.title || String(entry.type || "Record").replaceAll("_", " ")}</strong>
                        <p>{entry.summary || entry.focus || entry.next_action || "Canonical record updated."}</p>
                      </div>
                    </article>
                  )) : <div className="command-empty">No canonical public milestones are available.</div>}
                </div>
              </motion.div>
            )}

            {tab === "versions" && (
              <motion.div className="workspace-view story-view" key="versions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">LIVE STRATEGY HISTORY</span><h2>Version identity is public; execution logic is not.</h2></div>
                  <p>No thresholds, risk limits, sizing parameters, symbols, fills, or account values are included.</p>
                </div>
                <div className="record-version-list">
                  {versions.length ? versions.map((version) => (
                    <article key={version.version_id || version.activated_at}>
                      <time>{dateLabel(version.activated_at)}</time>
                      <div><span>{String(version.environment || "live").toUpperCase()}</span><strong>{version.version_id || "Unversioned"}</strong><p>{version.strategy_name || "Unnamed strategy"}</p></div>
                      <b>{String(version.status || "recorded").toUpperCase()}</b>
                    </article>
                  )) : <div className="command-empty">No sanitized strategy-version history is available.</div>}
                </div>
              </motion.div>
            )}

            {tab === "evidence" && (
              <motion.div className="workspace-view story-view" key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">PUBLIC EVIDENCE STANDARD</span><h2>The record shows state and decisions, not private capital.</h2></div>
                  <p>Account performance remains in Command and the canonical private ledger.</p>
                </div>
                <div className="rhen-state-grid">
                  <article><span>RESEARCH DECISIONS</span><strong>{terminal.length}</strong><p>Terminal research decisions are preserved, including rejected lanes.</p></article>
                  <article><span>NEXT DIRECTION</span><strong>{next?.status ? String(next.status).replaceAll("_", " ").toUpperCase() : "UNRECORDED"}</strong><p>{next?.subject || "No next research direction recorded."}</p></article>
                  <article><span>WEEKLY REPORT</span><strong>{weekly?.completeness_state || "UNAVAILABLE"}</strong><p>{weekly?.report_version || "No version"} · {weekly?.included_session_count ?? 0}/{weekly?.expected_session_count ?? 0} canonical daily sessions represented.</p></article>
                  <article><span>PRIVATE BY DESIGN</span><strong>CAPITAL + TRADES</strong><p>Equity, P&amp;L, positions, symbols, fills, orders, and trade history are not part of the public projection.</p></article>
                  <article className="record-release-card"><span>RELEASE PROGRAM</span><strong>{latestRelease.codename} / {latestRelease.version}</strong><p>{latestRelease.releaseClass}. Named releases preserve architecture, verification, limitations, and a downloadable archival packet.</p><Link to="/releases">OPEN RELEASE ARCHIVE ↗</Link></article>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
