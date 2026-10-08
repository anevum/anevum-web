import { Link } from "react-router-dom";
import PublicEvidenceSnapshot from "../components/PublicEvidenceSnapshot";
import SystemIcon from "../components/company/SystemIcon";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { fieldNotes } from "../data/fieldNotes";
import { currentRhenRelease } from "../data/releases";
import { publicProducts } from "../data/products";

function ago(value?: string | null, now = Date.now()) {
  if (!value) return "—";
  const ms = now - new Date(value).getTime();
  if (!Number.isFinite(ms)) return "—";
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1) return "now";
  if (m < 60) return m + "m";
  if (m < 1440) return Math.floor(m / 60) + "h";
  return Math.floor(m / 1440) + "d";
}

export default function HomeCompany() {
  const release = currentRhenRelease();
  const products = publicProducts();
  const notes = [...fieldNotes].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);
  const { data, error, now } = useLiveTrading(5000);
  const events = (data?.events || []).slice(0,6);

  return (
    <div className="studio-home truth-home">
      <section className="truth-hero">
        <div className="truth-hero-copy">
          <span className="truth-kicker">INDEPENDENT SOFTWARE / BUILT IN PUBLIC</span>
          <h1>Useful software, built against real problems.</h1>
          <p>ANEVUM builds practical tools around money, automation, research, and real-world data. The work stays small enough to inspect and public enough to challenge.</p>
          <div className="studio-actions">
            <Link className="studio-button primary" to="/products">Browse products <span>→</span></Link>
            <Link className="studio-button" to="/feed">See what changed</Link>
          </div>
          <div className="truth-hero-flags">
            <span><i /> REAL DATA</span>
            <span><i /> PUBLIC EVIDENCE</span>
            <span><i /> VERSIONED RELEASES</span>
          </div>
        </div>
        <PublicEvidenceSnapshot compact />
      </section>

      <section className="truth-live-row">
        <header><div><i className={error ? "degraded" : "live"} /><span>{error ? "PUBLIC FEED DEGRADED" : "WHAT'S HAPPENING NOW"}</span></div><Link to="/feed">Open feed →</Link></header>
        <div className="truth-live-items">
          {events.length ? events.map((event,index) => (
            <article key={String(event.at || index)+String(event.type || event.kind || "")}>
              <time>{ago(event.at,now)}</time><span>RHEN</span><strong>{event.label || event.type || event.kind || "Runtime observation"}</strong>
            </article>
          )) : (
            <article className="empty"><time>—</time><span>RHEN</span><strong>{error || "No current public runtime events. Static records remain available."}</strong></article>
          )}
        </div>
      </section>

      <section className="studio-section truth-products-section">
        <header className="truth-section-head"><div><span>PRODUCTS</span><h2>Things that actually exist.</h2></div><Link to="/products">All products →</Link></header>
        <div className="truth-product-grid">
          {products.map((product) => (
            <Link to={product.routes.home} className="truth-product-card" key={product.slug}>
              <header><SystemIcon system={product.system || "RHEN"} size="md" /><span>{product.lifecycle.toUpperCase()}</span></header>
              <h3>{product.name}</h3><p>{product.oneLine}</p>
              <dl><div><dt>RELEASE</dt><dd>{product.slug === "rhen" ? release.version : "—"}</dd></div><div><dt>CATEGORY</dt><dd>{product.category}</dd></div></dl>
              <footer><span>REAL PRODUCT</span><b>OPEN ↗</b></footer>
            </Link>
          ))}
          <article className="truth-product-card registry-empty">
            <header><span>REGISTRY</span></header>
            <h3>Next product goes here when it exists.</h3>
            <p>ANEVUM does not publish placeholder products just to fill a grid.</p>
            <footer><span>{products.length} PUBLIC PRODUCT{products.length === 1 ? "" : "S"}</span></footer>
          </article>
        </div>
      </section>

      <section className="studio-section truth-notes-section">
        <header className="truth-section-head"><div><span>FIELD NOTES</span><h2>The build record.</h2></div><Link to="/field-notes">All notes →</Link></header>
        <div className="truth-note-grid">
          {notes.map((note) => (
            <Link key={note.slug} to={"/field-notes/"+note.slug}>
              <time>{note.date}</time><span>{note.type}</span><h3>{note.title}</h3><p>{note.summary}</p><footer>{note.readMinutes} MIN READ <b>↗</b></footer>
            </Link>
          ))}
        </div>
      </section>

      <section className="truth-release-strip">
        <div><span>CURRENT RELEASE</span><strong>RHEN {release.version} · {release.codename}</strong><p>{release.headline}</p></div>
        <div className="truth-release-facts"><span>LIVE AUTHORITY · LONG U.S. EQUITIES + ETFs</span><span>OPTIONS · RESEARCH ONLY</span><span>PROMOTION · MANUAL</span></div>
        <Link to="/products/rhen/releases">Release record →</Link>
      </section>

      <section className="truth-independent-band">
        <span>INDEPENDENT SOFTWARE</span>
        <h2>No fake scale. No fake data.</h2>
        <p>ANEVUM is independently built and operated. Support and paid access will appear only when there is a real mechanism and a real product value behind them.</p>
        <Link to="/about">About ANEVUM →</Link>
      </section>
    </div>
  );
}
