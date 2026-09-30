export type ProductStatus = "OPERATIONAL" | "LIVE PRODUCTION" | "ACTIVE RESEARCH" | "RESEARCH / REPLAY";

export type Product = {
  slug: "iren" | "rhen" | "nostra" | "graen" | "velum";
  name: string;
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
    category: "Orchestration",
    status: "OPERATIONAL",
    summary: "The coordination layer for ANEVUM systems, operating state, research state, and protected operator workflows.",
    role: "IREN provides the system-level view across RHEN, NOSTRA, GRAEN, and VELUM without collapsing their different authorities. It is a control and orchestration surface, not a claim of general intelligence.",
    capabilities: ["System state coordination", "Research-state visibility", "Runtime and service topology", "Protected operator workflows", "Public/private surface separation", "Cross-system status presentation"],
    technologies: ["React", "TypeScript", "Cloudflare Workers", "Supabase", "PostgreSQL"],
    evidence: ["Protected Command surface", "Public system state", "Release and research registries", "Runtime service integrations"],
    boundaries: ["No direct public access to operator controls", "No authority to bypass RHEN risk gates", "No claim of AGI or human-equivalent reasoning"],
    flow: ["OBSERVE STATE", "NORMALIZE", "COORDINATE", "ROUTE", "SURFACE", "AUDIT"],
    related: ["rhen", "nostra", "graen", "velum"]
  },
  {
    slug: "rhen",
    name: "RHEN",
    eyebrow: "MARKET SYSTEM",
    category: "Market intelligence & execution",
    status: "LIVE PRODUCTION",
    summary: "A deterministic market system for observation, candidate evaluation, risk, execution, reconciliation, telemetry, and evidence.",
    role: "RHEN runs bounded market workflows with explicit live/research separation. Equities and crypto are independent market lanes with separate evidence attribution.",
    capabilities: ["Market observation and scanning", "Candidate evaluation", "Forecast inputs", "Qualification and allocation", "Risk controls", "Execution and protective exits", "Broker reconciliation", "Canonical telemetry", "Post-event evidence", "Strategy versioning"],
    technologies: ["Python 3.12", "FastAPI", "PostgreSQL", "Supabase", "Railway", "Docker", "Alpaca"],
    evidence: ["Canonical decision telemetry", "Closed-position ledger", "Forward outcomes", "Research reports", "Live strategy registry", "Public normalized performance"],
    boundaries: ["Private thresholds and order details remain private", "Research output cannot silently authorize live behavior", "Replay and simulation are excluded from live performance"],
    flow: ["OBSERVE", "EVALUATE", "FORECAST", "QUALIFY", "RISK", "EXECUTE", "PROTECT", "RECONCILE", "MEASURE", "RESEARCH"],
    related: ["iren", "nostra", "graen", "velum"]
  },
  {
    slug: "nostra",
    name: "NOSTRA",
    eyebrow: "FORWARD / FORECASTING",
    category: "Forecasting & prediction research",
    status: "ACTIVE RESEARCH",
    summary: "The forecasting identity of ANEVUM's formal FORWARD program: regimes, forward horizons, uncertainty, outcomes, and calibration.",
    role: "NOSTRA turns retained market state into explicit forecasts that can be measured after the event. A forecast is evidence for research; it is not trade authorization.",
    capabilities: ["Regime inference", "Forward-horizon state", "Prediction-state retention", "Confidence and uncertainty", "Forward-outcome measurement", "Calibration research", "Equities and crypto research lanes"],
    technologies: ["Python", "PostgreSQL", "Supabase", "Canonical telemetry"],
    evidence: ["NOSTRA regime/session modules", "Crypto regime methodology", "Forward-outcome tables", "Post-event evidence"],
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
    summary: "ANEVUM's mathematical and theoretical research program for methodology, falsification, bias control, dependence, and validation.",
    role: "GRAEN formalizes what the system is allowed to infer from evidence. It keeps conjecture, development, validation, and accepted evidence distinct.",
    capabilities: ["Selection-bias analysis", "Multiplicity controls", "Dependence analysis", "Falsification criteria", "Simulation design", "Adaptive validation", "Promotion methodology", "Theory registry"],
    technologies: ["Python", "PostgreSQL", "Formal research artifacts", "Simulation tooling"],
    evidence: ["MATH-001 artifacts", "Multiplicity and dependence modules", "Adaptive validation", "Theory registry and public theory feed"],
    boundaries: ["Conjecture is not proof", "Development evidence is not validation", "Novelty is not claimed without review", "Theory does not directly alter live trading"],
    flow: ["QUESTION", "FORMALIZE", "FALSIFY", "SIMULATE", "VALIDATE", "BOUND CLAIM", "HAND OFF"],
    related: ["iren", "rhen", "nostra", "velum"]
  },
  {
    slug: "velum",
    name: "VELUM",
    eyebrow: "REPLAY / SIMULATION",
    category: "Replay & counterfactual research",
    status: "RESEARCH / REPLAY",
    summary: "A broker-isolated replay and counterfactual system for historical reconstruction, simulation, comparison, and failure analysis.",
    role: "VELUM reuses production research mathematics while remaining broker-isolated. It supports equities and continuously traded crypto research without mixing simulated outcomes into live records.",
    capabilities: ["Historical replay", "Market reconstruction", "Counterfactual execution", "Equities replay", "Crypto replay", "Cost and slippage assumptions", "Reproducible reports", "Failure analysis"],
    technologies: ["Python", "FastAPI", "Railway", "Historical market data", "Replay engine"],
    evidence: ["Replay engine", "ContinuousReplayEngine", "VELUM service runtime", "Crypto challenger replay", "Counterfactual lab"],
    boundaries: ["No broker-order authority", "Simulated results remain separate from live performance", "Historical bars cannot reconstruct unknown intrabar ordering perfectly"],
    flow: ["CAPTURED STATE", "RECONSTRUCT", "REPLAY", "COUNTERFACTUAL", "COMPARE", "REPORT"],
    related: ["iren", "rhen", "nostra", "graen"]
  }
];

