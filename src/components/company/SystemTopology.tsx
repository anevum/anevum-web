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

export default function SystemTopology({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"company-topology topology-hierarchy " + (compact ? "is-compact" : "")}>
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
          <Link key={product.slug} to={"/products/" + product.slug} className={"topology-node node-" + product.slug} style={{ left: pos.x + "%", top: pos.y + "%" }} aria-label={product.name + ": " + product.category}>
            <SystemMark system={product.name} decorative />
            <span>{product.eyebrow}</span>
            <strong>{product.name}</strong>
            <small>{product.category}</small>
          </Link>
        );
      })}
      {!compact && <div className="topology-caption"><span>ANEVUM SYSTEM TOPOLOGY</span><p>IREN coordinates state. Research and forecasting challenge the system. RHEN operates. VELUM replays. Evidence moves between them without collapsing authority.</p></div>}
    </div>
  );
}
