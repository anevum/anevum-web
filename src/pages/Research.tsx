import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLiveTrading } from "../hooks/useLiveTrading";

type ResearchTab = "now" | "method" | "hunt" | "notes" | "toolbox";

const tabs: [ResearchTab, string, string][] = [
  ["now", "Right now", "Where the work is"],
  ["method", "The method", "How ideas survive"],
  ["hunt", "Edge hunt", "What is being tested"],
  ["notes", "Field notes", "What changed"],
  ["toolbox", "Toolbox", "What we use"]
];

const gates = [
  ["01", "Capture", "Keep the raw market, scanner, execution, and broker records. Do not clean away inconvenient outcomes."],
  ["02", "Audit", "Check bar counts, represented trading days, first and last timestamps, pagination, missing sessions, and coverage."],
  ["03", "Reconcile", "Make the internal ledger agree with broker truth before using the dataset to judge a strategy."],
  ["04", "Enrich", "Add identity tags, context, and MFE/MAE so winners and losers can be compared structurally."],
  ["05", "Replay", "Run historical sessions through the same intended logic and look for parity failures."],
  ["06", "Challenge", "Test independent strategy families instead of repeatedly tuning one favorite idea."],
  ["07", "Validate", "Use chronological development, validation, friction, and untouched holdout periods."],
  ["08", "Decide", "Promote a robust survivor or reject the family and preserve that rejection as useful evidence."]
];

const fallbackLogs = [
  ["SEP 26", "Corpus integrity", "Built a dedicated diagnostic for every development window and symbol: bar count, trading days, first/last timestamp, pagination completion, missing sessions, and coverage ratio."],
  ["SEP 25", "Edge Discovery v1", "Expanded the historical corpus and changed the goal from tuning one strategy to eliminating whole entry families."],
  ["SEP 25", "Data quality first", "Reconciliation, identity validation, tagging, MFE/MAE, pagination completeness, and replay parity moved ahead of scaling."],
  ["SEP 25", "Strategy 004", "Candidate filters stayed offline after they failed to demonstrate robust positive expectancy."],
  ["SEP 25", "Scaling lock", "More simultaneous exposure remained blocked until the entry logic could survive reproducible validation."],
  ["SEP 24", "Live baseline", "Established Alpaca execution, continuous scanning, telemetry, and the private operator surface."]
];

function journalDate(value?: string | null) {
  if (!value) return "NOW";
  const stamp = new Date(value);
  if (Number.isNaN(stamp.getTime())) return "NOW";
  return stamp.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
}

const toolsList = [
  ["Alpaca", "MARKET + BROKER", "https://www.google.com/s2/favicons?domain=alpaca.markets&sz=64", "Provides live execution, broker truth, and the market data used by live and historical systems."],
  ["Railway", "RUNTIME", "https://www.google.com/s2/favicons?domain=railway.com&sz=64", "Keeps RHEN running independently of the public website and hosts isolated research jobs."],
  ["Supabase", "RECORD", "https://www.google.com/s2/favicons?domain=supabase.com&sz=64", "Stores canonical application/trading records and the sanitized telemetry that can be exposed publicly."],
  ["Cloudflare", "EDGE", "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=64", "Serves anevum.com, handles Worker APIs and security, and protects private operator surfaces."],
  ["GitHub", "SOURCE", "https://www.google.com/s2/favicons?domain=github.com&sz=64", "Preserves the code and implementation history so every meaningful system change is traceable."],
  ["GitHub Actions", "VERIFY", "https://www.google.com/s2/favicons?domain=github.com&sz=64", "Checks builds and deployment assumptions before changes are allowed to become production code."],
  ["React + TypeScript", "INTERFACE", "https://www.google.com/s2/favicons?domain=react.dev&sz=64", "Powers the public explanation and the private operator application."],
  ["OpenAI / ChatGPT", "RESEARCH + ENGINEERING", "https://www.google.com/s2/favicons?domain=openai.com&sz=64", "Used for offline analysis, research, implementation, and documentation—not as a required live trading decision call."]
];

