import { Link } from "react-router-dom";
import {CompactMemberIdentity} from "./CompactMemberIdentity";
import type { Project } from "../lib/api";
import { Icon } from "./Icons";
import {CosmicArtwork} from "./CosmicArtwork";
import {CategoryCoverV136} from "../parity/CategoryCoverV136";
import type {CosmicScene} from "./CosmicIllustration";
import { projectDetailPath } from "../lib/navigation";
import { publicCreatorHandle } from "../lib/public-creator-handle";
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

const scenes: Record<Project["category"], CosmicScene> = {
  games:"games", tools:"tools", automation:"automation", research:"research",
  creative:"creative", learning:"learning", libraries:"libraries", other:"other"
};

export function ProjectCard({ project, returnTo = "/discover", presentation = "visual", onInspect }: {
  project: Project; returnTo?: string; presentation?: "visual" | "editorial";
  onInspect?:(project:Project)=>void;
}) {
  const href=projectDetailPath(project.id,returnTo);
  const handle=publicCreatorHandle(project.creatorHandle);
  const credit=project.creatorName||"ANEVUM member";
  if(presentation==="editorial")return <article className="project-card av73-project-card">
    <div className="av73-project-card-top">
      <span className="av73-project-card-category">{labels[project.category] || "Project"}</span>
      <span>{project.freeToUse?"Creator marks free":"Published project"}</span>
    </div>
    <h3><Link to={href}>{project.title}</Link></h3>
    <p>{project.summary}</p>
    <div className="av73-project-card-bottom">
      {handle?<CompactMemberIdentity size="inline" className="av73-project-card-author av79-public-project-author"
        href={"/creators/"+encodeURIComponent(handle)}
        member={{handle,displayName:credit,
          source:"creator-channel",avatar:false,level:null,featuredAwards:[]}}/>:
        <span className="av73-project-card-author av79-unlinked-project" aria-label="Creator profile not publicly linked">Public creator channel not linked. <strong>{credit}</strong></span>}
      {onInspect&&<button type="button" className="p136-artifact-inspect-button" onClick={()=>onInspect(project)} aria-label={'Inspect '+project.title}>Inspect</button>}
      <Link className="av73-project-card-action" to={href}>View project <Icon name="arrow" size={16}/></Link>
    </div>
  </article>;
  return (
    <article className="project-card depth-hover-card" onPointerMove={e=>applyPointerDepth(e,8)} onPointerLeave={clearPointerDepth}>
      <Link className="project-art" to={href} aria-label={`Open ${project.title}`}>
        {import.meta.env.VITE_PARITY_V136_FULL==="true"
         ?<CategoryCoverV136 category={project.category} title={project.title}/>
         :<CosmicArtwork scene={scenes[project.category]} seed={project.id}/>} 
        <span className="cw-card-art-overlay" aria-hidden="true" />
        <span className="project-kind">{labels[project.category] || "Project"}</span>
        <span className="cw-project-art-disclosure">{import.meta.env.VITE_PARITY_V136_FULL==="true"?"ANEVUM TYPE DEFAULT / NO CREATOR COVER":"CATEGORY ILLUSTRATION"}</span>
      </Link>
      <div className="project-card-body">
        <div className="project-card-topline"><span>{project.freeToUse ? "FREE" : "EXTERNAL"}</span><span>{project.category.toUpperCase()}</span></div>
        <h3><Link to={href}>{project.title}</Link></h3>
        <p>{project.summary}</p>
        <footer>
          {handle?<CompactMemberIdentity size="inline" className="creator-inline av79-public-project-author"
            href={"/creators/"+encodeURIComponent(handle)}
            member={{handle,displayName:credit,
              source:"creator-channel",avatar:false,level:null,featuredAwards:[]}}/>:
            <span className="creator-inline av79-unlinked-project" aria-label="Creator profile not publicly linked">Public creator channel not linked. <strong>{credit}</strong></span>}
          {onInspect&&<button type="button" className="p136-artifact-inspect-button" onClick={()=>onInspect(project)} aria-label={'Inspect '+project.title}>Inspect</button>}
          <Link className="project-arrow" to={href} aria-label={`View ${project.title}`}><Icon name="arrow" size={16} /></Link>
        </footer>
      </div>
    </article>
  );
}
