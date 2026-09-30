import { Link } from "react-router-dom";
import { products } from "../../data/products";

const positions: Record<string, { x: number; y: number }> = {
  graen: { x: 16, y: 20 },
  nostra: { x: 82, y: 20 },
  iren: { x: 50, y: 50 },
  rhen: { x: 18, y: 79 },
  velum: { x: 82, y: 79 }
};

export default function SystemTopology({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"company-topology " + (compact ? "is-compact" : "")}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="company-topology-lines">
        <path d="M20 24 C30 30 39 38 47 47" />
        <path d="M78 24 C68 31 60 39 53 47" />
        <path d="M21 75 C31 68 40 60 47 53" />
        <path d="M79 75 C69 68 60 60 53 53" />
        <path d="M22 22 C42 13 61 14 78 22" className="secondary" />
        <path d="M21 78 C40 88 61 87 79 78" className="secondary" />
      </svg>
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
            <span>{product.eyebrow}</span>
            <strong>{product.name}</strong>
            <small>{product.category}</small>
          </Link>
        );
      })}
      {!compact && (
        <div className="topology-caption">
          <span>ANEVUM SYSTEM TOPOLOGY</span>
          <p>Specialized systems exchange state and evidence without sharing authority indiscriminately.</p>
        </div>
      )}
    </div>
  );
}
