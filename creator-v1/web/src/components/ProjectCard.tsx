import { Link } from "react-router-dom";
import type { Project } from "../lib/api";
import { Icon } from "./Icons";
import { projectDetailPath } from "../lib/navigation";
import {CategoryArtifact} from "./CategoryArtifact";
import {applyPointerDepth,clearPointerDepth} from "../lib/pointer-depth";

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
    <article className="project-card depth-hover-card" onPointerMove={e=>applyPointerDepth(e,8)} onPointerLeave={clearPointerDepth}>
      <Link className="project-art" to={href} aria-label={`Open ${project.title}`}>
        <span className="project-art-layer" aria-hidden="true"><span className="project-art-shadow"/><span className="project-art-inner"><span className={`project-glyph project-glyph-${project.category}`}><CategoryArtifact category={project.category}/></span></span><span className="project-art-shine"/></span>
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
