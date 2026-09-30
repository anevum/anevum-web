import { Link } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import type { SystemName } from "../components/company/SystemMark";

const studies = [
  {
    id: "01",
    status: "ACTIVE RESEARCH",
    title: "Can an equity strategy survive translation to crypto?",
    problem: "A strategy can share mathematical structure across markets while still fail because the data-generating process, session structure, liquidity, cost model, and volatility regime changed.",
    chain: ["GRAEN", "NOSTRA", "VELUM", "RHEN"] as SystemName[],
    result: "No equity result is treated as crypto validation. The infrastructure is shared; the evidence gate is not.",
    href: "/research/multi-market-architecture-equities-crypto"
  },
  {
    id: "02",
    status: "PRODUCTION ENGINEERING",
    title: "Building a time-ordered prediction evidence chain",
    problem: "Research becomes hindsight if the system cannot prove what it believed before an event and attach outcomes afterward without altering that original state.",
    chain: ["RHEN", "NOSTRA", "GRAEN"] as SystemName[],
    result: "The production evidence model is being hardened around immutable pre-event state plus later forward outcomes.",
    href: "/research/prediction-outcome-evidence-chain"
  },
  {
    id: "03",
    status: "SYSTEM DESIGN",
    title: "How live execution and replay coexist without contaminating each other",
    problem: "Historical simulation is useful only if it remains visibly different from live broker-derived evidence.",
    chain: ["VELUM", "GRAEN", "RHEN"] as SystemName[],
    result: "VELUM is broker-isolated and replay results remain research evidence only. Live records remain live records.",
    href: "/research/velum-replay-layer"
  }
];

export default function CaseStudies() {
  return (
    <div className="company-page case-studies-page">
      <section className="company-page-hero case-study-hero">
        <span>CASE STUDIES</span>
        <h1>Systems demonstrated through real engineering and research problems.</h1>
        <p>These are not customer-success stories or polished retrospective marketing. They document how ANEVUM systems interact when a concrete problem has to be researched, built, falsified, repaired, or operated.</p>
      </section>

      <section className="case-study-list">
        {studies.map((study) => (
          <article key={study.id} className="case-study-card">
            <header>
              <span>{study.id}</span>
              <b>{study.status}</b>
            </header>
            <div className="case-study-main">
              <h2>{study.title}</h2>
              <p>{study.problem}</p>
            </div>
            <div className="case-study-chain" aria-label="Systems involved">
              {study.chain.map((system, index) => (
                <span key={system}>
                  <SystemIcon system={system} size="xs" />
                  <strong>{system}</strong>
                  {index < study.chain.length - 1 ? <i>→</i> : null}
                </span>
              ))}
            </div>
            <footer>
              <p>{study.result}</p>
              <Link to={study.href}>Read field note →</Link>
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
}
