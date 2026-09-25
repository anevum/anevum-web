import EquityChart from "../components/EquityChart";
import PageIntro from "../components/PageIntro";
import { usePublicRecord } from "../hooks/usePublicRecord";
import { dateTime, money, percent, signedMoney } from "../lib/format";

export default function Record() {
  const { data, loading, error } = usePublicRecord();
  const first = data.equity[0];
  const last = data.equity[data.equity.length - 1];
  const start = Number(first?.equity);
  const current = Number(last?.equity);
  const move = Number.isFinite(start) && Number.isFinite(current) ? current - start : null;
  const maxDrawdown = data.equity.reduce(
    (maximum, row) => Math.max(maximum, Number(row.drawdown_pct) || 0),
    0
  );
  const wins = data.trades.filter((trade) => Number(trade.net_pnl ?? trade.realized_pnl) > 0).length;
  const losses = data.trades.filter((trade) => Number(trade.net_pnl ?? trade.realized_pnl) < 0).length;

  return (
    <>
      <PageIntro
        kicker="RECORD"
        title="What actually happened."
        aside={<span className="record-status"><i /> {loading ? "CONNECTING" : error ? "DATA ERROR" : "PUBLIC LEDGER"}</span>}
      >
        <p>
          ANEVUM separates claims from evidence. This page is generated from sanitized trading
          telemetry and is designed to keep losses, revisions, and incomplete experiments visible
          alongside anything that works.
        </p>
      </PageIntro>

      <section className="content-section record-metrics">
        <article><span>STARTING RECORD</span><strong>{money(start)}</strong><small>{dateTime(first?.observed_at)}</small></article>
        <article><span>CURRENT EQUITY</span><strong>{money(current)}</strong><small className={move && move > 0 ? "positive" : move && move < 0 ? "negative" : ""}>{move === null ? "—" : signedMoney(move)}</small></article>
        <article><span>MAX DRAWDOWN</span><strong>{percent(maxDrawdown)}</strong><small>Observed public record</small></article>
        <article><span>CLOSED TRADES</span><strong>{data.trades.length}</strong><small>{wins} wins / {losses} losses</small></article>
      </section>

      <section className="content-section">
        <div className="record-chart-card">
          <div className="record-card-head">
            <div><span>EQUITY PATH</span><strong>{data.equity.length} public snapshots</strong></div>
            <small>{error || "Sanitized canonical record"}</small>
          </div>
          {loading ? <div className="chart-empty tall">Loading public equity history…</div> : <EquityChart rows={data.equity} />}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading compact">
          <div><p className="kicker">STRATEGY LEDGER</p><h2>Every version needs a reason.</h2></div>
          <p>Strategy changes remain attributable to a version and a stated hypothesis.</p>
        </div>
        <div className="ledger">
          {data.strategies.length ? data.strategies.map((strategy) => (
            <article className="ledger-row strategy-row" key={strategy.version_id || strategy.created_at}>
              <time>{dateTime(strategy.activated_at || strategy.created_at)}</time>
              <div><span>{String(strategy.environment || "research").toUpperCase()}</span><strong>{strategy.version_id || strategy.strategy_name || "Unnamed version"}</strong></div>
              <p>{strategy.hypothesis || "No public hypothesis recorded."}</p>
              <b>{String(strategy.status || "recorded").replaceAll("_", " ").toUpperCase()}</b>
            </article>
          )) : <div className="empty-ledger">No strategy versions have been published yet.</div>}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading compact">
          <div><p className="kicker">CLOSED TRADES</p><h2>Wins and losses use the same table.</h2></div>
          <p>Only canonical closed trades are shown here.</p>
        </div>
        <div className="trade-table">
          <div className="trade-head"><span>CLOSED</span><span>SYMBOL</span><span>SIDE</span><span>ENTRY → EXIT</span><span>NET P&L</span><span>EXIT</span></div>
          {data.trades.length ? data.trades.map((trade) => {
            const pnl = Number(trade.net_pnl ?? trade.realized_pnl);
            return (
              <article className="trade-row" key={trade.public_id || String(trade.closed_at) + trade.symbol}>
                <time>{dateTime(trade.closed_at)}</time>
                <strong>{trade.symbol || "—"}</strong>
                <span>{String(trade.side || "—").toUpperCase()}</span>
                <span>{money(trade.avg_entry_price)} → {money(trade.avg_exit_price)}</span>
                <b className={pnl > 0 ? "positive" : pnl < 0 ? "negative" : ""}>{signedMoney(pnl)}</b>
                <span>{trade.exit_reason || "—"}</span>
              </article>
            );
          }) : <div className="empty-ledger">No canonical closed trades yet.</div>}
        </div>
      </section>

      <section className="evidence-standard">
        <span>EVIDENCE STANDARD</span>
        <div>
          <p><b>01</b>A meaningful sample matters more than one green session.</p>
          <p><b>02</b>Positive expectancy must survive realistic execution and costs.</p>
          <p><b>03</b>Drawdown belongs in the record, not outside the story.</p>
          <p><b>04</b>Scaling comes after evidence, not before it.</p>
        </div>
      </section>
    </>
  );
}
