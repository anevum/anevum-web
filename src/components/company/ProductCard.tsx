import { Link } from "react-router-dom";
import type { Product } from "../../data/products";
import SystemMark from "./SystemMark";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link className={"company-product-card product-" + product.slug} to={"/products/" + product.slug}>
      <header>
        <span>{product.category}</span>
        <b>{product.status}</b>
      </header>
      <div className="company-product-identity">
        <SystemMark system={product.name} decorative />
        <div>
          <small>{product.eyebrow}</small>
          <h3>{product.name}</h3>
        </div>
      </div>
      <p>{product.summary}</p>
      <footer>
        <span>{product.capabilities.slice(0, 3).join(" · ")}</span>
        <strong>OPEN SYSTEM ↗</strong>
      </footer>
    </Link>
  );
}
