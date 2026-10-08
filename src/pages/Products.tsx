import { Link } from "react-router-dom";
import PublicEvidenceSnapshot from "../components/PublicEvidenceSnapshot";
import SystemIcon from "../components/company/SystemIcon";
import { publicProducts } from "../data/products";

export default function Products() {
  const products = publicProducts();
  return (
    <div className="studio-page truth-products-page">
      <section className="truth-page-intro">
        <span>PRODUCT REGISTRY</span>
        <h1>Software earns its place here by existing.</h1>
        <p>Public products are registered only when there is a real implementation, an explicit status, and something useful to inspect or use.</p>
      </section>

      <section className="truth-product-list">
        {products.map((product,index) => (
          <article key={product.slug} className="truth-product-row">
            <div className="truth-product-identity"><span>{String(index+1).padStart(2,"0")}</span><SystemIcon system={product.system || "RHEN"} size="lg" /><div><strong>{product.name}</strong><small>{product.category}</small></div></div>
            <div className="truth-product-copy"><span>{product.lifecycle.toUpperCase()}</span><p>{product.oneLine}</p></div>
            <div className="truth-product-route"><span>{product.currentRelease ? "CURRENT "+product.currentRelease : "NO RELEASE"}</span><Link to={product.routes.home}>Open product →</Link></div>
          </article>
        ))}
      </section>

      {products.some((product)=>product.slug==="rhen") ? <PublicEvidenceSnapshot /> : null}

      <section className="truth-registry-note">
        <span>REGISTRY RULE</span><h2>No empty product cards.</h2><p>Future applications will appear here when they are actually built. Internal RHEN modules remain architecture, not separate consumer products.</p>
      </section>
    </div>
  );
}
