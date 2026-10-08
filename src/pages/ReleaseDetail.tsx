import { Link, Navigate, useParams } from "react-router-dom";
import { rhenReleaseBySlug } from "../data/releases";

function displayDate(value: string) {
  const date = new Date(value + "T12:00:00Z");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function ReleaseDetail() {
  const { slug } = useParams();
  const release = rhenReleaseBySlug(slug);
  if (!release) return <Navigate to="/releases" replace />;

  return (
    <article className="studio-page studio-release-detail-page">
      <section className="studio-release-detail-hero">
        <div>
          <Link className="studio-release-back" to="/releases">RHEN / RELEASES ←</Link>
          <span>RHEN {release.version} / {release.releaseClass}</span>
          <h1>{release.codename}</h1>
          <p>{release.abstract}</p>
          <div className="studio-release-badges">{release.badges.map((badge) => <span key={badge}>{badge}</span>)}</div>
        </div>
        <aside>
          <div><span>LIFECYCLE</span><strong>{release.lifecycle}</strong></div>
          <div><span>RELEASED</span><strong>{displayDate(release.date)}</strong></div>
          <div><span>SOURCE</span><strong>{release.sourceCommit.slice(0, 12)}</strong></div>
          {release.productionDeployment ? <div><span>DEPLOYMENT</span><strong>{release.productionDeployment.slice(0, 12)}</strong></div> : null}
          {release.pdfPath ? <a href={release.pdfPath} target="_blank" rel="noreferrer">DOWNLOAD RELEASE PDF ↗</a> : null}
        </aside>
      </section>

      <section className="studio-statement compact">
        <span>RELEASE THESIS</span>
        <div><h2>{release.thesis}</h2></div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>CAPABILITY BOUNDARY</span><div><h2>What this build actually added or changed.</h2></div></header>
        <div className="studio-release-capability-grid">
          {release.capabilities.map((item, index) => (
            <article key={item.label}><span>{String(index + 1).padStart(2, "0")} / {item.label}</span><h3>{item.title}</h3><p>{item.body}</p></article>
          ))}
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>ARCHITECTURE</span><div><h2>The release boundary in system terms.</h2></div></header>
        <div className="studio-release-rows">
          {release.architecture.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.title}</strong><p>{item.body}</p></article>)}
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>VERIFICATION</span><div><h2>Claims need something underneath them.</h2></div></header>
        <div className="studio-release-verification-grid">
          {release.verification.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><p>{item.body}</p></article>)}
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>KNOWN LIMITATIONS</span><div><h2>What this release does not establish.</h2></div></header>
        <div className="studio-release-limitations">
          {release.limitations.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.body}</p></div></article>)}
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>SELECTED CHANGELOG</span><div><h2>The changes that define this record.</h2></div></header>
        <div className="studio-release-changelog">
          {release.changelog.map((item) => <article key={item.pr}><span>PR #{item.pr}</span><strong>{item.title}</strong></article>)}
        </div>
      </section>

      <section className="studio-page-cta">
        <span>NEXT RELEASE BOUNDARY</span>
        <h2>{release.next}</h2>
        <p>Active production strategy at freeze: <strong>{release.activeStrategy}</strong></p>
        <Link to="/products/rhen">Return to RHEN →</Link>
      </section>
    </article>
  );
}
