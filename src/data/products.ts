export type ProductLifecycle = "experiment" | "development" | "active" | "maintenance" | "archived";
export type ProductVisibility = "public" | "unlisted" | "private";
export type ProductAccess = "public" | "account" | "paid" | "private";
export type ProductSupportModel = "free" | "supporter" | "paid" | "mixed";

export type ProductDefinition = {
  slug: string;
  name: string;
  system?: "RHEN" | "IREN" | "GRAEN" | "NOSTRA" | "VELUM";
  visibility: ProductVisibility;
  lifecycle: ProductLifecycle;
  category: string;
  oneLine: string;
  publicDataAdapter?: "rhen-live";
  hasApp: boolean;
  appAccess?: ProductAccess;
  supportModel: ProductSupportModel;
  routes: {
    home: string;
    app?: string;
    evidence?: string;
    releases?: string;
    architecture?: string;
    notes?: string;
  };
  memberFeatures?: { id: string; name: string; description: string; route: string }[];
};

export const productRegistry: ProductDefinition[] = [
  {
    slug: "rhen",
    name: "RHEN",
    system: "RHEN",
    visibility: "public",
    lifecycle: "development",
    category: "Markets / research",
    oneLine: "Markets research application being rebuilt with private member workspaces, measured evidence, and separately gated execution.",
    publicDataAdapter: "rhen-live",
    hasApp: false,
    appAccess: "account",
    supportModel: "free",
    routes: {
      home: "/products/rhen",
      app: "/apps/rhen",
      evidence: "/products/rhen/evidence",
      releases: "/products/rhen/releases",
      architecture: "/products/rhen/architecture",
      notes: "/field-notes"
    },
    memberFeatures: [
      { id: "evidence", name: "Evidence", description: "Measured, public-safe performance and source freshness.", route: "/apps/rhen/evidence" },
      { id: "research", name: "Research", description: "Published experiments, decisions, and build notes.", route: "/apps/rhen/research" },
      { id: "updates", name: "Updates", description: "Release history and changes to the project.", route: "/apps/rhen/updates" }
    ]
  }
];

export function publicProducts() {
  return productRegistry.filter((product) => product.visibility === "public");
}

export function publicProductBySlug(slug?: string) {
  return productRegistry.find((product) => product.slug === slug);
}

/* Legacy internal topology compatibility.
   These records are not the public product registry and are not routed as products. */
export type Product = {
  slug: "iren" | "rhen" | "nostra" | "graen" | "velum";
  name: "IREN" | "RHEN" | "NOSTRA" | "GRAEN" | "VELUM";
  eyebrow: string;
  category: string;
  status: string;
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

const legacy = (
  slug: Product["slug"],
  name: Product["name"],
  eyebrow: string,
  category: string,
  role: string
): Product => ({
  slug, name, eyebrow, category, status: "INTERNAL MODULE",
  summary: role, role,
  capabilities: ["Observe canonical state", "Produce bounded evidence", "Preserve explicit authority boundaries"],
  technologies: ["Python", "RHEN Core", "Railway"],
  evidence: ["Canonical telemetry", "Durable research state"],
  boundaries: ["No silent authority expansion", "Public projection remains sanitized"],
  flow: ["OBSERVE", "MEASURE", "PERSIST", "REVIEW"],
  related: ["rhen","iren","graen","nostra","velum"].filter((item) => item !== slug)
});

export const products: Product[] = [
  legacy("rhen","RHEN","MARKET SYSTEM","Equity intelligence & execution","Canonical execution and market-observation runtime."),
  legacy("iren","IREN","CONTROL","Control & orchestration","Deterministic health, incidents, scheduling, configuration drift, recovery, and protected operator review."),
  legacy("graen","GRAEN","RESEARCH","Research","On-demand research methodology for turning canonical evidence into bounded experiments and deliberate AI-assisted investigation."),
  legacy("nostra","NOSTRA","FORECAST","Forecasting","Embedded numerical forecasting, point-in-time baselines, calibration, and matured-outcome scoring."),
  legacy("velum","VELUM","REPLAY","Replay","On-demand broker-isolated replay, friction stress, and counterfactual validation.")
];

export const modules: Module[] = [
  { name:"Deterministic Evidence Review", category:"Embedded research", owner:"RHEN Core", status:"EMBEDDED", purpose:"Compiles and classifies post-session evidence without model calls, broker authority, or automatic promotion.", interfaces:["Canonical telemetry","RHEN Core"] },
  { name:"AI Research / Work", category:"On-demand research", owner:"GRAEN / operator", status:"ON DEMAND", purpose:"Uses deliberate model-assisted research only when canonical evidence warrants a bounded investigation.", interfaces:["Evidence packages","Experiment specifications"] },
  { name:"Canonical Scheduler", category:"Operations", owner:"IREN", status:"OPERATIONAL", purpose:"Owns durable market-relative and interval workflows without requiring model execution.", interfaces:["Scheduler ledger","Exchange calendar"] }
];

export function productBySlug(slug?: string) {
  return products.find((product) => product.slug === slug);
}

