import { Link } from "react-router-dom";
import { currentRhenRelease } from "../data/releases";

export default function Products() {
  const release = currentRhenRelease();

  return (
    <div className="studio-page studio-products-page">
      <section className="studio-page-hero">
        <span>PRODUCTS / EXPERIMENTS</span>
        <h1>A portfolio that can grow without turning ANEVUM into one product.</h1>
        <p>
          RHEN is the first serious system. Future software can stand beside it when there is a real problem worth solving,
          a useful first version worth shipping, and enough evidence to keep going.
        </p>
      </section>

      <section className="studio-product-feature">
        <div className="studio-product-feature-copy">
          <div className="studio-product-meta"><span>01 / FLAGSHIP</span><b>ACTIVE R&amp;D</b></div>
          <h2>RHEN</h2>
          <p>
            A live automated trading and research system used to study whether market ideas can produce repeatable,
            measurable edge after friction, timing, risk, and real-world operating constraints.
          </p>
          <div className="studio-product-actions">
            <Link className="studio-button primary" to="/products/rhen">Explore RHEN <span>→</span></Link>
            <Link className="studio-button" to="/live">Public evidence</Link>
          </div>
        </div>
        <div className="studio-product-spec">
          <div><span>CURRENT RELEASE</span><strong>{release.version}</strong></div>
          <div><span>DOMAIN</span><strong>Markets / research</strong></div>
          <div><span>LIVE AUTHORITY</span><strong>Long U.S. equities + ETFs</strong></div>
          <div><span>STATUS</span><strong>Operating + validating</strong></div>
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading">
          <span>NEXT</span>
          <div><h2>Smaller tools are part of the plan.</h2><p>The next product does not need another giant architecture. It needs one useful job.</p></div>
        </header>
        <div className="studio-portfolio-lanes">
          <article><span>FINANCIAL TOOLS</span><h3>Make personal money easier to operate.</h3><p>Planning, cash flow, investing support, automation, and other tools that reduce recurring financial attention.</p><b>FUTURE PRODUCT LANE</b></article>
          <article><span>UTILITIES</span><h3>Small software can be enough.</h3><p>Focused tools that solve one irritating problem well can ship without becoming a platform or a permanent commitment.</p><b>OPEN LANE</b></article>
          <article><span>EXPERIMENTS</span><h3>Ideas have to earn their way forward.</h3><p>Prototype quickly, use the thing, measure whether it helps, then either improve it, publish it, or stop.</p><b>LAB MINDSET</b></article>
        </div>
      </section>

      <section className="studio-page-cta">
        <span>THE RULE</span>
        <h2>Build the smallest thing that meaningfully removes a burden.</h2>
        <p>That keeps ANEVUM flexible enough to make more software without letting new projects bury the work already worth finishing.</p>
        <Link to="/research">See what I&apos;m working on now →</Link>
      </section>
    </div>
  );
}
