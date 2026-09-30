import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dispatches, type DispatchKind } from "../data/dispatches";
import { useLiveTrading } from "../hooks/useLiveTrading";

type Filter = "ALL" | DispatchKind;

const filters: Filter[] = ["ALL", "PROGRESS REPORT", "RESEARCH NOTE", "SYSTEM UPDATE", "FIELD NOTE"];

function dateLabel(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function Dispatches() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data } = useLiveTrading(10000);
  const entries = useMemo(
    () => filter === "ALL" ? dispatches : dispatches.filter((entry) => entry.kind === filter),
    [filter]
  );
  const journal = data?.research?.journal || [];

  return (
    <div className="company-page dispatches-page">
      <section className="dispatches-hero">
        <div>
          <span>PUBLIC RECORD / DISPATCHES</span>
          <h1>Work in public, with the evidence attached.</h1>
          <p>Progress reports, research notes, system updates, release context, and field notes from the ongoing build of ANEVUM. This is not a marketing blog; it is the readable public layer of the work.</p>
        </div>
        <aside>
          <span>CURRENT PUBLIC STATE</span>
          <strong>{data?.state || "UNAVAILABLE"}</strong>
          <dl>
            <div><dt>Research</dt><dd>{data?.research?.current_status || "UNAVAILABLE"}</dd></div>
            <div><dt>Strategy</dt><dd>{data?.active_strategy?.version_id || "UNAVAILABLE"}</dd></div>
            <div><dt>Entries</dt><dd>{dispatches.length}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="dispatch-filter-bar" aria-label="Dispatch filters">
        {filters.map((item) => (
          <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </section>

      <section className="dispatch-grid">
        {entries.map((entry, index) => (
          <Link key={entry.slug} className={"dispatch-card " + (index === 0 ? "is-featured" : "")} to={"/dispatches/" + entry.slug}>
            <header><span>{entry.kind}</span><b>{entry.system}</b></header>
            <div>
              <time dateTime={entry.publishedAt}>{dateLabel(entry.publishedAt)}</time>
              <h2>{entry.title}</h2>
              <p>{entry.dek}</p>
            </div>
            <footer>
              <div>{entry.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
              <strong>{entry.status} · READ →</strong>
            </footer>
          </Link>
        ))}
      </section>

      <section className="company-section dispatch-live-journal">
        <header className="company-section-head">
          <span>LIVE RESEARCH WIRE</span>
          <h2>Canonical research state, without turning it into a press release.</h2>
          <p>When the public research feed contains journal entries, they appear here directly from telemetry. Editorial Dispatches remain separate from this machine-generated research record.</p>
        </header>
        <div className="dispatch-wire-list">
          {journal.length ? journal.slice(0, 8).map((item, index) => (
            <article key={(item.at || "") + index}>
              <time>{item.at ? dateLabel(item.at) : "UNDATED"}</time>
              <span>{String(item.classification || item.type || "RESEARCH").replaceAll("_", " ")}</span>
              <div><strong>{item.title || item.focus || "Research update"}</strong><p>{item.summary || item.next_action || "No public summary recorded."}</p></div>
            </article>
          )) : <div className="dispatch-wire-empty">No canonical public journal entries are available in the current feed.</div>}
        </div>
      </section>
    </div>
  );
}