export const modules: Module[] = [
  { name: "Research Agent", category: "Research service", owner: "RHEN / GRAEN", status: "OPERATIONAL", purpose: "Runs bounded post-event research workflows and produces durable research artifacts.", interfaces: ["Canonical telemetry", "Research scheduler", "PostgreSQL"] },
  { name: "Agent Support Layer", category: "Operations", owner: "IREN / RHEN", status: "OPERATIONAL", purpose: "Integrity, registry, deployment-role, snapshot, and escalation support for research services.", interfaces: ["Research Agent", "Railway roles", "Alert state"] },
  { name: "ADS", category: "Scoring research", owner: "RHEN / NOSTRA", status: "RESEARCH ONLY", purpose: "Retains shadow scores and attribution evidence without direct execution authority.", interfaces: ["Candidate evaluations", "Attribution", "Forward outcomes"] },
  { name: "Pre-Open State", category: "Market-state research", owner: "RHEN / NOSTRA", status: "SHADOW", purpose: "Builds research-only pre-open state and forward outcomes.", interfaces: ["Market data", "Pre-open snapshots", "Forward outcomes"] },
  { name: "Strategy Router", category: "Research controls", owner: "RHEN", status: "IMPLEMENTED", purpose: "Routes bounded strategy research while preserving production authorization boundaries.", interfaces: ["Strategy registry", "Research proposals", "Promotion controls"] },
  { name: "Promotion Gate", category: "Validation", owner: "GRAEN / RHEN", status: "IMPLEMENTED", purpose: "Requires explicit evidence gates before research can be considered for promotion.", interfaces: ["Evidence quality", "Adaptive shadow", "Strategy registry"] },
  { name: "Adaptive Shadow", category: "Validation", owner: "GRAEN / RHEN", status: "RESEARCH", purpose: "Evaluates bounded adaptive proposals in shadow before any production consideration.", interfaces: ["Candidate outcomes", "Strategy health", "Promotion gate"] },
  { name: "Counterfactual Lab", category: "Simulation", owner: "VELUM / GRAEN", status: "RESEARCH", purpose: "Measures alternate bounded decisions against retained post-event evidence.", interfaces: ["Forward outcomes", "Adaptive policy", "Historical decisions"] },
  { name: "Evidence Pipeline", category: "Telemetry", owner: "RHEN", status: "OPERATIONAL", purpose: "Links candidates, signals, intents, orders, positions, exits, and forward outcomes.", interfaces: ["Decision telemetry", "Broker lifecycle", "Post-event evidence"] },
  { name: "Post-Event Evidence", category: "Analytics", owner: "RHEN / NOSTRA", status: "OPERATIONAL", purpose: "Computes forward outcomes after decisions without feeding them back into the original live decision.", interfaces: ["Candidate evaluations", "Market data", "Forward-outcome store"] },
  { name: "Research Scheduler", category: "Operations", owner: "Research Agent", status: "OPERATIONAL", purpose: "Runs research work on bounded schedules and evidence readiness.", interfaces: ["Readiness state", "Agent runner", "Railway service"] },
  { name: "Strategy Lab", category: "Research tooling", owner: "RHEN / VELUM", status: "RESEARCH", purpose: "Compares strategy variants under common historical data and friction assumptions.", interfaces: ["Replay engine", "Historical bars", "Strategy variants"] },
  { name: "Canonical Telemetry", category: "Data infrastructure", owner: "RHEN", status: "OPERATIONAL", purpose: "Durable event and decision evidence across live and research workflows.", interfaces: ["Runtime emitters", "PostgreSQL", "Public projection"] },
  { name: "Cash Flow Accounting", category: "Performance integrity", owner: "RHEN", status: "OPERATIONAL", purpose: "Prevents external account flows from being misrepresented as system performance.", interfaces: ["Account activities", "Performance epochs", "Public performance"] },
  { name: "Crypto Layer", category: "Market lane", owner: "RHEN", status: "LIVE SAMPLE PENDING", purpose: "Separates continuous-market features, execution attribution, evidence, and calibration from equities.", interfaces: ["Crypto market data", "Execution adapter", "Market-lane telemetry"] },
  { name: "Crypto NOSTRA", category: "Forecasting research", owner: "NOSTRA", status: "RESEARCH", purpose: "Infers descriptive crypto regimes from volatility, liquidity, activity, momentum, and time state.", interfaces: ["Crypto feature state", "BTC/ETH context", "Regime evidence"] },
  { name: "Crypto GRAEN", category: "Validation", owner: "GRAEN", status: "RESEARCH", purpose: "Defines crypto-specific promotion evidence floors and validation requirements.", interfaces: ["Crypto evidence packet", "Promotion metrics", "Regime coverage"] },
  { name: "Crypto ADS", category: "Scoring research", owner: "RHEN / NOSTRA", status: "RESEARCH", purpose: "Provides crypto scoring research without live authority.", interfaces: ["Crypto features", "Prediction state", "Attribution evidence"] },
  { name: "VELUM Core", category: "Replay", owner: "VELUM", status: "ACTIVE", purpose: "Broker-isolated replay engine reusing production research mathematics.", interfaces: ["Historical bars", "Production scoring math", "Replay reports"] }
];

export function productBySlug(slug?: string) {
  return products.find((product) => product.slug === slug);
}
