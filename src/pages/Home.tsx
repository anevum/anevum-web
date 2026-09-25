import { motion } from "motion/react";
import { Link } from "react-router-dom";
import EquityChart from "../components/EquityChart";
import Mark from "../components/Mark";
import ProjectRow from "../components/ProjectRow";
import { usePublicRecord } from "../hooks/usePublicRecord";
import { money, signedMoney } from "../lib/format";

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
      <section className="home-hero">
        <div className="hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.2, 0.75, 0.25, 1] }}
          >
            <p className="kicker">DEVON AKINS / WORKING ARCHIVE</p>
            <h1>Build.<br />Test.<br /><span>Keep the record.</span></h1>
            <p className="hero-deck">
              ANEVUM is where I keep the things I am actually building: systems, experiments,
              software, markets, writing, research, and the evidence left behind.
            </p>
            <div className="hero-actions">
              <Link className="primary-link" to="/work">Explore the work <span>↗</span></Link>
              <Link className="text-link" to="/record">Open the record <span>→</span></Link>
            </div>
          </motion.div>

          <motion.div
            className="hero-instrument"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.12 }}
            aria-hidden="true"
          >
            <div className="instrument-orbit orbit-one" />
            <div className="instrument-orbit orbit-two" />
            <div className="instrument-axis axis-x" />
            <div className="instrument-axis axis-y" />
            <Mark className="instrument-mark" />
            <span className="instrument-point p1" />
            <span className="instrument-point p2" />
            <span className="instrument-point p3" />
            <div className="instrument-label top">ANV / 2026</div>
            <div className="instrument-label bottom">SYSTEMS IN MOTION</div>
          </motion.div>
        </div>
        <div className="hero-baseline">
          <span>Independent work</span>
          <span>Built in public</span>
          <span>Updated as the work changes</span>
        </div>
      </section>

      <section className="section current-section">
        <div className="section-heading">
          <div>
            <p className="kicker">CURRENTLY</p>
            <h2>The active build.</h2>
          </div>
          <p>
            ANEVUM is not permanently defined by one project. This is simply the work receiving
            the most attention now.
          </p>
        </div>

        <article className="current-project">
          <div className="current-project-top">
            <div>
              <span className="status-live"><i /> ACTIVE / LIVE CAPITAL</span>
              <h3>Automated Capital System</h3>
              <p>
                An autonomous trading system being developed around market observation,
                qualification, risk controls, execution, telemetry, and continuous review.
              </p>
            </div>
            <Link to="/work" className="round-link" aria-label="Open Automated Capital System">↗</Link>
          </div>

          <div className="current-telemetry">
            <div className="telemetry-chart">
              {loading ? <div className="chart-empty">Connecting to public record…</div> : <EquityChart rows={data.equity} compact />}
            </div>
            <div className="telemetry-stats">
              <div>
                <span>CURRENT EQUITY</span>
                <strong>{money(current)}</strong>
              </div>
              <div>
                <span>PUBLIC MOVE</span>
                <strong className={change && change > 0 ? "positive" : change && change < 0 ? "negative" : ""}>
                  {change === null ? "—" : signedMoney(change)}
                </strong>
              </div>
              <div>
                <span>CLOSED TRADES</span>
                <strong>{data.trades.length || "—"}</strong>
              </div>
              <div>
                <span>STRATEGY</span>
                <strong className="small-stat">
                  {active?.strategy_name || active?.version_id || "—"}
                </strong>
              </div>
            </div>
          </div>

          <div className="current-project-foot">
            <span>{error || "Public telemetry is a sanitized record, not a promise of future performance."}</span>
            <Link to="/record">View evidence <span>→</span></Link>
          </div>
        </article>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="kicker">WORK</p>
            <h2>A workshop, not a résumé.</h2>
          </div>
          <p>
            Projects remain visible by state: active work stays prominent; older directions move
            into the archive instead of disappearing.
          </p>
        </div>

        <div className="project-list">
          <ProjectRow
            index="01"
            status="ACTIVE"
            title="Automated Capital System"
            description="Algorithmic market observation, execution, telemetry, risk, and capital-scaling research."
            meta={["SOFTWARE", "MARKETS", "AUTOMATION"]}
            to="/work"
          />
          <ProjectRow
            index="02"
            status="ACTIVE"
            title="ANEVUM"
            description="The infrastructure and public record that connects projects, identity, experiments, and operations."
            meta={["WEB", "SYSTEMS", "ARCHIVE"]}
            to="/wiki"
          />
          <ProjectRow
            index="03"
            status="ARCHIVED"
            title="The Transcosmic"
            description="Fiction, REPLY, cosmology, publishing development, and the earlier ANEVUM creative era."
            meta={["WRITING", "WORLDBUILDING", "PUBLISHING"]}
            to="/wiki/archive/transcosmic"
          />
        </div>
        <Link className="section-end-link" to="/work">View all work <span>↗</span></Link>
      </section>

      <section className="section split-section">
        <div className="split-title">
          <p className="kicker">LAB</p>
          <h2>Ideas earn their place through testing.</h2>
          <Link className="text-link" to="/lab">Enter the lab <span>→</span></Link>
        </div>
        <div className="experiment-preview">
          <div className="experiment-id">ANV–EXP–001</div>
          <span className="status-live"><i /> RUNNING</span>
          <h3>Small-capital autonomous trading</h3>
          <p>
            Can a rules-based automated system create a repeatable process for growing a very
            small account without pretending early results are proof?
          </p>
          <div className="experiment-fields">
            <span><b>METHOD</b> Live execution + public ledger</span>
            <span><b>STATE</b> Evidence collection</span>
            <span><b>RULE</b> Failures remain visible</span>
          </div>
        </div>
      </section>

      <section className="section record-preview">
        <div className="section-heading">
          <div>
            <p className="kicker">RECORD</p>
            <h2>Output over intention.</h2>
          </div>
          <p>
            The record is a chronological trail of releases, experiments, revisions, results,
            and failures. It is what remains after the planning is over.
          </p>
        </div>
        <div className="record-lines">
          <article><time>25 SEP 2026</time><div><strong>React rebuild opened</strong><p>ANEVUM moves toward a permanent personal-work architecture.</p></div><span>WEB</span></article>
          <article><time>24 SEP 2026</time><div><strong>Live capital system connected</strong><p>Broker execution, telemetry, and private Command were joined into one operating loop.</p></div><span>SYSTEM</span></article>
          <article><time>24 SEP 2026</time><div><strong>First live test recorded</strong><p>The automated strategy began producing real execution evidence.</p></div><span>LAB</span></article>
        </div>
        <Link className="section-end-link" to="/record">Open the full record <span>↗</span></Link>
      </section>

      <section className="closing-statement">
        <Mark />
        <p>ANEVUM changes when the work changes.</p>
        <span>The archive remains.</span>
      </section>
    </>
  );
}
