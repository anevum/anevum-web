export type ProductStatus = "OPERATIONAL" | "LIVE PRODUCTION" | "ACTIVE RESEARCH" | "RESEARCH / REPLAY";

export type Product = {
  slug: "iren" | "rhen" | "nostra" | "graen" | "velum";
  name: "IREN" | "RHEN" | "NOSTRA" | "GRAEN" | "VELUM";
  eyebrow: string;
  category: string;
  status: ProductStatus;
  summary: string;
  role: string;
  capabilities: string[];
  technologies: string[];
  evidence: string[];
  boundaries: string[];
  flow: string[];
  related: string[];
};

export type Module = {
  name: string;
  category: string;
  owner: string;
  status: string;
  purpose: string;
  interfaces: string[];
};

export const products: Product[] = [
  {
    slug: "iren",
    name: "IREN",
    eyebrow: "OPERATING INTELLIGENCE",
    category: "Control & orchestration",
    status: "OPERATIONAL",
    summary: "The control layer for RHEN runtime health, incidents, scheduling, research boundaries, protected configuration, and deliberate Work handoffs.",
    role: "IREN coordinates the canonical RHEN runtime without inheriting broker authority. It distinguishes healthy runtime state from operator-required configuration or release review and preserves incidents until recovery is verified.",
    capabilities: ["System health reduction", "Incident persistence", "Canonical scheduling", "Protected configuration review", "Research-control state", "Work / Codex handoffs", "Runtime topology", "Operator guidance"],
    technologies: ["Python 3.12", "FastAPI", "RHEN Core / SQLite", "Railway", "Cloudflare Workers"],
    evidence: ["IREN durable state", "Scheduler ledger", "Configuration fingerprints", "Runtime topology", "Command control projection"],
    boundaries: ["No broker-order authority", "No silent protected-configuration overwrite", "No automatic live-strategy promotion", "Public observability remains sanitized"],
    flow: ["OBSERVE", "REDUCE", "PERSIST", "SCHEDULE", "GATE", "ESCALATE", "VERIFY"],
    related: ["rhen", "nostra", "graen", "velum"]
  },
  {
    slug: "rhen",
    name: "RHEN",
    eyebrow: "MARKET SYSTEM",
    category: "Equity intelligence & execution",
    status: "LIVE PRODUCTION",
    summary: "A deterministic equity market system for broad discovery, candidate evaluation, risk, execution, reconciliation, telemetry, and exact post-event evidence.",
    role: "RHEN V4.3 operates long U.S. equities and ETFs across regular and extended sessions. Live authority is explicit; research, replay, forecasting, options research, shorting, and leverage expansion cannot silently become broker behavior.",
    capabilities: ["Whole-market hierarchical discovery", "Regular-session equity execution", "24/5 extended-equity observation and execution", "Candidate evaluation", "Risk controls", "Protective exits", "Broker reconciliation", "Canonical telemetry", "Exact forward outcomes", "Strategy versioning"],
    technologies: ["Python 3.12", "FastAPI", "SQLite", "Railway", "Docker", "Alpaca"],
    evidence: ["Canonical decision telemetry", "Closed-position ledger", "Exact decision price + completed-bar timestamp", "10/15-minute forward outcomes", "Daily research v1.7", "Normalized public performance"],
    boundaries: ["Long U.S. equities / ETFs only", "Options remain research-only", "Short equities disabled", "No leverage expansion", "Research output cannot silently authorize live behavior", "Replay and simulation are excluded from live performance"],
    flow: ["DISCOVER", "OBSERVE", "EVALUATE", "QUALIFY", "RISK", "EXECUTE", "PROTECT", "RECONCILE", "MEASURE", "RESEARCH"],
    related: ["iren", "nostra", "graen", "velum"]
  },
  {
    slug: "nostra",
    name: "NOSTRA",
    eyebrow: "FORWARD / FORECASTING",
    category: "Forecasting & measurement",
    status: "ACTIVE RESEARCH",
    summary: "The forecasting identity of ANEVUM's FORWARD program: regimes, forward horizons, uncertainty, outcome measurement, and calibration.",
    role: "NOSTRA turns retained equity-market state into explicit forecasts and regime evidence that can be measured after the event. Forecast state remains research evidence rather than trade authorization.",
    capabilities: ["Regime inference", "Forward-horizon state", "Prediction-state retention", "Confidence and uncertainty", "Forward-outcome measurement", "Calibration research", "Session-state analysis"],
    technologies: ["Python", "RHEN Core / SQLite", "Canonical telemetry"],
    evidence: ["NOSTRA session modules", "Forward-outcome evidence", "Post-event measurements", "Calibration state"],
    boundaries: ["Prediction is not certainty", "Forecast is not trade authorization", "Research forecasts do not modify live execution on their own"],
    flow: ["INPUT STATE", "FEATURES", "REGIME", "FORECAST", "CONFIDENCE", "FORWARD OUTCOME", "CALIBRATION"],
    related: ["iren", "rhen", "graen", "velum"]
  },
  {
    slug: "graen",
    name: "GRAEN",
    eyebrow: "MATHEMATICAL RESEARCH",
    category: "Mathematics & methodology",
    status: "ACTIVE RESEARCH",
    summary: "ANEVUM's mathematical and theoretical research program for methodology, falsification, bias control, dependence, strategy discovery, and validation.",
    role: "GRAEN formalizes what the system is allowed to infer from evidence. It keeps conjecture, development, validation, holdout, replay, and production review distinct.",
    capabilities: ["Strategy-family research", "Selection-bias analysis", "Multiplicity controls", "Dependence analysis", "Falsification criteria", "Simulation design", "Adaptive validation", "Promotion methodology", "Theory registry"],
    technologies: ["Python", "RHEN Core / SQLite", "Formal research artifacts", "Simulation tooling"],
    evidence: ["GRAEN problems and runs", "Multiplicity and dependence modules", "Adaptive validation", "Strategy-family registry", "Theory artifacts"],
    boundaries: ["Conjecture is not proof", "Development evidence is not validation", "Novelty is not claimed without review", "GRAEN cannot alter live trading authority"],
    flow: ["QUESTION", "FORMALIZE", "FALSIFY", "SIMULATE", "VALIDATE", "BOUND CLAIM", "HAND OFF"],
    related: ["iren", "rhen", "nostra", "velum"]
  },
  {
    slug: "velum",
    name: "VELUM",
    eyebrow: "REPLAY / SIMULATION",
    category: "Replay & counterfactual research",
    status: "RESEARCH / REPLAY",
    summary: "A broker-isolated replay and counterfactual system for historical reconstruction, simulation, friction stress, comparison, and failure analysis.",
    role: "VELUM reuses production research mathematics while remaining broker-isolated. It verifies equity candidates and alternate decisions without mixing simulated outcomes into live records.",
    capabilities: ["Historical replay", "Market reconstruction", "Counterfactual execution", "Equity replay", "Friction stress", "Execution-delay stress", "Reproducible reports", "Failure analysis"],
    technologies: ["Python", "FastAPI", "Railway", "Historical market data", "Replay engine"],
    evidence: ["Replay runs", "VELUM validation", "Counterfactual lab", "Delay and cost stress", "Failure evidence"],
    boundaries: ["No broker-order authority", "Simulated results remain separate from live performance", "Historical bars cannot reconstruct unknown intrabar ordering perfectly"],
    flow: ["CAPTURED STATE", "RECONSTRUCT", "REPLAY", "STRESS", "COUNTERFACTUAL", "COMPARE", "REPORT"],
    related: ["iren", "rhen", "nostra", "graen"]
  }
];

