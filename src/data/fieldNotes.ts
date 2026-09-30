export type FieldNote = {
  slug: string;
  date: string;
  type: "ENGINEERING" | "RESEARCH" | "SYSTEMS" | "RELEASE";
  status: string;
  title: string;
  summary: string;
  systems: string[];
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
