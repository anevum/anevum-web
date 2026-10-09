import { Link } from "react-router-dom";
import "../styles/commons-learning.css";

const stages = [
  {
    number: "01", name: "Define the rule", kicker: "Make it falsifiable",
    body: "A strategy is a set of decisions that can be tested. Name the market, timeframe, entry condition, exit condition, position size, and circumstances when the strategy must not trade.",
    example: "For each rule, ask: Could another person reproduce the same decision from the same data?"
  },
  {
    number: "02", name: "Test it honestly", kicker: "Protect the holdout",
    body: "Separate development, validation, and a final untouched holdout. Use historical, point-in-time market data and include spreads, trading fees, slippage and realistic orders. Record the number of independent trades and the time periods tested.",
    example: "If a rule only works after repeated tuning on the same data, it may be fitting noise rather than capturing an edge."
  },
  {
    number: "03", name: "Measure the downside", kicker: "Risk is part of the system",
    body: "Study drawdowns, average win and loss, concentration, turnover, time out of market, and behavior in adverse regimes. Do not compare outcomes without the cost of trading and the amount of risk taken.",
    example: "Trade expectancy = (win rate × average win) − (loss rate × average loss) − average trading cost."
  },
  {
    number: "04", name: "Document and challenge", kicker: "Make the evidence reusable",
    body: "Publish the original hypothesis, fixed rules, code/data version, sample window, full costs, what failed, and what would disprove the idea. Invite criticism of the method instead of optimizing for an impressive result.",
    example: "A useful negative result can save another researcher from repeating the same mistake."
  }
];

export default function Learning() {
  return (
    <div className="commons-learning studio-page">
      <header className="commons-learning-hero">
        <span className="commons-eyebrow">COMMONS / FREE LEARNING</span>
        <h1>Trading research starts with rules, not predictions.</h1>
        <p>Markets draw attention because of what people hope to earn. A more useful starting point is understanding how ideas are tested, why results fail, and how risk changes the outcome. These lessons are a research framework, not a trading signal service.</p>
        <div className="commons-learning-actions">
          <Link className="commons-action" to="/commons?template=ruleset">Start a rule-set review</Link>
          <Link to="/apps/rhen">Explore RHEN's member workspace</Link>
        </div>
        <p className="commons-learning-caption">Open to read. Commons contributions require a member account and beta invitation. No paid subscription is required to read this material.</p>
      </header>
      <section className="commons-learning-sequence" aria-label="Research method">
        <div className="commons-learning-section-heading">
          <span className="commons-eyebrow">THE METHOD</span>
          <h2>From an idea to evidence worth discussing.</h2>
          <p>Use this as a worksheet whenever you test a new rule set or assess someone else's results.</p>
        </div>
        <div className="commons-learning-stages">
          {stages.map(stage => <article className="commons-learning-stage" key={stage.number}>
            <span className="commons-learning-index">{stage.number}</span>
            <div><span className="commons-eyebrow">{stage.kicker}</span><h3>{stage.name}</h3>
              <p>{stage.body}</p><p className="commons-learning-example">{stage.example}</p></div>
          </article>)}
        </div>
      </section>
      <section className="commons-learning-checklist">
        <div>
          <span className="commons-eyebrow">BEFORE SHARING A RESULT</span>
          <h2>Five questions worth answering.</h2>
        </div>
        <ol>
          <li>What exact rule is being tested, and what observation would prove it wrong?</li>
          <li>Which trades and dates were actually included, and which were excluded?</li>
          <li>Was the result evaluated on data the researcher did not repeatedly tune against?</li>
          <li>Are market impact, commissions, spreads, slippage and bad fills accounted for?</li>
          <li>Would the expected improvement justify the real risk and operating cost?</li>
        </ol>
      </section>
      <section className="commons-learning-rhen">
        <div>
          <span className="commons-eyebrow">TOOLS / RHEN CLOUD</span>
          <h2>Research and live automation are different responsibilities.</h2>
          <p>RHEN is a research and trading software project. ANEVUM is building a separate member service with private brokerage accounts and independently bounded algorithms. The company-operated bot is not a shared member terminal. The member service is still under review, and connecting an account will not automatically enable trading.</p>
        </div>
        <div className="commons-learning-links">
          <Link to="/products/rhen">What RHEN does →</Link>
          <Link to="/products/rhen/evidence">Published evidence and limitations →</Link>
          <Link to="/apps/rhen/connect">Alpaca account authorization disclosure →</Link>
        </div>
      </section>
      <footer className="commons-learning-endnote">
        <p>Education does not remove market risk. These materials are general information, not individualized investment advice, promises of returns, or verified signals for another person's account. Only share public research in Commons; never share brokerage credentials or private account data.</p>
      </footer>
    </div>
  );
}
