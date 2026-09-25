import { motion } from "motion/react";
import EquityChart from "../components/EquityChart";
import Mark from "../components/Mark";
import { usePublicRecord } from "../hooks/usePublicRecord";
import { money, signedMoney } from "../lib/format";

function Reveal({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.35, once: true }}
      transition={{ duration: 0.7, delay, ease: [0.18, 0.75, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { data, loading, error } = usePublicRecord();
  const first = data.equity[0];
  const last = data.equity[data.equity.length - 1];
  const start = Number(first?.equity);
  const current = Number(last?.equity);
  const change = Number.isFinite(start) && Number.isFinite(current) ? current - start : null;
  const active =
    data.strategies.find((item) => item.environment === "live" && item.status === "active") ||
    data.strategies.find((item) => item.environment === "live") ||
    data.strategies[0];

  return (
    <>
      <section id="intro" className="deck-section intro-slide">
        <div className="slide-grid hero-slide-grid">
          <Reveal className="slide-copy">
            <p className="slide-kicker">DEVON AKINS / ANEVUM</p>
            <h1>This is what<br />I&apos;m working on.</h1>
            <p className="slide-lede">
              I tend to build things that sound stranger when I explain them out loud than they do
              when you can actually see the system, the work, and the evidence.
            </p>
            <p className="slide-note">So this site is the explanation.</p>
          </Reveal>

          <Reveal className="hero-object" delay={0.12}>
            <div className="hero-orbit orbit-a" />
            <div className="hero-orbit orbit-b" />
            <div className="hero-axis horizontal" />
            <div className="hero-axis vertical" />
            <Mark />
            <span className="signal s1" />
            <span className="signal s2" />
            <span className="signal s3" />
          </Reveal>
        </div>
        <div className="slide-index"><span>01</span><p>Start here</p></div>
      </section>

      <section id="now" className="deck-section now-slide">
        <div className="slide-grid">
          <Reveal className="slide-copy">
            <p className="slide-kicker">RIGHT NOW</p>
            <h2>I&apos;m building a small autonomous trading system.</h2>
            <p className="slide-lede">
              The experiment is simple to describe: start with very little capital, let software
              observe the market, make only rule-based decisions, record everything, then improve
              the system from what actually happened.
            </p>
          </Reveal>

          <Reveal className="now-card" delay={0.1}>
            <div className="now-card-head">
              <span className="live-pill"><i /> LIVE EXPERIMENT</span>
              <span>{active?.version_id || "CURRENT STRATEGY"}</span>
            </div>
            <div className="now-big-number">
              <span>CURRENT PUBLIC EQUITY</span>
              <strong>{loading ? "—" : money(current)}</strong>
              <small className={change && change > 0 ? "positive" : change && change < 0 ? "negative" : ""}>
                {change === null ? "waiting for record" : signedMoney(change) + " from public start"}
              </small>
            </div>
            <div className="now-card-foot">
              <span>{data.trades.length} closed trades recorded</span>
              <span>{error ? "record unavailable" : "public data connected"}</span>
            </div>
          </Reveal>
        </div>
        <div className="slide-index"><span>02</span><p>What I am doing</p></div>
      </section>

      <section id="system" className="deck-section system-slide">
        <Reveal className="system-heading">
          <p className="slide-kicker">THE SYSTEM</p>
          <h2>It is not “AI picks stocks.”</h2>
          <p>
            It is a loop I can inspect, measure, change, and eventually decide whether it deserves
            more capital.
          </p>
        </Reveal>

        <Reveal className="system-flow" delay={0.08}>
          {[
            ["01", "Observe", "Watch many symbols and market conditions."],
            ["02", "Qualify", "Reject anything that does not meet the strategy."],
            ["03", "Risk", "Decide how much exposure the account can tolerate."],
            ["04", "Execute", "Send the permitted order through the broker."],
            ["05", "Record", "Keep the decision, fill, P&L, and account state."],
            ["06", "Review", "Use the record to decide what actually needs changing."]
          ].map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </Reveal>

        <div className="slide-index"><span>03</span><p>How it works</p></div>
      </section>

      <section id="evidence" className="deck-section evidence-slide">
        <div className="evidence-layout">
          <Reveal className="evidence-copy">
            <p className="slide-kicker">EVIDENCE</p>
            <h2>I don&apos;t want the pitch. I want the record.</h2>
            <p>
              A tiny gain is not proof. A tiny loss is not failure. The useful part is building a
              clean enough record that the system can eventually be judged by something better than
              excitement.
            </p>
          </Reveal>

          <Reveal className="evidence-panel" delay={0.08}>
            <div className="evidence-chart">
              {loading ? <div className="chart-empty">Connecting to public record…</div> : <EquityChart rows={data.equity} />}
            </div>
            <div className="evidence-stats">
              <div><span>START</span><strong>{money(start)}</strong></div>
              <div><span>NOW</span><strong>{money(current)}</strong></div>
              <div><span>MOVE</span><strong className={change && change > 0 ? "positive" : change && change < 0 ? "negative" : ""}>{change === null ? "—" : signedMoney(change)}</strong></div>
              <div><span>TRADES</span><strong>{data.trades.length}</strong></div>
            </div>
          </Reveal>
        </div>

        <div className="evidence-caption">
          <span>LIVE PUBLIC RECORD</span>
          <p>{error || "Sanitized telemetry. No promise of future performance."}</p>
        </div>
        <div className="slide-index"><span>04</span><p>What has happened</p></div>
      </section>

      <section id="mind" className="deck-section mind-slide">
        <Reveal className="mind-heading">
          <p className="slide-kicker">ON MY MIND</p>
          <h2>The questions matter more than the branding.</h2>
        </Reveal>

        <div className="thoughts">
          {[
            ["01", "Can something useful grow from almost nothing?", "Not by pretending risk disappears, but by making every dollar force better engineering."],
            ["02", "How much autonomy should I actually give the system?", "Execution can be automated. Changing the rules should still require evidence and deliberate review."],
            ["03", "What would count as proof?", "Enough trades, enough time, visible drawdowns, realistic costs, and results that survive more than one good day."]
          ].map(([number, title, copy], index) => (
            <Reveal className="thought" delay={index * 0.06} key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </Reveal>
          ))}
        </div>

        <div className="slide-index"><span>05</span><p>What I am thinking about</p></div>
      </section>

      <section id="other" className="deck-section other-slide">
        <div className="other-layout">
          <Reveal className="other-copy">
            <p className="slide-kicker">OTHER PROJECTS</p>
            <h2>Not gone.<br />Just not now.</h2>
            <p>
              I make a lot of things. Keeping them here lets me stop pretending they all deserve
              attention at the same time.
            </p>
          </Reveal>

          <Reveal className="limbo-list" delay={0.08}>
            <details>
              <summary><span>01</span><div><strong>The Transcosmic</strong><small>FICTION / WORLDBUILDING / LIMBO</small></div><b>+</b></summary>
              <p>REPLY, the Transcosmic universe, Continuance, cosmology, and the publishing work around them are preserved. They are simply not the active project right now.</p>
            </details>
            <details>
              <summary><span>02</span><div><strong>Publishing experiments</strong><small>BOOKS / VISUAL HISTORY / LIMBO</small></div><b>+</b></summary>
              <p>Book concepts, premium history projects, special editions, and earlier publishing infrastructure remain part of the archive without defining ANEVUM.</p>
            </details>
            <details>
              <summary><span>03</span><div><strong>Whatever comes next</strong><small>OPEN SLOT</small></div><b>+</b></summary>
              <p>ANEVUM is deliberately broad enough to survive the next thing I become interested in without needing another identity reset.</p>
            </details>
          </Reveal>
        </div>

        <Reveal className="closing-line">
          <Mark />
          <p>If I sent you this link, this is what I meant.</p>
        </Reveal>

        <div className="slide-index"><span>06</span><p>Everything else</p></div>
      </section>
    </>
  );
}
