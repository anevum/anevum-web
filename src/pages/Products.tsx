import { Link } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import { publicProducts } from "../data/products";
import { currentRhenRelease } from "../data/releases";

export default function Products() {
  const products = publicProducts();
  const release = currentRhenRelease();
  return (
    <div className="studio-page truth-products-page workshop-projects">
      <header className="workshop-page-intro">
        <p className="workshop-kicker">Projects</p>
        <h1>Things I’m working on.</h1>
        <p>Software I started because I wanted to use it, test an idea, or understand a problem. Every project here exists; its page explains what is available and what is still being built.</p>
      </header>
      <section className="workshop-section" aria-label="Registered projects">
        {products.length > 0 ? (
          <div className="workshop-project-list">
            {products.map((product) => (
              <article className="workshop-directory-row" key={product.slug}>
                <div className="workshop-directory-mark">
                  <SystemIcon system={product.system || "RHEN"} size="lg" />
                </div>
                <div className="workshop-directory-copy">
                  <div className="workshop-directory-title">
                    <h2>{product.name}</h2>
                    <span>{product.lifecycle} · {product.category}</span>
                  </div>
                  <p>{product.oneLine}</p>
                  <span className="workshop-directory-meta">
                    {product.slug === "rhen" ? "Current registered release " + release.version : product.hasApp ? "Application available" : "Project page available"}
                  </span>
                </div>
                <Link to={product.routes.home} className="workshop-directory-open" aria-label={"View " + product.name + " project"}>
                  View project <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        ) : <p className="workshop-empty">No public projects are registered yet.</p>}
      </section>
      <section className="workshop-endnote">
        <p>Project pages show actual functionality, research, updates, and limitations. I don’t add placeholder products to fill a catalog.</p>
        <Link to="/field-notes">Read the build notes <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
