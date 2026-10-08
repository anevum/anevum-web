import { useState } from "react";
import { Link } from "react-router-dom";
import PublicEvidenceSnapshot from "../components/PublicEvidenceSnapshot";
import SystemIcon from "../components/company/SystemIcon";
import { currentRhenRelease } from "../data/releases";
import { useMemberAvailability } from "../member/useMemberAvailability";

const publicRecords = [
  {
    href: "/products/rhen/evidence",
    title: "Public evidence",
    detail: "Live public-safe observations, performance history, timestamps, and limitations."
  },
  {
    href: "/products/rhen/releases",
    title: "Release history",
    detail: "What changed between versions and which results are actually verified."
  },
  {
    href: "/products/rhen/architecture",
    title: "How RHEN works",
    detail: "An explanation of the system, its research pipeline, and its operational boundaries."
  },
  {
    href: "/field-notes",
    title: "Build notes",
    detail: "Experiments, mistakes, improvements, and the decisions behind the work."
  }
];

export default function RhenProduct() {
  const release = currentRhenRelease();
  const memberAvailability = useMemberAvailability();
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const profitabilityLimitation = release.limitations.find((item) => item.title.toLowerCase().includes("profitability"));

  return (
    <div className="studio-page truth-rhen-page workshop-rhen">
      <header className="workshop-rhen-intro">
        <Link className="workshop-rhen-back" to="/products">← All projects</Link>
        <div className="workshop-rhen-heading">
          <div className="workshop-rhen-mark"><SystemIcon system="RHEN" size="lg" /></div>
          <div>
            <p className="workshop-kicker">PRODUCT / RHEN</p>
            <h1>RHEN</h1>
            <p className="workshop-rhen-lead">
              RHEN is my first major software project. I started building it to investigate markets,
              test trading ideas, and learn whether a system can make useful decisions from real evidence.
            </p>
            <p className="workshop-rhen-lead-secondary">
              The software is operating with narrow trading authority, but a working system is not the same thing
              as a consistently profitable strategy.
            </p>
            <div className="workshop-rhen-actions">
              <Link className="workshop-rhen-primary" to="/products/rhen/evidence">Explore real evidence <span aria-hidden="true">→</span></Link>
              {memberAvailability === "available" ? (
                <Link to="/apps/rhen">Open RHEN workspace <span aria-hidden="true">→</span></Link>
              ) : null}
              <Link to="/products/rhen/releases">Release history</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="workshop-rhen-section" aria-labelledby="rhen-current-state">
        <div className="workshop-rhen-section-heading">
          <p className="workshop-section-eyebrow">Current work</p>
          <h2 id="rhen-current-state">What actually exists</h2>
        </div>
        <div className="workshop-rhen-overview">
          <div className="workshop-rhen-description">
            <p>RHEN gathers market observations, evaluates candidates, manages narrowly authorized execution,
              and preserves what happened so trading ideas can be compared against later outcomes.</p>
            <p>Research and replay help decide what might be worth testing next. Those results do not automatically
              change the live trading strategy or grant new trading permissions.</p>
          </div>
          <dl className="workshop-rhen-facts">
            <div><dt>Registered release</dt><dd>{release.version} · {release.codename}</dd></div>
            <div><dt>Long equity/ETF trading</dt><dd>Authorized scope</dd></div>
            <div><dt>Options</dt><dd>Research only</dd></div>
            <div><dt>Short equities / leverage expansion</dt><dd>Disabled</dd></div>
            <div><dt>Strategy promotion</dt><dd>Manual approval required</dd></div>
          </dl>
        </div>
      </section>

      <section className="workshop-rhen-section" aria-labelledby="rhen-public-work">
        <div className="workshop-rhen-section-heading">
          <p className="workshop-section-eyebrow">Explore RHEN</p>
          <h2 id="rhen-public-work">The work behind the application</h2>
          <p>Everything here comes from real published records or sanitized public data. It does not require an ANEVUM account.</p>
        </div>
        <div className="workshop-rhen-records">
          {publicRecords.map(({ href, title, detail }) => (
            <Link to={href} key={href}>
              <strong>{title}</strong><span>{detail}</span><b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="workshop-rhen-section workshop-rhen-evidence" aria-labelledby="rhen-measurements">
        <div className="workshop-rhen-section-heading">
          <p className="workshop-section-eyebrow">Measurements</p>
          <h2 id="rhen-measurements">See the evidence, not just the claims</h2>
          <p>This is the public, privacy-safe observation feed. It may be stale or unavailable, and missing measurements remain missing.</p>
        </div>
        <details onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}>
          <summary>View current public evidence <span aria-hidden="true">+</span></summary>
          {evidenceOpen ? <PublicEvidenceSnapshot compact /> : null}
        </details>
      </section>

      <section className="workshop-rhen-section workshop-rhen-limits" aria-labelledby="rhen-limitations">
        <div className="workshop-rhen-section-heading">
          <p className="workshop-section-eyebrow">What this doesn't prove</p>
          <h2 id="rhen-limitations">A working program is only the beginning.</h2>
          <p>{profitabilityLimitation?.body || "Profitability remains a research question. Early observations and a running bot do not establish a repeatable economic edge."}</p>
          <p>RHEN's personal account features and any future brokerage connections for other users will require their own security, isolation, and validation work. ANEVUM membership alone grants no trading authority.</p>
        </div>
      </section>
    </div>
  );
}
