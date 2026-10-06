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
    slug: "rhen-v3-unified-runtime-rebuild",
    date: "2026-10-05",
    type: "SYSTEMS",
    status: "IMPLEMENTATION / CUTOVER",
    title: "RHEN v3 consolidates ANEVUM into one production runtime",
    summary: "ANEVUM is replacing an over-fragmented service topology with one RHEN Railway application service containing isolated execution, control, research, replay, forecast, Core/Store, research-worker, and Command/API modules.",
    systems: ["RHEN"],
    readMinutes: 6,
    featured: true,
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
    slug: "multi-market-architecture-equities-crypto",
    date: "2026-09-29",
    type: "SYSTEMS",
    status: "ACTIVE",
    title: "RHEN becomes a multi-market system",
    summary: "Equities remain intact while crypto is introduced as a separate continuous-market lane with its own attribution, research evidence, forecasting context, validation path, and replay support.",
    systems: ["RHEN", "NOSTRA", "GRAEN", "VELUM"],
    readMinutes: 5,
    featured: true,
    sections: [
      {
        heading: "What changed",
        body: [
          "The system no longer treats market type as an incidental symbol property. Equities and crypto are explicit market lanes with separate evidence attribution.",
          "This preserves the existing equities record while allowing crypto research, forecasting, replay, and eventual live execution to evolve under different assumptions."
        ]
      },
      {
        heading: "Why the separation matters",
        body: [
          "A 24/7 market is not simply an equity session with longer hours. Session structure, liquidity behavior, feature scaling, volatility, and evaluation windows can differ materially.",
          "The architecture therefore shares infrastructure where appropriate while keeping validation populations and performance records distinct."
        ]
      },
      {
        heading: "Current boundary",
        body: [
          "Crypto research can reuse infrastructure and mathematical tooling, but no equity result automatically validates a crypto strategy.",
          "GRAEN owns the promotion evidence, NOSTRA measures market state and forecasts, VELUM replays and challenges the strategy, and RHEN executes only after the required gate is satisfied."
        ]
      }
    ],
    reproduce: {
      question: "Can a second market lane be added without contaminating the evidence or performance record of the first?",
      inputs: [
        "An existing equities lane with retained live evidence",
        "A continuous-market data source for crypto",
        "A canonical event model capable of carrying market-lane attribution",
        "Separate research, replay, and performance populations"
      ],
      method: [
        "Make market lane an explicit field at ingestion and preserve it through candidate, decision, execution, and outcome records.",
        "Reuse shared infrastructure only where the assumptions are genuinely common.",
        "Keep research datasets, validation gates, and public performance summaries separated by lane.",
        "Require explicit promotion before a research result can affect execution."
      ],
      checks: [
        "Existing equities records remain unchanged.",
        "Every new crypto event can be attributed to the crypto lane without inference from symbol naming.",
        "Replay, shadow, and live results remain distinguishable.",
        "No equity validation result is treated as crypto validation."
      ],
      expected: "Two market lanes can share infrastructure while retaining independent evidence, validation, and performance histories.",
      limits: [
        "This architecture establishes separation; it does not prove a crypto trading edge.",
        "Market-lane isolation still depends on complete telemetry and correct attribution at every write boundary."
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
