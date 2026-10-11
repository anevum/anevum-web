import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { rhenReleases, rhenReleaseBySlug } from "../data/releases";
import { publishedSourceRecords } from "../data/products";

// Frozen records are publications, never runtime or execution authority.
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC"
  }).format(new Date(value + "T12:00:00Z"));
}
function Intro({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return <header className="c2-intro"><span className="c2-kicker">{kicker}</span><h1>{title}</h1><p>{children}</p></header>;
}
export function Releases() {
  const items = [...rhenReleases].sort((a, b) => b.date.localeCompare(a.date));
  return <div className="c2-page">
    <Intro kicker="RHEN / HISTORICAL RECORDS" title="Release history">Past version notes are retained as dated publications. They must not be mistaken for a currently deployed RHEN runtime.</Intro>
    <div className="c2-truth">Legacy execution was retired for V5 reconstruction. Release labels, older capabilities and old performance descriptions are historical.</div>
    <div className="c2-stack">{items.map(item => <article className="c2-card" key={item.slug}>
      <div className="c2-card-meta"><span>Version {item.version}</span><time dateTime={item.date}>{dateLabel(item.date)}</time></div>
      <h2><Link to={"/products/rhen/releases/" + item.slug}>{item.codename}</Link></h2><p>{item.headline}</p>
      <Link className="c2-text-link" to={"/products/rhen/releases/" + item.slug}>Read historical record →</Link>
    </article>)}</div>
  </div>;
}
export function ReleaseDetail({ slug, missing }: { slug: string; missing: ReactNode }) {
  const release = rhenReleaseBySlug(slug);
  if (!release) return missing;
  const repository = publishedSourceRecords.rhen.url;
  const deployments = [
    ["Production deployment at publication", release.productionDeployment],
    ["Shadow deployment at publication", release.shadowDeployment],
    ["Preopen deployment at publication", release.preopenDeployment]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return <article className="c2-page c2-article c2-release-detail" data-release-slug={release.slug}>
    <Link className="c2-text-link" to="/products/rhen/releases">← RHEN releases</Link>
    <Intro kicker={"RHEN " + release.version + " / " + dateLabel(release.date)} title={release.codename}>{release.headline}</Intro>
    <div className="c2-truth">Archived version record. Historical execution, paper, performance or deployment references do not imply current availability.</div>
    <section className="c2-article-section" data-release-section="publication">
      <h2>Historical publication</h2>
      <dl className="c2-release-metadata">
        <div><dt>Lifecycle at publication</dt><dd>{release.lifecycle}</dd></div>
        <div><dt>Release class</dt><dd>{release.releaseClass}</dd></div>
        <div><dt>Released</dt><dd><time dateTime={release.date}>{dateLabel(release.date)}</time></dd></div>
        <div><dt>Source commit</dt><dd><a className="c2-text-link" href={repository + "/commit/" + release.sourceCommit} target="_blank" rel="noopener noreferrer">{release.sourceCommit}</a></dd></div>
        {deployments.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <ul className="c2-release-badges" aria-label="Historical release labels">{release.badges.map(badge => <li key={badge}>{badge}</li>)}</ul>
      <div className="c2-action-row"><a href={release.pdfPath} target="_blank" rel="noopener noreferrer">Download release PDF ↗</a></div>
    </section>
    <section className="c2-article-section" data-release-section="overview"><h2>Overview</h2><p>{release.abstract}</p><p>{release.thesis}</p></section>
    <section className="c2-article-section" data-release-section="capabilities"><h2>Capabilities at publication</h2>
      {release.capabilities.map((item, i) => <div key={i}><span className="c2-kicker">{item.label}</span><h3>{item.title}</h3><p>{item.body}</p></div>)}
    </section>
    <section className="c2-article-section" data-release-section="architecture"><h2>Architecture at publication</h2>
      {release.architecture.map((item, i) => <div key={i}><span className="c2-kicker">{item.label}</span><h3>{item.title}</h3><p>{item.body}</p></div>)}
    </section>
    <section className="c2-article-section" data-release-section="verification"><h2>Verification at publication</h2>
      {release.verification.map((item, i) => <div key={i}><h3>{item.label}</h3><p><strong>{item.value}</strong></p><p>{item.body}</p></div>)}
    </section>
    <section className="c2-article-section" data-release-section="limitations"><h2>Recorded limitations</h2>
      {release.limitations.map((item, i) => <div key={i}><h3>{item.title}</h3><p>{item.body}</p></div>)}
    </section>
    <section className="c2-article-section" data-release-section="changelog"><h2>Changelog</h2>
      <ul>{release.changelog.map(item => <li key={item.pr}><a className="c2-text-link" href={repository + "/pull/" + item.pr} target="_blank" rel="noopener noreferrer">#{item.pr}</a> — {item.title}</li>)}</ul>
    </section>
    <section className="c2-article-section" data-release-section="boundary"><h2>Boundary at publication</h2><p>{release.next}</p><h3>Active strategy at freeze</h3><p>{release.activeStrategy}</p></section>
    <Link className="c2-text-link" to="/products/rhen">Current RHEN rebuild status →</Link>
  </article>;
}
