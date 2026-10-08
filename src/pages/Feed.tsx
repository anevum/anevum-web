import { Link } from "react-router-dom";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { fieldNotes } from "../data/fieldNotes";
import { rhenReleases } from "../data/releases";

type FeedItem = {
  id: string;
  at: string;
  precision: "date" | "time";
  type: "RELEASE" | "NOTE" | "RESEARCH" | "RUNTIME";
  title: string;
  summary?: string;
  href?: string;
};

function displayWhen(item: FeedItem) {
  if (item.precision === "date") return item.at;
  const parsed = new Date(item.at);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : item.at;
}

export function buildStaticFeed(): FeedItem[] {
  const releases: FeedItem[] = rhenReleases.map((release) => ({
    id: "release-" + release.slug,
    at: release.date,
    precision: "date",
    type: "RELEASE",
    title: "RHEN " + release.version + " · " + release.codename,
    summary: release.headline,
    href: "/products/rhen/releases/" + release.slug
  }));
  const notes: FeedItem[] = fieldNotes.map((note) => ({
    id: "note-" + note.slug,
    at: note.date,
    precision: "date",
    type: "NOTE",
    title: note.title,
    summary: note.summary,
    href: "/field-notes/" + note.slug
  }));
  return [...releases, ...notes].sort((a,b) => b.at.localeCompare(a.at));
}

export default function Feed() {
  const { data, error, loading } = useLiveTrading(5000);

  const runtimeItems: FeedItem[] = (data?.events || [])
    .filter((event) => Boolean(event.at))
    .map((event, index) => ({
      id: "runtime-" + String(event.at) + "-" + String(event.type || event.kind || index),
      at: String(event.at),
      precision: "time",
      type: "RUNTIME",
      title: event.label || event.type || event.kind || "RHEN runtime observation",
      summary: "Public-safe runtime observation"
    }));

  const researchItems: FeedItem[] = (data?.research?.completed_decisions || [])
    .filter((decision) => Boolean(decision.at))
    .map((decision, index) => ({
      id: "research-" + String(decision.decision_key || decision.at || index),
      at: String(decision.at),
      precision: "time",
      type: "RESEARCH",
      title: decision.subject || decision.decision_type || "Research decision",
      summary: decision.conclusion || decision.status || undefined
    }));

  const items = [...runtimeItems, ...researchItems, ...buildStaticFeed()]
    .filter((item) => item.at)
    .sort((a,b) => b.at.localeCompare(a.at))
    .slice(0, 80);

  const connected = Boolean(data?.generated_at) && !error;
  const feedState = error ? "LIVE FEED DEGRADED" : connected ? "LIVE FEED CONNECTED" : loading ? "CONNECTING TO LIVE FEED" : "STATIC RECORDS";
  const feedDetail = data?.generated_at
    ? "source observed " + new Date(data.generated_at).toLocaleString()
    : "release and Field Note records remain available";

  return (
    <div className="studio-page feed-page">
      <section className="feed-hero">
        <span>PUBLIC FEED</span>
        <h1>What changed, what ran, what was learned.</h1>
        <p>One chronological record assembled from real releases, Field Notes, public-safe runtime observations, and research decisions.</p>
      </section>
      <section className="feed-status">
        <i className={error ? "degraded" : connected ? "live" : ""} />
        <strong>{feedState}</strong>
        <span>{feedDetail}</span>
      </section>
      <section className="feed-list">
        {items.map((item) => {
          const body = (
            <>
              <time dateTime={item.at}>{displayWhen(item)}</time>
              <span>{item.type}</span>
              <strong>{item.title}</strong>
              {item.summary ? <p>{item.summary}</p> : null}
            </>
          );
          return item.href
            ? <Link key={item.id} to={item.href}>{body}<b>↗</b></Link>
            : <article key={item.id}>{body}</article>;
        })}
      </section>
    </div>
  );
}
