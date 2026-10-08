import { Link } from "react-router-dom";
import { currentRhenRelease } from "../data/releases";

const capabilities = [
  ["MARKET OBSERVATION", "Discover candidates and preserve the state that existed when a decision was made."],
  ["EXECUTION", "Operate a deliberately narrow live broker-write path for long U.S. equities and ETFs."],
  ["RESEARCH", "Turn weak outcomes and new hypotheses into bounded experiments rather than silent live changes."],
  ["REPLAY", "Reconstruct and stress ideas without allowing simulated evidence to become live performance."],
  ["FORECASTING", "Measure regimes and forward outcomes without putting a model directly in the broker order path."],
  ["CONTROL", "Keep health, incidents, configuration drift, authority, and release gates explicit."],
] as const;

export default function RhenProduct() {
  const release = currentRhenRelease();

  return (
    <div className="studio-page rhen-product-page">
      <section className="rhen-product-hero">
        <div>
          <span>PRODUCT 01 / RHEN</span>
          <h1>Can a trading system actually earn the right to trust itself?</h1>
          <p>
            RHEN is ANEVUM&apos;s flagship R&amp;D project: a live automated trading and research system built to test market ideas,
            measure what really happened, and make improvement decisions from evidence instead of confidence.
          </p>
          <div className="studio-actions">
            <Link className="studio-button primary" to="/live">View public evidence <span>→</span></Link>
            <Link className="studio-button" to="/releases">Release history</Link>
          </div>
        </div>
        <aside className="rhen-release-card">
          <span>CURRENT</span><strong>RHEN {release.version}</strong><b>{release.codename}</b>
          <p>{release.headline}</p>
          <dl>
            <div><dt>LIVE</dt><dd>LONG EQUITIES + ETFs</dd></div>
            <div><dt>OPTIONS</dt><dd>RESEARCH ONLY</dd></div>
            <div><dt>SHORTS</dt><dd>DISABLED</dd></div>
            <div><dt>PROMOTION</dt><dd>MANUAL</dd></div>
          </dl>
        </aside>
      </section>

      <section className="studio-statement compact">
        <span>WHAT IT IS</span>
        <div><h2>A working research machine, not a claim of solved markets.</h2><p>RHEN trades real money while the system measures execution, candidate quality, forward outcomes, replay results, and operating failures. The live path stays narrow while research is allowed to be much more exploratory.</p></div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>CAPABILITIES</span><div><h2>One product, several internal responsibilities.</h2><p>IREN, GRAEN, VELUM, and NOSTRA remain useful names inside RHEN. They are architecture, not separate companies.</p></div></header>
        <div className="rhen-capability-grid">
          {capabilities.map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="studio-section rhen-links-section">
        <header className="studio-section-heading"><span>INSPECT IT</span><div><h2>The technical record still exists. It just lives under the product now.</h2></div></header>
        <div className="rhen-link-grid">
          <Link to="/live"><span>LIVE</span><strong>Public evidence</strong><p>Sanitized runtime and performance evidence.</p><b>OPEN ↗</b></Link>
          <Link to="/architecture"><span>SYSTEM</span><strong>Architecture</strong><p>Execution, research, replay, forecast, control, and data boundaries.</p><b>OPEN ↗</b></Link>
          <Link to="/releases"><span>VERSIONS</span><strong>Releases</strong><p>What changed, what was verified, and what remains unresolved.</p><b>OPEN ↗</b></Link>
          <Link to="/research"><span>JOURNAL</span><strong>Field Notes</strong><p>Research decisions, failures, repairs, and build notes.</p><b>OPEN ↗</b></Link>
        </div>
      </section>
    </div>
  );
}
