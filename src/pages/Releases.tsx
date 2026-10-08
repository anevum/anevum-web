import { Link } from "react-router-dom";
import {
  archivedRhenReleases,
  currentRhenRelease,
  nextMajorVersion,
  nextMinorVersion,
  nextPatchVersion
} from "../data/releases";

function displayDate(value: string) {
  const date = new Date(value + "T12:00:00Z");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function Releases() {
  const current = currentRhenRelease();
  const archive = archivedRhenReleases();

  return (
    <div className="studio-page studio-releases-page">
      <section className="studio-page-hero">
        <span>RHEN / RELEASES</span>
        <h1>Every version leaves a record.</h1>
        <p>
          RHEN releases preserve what changed, what was verified, what remained unknown, and what the system was actually
          authorized to do at that point in time.
        </p>
      </section>

      <Link className="studio-release-feature" to={`/releases/${current.slug}`}>
        <div className="studio-release-feature-copy">
          <div className="studio-release-meta">
            <span>CURRENT RELEASE</span>
            <strong>RHEN {current.version}</strong>
            <time>{displayDate(current.date)}</time>
          </div>
          <div>
            <span>{current.lifecycle}</span>
            <h2>{current.codename}</h2>
            <p>{current.headline}</p>
          </div>
        </div>
        <aside>
          <span>RELEASE CLASS</span>
          <strong>{current.releaseClass}</strong>
          <span>SOURCE</span>
          <strong>{current.sourceCommit.slice(0, 12)}</strong>
          <span>OPEN RECORD</span>
          <b>↗</b>
        </aside>
      </Link>

      <section className="studio-section">
        <header className="studio-section-heading">
          <span>VERSIONING</span>
          <div>
            <h2>Changes should say how large they really are.</h2>
            <p>A release name is useful only if it makes the system easier to reconstruct later.</p>
          </div>
        </header>
        <div className="studio-release-standard-grid">
          <article><span>PATCH</span><strong>{nextPatchVersion(current.version)}</strong><p>Bug fixes, telemetry corrections, documentation, and operational hardening without a generational change.</p></article>
          <article><span>MINOR</span><strong>{nextMinorVersion(current.version)}</strong><p>A meaningful capability or operating-model change that deserves its own release record.</p></article>
          <article><span>MAJOR</span><strong>{nextMajorVersion(current.version)}</strong><p>A generational milestone with a full evidence boundary, limitations, verification, and new operating thesis.</p></article>
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading">
          <span>ARCHIVE</span>
          <div><h2>Older releases stay inspectable.</h2><p>The archive is part of the evidence. New claims should not rewrite what an earlier build actually was.</p></div>
        </header>
        <div className="studio-release-archive">
          {archive.length ? archive.map((release) => (
            <Link key={release.slug} to={`/releases/${release.slug}`}>
              <span>RHEN {release.version}</span>
              <strong>{release.codename}</strong>
              <small>{release.lifecycle}</small>
              <time>{displayDate(release.date)}</time>
              <b>↗</b>
            </Link>
          )) : (
            <div className="studio-release-empty">{current.codename} is the first registered release. Future named releases will appear here automatically.</div>
          )}
        </div>
      </section>

      <section className="studio-page-cta">
        <span>PRODUCT CONTEXT</span>
        <h2>A release is evidence about RHEN, not a company announcement.</h2>
        <p>The public record stays under the product so ANEVUM can grow beyond one system without turning every engineering change into the identity of the studio.</p>
        <Link to="/products/rhen">Back to RHEN →</Link>
      </section>
    </div>
  );
}