export const modules: Module[] = [
  { name: "Research Agent", category: "Research runtime", owner: "RHEN / GRAEN", status: "OPERATIONAL", purpose: "Runs bounded post-event evidence review inside the canonical runtime without broker authority.", interfaces: ["Canonical telemetry", "Daily research v1.7", "RHEN Core"] },
  { name: "Canonical Scheduler", category: "Operations", owner: "IREN", status: "OPERATIONAL", purpose: "Owns market-relative and interval workflows with durable job identity, recovery, and bounded retry behavior.", interfaces: ["Scheduler ledger", "Exchange calendar", "IREN incidents"] },
  { name: "Whole-Market Discovery", category: "Market discovery", owner: "RHEN", status: "OPERATIONAL", purpose: "Uses hierarchical Alpaca screening before bounded detailed market-data evaluation to expand the equity opportunity pool efficiently.", interfaces: ["Alpaca assets", "Most-active / movers seeds", "Dynamic universe"] },
  { name: "Extended Equity", category: "Market lane", owner: "RHEN", status: "OPERATIONAL", purpose: "Separates overnight, premarket, regular-session handoff, and after-hours state while preserving explicit execution authority.", interfaces: ["Equity sessions", "Extended scanner", "Broker order attribution"] },
  { name: "Pre-Open State", category: "Market-state research", owner: "RHEN / NOSTRA", status: "SHADOW", purpose: "Builds research-only pre-open state and later outcomes.", interfaces: ["Market data", "Pre-open snapshots", "Forward outcomes"] },
  { name: "Strategy Router", category: "Research controls", owner: "RHEN", status: "IMPLEMENTED", purpose: "Routes bounded strategy research while preserving production authorization boundaries.", interfaces: ["Strategy registry", "Research proposals", "Promotion controls"] },
  { name: "Promotion Gate", category: "Validation", owner: "GRAEN / RHEN", status: "IMPLEMENTED", purpose: "Requires explicit evidence gates and protected review before research can affect a production release.", interfaces: ["Evidence quality", "VELUM validation", "Strategy registry"] },
  { name: "Shadow Economics", category: "Post-event research", owner: "RHEN / GRAEN", status: "RESEARCH", purpose: "Measures cost-aware counterfactual economics against matured forward outcomes without altering original decisions.", interfaces: ["Candidate evidence", "Forward outcomes", "Execution-cost assumptions"] },
  { name: "Shadow Allocation", category: "Post-event research", owner: "RHEN / GRAEN", status: "RESEARCH", purpose: "Tests normalized allocation alternatives against matured outcomes while preserving the live allocation record.", interfaces: ["Candidate evidence", "Forward outcomes", "Allocation policy"] },
  { name: "Counterfactual Lab", category: "Simulation", owner: "VELUM / GRAEN", status: "RESEARCH", purpose: "Measures alternate bounded decisions against retained post-event evidence.", interfaces: ["Forward outcomes", "Adaptive policy", "Historical decisions"] },
  { name: "Forward Evidence Cohort", category: "Evidence integrity", owner: "RHEN / NOSTRA", status: "ACTIVE", purpose: "Admits only candidates with the original exact decision price and completed-bar timestamp into forward-outcome evaluation.", interfaces: ["Decision telemetry", "10/15-minute outcomes", "Research readiness"] },
  { name: "Evidence Pipeline", category: "Telemetry", owner: "RHEN", status: "OPERATIONAL", purpose: "Links candidates, signals, intents, orders, positions, exits, and forward outcomes.", interfaces: ["Decision telemetry", "Broker lifecycle", "Post-event evidence"] },
  { name: "Canonical Telemetry", category: "Data infrastructure", owner: "RHEN", status: "OPERATIONAL", purpose: "Durable bounded event and decision evidence across live and research workflows.", interfaces: ["Runtime emitters", "RHEN Core / SQLite", "Public projection"] },
  { name: "Cash Flow Accounting", category: "Performance integrity", owner: "RHEN", status: "OPERATIONAL", purpose: "Prevents external account flows from being misrepresented as system performance.", interfaces: ["Account activities", "Performance epochs", "Public performance"] },
  { name: "VELUM Core", category: "Replay", owner: "VELUM", status: "ACTIVE", purpose: "Broker-isolated replay engine reusing production research mathematics.", interfaces: ["Historical bars", "Production scoring math", "Replay reports"] }
];

export function productBySlug(slug?: string) {
  return products.find((product) => product.slug === slug);
}
