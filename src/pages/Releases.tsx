import { Link } from "react-router-dom";
import { rhenReleases } from "../data/releases";
import "../styles/releases.css";

function displayDate(value: string) {
  const date = new Date(value + "T12:00:00Z");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function Releases() {
  const [latest, ...archive] = rhenReleases;
  return (
    <section className="release-index docs-page">
      <header className="release-index-hero">
        <div>
          <p className="release-eyebrow">RHEN / RELEASE PROGRAM</p>
          <h1>Releases</h1>
          <p>
            Named system milestones that preserve what RHEN was, what changed, what was verified, what remained unknown, and why the next version exists.
          </p>
        </div>
        <div className="release-index-mark" aria-hidden="true"><span>R</span><i /></div>
      </header>

      {latest && (
        <Link className="release-feature" to={`/releases/${latest.slug}`}>
          <div className="release-feature-meta">
            <span>CURRENT RELEASE</span>
            <strong>RHEN {latest.version}</strong>
            <small>{displayDate(latest.date)}</small>
          </div>
          <div className="release-feature-title">
            <span>{latest.lifecycle}</span>
            <h2>{latest.codename}</h2>
            <p>{latest.headline}</p>
          </div>
          <div className="release-feature-arrow">OPEN <i>↗</i></div>
        </Link>
      )}

      <section className="release-standard">
        <div className="release-section-label"><span>01</span><strong>THE RELEASE STANDARD</strong></div>
        <div className="release-standard-grid">
          <article><small>PATCH</small><strong>0.8.3</strong><p>Bug fixes, telemetry corrections, documentation, and operational hardening. Normally retains the active codename.</p></article>
          <article><small>MINOR</small><strong>0.9.0</strong><p>A meaningful capability or operating-model change. Receives release notes and normally a new codename.</p></article>
          <article><small>MAJOR</small><strong>1.0.0</strong><p>A generational milestone with a full release packet, immutable manifest, evidence summary, limitations, and new codename.</p></article>
        </div>
      </section>

      <section className="release-archive">
        <div className="release-section-label"><span>02</span><strong>ARCHIVE</strong></div>
        {archive.length ? archive.map((release) => (
          <Link key={release.slug} to={`/releases/${release.slug}`} className="release-archive-row">
            <span>RHEN {release.version}</span><strong>{release.codename}</strong><small>{release.lifecycle}</small><time>{displayDate(release.date)}</time>
          </Link>
        )) : <div className="release-empty">AURORA establishes the archive. Future named releases will appear here.</div>}
      </section>
    </section>
  );
}
