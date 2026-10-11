import type { SystemName } from "../components/company/SystemMark";

export type FieldNote = {
  slug: string;
  date: string;
  type: "ENGINEERING" | "RESEARCH" | "SYSTEMS" | "RELEASE";
  status: string;
  title: string;
  summary: string;
  systems: SystemName[];
  readMinutes: number;
  featured?: boolean;
  sections: { heading: string; body: string[] }[];
  reproduce: {
    question: string;
    inputs: string[];
    method: string[];
    checks: string[];
    expected: string;
    limits: string[];
  };
};

export const fieldNotes: FieldNote[] = [
  {
    slug: "anevum-lean-runtime-reset",
    date: "2026-10-08",
    type: "SYSTEMS",
    status: "DEPLOYED / MANUAL INFRA CLEANUP OPEN",
    title: "ANEVUM gets smaller on purpose",
    summary: "RHEN now keeps permanent compute focused on trading, control, evidence, and API routing. Numerical forecasting and deterministic evidence review are embedded; model-assisted research and replay move on demand; live promotion remains manual.",
    systems: ["RHEN", "IREN", "GRAEN", "VELUM", "NOSTRA"],
    readMinutes: 5,
    featured: true,
    sections: [
      {
        heading: "The problem was not a missing agent",
        body: [
          "ANEVUM had accumulated too many always-running internal roles for the amount of real work that required continuous compute. Several services mostly waited for scheduled research, replay, or model-assisted work while the trading runtime carried the only true real-time obligation.",
          "The reset keeps the original loop and removes the theater around it: trade, preserve evidence, review what happened, define a bounded experiment, replay or validate it, and promote only after an explicit operator decision."
        ]
      },
      {
        heading: "What stays resident",
        body: [
          "RHEN remains the single permanent Railway product service. Inside it, the production supervisor now keeps four resident process boundaries: canonical Core/Store, live execution, deterministic IREN control, and the API router.",
          "NOSTRA no longer needs a standalone server. Its point-in-time numerical forecast and scoring loop runs inside Core with the same research-only authority. Deterministic post-session evidence review is embedded there as well."
        ]
      },
      {
        heading: "What moved on demand",
        body: [
          "GRAEN is now a research method rather than a permanent process. Canonical evidence can be exported as one private, fingerprinted research package for operator or ChatGPT Work analysis. That package can identify a question worth investigating, but it has no broker-write, live-strategy-mutation, or promotion authority.",
          "VELUM no longer waits online for work. A bounded one-shot runner validates a completed market session, executes the existing replay and friction assumptions, writes research evidence, and exits. Semantic model research is similarly deliberate rather than an always-on production dependency."
        ]
      },
      {
        heading: "What did not change",
        body: [
          "The architecture cut did not change RHEN's live strategy merely to make the migration look successful. Live broker authority remains confined to RHEN execution, current scope remains long U.S. equities and ETFs, and research cannot silently enable options, shorting, leverage, or another asset lane.",
          "No language model is required for scanning, entries, sizing, exits, reconciliation, health, scheduling, or configuration identity. Promotion still requires explicit operator authority."
        ]
      },
      {
        heading: "Cleanup that is intentionally not hidden",
        body: [
          "The old RHEN 4.4 shadow did not satisfy its release gates. Its exact deployed source and latest branch state were archived instead of being promoted. Its Railway compute deletion is staged while the small evidence volume is retained for reproducibility; until that staged infrastructure change is confirmed, the old shadow still exists.",
          "Legacy crypto and model-related Railway variable names also remain visible until they are manually removed. Expensive or obsolete activation switches have been explicitly pinned off so those names cannot silently restore the retired runtime paths.",
          "Early resource readings are lower after the process reduction, but the post-cutover window is not long enough to publish a mature cost-savings claim. A clean architecture and a profitable trading edge are separate questions."
        ]
      }
    ],
    reproduce: {
      question: "Can ANEVUM preserve the trading and evidence loop while removing permanent compute that has no continuous-time obligation?",
      inputs: [
        "The current RHEN supervisor process manifest",
        "Canonical daily and weekly research evidence",
        "Point-in-time NOSTRA forecast and outcome records",
        "IREN scheduler, configuration, and incident state",
        "VELUM replay manifests",
        "Railway process and resource observations",
        "The archived RHEN 4.4 shadow source and evidence identity"
      ],
      method: [
        "Keep execution, canonical storage, deterministic control, and routing resident.",
        "Embed deterministic NOSTRA forecasting and evidence review in Core.",
        "Move model-assisted GRAEN research to explicit operator / Work sessions.",
        "Run VELUM as a bounded replay job only when an experiment or incident requires it.",
        "Keep strategy behavior fixed during the architecture migration so operational and trading changes remain attributable.",
        "Archive incomplete shadow work before staging its compute teardown."
      ],
      checks: [
        "A model-provider outage cannot stop the authorized live trading path.",
        "Research and replay retain no broker-write or automatic-promotion authority.",
        "Daily and weekly deterministic evidence review still runs without a model call.",
        "A private canonical research package can be produced without changing live state.",
        "VELUM can complete a replay and exit without a permanent server.",
        "Command and the public architecture distinguish resident, embedded, and on-demand functions.",
        "Missing or still-manual cleanup is described explicitly rather than shown as complete."
      ],
      expected: "One permanent RHEN product service supports the live trading loop while research intelligence and replay consume compute only when bounded work exists.",
      limits: [
        "The staged RHEN 4.4 shadow-service deletion still requires infrastructure confirmation before that compute is actually gone.",
        "Legacy Railway variable names still require manual dashboard deletion even though retired activation paths are pinned off.",
        "A short post-cutover resource sample is not enough to establish the final monthly Railway cost.",
        "This architecture change does not establish trading profitability or a repeatable market edge."
      ]
    }
  },
  {
    slug: "rhen-v4-4-research-observation-and-release-gates",
    date: "2026-10-07",
    type: "ENGINEERING",
    status: "RESEARCH OBSERVATION / VALIDATION OPEN",
    title: "RHEN 4.4: observe first, earn the crossover",
    summary: "RHEN 4.4 now treats live read-only observation as research infrastructure: Discover collects market and candidate evidence, while Review owns reconciliation, replay, holdout, approval, and crossover decisions. The current production champion continues trading while validation remains open.",
    systems: ["RHEN", "NOSTRA", "VELUM", "GRAEN", "IREN"],
    readMinutes: 3,
    featured: false,
    sections: [
      {heading: "What is deployed", body: [
        "Discover follows a rotating 24-symbol hotset drawn from the canonical 100-symbol discovery universe. The read-only research stream preserves bounded churn, pinned confirmation symbols, and durable state across restart without becoming a separate strategy lane.",
        "Broker events are compared with the canonical order and fill ledger. Reconciliation can recover a missing stream observation while preserving the original gap in the record. Recovery is not presented as perfect raw-stream coverage.",
        "NOSTRA forecasts are read from the canonical store and projected only when an observed reference price, source timestamp, model version, and valid horizon are available. The approval registry accepts exact evidence-linked profile decisions; it does not approve profiles by itself."
      ]},
      {heading: "What the free feed can actually cover", body: [
        "Basic IEX research observation covers 8 AM to 5 PM Eastern. Discover explicitly blocks remaining premarket and after-hours gaps rather than extending stale quotes into a continuous chart.",
        "Overnight research observation uses its own feed and eligibility rules. Each session requires separate evidence. Continuous observation does not establish continuous trading authority."
      ]},
      {heading: "What still has to be earned", body: [
        "The remaining work includes complete risk and cost attribution, canonical research exports, VELUM validation artifacts, and authenticated visual acceptance. Forward and untouched holdout evidence must be collected from real observations.",
        "The current production strategy continues trading. Adaptive ACTIVE policies and a 4.4 broker-write crossover have not been promoted. Engineering tests establish mechanics; they do not establish a profitable edge."
      ]}
    ],
    reproduce: {
      question: "Can 4.4 improve market observation and policy evidence while preserving a traceable, reversible trading path?",
      inputs: ["Canonical discovery universe", "Timestamped market observations", "Broker trade updates and canonical ledger", "Versioned forecasts and profile approvals"],
      method: ["Collect live read-only evidence through Discover while live execution remains isolated.", "Retain source times and distinguish recovery from raw stream parity.", "Project forecasts only against observed point-in-time references.", "Send parity, replay, holdout, approval, and crossover evidence to Review."],
      checks: ["Discover research observation has no broker-write authority.", "Feed gaps and stale values remain explicit.", "Missing evidence cannot become an approval.", "Review cannot promote a release without the declared evidence gates."],
      expected: "One verifiable Discover → Review research record and a clear list of unresolved release gates.",
      limits: ["Forward coverage and independent holdout evidence remain incomplete.", "Command transport and full visual acceptance remain under verification.", "No claim of profitability or full 24/5 execution is established by this update."]
    }
  },
  {
    slug: "rhen-v4-3-canonical-equity-evidence",
    date: "2026-10-06",
    type: "RELEASE",
    status: "DEPLOYED / EVIDENCE GATE OPEN",
    title: "RHEN V4.3 narrows authority and raises the evidence standard",
    summary: "RHEN V4.3 retires active crypto research, expands equity discovery and 24/5 market coverage, validates shadow economics and allocation post-event, and refuses to reconstruct missing decision-time inputs for forward outcomes.",
    systems: ["RHEN", "IREN", "GRAEN", "VELUM", "NOSTRA"],
    readMinutes: 6,
    featured: false,
    sections: [
      {
        heading: "What V4.3 changes",
        body: [
          "RHEN is now explicitly equity-first. Current broker authority is limited to long U.S. equities and ETFs, with regular-session execution and a separate 24/5 extended-equity lane whose authorization is visible rather than implied.",
          "Whole-market discovery uses bounded brokerage market-data screening and dynamic-universe logic to expand the opportunity pool without turning every listed asset into an expensive full-history request."
        ]
      },
      {
        heading: "What was retired",
        body: [
          "Crypto execution, crypto research lanes, the BTC paper canary, and the retired adaptive research executor are historical evidence only. They are filtered from current control, research, and website projections rather than being shown as dormant current capabilities.",
          "The canonical scheduler no longer calls the removed adaptive executor. That stale workflow was the source of repeated IREN ConnectError incidents after the V4 cleanup."
        ]
      },
      {
        heading: "The new evidence boundary",
        body: [
          "A candidate enters the post-fix measurable cohort only when RHEN preserved the exact decision reference price and the timestamp of the completed decision bar. Forward outcomes mature later at declared horizons; they do not rewrite the original decision.",
          "October 6 contains 2,445 legacy candidates that cannot meet that standard: 1,746 lack the original decision-bar timestamp and 699 lack the original decision reference price. V4.3 does not infer or backfill those values."
        ]
      },
      {
        heading: "What happens next",
        body: [
          "The system is deliberately in AWAITING_MEASURABLE_COHORT until the first live post-fix equity decision cycle. The next valid question is whether new candidates enter the cohort at effectively complete coverage and produce mature 10- and 15-minute outcomes.",
          "Only after that evidence exists should shadow economics, shadow allocation, or the production strategy be judged again."
        ]
      }
    ],
    reproduce: {
      question: "Can RHEN expand equity coverage and research depth while preserving exact no-lookahead evidence and narrow live authority?",
      inputs: [
        "The deployed RHEN V4.3 source",
        "The successful RHEN V4.3 Railway deployment",
        "Canonical scheduler v1.0.10",
        "Daily research rhen-daily-v1.7",
        "Candidate decision reference price and completed-bar timestamp",
        "Post-event 10- and 15-minute outcomes"
      ],
      method: [
        "Retire crypto-specific current-state projections and stale adaptive scheduler work.",
        "Keep live authority scoped to long U.S. equities and ETFs.",
        "Expand candidate discovery through bounded hierarchical brokerage market-data screening.",
        "Persist exact decision-time price and completed-bar evidence for new candidates.",
        "Evaluate shadow economics and shadow allocation only after forward outcomes mature."
      ],
      checks: [
        "No retired crypto or BTC runtime is represented as a current active lane.",
        "Research, replay, forecasting, and control retain no broker-order authority.",
        "New measurable candidates contain both exact decision price and completed-bar timestamp.",
        "Legacy candidates missing those fields remain explicitly unmeasurable.",
        "Forward outcomes are attached after the decision and cannot alter the original record."
      ],
      expected: "V4.3 should produce a clean post-fix equity cohort whose evidence can be evaluated without reconstruction, hindsight, or hidden authority expansion.",
      limits: [
        "The first post-fix cohort had not yet occurred at release freeze because the evidence repair landed after the October 6 regular session.",
        "A clean evidence pipeline does not establish profitability; additional independent sessions are required before strategy conclusions."
      ]
    }
  },
  {
    slug: "rhen-v3-unified-runtime-rebuild",
    date: "2026-10-05",
    type: "SYSTEMS",
    status: "IMPLEMENTATION / CUTOVER",
    title: "RHEN v3 consolidates ANEVUM into one production runtime",
    summary: "ANEVUM is replacing an over-fragmented service topology with one RHEN Railway application service containing isolated execution, control, research, replay, forecast, Core/Store, research-worker, and Command/API modules.",
    systems: ["RHEN"],
    readMinutes: 6,
    featured: false,
    sections: [
      {
        heading: "What changed",
        body: [
          "RHEN is now the unified ANEVUM production runtime. IREN, GRAEN, VELUM, and NOSTRA remain named internal modules with distinct control, research, replay, and forecasting responsibilities inside that runtime.",
          "The existing production service is converted in place so it can retain its persistent volume while internal service-to-service traffic moves to loopback boundaries inside one container."
        ]
      },
      {
        heading: "Why the rebuild was necessary",
        body: [
          "The previous architecture duplicated long-lived services that shared one repository, called each other over HTTP, and retained too much high-frequency evidence.",
          "The PostgreSQL storage path reached its volume ceiling during the rebuild. RHEN v3 treats that as an architecture problem: the new Core uses bounded SQLite storage, explicit retention windows, compaction, and analytics shedding instead of assuming storage can grow indefinitely."
        ]
      },
      {
        heading: "Authority is still separated",
        body: [
          "One Railway service does not mean one permission set. Execution retains broker authority, while Research, Replay, Forecast, Control, and pure Core processes run with execution disabled.",
          "Strategy authority remains separate from research candidates. The rebuild does not let GRAEN, VELUM, NOSTRA, or other research processes silently gain broker-write authority; Command reads the current production and candidate states from the canonical RHEN pipeline."
        ]
      },
      {
        heading: "Verification and cutover",
        body: [
          "The RHEN v3 branch passed the full staging suite with 1,208 tests passing and 8 skipped, plus 54 focused RHEN v3, research, forecast, and V15 tests. GitHub CI and the Foundation runtime audit were green before merge.",
          "The production cutover now centers on one RHEN service and bounded Core storage. Verification covers critical runtime health, internal module health, canonical evidence, Command projections, and explicit release gates; legacy staging services are not authoritative production sources."
        ]
      }
    ],
    reproduce: {
      question: "Can ANEVUM reduce deployment complexity and storage growth without collapsing the authority boundaries that protect execution?",
      inputs: [
        "The existing RHEN production service and persistent volume",
        "The previous multi-service runtime inventory",
        "Canonical execution, research, replay, forecast, scheduler, and control responsibilities",
        "Observed database-volume growth and evidence-retention patterns",
        "The canonical strategy and research-promotion contracts"
      ],
      method: [
        "Move top-level subsystem responsibilities behind one RHEN supervisor as isolated internal modules.",
        "Route internal APIs over loopback and keep broker configuration confined to the execution boundary.",
        "Replace the operational PostgreSQL dependency with a bounded SQLite Core on the retained RHEN volume.",
        "Compact high-frequency decision evidence and apply explicit retention windows.",
        "Validate the combined runtime before retiring legacy services."
      ],
      checks: [
        "Execution remains the only broker-writing boundary.",
        "Research, replay, forecast, control, and Core processes run with execution disabled.",
        "Critical order, fill, reconciliation, incident, approval, replay-result, and deployment evidence remains durable.",
        "Routine analytics cannot consume the remaining volume indefinitely.",
        "Research candidates remain separate from production authority until an explicit release gate changes that authority."
      ],
      expected: "One production RHEN application service can replace the duplicated service topology while preserving functional isolation, bounded storage, reproducible evidence, and protected live-risk authority.",
      limits: [
        "A merged architecture is not the same thing as a completed production cutover; legacy services are retired only after runtime verification.",
        "Consolidation reduces operational duplication but does not remove the need for observability, fail-closed gates, or explicit human authority for protected live-risk changes."
      ]
    }
  },
  {
    slug: "prediction-outcome-evidence-chain",
    date: "2026-09-29",
    type: "ENGINEERING",
    status: "REPAIR / HARDENING",
    title: "Preserving the prediction → outcome evidence chain",
    summary: "A production repair is hardening the path from pre-trade candidate state to later forward outcomes so research can evaluate what RHEN believed before an event and what actually followed.",
    systems: ["RHEN", "NOSTRA", "GRAEN"],
    readMinutes: 4,
    sections: [
      {
        heading: "The failure mode",
        body: [
          "A live trade can be executed correctly while still producing weak research evidence if the pre-event prediction state is not durably linked to later outcomes.",
          "That is an observability failure rather than a reason to rewrite the live strategy."
        ]
      },
      {
        heading: "Repair principle",
        body: [
          "Every candidate that reaches live entry should retain its pre-trade state before the result is known.",
          "Post-event forward outcomes are attached later. They must never be allowed to rewrite the original decision."
        ]
      },
      {
        heading: "Why this matters",
        body: [
          "Without the chain, calibration work can become hindsight. With it, NOSTRA and GRAEN can compare forecasts, scores, regimes, and decisions against what actually happened using time-ordered evidence."
        ]
      }
    ],
    reproduce: {
      question: "Can a forecast be evaluated later without allowing future information to leak back into the original decision?",
      inputs: [
        "A candidate or decision identifier",
        "The complete pre-event feature and forecast state",
        "An immutable decision timestamp",
        "Market data available after the event for declared forward horizons"
      ],
      method: [
        "Persist the pre-event state before the outcome exists.",
        "Treat the retained decision record as immutable research evidence.",
        "Compute forward outcomes later for fixed horizons and attach them by durable identifier.",
        "Analyze calibration only from the time-ordered prediction/outcome pair."
      ],
      checks: [
        "Prediction timestamp precedes every measured outcome horizon.",
        "Outcome jobs append evidence rather than mutating original prediction fields.",
        "Missing outcomes remain explicitly incomplete instead of being silently dropped.",
        "The same identifier resolves from prediction to later outcome evidence."
      ],
      expected: "Research can compare what the system believed at decision time with what followed, without hindsight contamination.",
      limits: [
        "A complete evidence chain makes evaluation possible; it does not make the forecast accurate.",
        "Missing or dropped pre-event records cannot be reconstructed reliably from later state."
      ]
    }
  },
  {
    slug: "velum-replay-layer",
    date: "2026-09-29",
    type: "SYSTEMS",
    status: "IMPLEMENTATION",
    title: "VELUM becomes the replay and counterfactual layer",
    summary: "VELUM formalizes off-hours historical replay, simulation, counterfactual comparison, and failure analysis without giving simulated work broker authority.",
    systems: ["VELUM", "RHEN", "GRAEN", "NOSTRA"],
    readMinutes: 4,
    sections: [
      {
        heading: "Role",
        body: [
          "VELUM reconstructs historical market state and re-runs bounded strategy logic against declared assumptions.",
          "Its job is to challenge ideas, reproduce behavior, and compare alternatives—not to make simulated evidence look like live performance."
        ]
      },
      {
        heading: "Safety boundary",
        body: [
          "The replay layer remains broker-isolated. Simulated orders, counterfactual decisions, and reconstructed paths stay outside the canonical live record.",
          "The design makes it possible to run repeated research while markets are closed or while a live lane is inactive without contaminating production evidence."
        ]
      }
    ],
    reproduce: {
      question: "Can production decision logic be replayed against historical state without giving the replay environment live broker authority?",
      inputs: [
        "Historical bars for a declared time window",
        "A pinned strategy or decision-logic version",
        "Declared spread, slippage, and fill assumptions",
        "A broker-isolated replay runtime"
      ],
      method: [
        "Reconstruct the historical input stream in timestamp order.",
        "Run the pinned decision logic against only information available at each replay point.",
        "Apply declared friction assumptions consistently.",
        "Write replay output to a research-only evidence surface and compare bounded alternatives on the same data."
      ],
      checks: [
        "Replay code has no live broker execution authority.",
        "Strategy version and friction assumptions are recorded with the run.",
        "Replay results never enter the broker-derived live performance record.",
        "Repeated runs with identical inputs produce reproducible outputs within declared deterministic assumptions."
      ],
      expected: "Historical behavior and counterfactual alternatives can be studied repeatedly without contaminating live evidence.",
      limits: [
        "Historical replay cannot reconstruct information that was never retained.",
        "Intrabar order and fill realism remain bounded by the resolution and assumptions of the historical data."
      ]
    }
  },
  {
    slug: "residual-downshock-rebound-development-fail",
    date: "2026-09-28",
    type: "RESEARCH",
    status: "DEVELOPMENT CORPUS FAIL",
    title: "Residual Downshock Rebound v2.1 fails the development corpus gate",
    summary: "The strategy did not reach performance testing because the development corpus itself failed the required gate. The failure is retained as a first-class research result.",
    systems: ["GRAEN", "RHEN"],
    readMinutes: 3,
    sections: [
      {
        heading: "Decision",
        body: [
          "The research process stopped before performance testing because the corpus requirement was not satisfied.",
          "That distinction matters: a failed data or evidence gate is not the same thing as a poor strategy return, and the site should not collapse those categories."
        ]
      },
      {
        heading: "What happens next",
        body: [
          "The canonical decision remains recorded as DEVELOPMENT CORPUS FAIL.",
          "Future work must repair or replace the evidence basis before the hypothesis can advance."
        ]
      }
    ],
    reproduce: {
      question: "Does the declared development corpus satisfy the evidence requirements needed before performance testing is allowed?",
      inputs: [
        "The frozen development-corpus specification",
        "Session-completeness diagnostics",
        "The declared inclusion and exclusion rules",
        "The promotion methodology in effect for v2.1"
      ],
      method: [
        "Build the corpus using only the frozen inclusion rules.",
        "Run completeness and integrity diagnostics before calculating strategy performance.",
        "Stop the experiment if the corpus gate fails.",
        "Record the gate result as the canonical research decision rather than substituting a performance result."
      ],
      checks: [
        "The gate is evaluated before strategy returns.",
        "Failure is classified as a corpus failure, not a strategy-loss result.",
        "No holdout or promotion claim is produced after the failed development gate.",
        "The failed result remains visible in the research record."
      ],
      expected: "The experiment terminates at the evidence gate when the corpus is not valid enough to support performance testing.",
      limits: [
        "This result does not show whether the strategy itself would have been profitable or unprofitable.",
        "A future test requires a repaired or independently justified corpus, not a reinterpretation of the failed one."
      ]
    }
  }
];

export function fieldNoteBySlug(slug?: string) {
  return fieldNotes.find((note) => note.slug === slug);
}
