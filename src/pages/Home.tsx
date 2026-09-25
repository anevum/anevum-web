import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "react-router-dom";
import EquityChart from "../components/EquityChart";
import Mark from "../components/Mark";
import { usePublicRecord } from "../hooks/usePublicRecord";
import { money, signedMoney } from "../lib/format";

type ViewId = "home" | "current" | "proof" | "ideas" | "other";

function viewFromHash(hash: string): ViewId {
  const value = hash.replace("#", "").toLowerCase();
  return ["current", "proof", "ideas", "other"].includes(value)
    ? (value as ViewId)
    : "home";
}

const transition = {
  duration: 0.34,
  ease: [0.2, 0.75, 0.25, 1] as [number, number, number, number]
};

function Scene({
  id,
  active,
  children
}: {
  id: ViewId;
  active: ViewId;
  children: React.ReactNode;
}) {
  if (id !== active) return null;

  return (
    <motion.section
      key={id}
      className={"portal-view portal-view-" + id}
      initial={{ opacity: 0, scale: 0.985, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.01, y: -8 }}
      transition={transition}
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  const location = useLocation();
  const activeView = viewFromHash(location.hash);
  const { data, loading, error } = usePublicRecord();

  const first = data.equity[0];
  const last = data.equity[data.equity.length - 1];
  const start = Number(first?.equity);
  const current = Number(last?.equity);
  const change = Number.isFinite(start) && Number.isFinite(current) ? current - start : null;
  const strategy =
    data.strategies.find((item) => item.environment === "live" && item.status === "active") ||
    data.strategies.find((item) => item.environment === "live") ||
    data.strategies[0];

  return (
    <AnimatePresence mode="wait">
      <Scene id="home" active={activeView}>
        <div className="home-copy">
          <p className="portal-kicker">DEVON AKINS / PERSONAL PROJECT</p>
          <h1>Here&apos;s what<br />I&apos;m doing.</h1>
          <p>
            ANEVUM is the easiest way to show people what I&apos;m building without turning it into
            a long explanation.
          </p>
        </div>

        <div className="home-visual" aria-hidden="true">
          <div className="visual-ring ring-a" />
          <div className="visual-ring ring-b" />
          <div className="visual-ring ring-c" />
          <div className="visual-axis axis-x" />
          <div className="visual-axis axis-y" />
          <Mark />
          <span className="visual-dot dot-a" />
          <span className="visual-dot dot-b" />
          <span className="visual-dot dot-c" />
          <div className="visual-label label-a">BUILD</div>
          <div className="visual-label label-b">TEST</div>
          <div className="visual-label label-c">PROVE</div>
        </div>

        <div className="home-mini">
          <span>NOW</span>
          <strong>Autonomous capital system</strong>
        </div>
      </Scene>

      <Scene id="current" active={activeView}>
        <div className="current-title">
          <p className="portal-kicker">CURRENT PROJECT</p>
          <h2>Small capital.<br />Autonomous system.</h2>
          <p>Observe. Qualify. Risk. Execute. Record. Review.</p>
        </div>

        <div className="system-visual">
          <div className="system-core">
            <span>PUBLIC EQUITY</span>
            <strong>{loading ? "—" : money(current)}</strong>
            <small className={change && change > 0 ? "positive" : change && change < 0 ? "negative" : ""}>
              {change === null ? "collecting data" : signedMoney(change)}
            </small>
          </div>

          {[
            ["observe", "OBSERVE"],
            ["qualify", "QUALIFY"],
            ["risk", "RISK"],
            ["execute", "EXECUTE"],
            ["record", "RECORD"],
            ["review", "REVIEW"]
          ].map(([key, label], index) => (
            <div className={"system-node node-" + (index + 1)} key={key}>
              <i />
              <span>{label}</span>
            </div>
          ))}

          <div className="system-orbit orbit-outer" />
          <div className="system-orbit orbit-inner" />
        </div>

        <div className="current-meta">
          <div><span>STATE</span><strong>LIVE</strong></div>
          <div><span>TRADES</span><strong>{data.trades.length}</strong></div>
          <div><span>STRATEGY</span><strong>{strategy?.version_id || strategy?.strategy_name || "CURRENT"}</strong></div>
        </div>
      </Scene>

      <Scene id="proof" active={activeView}>
        <div className="proof-head">
          <div>
            <p className="portal-kicker">PROOF</p>
            <h2>The record,<br />not the pitch.</h2>
          </div>
          <div className="proof-callout">
            <span>EARLY DATA</span>
            <p>A gain is not proof. A loss is not failure. The sample is the experiment.</p>
          </div>
        </div>

        <div className="proof-chart">
          {loading ? <div className="chart-empty">Connecting to public record…</div> : <EquityChart rows={data.equity} />}
        </div>

        <div className="proof-stats">
          <div><span>START</span><strong>{money(start)}</strong></div>
          <div><span>NOW</span><strong>{money(current)}</strong></div>
          <div><span>MOVE</span><strong className={change && change > 0 ? "positive" : change && change < 0 ? "negative" : ""}>{change === null ? "—" : signedMoney(change)}</strong></div>
          <div><span>CLOSED</span><strong>{data.trades.length}</strong></div>
        </div>

        <div className="proof-foot">{error || "Sanitized live telemetry. No promise of future performance."}</div>
      </Scene>

      <Scene id="ideas" active={activeView}>
        <div className="ideas-title">
          <p className="portal-kicker">ON MY MIND</p>
          <h2>Questions I&apos;m<br />actually testing.</h2>
        </div>

        <div className="idea-orbit" aria-hidden="true">
          <div className="idea-center"><Mark /></div>
          <div className="idea-line line-1" />
          <div className="idea-line line-2" />
          <div className="idea-line line-3" />
        </div>

        <div className="idea-cards">
          <article className="idea-card idea-1">
            <span>01</span>
            <strong>Can useful capital grow from almost nothing?</strong>
          </article>
          <article className="idea-card idea-2">
            <span>02</span>
            <strong>How much autonomy should the system get?</strong>
          </article>
          <article className="idea-card idea-3">
            <span>03</span>
            <strong>What would actually count as proof?</strong>
          </article>
        </div>
      </Scene>

      <Scene id="other" active={activeView}>
        <div className="other-title">
          <p className="portal-kicker">OTHER PROJECTS</p>
          <h2>In limbo,<br />not deleted.</h2>
        </div>

        <div className="other-grid">
          <article>
            <span>01</span>
            <div className="other-symbol transcosmic-symbol"><i /><i /><i /></div>
            <h3>The Transcosmic</h3>
            <p>Fiction, REPLY, worldbuilding.</p>
            <b>LIMBO</b>
          </article>
          <article>
            <span>02</span>
            <div className="other-symbol book-symbol"><i /><i /></div>
            <h3>Publishing</h3>
            <p>Books, editions, visual history.</p>
            <b>LIMBO</b>
          </article>
          <article>
            <span>03</span>
            <div className="other-symbol open-symbol"><i /></div>
            <h3>Next thing</h3>
            <p>Whatever becomes worth building.</p>
            <b>OPEN</b>
          </article>
        </div>

        <div className="other-note">
          <Mark />
          <span>If I sent you this link, this is what I meant.</span>
        </div>
      </Scene>
    </AnimatePresence>
  );
}
