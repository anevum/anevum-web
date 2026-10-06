import { Link } from "react-router-dom";
import { products } from "../../data/products";
import SystemIcon from "./SystemIcon";

const positions: Record<string, { x: number; y: number }> = {
  rhen: { x: 50, y: 20 },
  iren: { x: 24, y: 54 },
  graen: { x: 76, y: 54 },
  nostra: { x: 24, y: 80 },
  velum: { x: 76, y: 80 }
};

export default function SystemTopology({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"company-topology topology-hierarchy " + (compact ? "is-compact" : "")}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="company-topology-lines">
        <path d="M50 27 L24 47" />
        <path d="M50 27 L76 47" />
        <path d="M50 27 L24 73" className="secondary" />
        <path d="M50 27 L76 73" className="secondary" />
      </svg>
      <div className="topology-flow-label flow-research">CONTROL / RESEARCH</div>
      <div className="topology-flow-label flow-operate">FORECAST / REPLAY</div>
      {products.map((product) => {
        const pos = positions[product.slug];
        return (
          <Link key={product.slug} to={"/products/" + product.slug} className={"topology-node node-" + product.slug} style={{ left: pos.x + "%", top: pos.y + "%" }} aria-label={product.name + ": " + product.category}>
            <SystemIcon system={product.name} size={compact ? "sm" : "md"} />
            <span>{product.eyebrow}</span>
            <strong>{product.name}</strong>
            <small>{product.category}</small>
          </Link>
        );
      })}
      {!compact && <div className="topology-caption"><span>ANEVUM / RHEN MODULE TOPOLOGY</span><p>RHEN is the production system. IREN / Control, GRAEN / Research, NOSTRA / Forecast, and VELUM / Replay remain named modules inside it, with distinct responsibilities and shared RHEN visual identity.</p></div>}
    </div>
  );
}
