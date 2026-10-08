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
};

export const productRegistry: ProductDefinition[] = [
  {
    slug: "rhen",
    name: "RHEN",
    system: "RHEN",
    visibility: "public",
    lifecycle: "active",
    category: "Markets / research",
    oneLine: "Live trading and research system for testing market ideas against real evidence and real operating constraints.",
    publicDataAdapter: "rhen-live",
    hasApp: false,
    supportModel: "free",
    routes: {
      home: "/products/rhen",
      evidence: "/products/rhen/evidence",
      releases: "/products/rhen/releases",
      architecture: "/products/rhen/architecture",
      notes: "/field-notes"
    }
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
  legacy("iren","IREN","CONTROL","Control & orchestration","Control, health, incidents, scheduling, and protected review."),
  legacy("graen","GRAEN","RESEARCH","Research","Bounded research, methodology, and evidence."),
  legacy("nostra","NOSTRA","FORECAST","Forecasting","Forward horizons, regimes, uncertainty, and outcome measurement."),
  legacy("velum","VELUM","REPLAY","Replay","Broker-isolated replay and counterfactual research.")
];

export const modules: Module[] = [
  { name:"Research Agent", category:"Research runtime", owner:"RHEN / GRAEN", status:"OPERATIONAL", purpose:"Runs bounded post-event evidence review without broker authority.", interfaces:["Canonical telemetry","RHEN Core"] },
  { name:"Canonical Scheduler", category:"Operations", owner:"IREN", status:"OPERATIONAL", purpose:"Owns durable market-relative and interval workflows.", interfaces:["Scheduler ledger","Exchange calendar"] }
];

export function productBySlug(slug?: string) {
  return products.find((product) => product.slug === slug);
}
