import { Link } from "react-router-dom";
import type { Product } from "../../data/products";
import SystemMark from "./SystemMark";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link className={"company-product-card product-" + product.slug + " status-" + product.status.toLowerCase().replaceAll(" ", "-").replaceAll("/", "")} to={"/products/" + product.slug}>
      <header>
        <span>{product.category}</span>
        <b><i aria-hidden="true" />{product.status}</b>
      </header>
      <div className="company-product-identity">
        <SystemMark system={product.name} decorative />
        <div>
          <small>{product.eyebrow}</small>
          <h3>{product.name}</h3>
        </div>
      </div>
      <p>{product.summary}</p>
      <div className="company-product-card-stats" aria-label={product.name + " specification summary"}>
        <span><b>{product.capabilities.length}</b> capabilities</span>
        <span><b>{product.technologies.length}</b> technologies</span>
        <span><b>{product.evidence.length}</b> evidence surfaces</span>
        <span><b>{product.boundaries.length}</b> explicit boundaries</span>
      </div>
      <footer>
        <span>{product.capabilities.slice(0, 3).join(" · ")}</span>
        <strong>OPEN SYSTEM ↗</strong>
      </footer>
    </Link>
  );
}
