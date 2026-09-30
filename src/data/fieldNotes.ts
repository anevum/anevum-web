export type FieldNote = {
  slug: string;
  date: string;
  type: "ENGINEERING" | "RESEARCH" | "SYSTEMS" | "RELEASE";
  status: string;
  title: string;
  summary: string;
  systems: string[];
  evidenceBasis: string;
  limitations: string[];
  reproducibility: {
    inputs: string[];
    procedure: string[];
    expected: string[];
  };
  sections: { heading: string; body: string[] }[];
};

export const fieldNotes: FieldNote[] = [
  {
    slug: "multi-market-architecture-equities-crypto",
    date: "2026-09-29",
    type: "SYSTEMS",
    status: "ACTIVE",
    title: "RHEN becomes a multi-market system",
    summary: "Equities remain intact while crypto is introduced as a separate continuous-market lane with its own attribution, research evidence, forecasting context, validation path, and replay support.",
    systems: ["RHEN", "NOSTRA", "GRAEN", "VELUM"],
    evidenceBasis: "Production architecture and market-lane attribution rules.",
    limitations: [
      "This note describes the architecture boundary; it does not claim that a crypto trading edge has been validated.",
      "Live and simulated performance remain separate records and must be evaluated independently."
    ],
    reproducibility: {
      inputs: [
        "Durable market events carrying explicit market-lane attribution.",
        "Separate equities and crypto research, replay, and performance records."
      ],
      procedure: [
        "Select the same evidence class for both markets and group records by market lane.",
        "Verify that equities records remain attributable to equities and crypto records remain attributable to crypto.",
        "Check that promotion or performance logic never treats an equity result as automatic validation for crypto."
      ],
      expected: [
        "The two markets remain separately attributable through observation, research, replay, and measurement.",
        "Shared infrastructure does not merge validation populations or live performance histories."
      ]
    },
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
    ]
  },
  {
    slug: "prediction-outcome-evidence-chain",
    date: "2026-09-29",
    type: "ENGINEERING",
    status: "REPAIR / HARDENING",
    title: "Preserving the prediction → outcome evidence chain",
    summary: "A production repair is hardening the path from pre-trade candidate state to later forward outcomes so research can evaluate what RHEN believed before an event and what actually followed.",
    systems: ["RHEN", "NOSTRA", "GRAEN"],
    evidenceBasis: "Time-ordered candidate, prediction, and forward-outcome records.",
    limitations: [
      "A complete evidence chain improves auditability; it does not by itself establish predictive skill.",
      "Any missing pre-event snapshot invalidates hindsight-sensitive calibration for that observation."
    ],
    reproducibility: {
      inputs: [
        "A candidate that reached the live-entry boundary.",
        "Its immutable pre-event prediction snapshot and later forward-outcome records."
      ],
      procedure: [
        "Confirm the prediction snapshot timestamp precedes the event and every attached outcome.",
        "Join later outcomes to the preserved pre-event record using the durable observation identity.",
        "Verify that appending outcomes does not mutate the original prediction, score, regime, or decision state."
      ],
      expected: [
        "The original decision state remains unchanged after outcomes become known.",
        "Forward outcomes can be evaluated against the state that actually existed before the event."
      ]
    },
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
    ]
  },
  {
    slug: "velum-replay-layer",
    date: "2026-09-29",
    type: "SYSTEMS",
    status: "IMPLEMENTATION",
    title: "VELUM becomes the replay and counterfactual layer",
    summary: "VELUM formalizes off-hours historical replay, simulation, counterfactual comparison, and failure analysis without giving simulated work broker authority.",
    systems: ["VELUM", "RHEN", "GRAEN", "NOSTRA"],
    evidenceBasis: "Broker-isolated replay outputs with explicit simulation provenance.",
    limitations: [
      "Replay quality is bounded by historical data quality and declared friction assumptions.",
      "A replay can reproduce strategy behavior without reproducing future live market conditions."
    ],
    reproducibility: {
      inputs: [
        "Historical market data, a declared strategy version, and the replay friction configuration.",
        "Replay output tagged as simulated and a separately identifiable live evidence store."
      ],
      procedure: [
        "Run the declared strategy version against the historical input under the stated replay assumptions.",
        "Confirm every generated decision and order remains simulation-tagged and broker-isolated.",
        "Compare replay output with the intended strategy rules without writing simulated events into the canonical live record."
      ],
      expected: [
        "The same inputs and configuration produce a traceable replay result.",
        "Simulation provenance remains explicit and no replay event is represented as live performance."
      ]
    },
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
    ]
  },
  {
    slug: "residual-downshock-rebound-development-fail",
    date: "2026-09-28",
    type: "RESEARCH",
    status: "DEVELOPMENT CORPUS FAIL",
    title: "Residual Downshock Rebound v2.1 fails the development corpus gate",
    summary: "The strategy did not reach performance testing because the development corpus itself failed the required gate. The failure is retained as a first-class research result.",
    systems: ["GRAEN", "RHEN"],
    evidenceBasis: "Development-corpus completeness gate before performance evaluation.",
    limitations: [
      "No performance conclusion should be inferred because performance testing did not run.",
      "The result applies to the evaluated development corpus and does not establish that every future corpus will fail."
    ],
    reproducibility: {
      inputs: [
        "The declared Residual Downshock Rebound v2.1 development corpus.",
        "The corpus-completeness diagnostic and the frozen development gate."
      ],
      procedure: [
        "Run the corpus gate before any strategy-performance evaluation.",
        "Record whether the development corpus satisfies the required completeness condition.",
        "If the corpus fails, stop the experiment before calculating or promoting performance results."
      ],
      expected: [
        "The canonical decision is DEVELOPMENT CORPUS FAIL.",
        "No return, win-rate, or promotion claim is produced from a development population that failed the prerequisite gate."
      ]
    },
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
    ]
  }
];

export function fieldNoteBySlug(slug?: string) {
  return fieldNotes.find((note) => note.slug === slug);
}

export function fieldNoteReadingMinutes(note: FieldNote) {
  const words = [
    note.summary,
    note.evidenceBasis,
    ...note.limitations,
    ...note.reproducibility.inputs,
    ...note.reproducibility.procedure,
    ...note.reproducibility.expected,
    ...note.sections.flatMap((section) => [section.heading, ...section.body])
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(2, Math.ceil(words / 220));
}
