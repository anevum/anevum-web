import { Link } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";

const stack = [
  ["PUBLIC SURFACE", "React · TypeScript · Vite", "ANEVUM.com, Command entry points, the public Live Terminal, Field Notes, founder profile, and public-safe evidence."],
  ["EDGE", "Cloudflare Workers · Access", "Production delivery, protected Command identity, API proxying, privacy boundaries, and response hardening."],
  ["RUNTIME", "RHEN · one Railway service", "The existing production service runs the RHEN supervisor and all internal modules in one container and on one persistent volume."],
  ["MODULES", "Execution · Control · Research · Replay · Forecast", "Functional boundaries remain explicit even though the deployment topology is consolidated."],
  ["CORE / STORE", "SQLite WAL · /data/rhen-core.db", "Bounded state and evidence storage with retention, compaction, WAL checkpointing, and one canonical Core writer."],
  ["BROKER", "Alpaca", "Only the execution boundary receives broker execution configuration. Research, replay, forecast, and control paths remain execution-disabled."],
  ["INTEGRATIONS", "Slack · GitHub · Railway", "Operational alerts, source control, CI, deployment, and service-level infrastructure."]
];

const modules = [
  ["EXECUTION", "Market observation, equities and crypto lanes, orders, fills, risk, reconciliation, session handling, and broker-derived evidence."],
  ["CONTROL", "Health, incidents, scheduling, orchestration, protected-action gates, and system supervision."],
  ["RESEARCH", "Strategy evaluation, crypto edge discovery, V15 research execution, and forward-shadow evidence."],
  ["REPLAY", "Deterministic historical replay and counterfactual simulation without broker-order authority."],
  ["FORECAST", "Regime, baseline, calibration, and forward-measurement workflows."],
  ["CORE / STORE", "Canonical APIs, scheduler state, research state, bounded evidence storage, retention, and compaction."],
  ["RESEARCH WORKER", "Evidence review and model-assisted research under the same protected promotion boundaries."],
  ["COMMAND / API", "Protected operator and customer routing into the same canonical RHEN state rather than a parallel platform."]
] as const;

export default function Architecture() {
  return (
    <div className="company-page architecture-page">
      <section className="company-page-hero architecture-hero">
        <span>RHEN V3 ARCHITECTURE</span>
        <h1>One runtime. Internal modules. Explicit authority isolation.</h1>
        <p>
          ANEVUM has consolidated its production topology around RHEN. The former subsystem brands now
          survive only as migration aliases for internal responsibilities. Deployment is simpler, but
          research, replay, control, storage, and broker execution still have separate authority boundaries.
        </p>
      </section>

      <section className="architecture-evidence-band" aria-label="RHEN runtime topology">
        <div className="architecture-evidence-flow">
          <article><span>01 / OBSERVE</span><strong>Market + runtime state</strong><p>RHEN ingests market state, runtime state, and broker-derived evidence into one canonical runtime.</p></article>
          <article><span>02 / RESEARCH</span><strong>Challenge the hypothesis</strong><p>Research, forecast, and replay modules test claims without receiving live order authority.</p></article>
          <article><span>03 / GATE</span><strong>Protect promotion</strong><p>Evidence can advance a candidate to review, but research code cannot silently grant live authority.</p></article>
          <article><span>04 / EXECUTE</span><strong>Broker authority stays narrow</strong><p>Only the execution boundary can submit broker actions within configured risk and reconciliation controls.</p></article>
        </div>
        <div className="architecture-evidence-legend">ONE RHEN SERVICE · LOOPBACK INTERNAL MODULES · EXECUTION AUTHORITY ISOLATED · SHADOW / PAPER / LIVE EVIDENCE REMAIN DISTINCT</div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>INTERNAL MODULES</span>
          <h2>Consolidation removes duplicate services, not functional boundaries.</h2>
        </header>
        <div className="architecture-role-grid">
          {modules.map(([name, role], index) => (
            <Link key={name} to="/live">
              <SystemIcon system="RHEN" size="sm" />
              <span>{String(index + 1).padStart(2, "0")} / RHEN MODULE</span>
              <strong>{name}</strong>
              <p>{role}</p>
              <i>INSPECT RHEN →</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>PRODUCTION STACK</span>
          <h2>The operational stack after the rebuild.</h2>
        </header>
        <div className="architecture-stack">
          {stack.map(([layer, tech, description], index) => (
            <article key={layer}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><small>{layer}</small><strong>{tech}</strong></div>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>STORAGE + SAFETY</span>
          <h2>The rebuild is also a data-discipline change.</h2>
        </header>
        <div className="authority-grid">
          <article><SystemIcon system="RHEN" size="sm" /><span>CORE</span><strong>Bounded SQLite instead of an operational PostgreSQL dependency.</strong><p>RHEN v3 targets normal storage below 500 MB and sheds routine analytics above the defined pressure threshold while preserving critical execution evidence.</p></article>
          <article><SystemIcon system="RHEN" size="sm" /><span>RETENTION</span><strong>Routine telemetry is compacted instead of warehoused forever.</strong><p>Decision summaries, normalized candidate observations, position metrics, and routine evidence use explicit retention windows.</p></article>
          <article><SystemIcon system="RHEN" size="sm" /><span>AUTHORITY</span><strong>One service does not mean one permission set.</strong><p>Research, replay, forecast, control, and pure Core subprocesses have execution disabled; broker order authority remains confined to execution.</p></article>
          <article><SystemIcon system="RHEN" size="sm" /><span>V15</span><strong>The BTC candidate remains frozen and unpromoted.</strong><p>V15-R1-BTC-R2H-BREAKOUT-42-15 remains shadow/paper only until fresh forward evidence and protected promotion requirements are satisfied.</p></article>
          <article><SystemIcon system="RHEN" size="sm" /><span>CUTOVER</span><strong>Legacy services are retired only after RHEN is verified healthy.</strong><p>The rebuild preserves rollback evidence and does not treat architectural simplification as permission to skip verification.</p></article>
        </div>
      </section>

      <section className="architecture-cta">
        <div><span>SEE RHEN OPERATE</span><h2>The public surface should match the runtime that actually exists.</h2></div>
        <div><Link to="/live">Live Terminal →</Link><Link to="/research">Field Notes →</Link><Link to="/command/overview">Command →</Link></div>
      </section>
    </div>
  );
}
