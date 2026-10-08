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
  currentRelease?: string;
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
    currentRelease: "4.3.2",
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

export function productBySlug(slug?: string) {
  return productRegistry.find((product) => product.slug === slug);
}
