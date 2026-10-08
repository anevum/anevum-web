import { useState } from "react";
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

type Filter = "ALL" | FeedItem["type"];

function displayWhen(item: FeedItem) {
  if (item.precision === "date") return item.at;
  const date = new Date(item.at);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
    : item.at;
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
  return [...releases, ...notes].sort((a, b) => b.at.localeCompare(a.at));
}

const filters: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Everything" },
  { value: "RELEASE", label: "Releases" },
  { value: "NOTE", label: "Notes" },
  { value: "RESEARCH", label: "Research" },
  { value: "RUNTIME", label: "Runtime" }
];

export default function Feed() {
  const [filter, setFilter] = useState<Filter>("ALL");
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
    .filter((item) => item.at && (filter === "ALL" || item.type === filter))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 80);
  const connected = Boolean(data?.generated_at) && !error;
  const sourceText = error
    ? "RHEN's current live feed is unavailable. Published records are still here."
    : connected
      ? "RHEN live observations last received " + new Date(data!.generated_at!).toLocaleString()
      : loading ? "Checking live observations. Published records remain available."
        : "Published release and Field Note records.";

  return (
    <div className="studio-page feed-page workshop-feed">
      <header className="workshop-page-intro">
        <p className="workshop-kicker">PUBLIC FEED</p>
        <h1>Updates from the workbench.</h1>
        <p>What's changed, what I've tested, and what I've learned. These are actual published records and public-safe RHEN observations, not a social feed.</p>
      </header>
      <section className="workshop-feed-list-section" aria-label="Updates">
        <div className="workshop-feed-source" role="status">
          <span className={error ? "is-degraded" : connected ? "is-connected" : ""} aria-hidden="true" />
          {sourceText}
        </div>
        <div className="workshop-feed-filters" aria-label="Filter updates">
          {filters.map((item) => (
            <button key={item.value} type="button" onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value} className={filter === item.value ? "selected" : ""}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="workshop-feed-items">
          {items.length ? items.map((item) => {
            const content = (
              <>
                <time dateTime={item.at}>{displayWhen(item)}</time>
                <div className="workshop-feed-copy">
                  <span>{item.type === "NOTE" ? "FIELD NOTE" : item.type} · RHEN</span>
                  <h2>{item.title}</h2>
                  {item.summary && <p>{item.summary}</p>}
                </div>
                {item.href ? <span className="workshop-feed-arrow" aria-hidden="true">→</span> : null}
              </>
            );
            return item.href
              ? <Link className="workshop-feed-item" key={item.id} to={item.href}>{content}</Link>
              : <article className="workshop-feed-item" key={item.id}>{content}</article>;
          }) : <p className="workshop-empty">No recorded items in this category.</p>}
        </div>
      </section>
    </div>
  );
}
