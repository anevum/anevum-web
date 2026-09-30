import { Link } from "react-router-dom";
import { products } from "../../data/products";
import SystemMark from "./SystemMark";

const positions: Record<string, { x: number; y: number }> = {
  iren: { x: 50, y: 13 },
  graen: { x: 23, y: 42 },
  nostra: { x: 77, y: 42 },
  rhen: { x: 28, y: 77 },
  velum: { x: 72, y: 77 }
};

const topologyTiers = [
  {
    key: "control",
    index: "01",
    label: "OPERATING INTELLIGENCE",
    description: "Coordinates state and keeps authority boundaries visible.",
    systems: ["iren"]
  },
  {
    key: "research",
    index: "02",
    label: "RESEARCH / FORECAST",
    description: "Challenges claims, estimates forward state, and produces promotion evidence.",
    systems: ["graen", "nostra"]
  },
  {
    key: "operation",
    index: "03",
    label: "OPERATE / REPLAY",
    description: "Runs bounded production behavior and reconstructs it outside the live record.",
    systems: ["rhen", "velum"]
  }
] as const;

const productBySlug = new Map(products.map((product) => [product.slug, product] as const));

export default function SystemTopology({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="company-topology topology-hierarchy is-compact">
        <svg viewBox="0 0 100 100" aria-hidden="true" className="company-topology-lines">
          <path d="M50 18 L50 28 L23 36" />
          <path d="M50 28 L77 36" />
          <path d="M23 48 L28 70" />
          <path d="M77 48 L72 70" />
          <path d="M29 45 C40 50 60 50 71 45" className="secondary" />
          <path d="M31 75 C43 65 57 65 69 75" className="secondary" />
          <path d="M50 28 L50 61 L31 72" className="tertiary" />
          <path d="M50 61 L69 72" className="tertiary" />
        </svg>
        <div className="topology-flow-label flow-research">RESEARCH / FORECAST</div>
        <div className="topology-flow-label flow-operate">OPERATE / REPLAY</div>
        {products.map((product) => {
          const pos = positions[product.slug];
          return (
            <Link
              key={product.slug}
              to={"/products/" + product.slug}
              className={"topology-node node-" + product.slug}
              style={{ left: pos.x + "%", top: pos.y + "%" }}
              aria-label={product.name + ": " + product.category}
            >
              <SystemMark system={product.name} decorative />
              <span>{product.eyebrow}</span>
              <strong>{product.name}</strong>
              <small>{product.category}</small>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="company-topology topology-layout-v2">
      <header className="topology-map-intro">
        <div>
          <span>SYSTEM MAP</span>
          <strong>Three layers, five specialized systems.</strong>
        </div>
        <p>
          This map shows responsibility, not a wiring diagram. Systems exchange evidence and state,
          but their authority does not collapse into one process.
        </p>
      </header>

      <div className="topology-stages">
        {topologyTiers.map((tier) => (
          <section className={"topology-stage topology-stage-" + tier.key} key={tier.key}>
            <header className="topology-stage-label">
              <span>{tier.index}</span>
              <div>
                <strong>{tier.label}</strong>
                <p>{tier.description}</p>
              </div>
            </header>
            <div className={"topology-tier topology-tier-" + tier.key}>
              {tier.systems.map((slug) => {
                const product = productBySlug.get(slug);
                if (!product) return null;
                return (
                  <Link
                    key={product.slug}
                    to={"/products/" + product.slug}
                    className={"topology-node node-" + product.slug}
                    aria-label={product.name + ": " + product.category}
                  >
                    <div className="topology-node-mark">
                      <SystemMark system={product.name} decorative />
                    </div>
                    <div className="topology-node-copy">
                      <span>{product.eyebrow}</span>
                      <strong>{product.name}</strong>
                      <small>{product.category}</small>
                      <p>{product.role}</p>
                    </div>
                    <i>OPEN SYSTEM →</i>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="topology-map-footer">
        <span>BOUNDARY PRINCIPLE</span>
        <p>
          Evidence may move across ANEVUM. Promotion authority, broker authority, and live records
          remain explicitly bounded.
        </p>
      </footer>
    </div>
  );
}
