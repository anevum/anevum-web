import type { CommandSnapshot } from "../lib/data";
import type { IrenSnapshot } from "../lib/runtime-topology";
import { displayState } from "../lib/system-display";
import CommandResearchLab from "./CommandResearchLab";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function count(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function stateClass(value: string) {
  const state = value.toUpperCase();
  if (state.includes("REVIEW") || state.includes("GATED")) return "review";
  if (state.includes("ACTIVE") || state.includes("AUTOMATED") || state.includes("LIVE")) return "active";
  if (state.includes("ERROR") || state.includes("DEGRADED")) return "bad";
  return "idle";
}

export default function CommandDiscoveryDeck({
  snapshot,
  control,
  now
}: {
  snapshot: CommandSnapshot | null;
  control: IrenSnapshot | null;
  now: number;
}) {
  const universe = snapshot?.universe;
  const scanner = record(snapshot?.scanner);
  const researchControl = control?.research?.control;
  const mode = text(researchControl?.mode, "IDLE");
  const eligible = count(universe?.eligible_count);
  const candidates = count(universe?.candidate_count);
  const active = count(universe?.active_count);
  const observed = Object.keys(scanner).length;
  const maxFunnel = Math.max(eligible, candidates, active, observed, 1);
  const extended = snapshot?.extended_equity;
  const crypto = snapshot?.crypto_live;

  const funnel = [
    ["ELIGIBLE", eligible, "Tradable + fractionable equities RHEN can consider"],
    ["CANDIDATE", candidates, "Daily liquidity / movement shortlist"],
    ["ACTIVE", active, "Current rotating intraday watch set"],
    ["OBSERVED", observed, "Symbols in the latest completed strategy cycle"]
  ] as const;

  return (
    <div className="command-v4-discover">
      <section className={"command-v4-decision tone-" + stateClass(mode)}>
        <div>
          <span>RESEARCH CONTROL</span>
          <strong>{displayState(mode)}</strong>
          <p>{researchControl?.reason || "No bounded research program is currently requesting work."}</p>
        </div>
        <dl>
          <div><dt>STAGE</dt><dd>{displayState(researchControl?.stage)}</dd></div>
          <div><dt>REJECTED</dt><dd>{researchControl?.rejected_generations ?? 0}</dd></div>
          <div><dt>NEXT</dt><dd>{displayState(researchControl?.next_action)}</dd></div>
          <div><dt>WORK PASS</dt><dd>{researchControl?.work_credit_recommended ? "RECOMMENDED" : "NOT REQUIRED"}</dd></div>
        </dl>
      </section>

      <div className="command-v4-two">
        <article className="command-v4-card">
          <header><div><span>MARKET DISCOVERY</span><strong>Equity universe funnel</strong></div><small>{text(universe?.source, "unavailable")}</small></header>
          <div className="command-v4-funnel">
            {funnel.map(([label, value, detail]) => (
              <div key={label}>
                <div><span>{label}</span><strong>{value.toLocaleString()}</strong><small>{detail}</small></div>
                <i><b style={{ width: Math.max(2, value / maxFunnel * 100) + "%" }} /></i>
              </div>
            ))}
          </div>
          {universe?.error ? <p className="command-v4-warning">{universe.error}</p> : null}
        </article>

        <article className="command-v4-card">
          <header><div><span>MARKET SURFACES</span><strong>What RHEN actually covers</strong></div><small>No cosmetic lanes</small></header>
          <div className="command-v4-surface-list">
            <div><b>EQUITIES</b><strong>LIVE</strong><p>{active || observed} active symbols · rotating universe</p></div>
            <div><b>EXTENDED 24/5</b><strong>{extended?.execution_authorized ? "LIVE" : extended?.enabled ? "OBSERVING" : "OFF"}</strong><p>{text(extended?.session?.session, "closed").replaceAll("_", " ")} · {count(extended?.universe?.active_count)} symbols</p></div>
            <div><b>CRYPTO</b><strong>{crypto?.execution_authorized ? "LIVE" : crypto?.execution_enabled ? "GATED" : "OBSERVING"}</strong><p>{text(crypto?.strategy_version_id, "No active strategy identity")}</p></div>
            <div><b>OPTIONS</b><strong>NOT WIRED</strong><p>No RHEN options execution path is represented as active.</p></div>
            <div><b>SHORT EQUITIES</b><strong>NOT WIRED</strong><p>No short-selling authority is represented as active.</p></div>
          </div>
        </article>
      </div>

      <CommandResearchLab snapshot={control} now={now} />
    </div>
  );
}
