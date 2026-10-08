import { Link } from "react-router-dom";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { fieldNotes } from "../data/fieldNotes";
import { rhenReleases } from "../data/releases";

type FeedItem = {
  id: string;
  at: string;
  type: "RELEASE" | "NOTE" | "RESEARCH" | "RUNTIME";
  title: string;
  summary?: string;
  href?: string;
};

export function buildStaticFeed(): FeedItem[] {
  const releases = rhenReleases.map((release) => ({
    id: "release-" + release.slug,
    at: release.date + "T12:00:00Z",
    type: "RELEASE" as const,
    title: "RHEN " + release.version + " · " + release.codename,
    summary: release.headline,
    href: "/products/rhen/releases/" + release.slug
  }));
  const notes = fieldNotes.map((note) => ({
    id: "note-" + note.slug,
    at: note.date + "T13:00:00Z",
    type: "NOTE" as const,
    title: note.title,
    summary: note.summary,
    href: "/field-notes/" + note.slug
  }));
  return [...releases, ...notes].sort((a,b) => b.at.localeCompare(a.at));
}

export default function Feed() {
  const { data, error, now } = useLiveTrading(5000);
  const liveItems: FeedItem[] = [
    ...(data?.events || []).map((event, index) => ({
      id: "runtime-" + String(event.at || index) + "-" + String(event.type || event.kind || ""),
      at: event.at || data?.generated_at || new Date(now).toISOString(),
      type: "RUNTIME" as const,
      title: event.label || event.type || event.kind || "RHEN runtime observation",
      summary: "Public-safe runtime event"
    })),
    ...((data?.research?.completed_decisions || []).map((decision, index) => ({
      id: "research-" + String(decision.decision_key || decision.at || index),
      at: decision.at || data?.generated_at || new Date(now).toISOString(),
      type: "RESEARCH" as const,
      title: decision.subject || decision.decision_type || "Research decision",
      summary: decision.conclusion || decision.status || undefined
    })))
  ];

  const items = [...liveItems, ...buildStaticFeed()]
    .filter((item) => item.at)
    .sort((a,b) => b.at.localeCompare(a.at))
    .slice(0, 80);

  return (
    <div className="studio-page feed-page">
      <section className="feed-hero">
        <span>PUBLIC FEED</span>
        <h1>What changed, what ran, what was learned.</h1>
        <p>One chronological record assembled from real releases, Field Notes, public-safe runtime observations, and research decisions.</p>
      </section>
      <section className="feed-status"><i className={error ? "degraded" : "live"} /><strong>{error ? "LIVE FEED DEGRADED" : "LIVE FEED CONNECTED"}</strong><span>{data?.generated_at ? new Date(data.generated_at).toLocaleString() : "static records still available"}</span></section>
      <section className="feed-list">
        {items.map((item) => {
          const body = <><time>{new Date(item.at).toLocaleString()}</time><span>{item.type}</span><strong>{item.title}</strong>{item.summary ? <p>{item.summary}</p> : null}</>;
          return item.href ? <Link key={item.id} to={item.href}>{body}<b>↗</b></Link> : <article key={item.id}>{body}</article>;
        })}
      </section>
    </div>
  );
}
