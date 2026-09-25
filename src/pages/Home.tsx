import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import EquityChart from "../components/EquityChart";
import Mark from "../components/Mark";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { clockTime, money, percent, signedMoney } from "../lib/format";
import type { LiveScannerEvent } from "../lib/data";

type ViewId = "home" | "current" | "proof" | "ideas" | "other";

function viewFromHash(hash: string): ViewId {
  const value = hash.replace("#", "").toLowerCase();
  return ["current", "proof", "ideas", "other"].includes(value)
    ? (value as ViewId)
    : "home";
}

const transition = {
  duration: 0.34,
  ease: [0.2, 0.75, 0.25, 1] as [number, number, number, number]
};

function Scene({
  id,
  active,
  children
}: {
  id: ViewId;
  active: ViewId;
  children: ReactNode;
}) {
  if (id !== active) return null;

  return (
    <motion.section
      key={id}
      className={"portal-view portal-view-" + id}
      initial={{ opacity: 0, scale: 0.985, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.01, y: -8 }}
      transition={transition}
    >
      {children}
    </motion.section>
  );
}

function number(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function metric(value: number | null, digits = 2) {
  return value == null ? "—" : value.toFixed(digits);
}

function ageLabel(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "unknown age";
  if (value < 60) return Math.round(value) + "s ago";
  return Math.floor(value / 60) + "m " + Math.round(value % 60) + "s ago";
}

function eventLabel(event: LiveScannerEvent) {
  const symbol = event.symbol || "SYSTEM";
  const action = String(event.action || event.type || "event").toUpperCase();
  return symbol + " / " + action;
}

export default function Home() {
  const location = useLocation();
  const activeView = viewFromHash(location.hash);
  const { data, loading, error } = useLiveTrading(5000);

  const account = data?.account;
  const equityRows = data?.equity || [];
  const first = equityRows[0];
  const sessionStart = number(first?.equity);
  const current = number(account?.equity);
  const lastEquity = number(account?.last_equity);
  const sessionMove =
    sessionStart != null && current != null ? current - sessionStart : null;
  const dayMove =
    lastEquity != null && current != null ? current - lastEquity : null;
  const scannerCandidates = data?.scanner?.candidates || [];
  const scannerFallback = (data?.events || [])
    .filter((event) => event.type === "scan")
    .slice(0, 8);
  const scannerRows =
    scannerCandidates.length > 0 ? scannerCandidates.slice(0, 8) : scannerFallback;
  const positions = data?.positions || [];
  const recentClosed = data?.recent_closed_positions || [];
  const events = data?.events || [];
  const strategyVersion =
    scannerRows.find((row) => row.strategy_version)?.strategy_version ||
    events.find((row) => row.strategy_version)?.strategy_version ||
    "—";
  const freshness = data?.freshness_seconds;
  const feedState = loading ? "CONNECTING" : data?.live ? "LIVE" : "STALE";
  const liveClass = data?.live ? "is-live" : data ? "is-stale" : "";
  const latestEvent = events[0];
  const topReasons = data?.scanner?.top_hold_reasons || [];

  return (
    <AnimatePresence mode="wait">
      <Scene id="home" active={activeView}>
        <div className="home-copy">
          <p className="portal-kicker">DEVON AKINS / PERSONAL PROJECT</p>
          <h1>Here&apos;s what<br />I&apos;m doing.</h1>
          <p>
            A live window into the systems I am actually building, testing, and running.
          </p>
        </div>

        <div className="home-live-card">
          <header>
            <span className={"feed-state " + liveClass}><i /> {feedState}</span>
            <time>{data ? ageLabel(freshness) : "waiting for canonical log"}</time>
          </header>
          <div className="home-live-equity">
            <span>ACCOUNT EQUITY</span>
            <strong>{loading ? "—" : money(current)}</strong>
            <small className={dayMove != null && dayMove > 0 ? "positive" : dayMove != null && dayMove < 0 ? "negative" : ""}>
              {dayMove == null ? "—" : signedMoney(dayMove) + " vs prior close"}
            </small>
          </div>
          <div className="home-live-grid">
            <div><span>OPEN</span><strong>{account?.open_positions ?? positions.length}</strong></div>
            <div><span>EXPOSURE</span><strong>{money(account?.gross_exposure)}</strong></div>
            <div><span>LAST SCAN</span><strong>{clockTime(data?.scanner?.at)}</strong></div>
            <div><span>EVENT</span><strong>{latestEvent ? eventLabel(latestEvent) : "—"}</strong></div>
          </div>
        </div>

        <div className="home-mini">
          <span>CANONICAL LOG</span>
          <strong>{error || "Refreshes every 5 seconds"}</strong>
        </div>
      </Scene>

      <Scene id="current" active={activeView}>
        <div className="live-dashboard">
          <header className="live-dashboard-head">
            <div>
              <p className="portal-kicker">CURRENT / CANONICAL TELEMETRY</p>
              <h2>Live system.</h2>
            </div>
            <div className="live-head-state">
              <span className={"feed-state " + liveClass}><i /> {feedState}</span>
              <time>{ageLabel(freshness)}</time>
              <small>{strategyVersion}</small>
            </div>
          </header>

          <div className="live-metrics">
            <article>
              <span>EQUITY</span>
              <strong>{money(current)}</strong>
              <small className={dayMove != null && dayMove > 0 ? "positive" : dayMove != null && dayMove < 0 ? "negative" : ""}>
                {dayMove == null ? "—" : signedMoney(dayMove) + " day"}
              </small>
            </article>
            <article>
              <span>CASH</span>
              <strong>{money(account?.cash)}</strong>
              <small>BP {money(account?.buying_power)}</small>
            </article>
            <article>
              <span>EXPOSURE</span>
              <strong>{money(account?.gross_exposure)}</strong>
              <small>{account?.open_positions ?? positions.length} open</small>
            </article>
            <article>
              <span>DRAWDOWN</span>
              <strong>{percent(account?.drawdown_pct)}</strong>
              <small>snapshot {clockTime(account?.observed_at)}</small>
            </article>
          </div>

          <div className="live-grid">
            <section className="live-panel live-scanner">
              <header>
                <div><span>SCANNER CHANGES</span><strong>{clockTime(data?.scanner?.at)}</strong></div>
                <small>{scannerRows.length} recent symbols</small>
              </header>
              <div className="live-table-head">
                <span>SYMBOL</span><span>PRICE</span><span>QUALITY</span><span>DECISION</span>
              </div>
              <div className="live-table-body">
                {scannerRows.length ? scannerRows.slice(0, 7).map((row, index) => (
                  <div className="live-scan-row" key={(row.symbol || "row") + String(row.at) + index}>
                    <strong>{row.symbol || "—"}</strong>
                    <span>{row.price == null ? "—" : money(row.price)}</span>
                    <span>{row.quality_score == null ? "—" : metric(row.quality_score, 1)}</span>
                    <p title={row.reason || ""}>{row.reason || String(row.action || "—")}</p>
                  </div>
                )) : <div className="live-empty">{loading ? "Connecting to scanner log…" : "No recent scanner changes."}</div>}
              </div>
            </section>

            <section className="live-panel live-positions">
              <header>
                <div><span>OPEN POSITIONS</span><strong>{positions.length}</strong></div>
                <small>canonical ledger</small>
              </header>
              <div className="position-live-body">
                {positions.length ? positions.slice(0, 5).map((position) => {
                  const pnl = number(position.estimated_unrealized_pnl);
                  return (
                    <div className="position-live-row" key={position.symbol}>
                      <div><strong>{position.symbol}</strong><span>{String(position.side || "").toUpperCase()}</span></div>
                      <div><span>ENTRY</span><strong>{money(position.avg_entry_price)}</strong></div>
                      <div><span>MARK</span><strong>{money(position.current_price)}</strong></div>
                      <b className={pnl != null && pnl > 0 ? "positive" : pnl != null && pnl < 0 ? "negative" : ""}>{pnl == null ? "—" : signedMoney(pnl)}</b>
                    </div>
                  );
                }) : <div className="live-empty">No open positions in the canonical ledger.</div>}
              </div>
            </section>

            <section className="live-panel live-reasons">
              <header>
                <div><span>WHY IT SAID NO</span><strong>latest changes</strong></div>
                <small>actual scan reasons</small>
              </header>
              <div className="reason-live-body">
                {topReasons.length ? topReasons.slice(0, 5).map((item) => (
                  <div className="reason-live-row" key={item.reason}>
                    <strong>{item.count}</strong><p>{item.reason}</p>
                  </div>
                )) : <div className="live-empty">No rejection summary in the latest change set.</div>}
              </div>
            </section>

            <section className="live-panel live-events">
              <header>
                <div><span>RECENT LOG</span><strong>canonical events</strong></div>
                <small>newest first</small>
              </header>
              <div className="event-live-body">
                {events.length ? events.slice(0, 6).map((event, index) => (
                  <div className="event-live-row" key={(event.symbol || "event") + String(event.at) + index}>
                    <time>{clockTime(event.at)}</time>
                    <strong>{event.symbol || String(event.type || "SYSTEM").toUpperCase()}</strong>
                    <p>{event.reason || String(event.action || event.type || "recorded")}</p>
                  </div>
                )) : <div className="live-empty">{error || "Waiting for event log."}</div>}
              </div>
            </section>
          </div>
        </div>
      </Scene>

      <Scene id="proof" active={activeView}>
        <div className="proof-head">
          <div>
            <p className="portal-kicker">PROOF / ACCOUNT SNAPSHOTS</p>
            <h2>Actual equity.<br />Actual time.</h2>
          </div>
          <div className="proof-callout">
            <span>{feedState} / {ageLabel(freshness)}</span>
            <p>Each point is a persisted account snapshot from the canonical trading ledger.</p>
          </div>
        </div>

        <div className="proof-chart">
          {loading ? <div className="chart-empty">Connecting to canonical snapshots…</div> : <EquityChart rows={equityRows} />}
        </div>

        <div className="proof-stats">
          <div><span>SESSION START</span><strong>{money(sessionStart)}</strong></div>
          <div><span>NOW</span><strong>{money(current)}</strong></div>
          <div><span>SESSION MOVE</span><strong className={sessionMove != null && sessionMove > 0 ? "positive" : sessionMove != null && sessionMove < 0 ? "negative" : ""}>{sessionMove == null ? "—" : signedMoney(sessionMove)}</strong></div>
          <div><span>RECENT CLOSES</span><strong>{recentClosed.length}</strong></div>
        </div>

        <div className="proof-close-tape">
          {recentClosed.slice(0, 4).map((position) => {
            const pnl = number(position.net_pnl ?? position.realized_pnl);
            return (
              <div key={(position.symbol || "") + String(position.closed_at)}>
                <time>{clockTime(position.closed_at)}</time>
                <strong>{position.symbol || "—"}</strong>
                <span>{money(position.avg_entry_price)} → {money(position.avg_exit_price)}</span>
                <b className={pnl != null && pnl > 0 ? "positive" : pnl != null && pnl < 0 ? "negative" : ""}>{pnl == null ? "—" : signedMoney(pnl)}</b>
              </div>
            );
          })}
        </div>

        <div className="proof-foot">{error || "Source: canonical trading log · automatic 5-second refresh"}</div>
      </Scene>

      <Scene id="ideas" active={activeView}>
        <div className="ideas-title">
          <p className="portal-kicker">ON MY MIND</p>
          <h2>Questions I&apos;m<br />actually testing.</h2>
        </div>

        <div className="idea-orbit" aria-hidden="true">
          <div className="idea-center"><Mark /></div>
          <div className="idea-line line-1" />
          <div className="idea-line line-2" />
          <div className="idea-line line-3" />
        </div>

        <div className="idea-cards">
          <article className="idea-card idea-1">
            <span>01</span>
            <strong>Can useful capital grow from almost nothing?</strong>
          </article>
          <article className="idea-card idea-2">
            <span>02</span>
            <strong>How much autonomy should the system get?</strong>
          </article>
          <article className="idea-card idea-3">
            <span>03</span>
            <strong>What would actually count as proof?</strong>
          </article>
        </div>
      </Scene>

      <Scene id="other" active={activeView}>
        <div className="other-title">
          <p className="portal-kicker">OTHER PROJECTS</p>
          <h2>In limbo,<br />not deleted.</h2>
        </div>

        <div className="other-grid">
          <article>
            <span>01</span>
            <div className="other-symbol transcosmic-symbol"><i /><i /><i /></div>
            <h3>The Transcosmic</h3>
            <p>Fiction, REPLY, worldbuilding.</p>
            <b>LIMBO</b>
          </article>
          <article>
            <span>02</span>
            <div className="other-symbol book-symbol"><i /><i /></div>
            <h3>Publishing</h3>
            <p>Books, editions, visual history.</p>
            <b>LIMBO</b>
          </article>
          <article>
            <span>03</span>
            <div className="other-symbol open-symbol"><i /></div>
            <h3>Next thing</h3>
            <p>Whatever becomes worth building.</p>
            <b>OPEN</b>
          </article>
        </div>

        <div className="other-note">
          <Mark />
          <span>If I sent you this link, this is what I meant.</span>
        </div>
      </Scene>
    </AnimatePresence>
  );
}
