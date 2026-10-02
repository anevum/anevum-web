export type PublicWorkLogEntry = {
  at: string;
  category: "OPERATIONS" | "RESEARCH" | "INFRASTRUCTURE" | "WEBSITE" | "COMMUNICATIONS";
  title: string;
  summary: string;
  status: "COMPLETE" | "ACTIVE" | "RESEARCH ONLY";
};

export const publicWorkLog: PublicWorkLogEntry[] = [
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
  ["alpaca-trader", "Railway", "ONLINE", "Live RHEN execution, telemetry, reconciliation, and canonical session recording."],
  ["rhen-research-agent", "Railway", "ONLINE", "Bounded research review service. Research cannot directly mutate live trading."],
  ["rhen-research-scheduler", "Railway", "READY", "DST-safe scheduled daily research cadence and catch-up orchestration."],
  ["rhen-preopen-state", "Railway", "ONLINE", "Pre-open state preparation and readiness support."],
  ["trading-public-feed", "Railway / Cloudflare", "OFFLINE_BY_DESIGN", "Railway-native feed exists; public telemetry stays offline during the rebuild."],
  ["trading-report-read", "Railway", "VERIFYING", "Private canonical PostgreSQL report/evidence reads; report latency verification remains open."],
  ["research-agent-gateway", "Railway", "ACTIVE", "Bounded canonical evidence gateway for the Research Agent."],
  ["anevum.com", "Cloudflare", "ACTIVE", "Public system, research, record, performance, and authenticated Command surfaces."],
  ["IREN / Slack", "Slack", "ACTIVE", "Operational alerts, completion notices, research notes, and cross-system coordination."]
] as const;
