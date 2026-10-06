export type PublicWorkLogEntry = {
  at: string;
  category: "OPERATIONS" | "RESEARCH" | "INFRASTRUCTURE" | "WEBSITE" | "COMMUNICATIONS";
  title: string;
  summary: string;
  status: "COMPLETE" | "ACTIVE" | "RESEARCH ONLY";
};

export const publicWorkLog: PublicWorkLogEntry[] = [
  {
    at: "2026-10-06T23:32:14Z",
    category: "INFRASTRUCTURE",
    title: "RHEN V4.3 canonical runtime deployed",
    summary: "RHEN production is on the deployed V4.3 source with scheduler v1.0.10. The stale adaptive executor workflow was retired, the unified runtime is healthy, and crypto-specific current research remains quarantined as historical evidence.",
    status: "COMPLETE"
  },
  {
    at: "2026-10-06T22:58:35Z",
    category: "RESEARCH",
    title: "Exact measurable forward-evidence cohort formalized",
    summary: "New candidates require the original decision reference price plus completed decision-bar timestamp before 10/15-minute outcomes can be evaluated. Legacy rows with missing decision-time inputs are not reconstructed.",
    status: "COMPLETE"
  },
  {
    at: "2026-10-06T21:55:30Z",
    category: "RESEARCH",
    title: "Shadow economics and allocation validation added",
    summary: "Post-event validators now measure cost-aware shadow economics and normalized allocation alternatives against matured forward outcomes without modifying the live decision record.",
    status: "COMPLETE"
  },
  {
    at: "2026-10-06T17:30:19Z",
    category: "RESEARCH",
    title: "Research control and whole-market equity discovery redesigned",
    summary: "RHEN now distinguishes automated frozen testing from deliberate research/release review and uses hierarchical Alpaca screening to broaden the equity opportunity pool efficiently.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T23:55:37Z",
    category: "INFRASTRUCTURE",
    title: "Post-close evidence path optimized and reconciled",
    summary: "The sanitized reporting path was moved to a compressed, set-based evidence query and reconciled onto the hardened production branch. The live reporting function remains versioned and active.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T23:46:22Z",
    category: "INFRASTRUCTURE",
    title: "RHEN production hardening completed after Railway scaling upgrade",
    summary: "The live trader, Research Agent, scheduler, and pre-open service were verified on the upgraded Railway production environment with health checks, bounded restart behavior, scheduling, persistence, and operational alerting intact.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T23:15:36Z",
    category: "RESEARCH",
    title: "Canonical end-of-day research report recorded",
    summary: "The session closed as INVESTIGATE. The sample was too small for strategy-parameter changes, so tomorrow's live strategy remains unchanged while research continues offline.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T23:15:23Z",
    category: "RESEARCH",
    title: "ADS-002 post-close refresh completed",
    summary: "ADS-002 remains research-only. Attribution integrity is not yet sufficient to interpret candidate-score performance, so no production promotion or live configuration change was authorized.",
    status: "RESEARCH ONLY"
  },
  {
    at: "2026-09-28T22:48:24Z",
    category: "RESEARCH",
    title: "ADS-002 shadow learning and attribution integrity implemented",
    summary: "A decomposed Attention / Qualification / Timing research score, confidence gates, direct attribution contract, forward-outcome methodology, and fail-closed readiness states were added without changing live trading behavior.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T21:43:29Z",
    category: "RESEARCH",
    title: "ADS-001 research determination finalized",
    summary: "The decomposed Adaptive Decision Space direction was accepted for further research. The prior single quality score and simple threshold tuning were rejected as sufficient evidence for production changes.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T20:10:00Z",
    category: "OPERATIONS",
    title: "First official RHEN live session completed",
    summary: "RHEN completed its first official autonomous live operating session, recorded the full evidence trail, reconciled broker truth, and preserved the session for post-close analysis. Public reporting uses normalized percentages and counts rather than raw account values.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T20:09:28Z",
    category: "COMMUNICATIONS",
    title: "Native Slack operational notifications activated",
    summary: "RHEN lifecycle, significant state changes, failures, blockers, and intervention-worthy events can route to Slack while routine internal scans and model chatter remain quiet.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T14:42:05Z",
    category: "OPERATIONS",
    title: "Normalized public performance epoch indexed",
    summary: "The public performance record was reset across an external cash-flow boundary so normalized return and drawdown remain mathematically honest without exposing raw capital values.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T13:49:35Z",
    category: "WEBSITE",
    title: "Live RHEN activity feed improved",
    summary: "The public and Command activity surfaces were updated so the newest runtime events appear first and current operational state is easier to inspect.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T21:20:42Z",
    category: "WEBSITE",
    title: "Calendar-driven seasonal system activated",
    summary: "ANEVUM gained a reusable monthly visual system, seasonal ambient effects, automated IREN avatar generation, and calendar-driven theme changes without replacing the underlying product architecture.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T23:56:25Z",
    category: "WEBSITE",
    title: "Cinematic RHEN launch sequence shipped",
    summary: "The homepage now visualizes the real services that support RHEN converging into the RHEN identity before revealing the live system, while preserving live telemetry and the existing evidence surfaces.",
    status: "COMPLETE"
  },
  {
    at: "2026-09-28T21:04:08Z",
    category: "COMMUNICATIONS",
    title: "IREN control and specialist Slack routing established",
    summary: "IREN now acts as the coordination layer with dedicated channels for live RHEN activity, alerts, daily reports, research, website work, FORWARD, mathematical research, and cross-system operations.",
    status: "COMPLETE"
  }
];

export const productionServiceLog = [
  ["rhen", "Railway", "ONLINE", "Canonical RHEN V4.3 runtime: equity execution, Core/Store, IREN, GRAEN, VELUM, NOSTRA, Research Agent, scheduler, and internal APIs."],
  ["RHEN Core / SQLite", "Railway volume", "ACTIVE", "Bounded canonical scheduler, research, incident, telemetry, and evidence state with retention, reclaimable-space accounting, and compaction."],
  ["anevum.com", "Cloudflare", "ACTIVE", "Public system, Field Notes, Releases, Live Terminal, and authenticated Command surfaces."],
  ["Command", "Cloudflare Access", "PROTECTED", "Private operator surface reading canonical RHEN and IREN state; no parallel control model."],
  ["Alpaca", "Broker / market data", "ACTIVE", "Long U.S. equity and ETF execution plus bounded market discovery and exchange-calendar truth."],
  ["IREN / Slack", "Slack", "ACTIVE", "Operational alerts, failures, blockers, research/release review notices, and actions requiring attention."]
] as const;
