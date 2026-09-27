import { Link, Navigate, useParams } from "react-router-dom";
import { rhenReleaseBySlug } from "../data/releases";
import "../styles/releases.css";

function displayDate(value: string) {
  const date = new Date(value + "T12:00:00Z");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function ReleaseDetail() {
  const { slug } = useParams();
  const release = rhenReleaseBySlug(slug);
  if (!release) return <Navigate to="/releases" replace />;

  return (
    <article className="release-detail docs-page">
      <header className="release-hero">
        <div className="release-hero-copy">
          <Link className="release-back" to="/releases">RHEN / RELEASES</Link>
          <div className="release-version">RHEN {release.version} / {release.releaseClass}</div>
          <h1>{release.codename}</h1>
          <p>{release.abstract}</p>
          <div className="release-badges">{release.badges.map((badge) => <span key={badge}>{badge}</span>)}</div>
        </div>
        <aside className="release-identity">
          <div><small>LIFECYCLE</small><strong>{release.lifecycle}</strong></div>
          <div><small>RELEASED</small><strong>{displayDate(release.date)}</strong></div>
          <div><small>SOURCE</small><strong>{release.sourceCommit.slice(0, 12)}</strong></div>
          <a href={release.pdfPath} target="_blank" rel="noreferrer">DOWNLOAD PDF <span>↗</span></a>
        </aside>
      </header>

      <section className="release-thesis">
        <span>RELEASE THESIS</span>
        <h2>{release.thesis}</h2>
      </section>

      <section className="release-section">
        <div className="release-section-label"><span>01</span><strong>CAPABILITY BOUNDARY</strong></div>
        <div className="release-capability-grid">
          {release.capabilities.map((item) => <article key={item.label}><small>{item.label}</small><h3>{item.title}</h3><p>{item.body}</p></article>)}
        </div>
      </section>

      <section className="release-section">
        <div className="release-section-label"><span>02</span><strong>ARCHITECTURE</strong></div>
        <div className="release-architecture">
          {release.architecture.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.title}</strong><p>{item.body}</p></article>)}
        </div>
      </section>

      <section className="release-section">
        <div className="release-section-label"><span>03</span><strong>VERIFICATION</strong></div>
        <div className="release-verification-grid">
          {release.verification.map((item) => <article key={item.label}><small>{item.label}</small><strong>{item.value}</strong><p>{item.body}</p></article>)}
        </div>
      </section>

      <section className="release-section">
        <div className="release-section-label"><span>04</span><strong>KNOWN LIMITATIONS</strong></div>
        <div className="release-limitations">
          {release.limitations.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.body}</p></div></article>)}
        </div>
      </section>

      <section className="release-section release-changelog-section">
        <div className="release-section-label"><span>05</span><strong>SELECTED CHANGELOG</strong></div>
        <div className="release-changelog">
          {release.changelog.map((item) => <article key={item.pr}><span>PR #{item.pr}</span><strong>{item.title}</strong></article>)}
        </div>
      </section>

      <section className="release-next">
        <span>NEXT RELEASE BOUNDARY</span>
        <h2>{release.next}</h2>
        <p>Active production strategy at freeze: <strong>{release.activeStrategy}</strong></p>
      </section>
    </article>
  );
}
