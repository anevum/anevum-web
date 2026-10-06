import type { IrenSnapshot, StrategyAuthorityProjection } from "../lib/runtime-topology";
import { ageText, displayState } from "../lib/system-display";
import SystemIcon from "./company/SystemIcon";
import { btcDiscoveryView } from "../lib/btc-discovery";

function authorityLabel(row: StrategyAuthorityProjection) {
  return row.strategy_name || row.strategy_version_id || "Unidentified strategy";
}

function executionLabel(row: StrategyAuthorityProjection) {
  if (row.status === "DISABLED") return "Disabled";
  if (row.manual_approval_required && row.signals_enabled) {
    return "Signals live · manual approval";
  }
  if (row.entries_enabled && row.broker_writes_allowed !== false) {
    return "Entries enabled";
  }
  if (row.signals_enabled) return "Signals enabled";
  if (row.execution_authorized && row.broker_writes_allowed !== false) {
    return "Broker execution authorized";
  }
  if (row.execution_enabled) return "Execution configured";
  return "Observing";
}

export default function CommandStrategyPipeline({
  snapshot,
  now
}: {
  snapshot: IrenSnapshot | null;
  now: number;
}) {
  const pipeline = snapshot?.strategy_pipeline;
  const active = pipeline?.active || [];
  const candidate = pipeline?.candidate;
  const validation = pipeline?.validation;
  const release = pipeline?.release_gate;
  const available = pipeline?.available !== false && Boolean(pipeline);
  const discovery = pipeline?.btc_discovery;
  const btc = btcDiscoveryView(discovery);

  const candidateLabel = candidate?.title || candidate?.candidate_id || "No replacement candidate";
  const candidateState = candidate
    ? [candidate.lane, candidate.stage || candidate.status].filter(Boolean).map(value => displayState(value)).join(" · ")
    : "No superseding research";
  const validationState = validation?.status || (candidate ? "WAITING" : "NO_CANDIDATE");
  const releaseState = release?.status || (available ? "NO_CANDIDATE" : "UNAVAILABLE");

  return (
    <article className={"command-panel command-strategy-pipeline" + (available ? "" : " is-unavailable")}>
      <header>
        <div>
          <span>STRATEGY LIFECYCLE</span>
          <strong>Authority → research → validation → release gate</strong>
        </div>
        <small>{pipeline?.schema_version || "strategy_pipeline unavailable"}</small>
      </header>

      <div className="command-strategy-flow" aria-label="Strategy research and promotion pipeline">
        <section>
          <SystemIcon system="RHEN" size="sm" />
          <span>01 · ACTIVE AUTHORITY</span>
          <div className="command-strategy-authorities">
            {active.length ? active.map((row, index) => (
              <div key={(row.lane || "lane") + "-" + index}>
                <strong>{String(row.lane || "lane").toUpperCase()} · {authorityLabel(row)}</strong>
                <p>{displayState(row.status)} · {executionLabel(row)}</p>
                <small>
                  {row.strategy_version_id || "No version ID"} · {row.trading_mode || "mode unknown"}
                  {row.broker_writes_allowed === false ? " · broker writes off" : ""}
                </small>
              </div>
            )) : <p>No canonical strategy authority exposed.</p>}
          </div>
        </section>
        <i aria-hidden="true">→</i>

        <section>
          <SystemIcon system="GRAEN" size="sm" />
          <span>02 · RESEARCH</span>
          <strong>{candidateLabel}</strong>
          <p>{candidateState}</p>
          <small>
            {candidate
              ? [
                  candidate.supersedes_strategy_version_id
                    ? "supersedes " + candidate.supersedes_strategy_version_id
                    : "no supersession target",
                  candidate.updated_at ? ageText(candidate.updated_at, now) : null
                ].filter(Boolean).join(" · ")
              : "No active candidate"}
          </small>
        </section>
        <i aria-hidden="true">→</i>

        <section>
          <SystemIcon system="VELUM" size="sm" />
          <span>03 · VALIDATE</span>
          <strong>{displayState(validationState)}</strong>
          <p>
            {validation
              ? [
                  validation.candidate_id || validation.strategy_version_id,
                  validation.event_type ? displayState(validation.event_type) : null
                ].filter(Boolean).join(" · ")
              : "Validation evidence required before promotion"}
          </p>
          <small>{validation?.observed_at ? ageText(validation.observed_at, now) : "No matching VELUM evidence"}</small>
        </section>
        <i aria-hidden="true">→</i>

        <section>
          <SystemIcon system="IREN" size="sm" />
          <span>04 · RELEASE GATE</span>
          <strong>{displayState(releaseState)}</strong>
          <p>{release?.reason || (available ? "No strategy change is awaiting release." : "Canonical pipeline projection is unavailable.")}</p>
          <small>
            {release?.target_lane
              ? String(release.target_lane).toUpperCase() + " · " + (release.target_strategy_version_id || "no active target")
              : "Protected authority boundary"}
            {" · auto promotion off"}
          </small>
        </section>
      </div>
      {discovery && <section className="command-btc-discovery" aria-label="Canonical GRAEN BTC discovery">
        <header><div><span>GRAEN → VELUM → PAPER → IREN</span>
          <strong>{btc.candidateId}</strong></div>
          <small>{btc.activity} · {displayState(btc.stage)}</small></header>
        <p>{displayState(btc.promotion)} · {discovery.search_completed ?? 0}/{discovery.search_bound ?? 0} bounded candidates evaluated
          {discovery.updated_at ? " · " + ageText(discovery.updated_at, now) : ""}</p>
        <p>Live BTC: RHEN-BTC-DIRECT-003 · signal only · automatic live promotion off</p>
        {discovery.candidate?.fingerprint && <small>Candidate fingerprint · {discovery.candidate.fingerprint}</small>}
        {btc.metricsStage && <><p>{displayState(btc.metricsStage)} · net metrics after per-side fees, spread and slippage</p>
          <div className="command-btc-stress"><table><thead><tr>
            <th>Scenario / delay</th><th>Fee / spread / slip bps</th><th>Trades / days</th><th>Net expectancy</th><th>Profit factor</th><th>Drawdown</th>
          </tr></thead><tbody>{btc.scenarios.map(([key, row]) => <tr key={key}>
            <td>{key}</td><td>{row.costs.fee_bps} / {row.costs.spread_bps} / {row.costs.slippage_bps}</td>
            <td>{row.metrics.trade_count} / {row.metrics.independent_days}</td>
            <td>{(row.metrics.net_expectancy * 100).toFixed(3)}%</td><td>{row.metrics.profit_factor.toFixed(2)}</td>
            <td>{(row.metrics.max_drawdown * 100).toFixed(2)}%</td>
          </tr>)}</tbody></table></div></>}
        <p>VELUM · {displayState(btc.verification)}</p>
        <p>Paper assignment · {discovery.paper_candidate_id || "No eligible assignment"}</p>
        {btc.paper && <p>{displayState(btc.paper.status)} · {btc.paper.metrics?.trade_count ?? 0} trades · {btc.paper.metrics?.independent_days ?? 0} days
          · {(btc.paper.elapsed_days ?? 0).toFixed(1)} elapsed days · {btc.paper.fresh === true ? "fresh" : "awaiting fresh evidence"}</p>}
        {btc.rejections.length > 0 && <details open><summary>Rejection reasons ({btc.rejections.length})</summary>
          <ul>{btc.rejections.map(reason => <li key={reason}>{reason}</li>)}</ul></details>}
        {discovery.last_error && <p role="status">{discovery.last_error}</p>}
        <small>{discovery.methodology_version} · paper success can only become ELIGIBLE_FOR_REVIEW</small>
      </section>}
    </article>
  );
}
