import PageIntro from "../components/PageIntro";

const experiments = [
  {
    id: "ANV–EXP–001",
    status: "RUNNING",
    title: "Small-capital autonomous trading",
    hypothesis: "A small account can be managed by a disciplined automated process whose performance is judged from a complete record rather than isolated wins.",
    method: "Live broker execution, rules-based entries and exits, telemetry, public sanitized equity history, and strategy versioning.",
    evidence: "Early live execution exists. The sample remains too small for durable conclusions.",
    next: "Increase sample quality, measure expectancy and drawdown, and change rules only from explicit hypotheses."
  },
  {
    id: "ANV–EXP–002",
    status: "ACTIVE",
    title: "Dynamic capital allocation",
    hypothesis: "Position sizing can respond to available capital and account constraints without turning every increase in equity into uncontrolled risk.",
    method: "Account-aware sizing, exposure ceilings, order limits, and strategy telemetry.",
    evidence: "Engineering implementation is ahead of statistical validation.",
    next: "Compare sizing behavior against realized volatility and completed trade outcomes."
  },
  {
    id: "ANV–EXP–003",
    status: "DESIGN",
    title: "Self-reviewing trading system",
    hypothesis: "Automated post-run analysis can identify measurable strategy weaknesses without allowing the live system to rewrite itself impulsively.",
    method: "Separate execution from analysis; produce suggested revisions as reviewed hypotheses rather than automatic live mutations.",
    evidence: "Architecture is being defined.",
    next: "Create a post-session analysis pipeline and explicit promotion gate."
  }
];

export default function Lab() {
  return (
    <>
      <PageIntro kicker="LAB" title="Test the idea.">
        <p>
          The Lab is for questions that can be made concrete. Each experiment gets an identifier,
          a hypothesis, a method, evidence, and a next action. A failed result is still a result.
        </p>
      </PageIntro>

      <section className="content-section experiment-list">
        {experiments.map((experiment, index) => (
          <article className="experiment-card" key={experiment.id}>
            <div className="experiment-card-head">
              <span>{experiment.id}</span>
              <b>{experiment.status}</b>
              <em>0{index + 1}</em>
            </div>
            <h2>{experiment.title}</h2>
            <div className="experiment-detail">
              <div><span>HYPOTHESIS</span><p>{experiment.hypothesis}</p></div>
              <div><span>METHOD</span><p>{experiment.method}</p></div>
              <div><span>EVIDENCE</span><p>{experiment.evidence}</p></div>
              <div><span>NEXT</span><p>{experiment.next}</p></div>
            </div>
          </article>
        ))}
      </section>

      <section className="lab-rule">
        <span>LAB RULE 01</span>
        <p>Do not confuse an interesting result with a proven system.</p>
      </section>
    </>
  );
}
