import { Link } from "react-router-dom";
import type { Product } from "../../data/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link className={"company-product-card product-" + product.slug} to={"/products/" + product.slug}>
      <header>
        <span>{product.category}</span>
        <b>{product.status}</b>
      </header>
      <div>
        <small>{product.eyebrow}</small>
        <h3>{product.name}</h3>
        <p>{product.summary}</p>
      </div>
      <footer>
        <span>{product.capabilities.slice(0, 3).join(" · ")}</span>
        <strong>OPEN SYSTEM ↗</strong>
      </footer>
    </Link>
  );
}
