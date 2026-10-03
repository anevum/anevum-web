import ProductCard from "../components/company/ProductCard";
import ModuleGrid from "../components/company/ModuleGrid";
import SystemTopology from "../components/company/SystemTopology";
import PublicSystemStatus from "../components/PublicSystemStatus";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { products } from "../data/products";

export default function Products() {
  const { data } = useLiveTrading(10000);
  return (
    <div className="company-page">
      <section className="company-page-hero">
        <span>PRODUCT PORTFOLIO</span>
        <h1>Systems with explicit jobs and explicit boundaries.</h1>
        <p>ANEVUM is organized around five flagship systems and a supporting package ecosystem. Product status describes implementation maturity, not commercial availability or performance.</p>
      </section>
      <section className="company-section no-top-border"><PublicSystemStatus data={data} /></section>
      <section className="company-section"><SystemTopology /></section>
      <section className="company-section">
        <header className="company-section-head"><span>FLAGSHIP SYSTEMS</span><h2>Portfolio</h2></header>
        <div className="company-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      </section>
      <section className="company-section">
        <header className="company-section-head">
          <span>PACKAGE ECOSYSTEM</span>
          <h2>Supporting components.</h2>
          <p>These are implemented modules, research layers, and production infrastructure. They are not promoted into separate products simply because they have names in the codebase.</p>
        </header>
        <ModuleGrid />
      </section>
    </div>
  );
}
