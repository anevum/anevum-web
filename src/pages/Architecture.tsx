import { Link } from "react-router-dom";
import RhenModuleGlyph, { type RhenModuleGlyphName } from "../components/company/RhenModuleGlyph";

const stack = [
  ["PUBLIC SURFACE", "React · TypeScript · Vite", "ANEVUM.com, Command entry points, the public Live Terminal, Field Notes, founder profile, and public-safe evidence."],
  ["EDGE", "Cloudflare Workers · Access", "Production delivery, protected Command identity, API proxying, privacy boundaries, and response hardening."],
  ["RUNTIME", "RHEN · canonical Railway service", "The canonical production service runs the RHEN supervisor, execution boundary, Core/Store, and named internal modules on one persistent volume."],
  ["MODULES", "Execution · Control · Research · Replay · Forecast", "Functional boundaries remain explicit even though the deployment topology is consolidated."],
  ["CORE / STORE", "SQLite WAL · /data/rhen-core.db", "Bounded state and evidence storage with retention, compaction, WAL checkpointing, and one canonical Core writer."],
  ["BROKER", "Alpaca", "Only RHEN execution receives live broker execution configuration. Research, replay, forecast, control, Core/Store, and the paper-only candidate path cannot self-promote into live authority."],
  ["INTEGRATIONS", "Slack · GitHub · Railway", "Operational alerts, source control, CI, deployment, and service-level infrastructure."]
];

const modules: ReadonlyArray<readonly [string, RhenModuleGlyphName, string]> = [
  ["EXECUTION", "EXECUTION", "Market observation, regular and extended equity sessions, orders, fills, risk, reconciliation, session handling, and broker-derived evidence."],
  ["CONTROL", "CONTROL", "Health, incidents, scheduling, orchestration, protected-action gates, and system supervision."],
  ["RESEARCH", "RESEARCH", "GRAEN bounded strategy discovery, chronological development/validation/holdout evidence, falsification, and protected promotion state."],
  ["REPLAY", "REPLAY", "VELUM independent historical replay, friction stress, execution-delay stress, and counterfactual verification without live broker authority."],
  ["FORECAST", "FORECAST", "NOSTRA regime, baseline, calibration, forward-measurement, and prediction-state workflows."],
  ["CORE / STORE", "CORE", "Canonical APIs, scheduler state, research state, bounded evidence storage, retention, and compaction."],
  ["RESEARCH WORKER", "WORKER", "Deterministic evidence review plus deliberate model-assisted Work handoffs under protected promotion boundaries."],
  ["COMMAND / API", "COMMAND", "Protected operator and customer routing into the same canonical RHEN state rather than a parallel platform."]
];

export default function Architecture() {
  return (
    <div className="company-page architecture-page">
      <section className="company-page-hero architecture-hero">
        <span>RHEN V4.3 ARCHITECTURE</span>
        <h1>One runtime. Internal modules. Explicit authority isolation.</h1>
        <p>
          ANEVUM has consolidated its production topology around RHEN. IREN, GRAEN, VELUM, and NOSTRA remain
          named internal modules with distinct control, research, replay, and forecasting responsibilities.
          Live broker authority remains confined to RHEN execution and the current long U.S. equities / ETF scope;
          research, replay, forecasting, and control cannot grant themselves broker-write authority.
        </p>
      </section>

      <section className="architecture-evidence-band" aria-label="RHEN runtime topology">
        <div className="architecture-evidence-flow">
          <article><span>01 / OBSERVE</span><strong>Market + runtime state</strong><p>RHEN ingests market state, runtime state, and broker-derived evidence into one canonical runtime.</p></article>
          <article><span>02 / RESEARCH</span><strong>Challenge the hypothesis</strong><p>Research, forecast, and replay modules test claims without receiving live order authority.</p></article>
          <article><span>03 / GATE</span><strong>Protect promotion</strong><p>Evidence can advance a candidate to review, but research code cannot silently grant live authority.</p></article>
          <article><span>04 / EXECUTE</span><strong>Broker authority stays narrow</strong><p>Only the execution boundary can submit broker actions within configured risk and reconciliation controls.</p></article>
        </div>
        <div className="architecture-evidence-legend">ONE CANONICAL RHEN RUNTIME · NAMED INTERNAL MODULES · EQUITY-ONLY BROKER AUTHORITY · RESEARCH / LIVE AUTHORITY REMAIN DISTINCT</div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>INTERNAL MODULES</span>
          <h2>Consolidation removes duplicate services, not functional boundaries.</h2>
        </header>
        <div className="architecture-role-grid">
          {modules.map(([name, glyph, role], index) => (
            <Link key={name} to="/live">
              <RhenModuleGlyph module={glyph} decorative />
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
          <article><RhenModuleGlyph module="CORE" decorative /><span>CORE</span><strong>Bounded SQLite instead of an operational PostgreSQL dependency.</strong><p>RHEN V4.3 measures effective live SQLite usage, reuses reclaimable pages, compacts bounded history, and sheds routine analytics only under defined storage pressure while preserving critical execution evidence.</p></article>
          <article><RhenModuleGlyph module="CORE" decorative /><span>RETENTION</span><strong>Routine telemetry is compacted instead of warehoused forever.</strong><p>Decision summaries, normalized candidate observations, position metrics, and routine evidence use explicit retention windows.</p></article>
          <article><RhenModuleGlyph module="CONTROL" decorative /><span>AUTHORITY</span><strong>One runtime does not mean one permission set.</strong><p>Research, replay, forecast, control, and pure Core subprocesses have execution disabled; broker order authority remains confined to execution.</p></article>
          <article><RhenModuleGlyph module="RESEARCH" decorative /><span>STRATEGY</span><strong>Runtime authority and research candidates stay separate.</strong><p>Command reads current equity authority from RHEN while GRAEN candidates, VELUM verification, exact forward-outcome readiness, shadow economics/allocation evidence, and IREN release state remain explicit. Automated research can reach review, never live authority.</p></article>
          <article><RhenModuleGlyph module="CONTROL" decorative /><span>CUTOVER</span><strong>Retired services remain historical after RHEN is verified healthy.</strong><p>The canonical runtime preserves rollback evidence, filters retired asset-class research from active projections, and does not treat architectural simplification as permission to skip verification.</p></article>
        </div>
      </section>

      <section className="architecture-cta">
        <div><span>SEE RHEN OPERATE</span><h2>The public surface should match the runtime that actually exists.</h2></div>
        <div><Link to="/live">Live Terminal →</Link><Link to="/research">Field Notes →</Link><Link to="/command/overview">Command →</Link></div>
      </section>
    </div>
  );
}
