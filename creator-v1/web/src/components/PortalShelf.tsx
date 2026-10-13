import {Link} from "react-router-dom";
import type {Category,Project} from "../lib/api";
import {CategoryArtifact} from "./CategoryArtifact";
import {ProjectCard} from "./ProjectCard";

export function PortalShelf({eyebrow,title,category,projects,description}:{
  eyebrow:string;title:string;category:Category;projects:Project[];description:string;
}){
  const href="/discover?category="+encodeURIComponent(category);
  return <section className="portal-shelf" aria-label={title}>
    <header className="portal-box-header">
      <div className="portal-shelf-heading"><span className="portal-shelf-mark" aria-hidden="true"><CategoryArtifact category={category}/></span><div><span className="kicker">{eyebrow}</span><h2>{title}</h2></div></div>
      <Link to={href}>VIEW ALL →</Link>
    </header>
    {projects.length?
      <div className="portal-shelf-projects">{projects.slice(0,4).map(project=><ProjectCard key={project.id} project={project} returnTo="/"/>)}</div>:
      <div className="portal-shelf-empty">
        <span className="portal-shelf-placeholder" aria-hidden="true">✳</span>
        <div><strong>THE FIRST {title.toUpperCase()} RELEASE IS STILL AHEAD.</strong><p>{description} Only real, staff-approved projects will appear here.</p></div>
        <Link to={href}>EXPLORE CATEGORY ↗</Link>
      </div>
    }
  </section>;
}
