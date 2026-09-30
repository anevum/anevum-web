import { Link, Navigate, useParams } from "react-router-dom";
import { dispatchBySlug } from "../data/dispatches";

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function DispatchDetail() {
  const { slug } = useParams();
  const entry = dispatchBySlug(slug);
  if (!entry) return <Navigate to="/dispatches" replace />;

  return (
    <div className="company-page dispatch-detail-page">
      <article className="dispatch-article">
        <header>
          <Link to="/dispatches">← ALL DISPATCHES</Link>
          <div className="dispatch-article-meta">
            <span>{entry.kind}</span><b>{entry.system}</b><time dateTime={entry.publishedAt}>{dateLabel(entry.publishedAt)}</time>
          </div>
          <h1>{entry.title}</h1>
          <p className="dispatch-dek">{entry.dek}</p>
        </header>

        <div className="dispatch-article-body">
          {entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>

        <footer>
          <div className="dispatch-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="dispatch-related">
            <span>RELATED SURFACES</span>
            {entry.links.map((href) => (
              <Link key={href} to={href}>{(href.replace(/^\//, "").replaceAll("/", " / ") || "HOME").toUpperCase()} →</Link>
            ))}
          </div>
        </footer>
      </article>
    </div>
  );
}
