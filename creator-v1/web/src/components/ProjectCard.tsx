import { Link } from "react-router-dom";
import type { Project } from "../lib/api";
import { Icon } from "./Icons";
import { projectDetailPath } from "../lib/navigation";

const labels: Record<string, string> = {
  games: "Game",
  tools: "App / Tool",
  automation: "Automation",
  research: "Research",
  creative: "Creative",
  learning: "Learning",
  libraries: "Open source",
  other: "Project"
};

export function ProjectCard({ project, returnTo = "/discover" }: { project: Project; returnTo?: string }) {
  const href=projectDetailPath(project.id,returnTo);
  return (
    <article className="project-card">
      <Link className="project-art" to={href} aria-label={`Open ${project.title}`}>
        <span className={`project-glyph project-glyph-${project.category}`} aria-hidden="true"><OrbitalMini /></span>
        <span className="project-kind">{labels[project.category] || "Project"}</span>
      </Link>
      <div className="project-card-body">
        <div className="project-card-topline"><span>{project.freeToUse ? "FREE" : "EXTERNAL"}</span><span>{project.category.toUpperCase()}</span></div>
        <h3><Link to={href}>{project.title}</Link></h3>
        <p>{project.summary}</p>
        <footer>
          <Link className="creator-inline" to={`/creators/${encodeURIComponent(project.creatorHandle)}`}>@{project.creatorHandle}</Link>
          <Link className="project-arrow" to={href} aria-label={`View ${project.title}`}><Icon name="arrow" size={16} /></Link>
        </footer>
      </div>
    </article>
  );
}

function OrbitalMini() {
  return <svg viewBox="0 0 120 120" focusable="false"><ellipse cx="60" cy="60" rx="44" ry="17" transform="rotate(-16 60 60)" fill="none" stroke="currentColor" strokeWidth="8"/><circle cx="60" cy="60" r="17" fill="currentColor"/><path d="m60 12 5 37 13 11-13 11-5 37-5-37-13-11 13-11z" fill="currentColor"/><circle cx="92" cy="31" r="5" fill="currentColor"/></svg>;
}
