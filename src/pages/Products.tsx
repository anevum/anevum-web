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
        <p className="workshop-kicker">ANEVUM / Applications</p>
        <h1>Software you can explore.</h1>
        <p>Browse the applications being developed at ANEVUM. Each page distinguishes what works now, what is under evaluation, and what is still planned.</p>
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
                  Explore application <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        ) : <p className="workshop-empty">No public projects are registered yet.</p>}
      </section>
      <section className="workshop-endnote">
        <p>ANEVUM shows actual applications, measurements, research, and limitations. Planned capabilities are identified rather than presented as finished features.</p>
        <Link to="/field-notes">Read the build notes <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