export default function Research() {
  const [tab, setTab] = useState<ResearchTab>("now");
  const { data } = useLiveTrading(10000);
  const researchState = data?.research;
  const latestDaily = researchState?.latest_daily;
  const currentFocus = researchState?.current_focus || "Finish the corpus audit, then let elimination happen.";
  const currentStatus = researchState?.current_status || "INVESTIGATE";
  const currentSummary = latestDaily?.summary ||
    "The current entry families still have to demonstrate reproducible positive expectancy before RHEN is allowed to scale.";
  const journalLogs = (researchState?.journal || []).slice(0, 8).map((entry) => [
    journalDate(entry.at),
    entry.title || String(entry.type || "Research checkpoint").replaceAll("_", " "),
    entry.summary || entry.focus || entry.next_action || "Research checkpoint recorded."
  ]);
  const logs = journalLogs.length ? journalLogs : fallbackLogs;

  return (
    <section className="compact-page workspace-screen story-workspace research-story">
      <header className="workspace-heading story-heading">
        <div>
          <p className="compact-eyebrow">RHEN / RESEARCH</p>
          <h1>The lab</h1>
          <p className="story-heading-copy">
            This is where RHEN is allowed to be wrong. Ideas are broken here before they are trusted with more capital.
          </p>
        </div>
        <div className="workspace-heading-status story-status">
          <div><small>PROGRAM</small><strong>EDGE DISCOVERY V1</strong></div>
          <div><small>BOTTLENECK</small><strong>ENTRY EDGE</strong></div>
          <div><small>SCALING</small><strong>LOCKED</strong></div>
        </div>
      </header>

      <div className="workspace-layout story-layout">
        <aside className="workspace-tabs story-tabs research-tabs" aria-label="Research sections">
          {tabs.map(([id, label, hint], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><small>{hint}</small></div>
            </button>
          ))}
        </aside>

        <div className="workspace-content story-content">
          <AnimatePresence mode="wait" initial={false}>
            {tab === "now" && (
              <motion.div
                className="workspace-view story-view"
                key="now"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="research-now-layout">
                  <section className="research-question">
                    <span className="story-kicker">CURRENT RESEARCH FOCUS</span>
                    <h2>{currentFocus}</h2>
                    <p>{currentSummary}</p>
                    <div className="question-line">
                      <span>IF YES</span><strong>Promote carefully → measure live → scale only after evidence persists.</strong>
                    </div>
                    <div className="question-line is-no">
                      <span>IF NO</span><strong>Kill the family → keep the evidence → design from new premises.</strong>
                    </div>
                  </section>

                  <div className="research-now-side">
                    <article className="now-card is-known">
                      <span>LATEST REVIEW</span>
                      <strong>{latestDaily?.title || "The machine can run."}</strong>
                      <p>{latestDaily?.summary || "Scanning, execution, telemetry, reconciliation, reporting, and controlled deployment are operating as measurable engineering systems."}</p>
                    </article>
                    <article className="now-card is-unknown">
                      <span>WHAT WE DO NOT KNOW</span>
                      <strong>Whether the current entry families deserve capital.</strong>
                      <p>A strategy does not earn promotion because it looks clever, worked once, or made money on a single session.</p>
                    </article>
                    <article className="now-card is-next">
                      <span>RESEARCH STATE</span>
                      <strong>{currentStatus}</strong>
                      <p>{currentFocus}</p>
                    </article>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "method" && (
              <motion.div
                className="workspace-view story-view"
                key="method"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="story-title-row">
                  <div>
                    <span className="story-kicker">THE RESEARCH LADDER</span>
                    <h2>An idea has to survive eight chances to die.</h2>
                  </div>
                  <p>The order matters. A beautiful backtest built on incomplete or mismatched data is still bad evidence.</p>
                </div>

                <div className="gate-ladder">
                  <div className="gate-spine" aria-hidden="true"><i /></div>
                  {gates.map(([number, title, body], index) => (
                    <article key={number} className="gate-rung">
                      <span className="gate-number">{number}</span>
                      <div>
                        <small>{index < 4 ? "DATA TRUST" : index < 7 ? "STRATEGY TEST" : "DECISION"}</small>
                        <strong>{title}</strong>
                        <p>{body}</p>
                      </div>
                      <b>{index === 7 ? "SURVIVE / REJECT" : "PASS →"}</b>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "hunt" && (
              <motion.div
                className="workspace-view story-view"
                key="hunt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="story-title-row">
                  <div>
                    <span className="story-kicker">EDGE DISCOVERY V1</span>
                    <h2>Five families enter. None is promised a future.</h2>
                  </div>
                  <p>The research program is designed to eliminate weak structures, not keep optimizing until something looks good.</p>
                </div>

                <div className="edge-hunt-board">
                  <section className="edge-hunt-core">
                    <div className="hunt-radar" aria-hidden="true">
                      <i className="ring r1" />
                      <i className="ring r2" />
                      <i className="ring r3" />
                      <i className="sweep" />
                      <b>EDGE?</b>
                    </div>
                    <div className="hunt-copy">
                      <span>PRIMARY TEST</span>
                      <strong>Can any entry family remain useful outside the sample that suggested it?</strong>
                      <p>If the answer is no, that is not a failed research program. It is the program doing its job.</p>
                    </div>
                  </section>

                  <div className="family-row" aria-label="Five independent strategy families under evaluation">
                    {["A", "B", "C", "D", "E"].map((family) => (
                      <article key={family}>
                        <span>FAMILY {family}</span>
                        <strong>UNDER TEST</strong>
                        <i />
                      </article>
                    ))}
                  </div>

                  <div className="hunt-evidence-strip">
                    <article><span>CORPUS</span><strong>JAN–JUL 2026</strong><p>Historical development window currently being audited and expanded.</p></article>
                    <article><span>UNIVERSE</span><strong>36 + 3</strong><p>The main symbol universe plus benchmark/context symbols.</p></article>
                    <article><span>DATA</span><strong>ALPACA IEX</strong><p>Sparsity is being measured rather than automatically treated as corruption.</p></article>
                    <article><span>STRESS</span><strong>3 FRICTION MODELS</strong><p>Any apparent advantage has to survive more realistic execution assumptions.</p></article>
                    <article><span>VERDICT</span><strong>SURVIVE / REJECT</strong><p>No “almost good enough” promotion category exists.</p></article>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "notes" && (
              <motion.div
                className="workspace-view story-view"
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="story-title-row">
                  <div>
                    <span className="story-kicker">FIELD NOTES</span>
                    <h2>The project should leave a trail.</h2>
                  </div>
                  <p>Not every change is progress. These notes record material shifts in what we believe, test, or refuse to do.</p>
                </div>

                <div className="field-notes">
                  <div className="notes-line" aria-hidden="true" />
                  {logs.map(([date, type, body], index) => (
                    <article key={date + type}>
                      <div className="note-marker"><i /><span>{date}</span></div>
                      <div className="note-body">
                        <small>{String(logs.length - index).padStart(2, "0")}</small>
                        <strong>{type}</strong>
                        <p>{body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "toolbox" && (
              <motion.div
                className="workspace-view story-view"
                key="toolbox"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="story-title-row">
                  <div>
                    <span className="story-kicker">THE TOOLBOX</span>
                    <h2>Every service exists because it owns a specific piece of truth.</h2>
                  </div>
                  <p>This is not a stack for its own sake. Each tool either executes, records, verifies, exposes, or helps investigate the system.</p>
                </div>

                <div className="tool-constellation">
                  <div className="tool-core">
                    <span>RHEN</span>
                    <strong>TRADING SYSTEM</strong>
                    <i />
                  </div>
                  {toolsList.map(([name, role, icon, body], index) => (
                    <article key={name} className={"tool-node tool-" + (index + 1)}>
                      <div className="brand-line">
                        <img src={icon} alt="" aria-hidden="true" referrerPolicy="no-referrer" />
                        <span>{role}</span>
                      </div>
                      <strong>{name}</strong>
                      <p>{body}</p>
                    </article>
                  ))}
                  <svg className="tool-lines" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M500 260 L180 90 M500 260 L500 65 M500 260 L820 90 M500 260 L900 260 M500 260 L820 430 M500 260 L500 455 M500 260 L180 430 M500 260 L100 260" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
