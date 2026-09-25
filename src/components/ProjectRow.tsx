import { Link } from "react-router-dom";

export default function ProjectRow({
  index,
  status,
  title,
  description,
  meta,
  to
}: {
  index: string;
  status: string;
  title: string;
  description: string;
  meta: string[];
  to?: string;
}) {
  const content = (
    <>
      <span className="project-index">{index}</span>
      <div className="project-main">
        <span className="project-status">{status}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="project-meta">
        {meta.map((item) => <span key={item}>{item}</span>)}
      </div>
      <span className="project-arrow">↗</span>
    </>
  );

  return to ? <Link className="project-row" to={to}>{content}</Link> : <article className="project-row">{content}</article>;
}
