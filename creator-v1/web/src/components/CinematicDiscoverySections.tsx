import {Link} from "react-router-dom";
import type {Creator, Project, Category} from "../lib/api";
import {projectDetailPath} from "../lib/navigation";
import {CosmicArtwork} from "./CosmicArtwork";
import type {CosmicScene} from "./CosmicIllustration";
import {CelestialEmblem} from "./CelestialEmblem";
import {Icon} from "./Icons";
import {ErrorState, LoadingState} from "./States";

/**
 * Public content shaped like the two locked website references.
 * Every project, count, and creator identity comes from the public API.
 * Category art and artifact studies are illustrative, never member content.
 */
const art:Record<Category,CosmicScene>={
  games:"games",tools:"tools",automation:"automation",research:"research",
  creative:"creative",learning:"learning",libraries:"libraries",other:"other"
};
const categories:readonly {label:string;category:Category|null}[]=[
  {label:"ALL",category:null},{label:"GAMES",category:"games"},
  {label:"ART & AI",category:"creative"},{label:"APPS & TOOLS",category:"tools"},
  {label:"AUTOMATION",category:"automation"},{label:"RESEARCH",category:"research"},
  {label:"LEARN",category:"learning"},{label:"OPEN SOURCE",category:"libraries"},
  {label:"MORE",category:"other"}
];
const firstWorlds:readonly {label:string;scene:CosmicScene;category:Category}[]=[
  {label:"GAMES",scene:"games",category:"games"},
  {label:"ART & AI",scene:"creative",category:"creative"},
  {label:"APPS & TOOLS",scene:"tools",category:"tools"},
  {label:"LEARNING",scene:"learning",category:"learning"},
  {label:"OTHER WORLDS",scene:"other",category:"other"}
];
const studies=["spark","key","atlas","light","beacon"] as const;

type Props={projects:readonly Project[];creators:readonly Creator[];state:"loading"|"ready"|"error"};

function Heading({title,description,to,id}:{title:string;description:string;to:string;id:string}){
  return <div className="cinema-section-heading"><div><h2 id={id}>{title}</h2><p>{description}</p></div><Link to={to}>VIEW ALL <Icon name="arrow" size={14}/></Link></div>;
}
function WorldTile({project}:{project:Project}){
  return <Link className="cinema-world-tile" to={projectDetailPath(project.id,"/")} aria-label={"Open published project " + project.title}>
    <div className="cinema-world-tile-art"><CosmicArtwork scene={art[project.category]}/></div>
    <div className="cinema-world-tile-body">
      <span className="cinema-world-kind">{project.category.toUpperCase()} · CATEGORY ILLUSTRATION</span>
      <strong>{project.title}</strong>
      <span>{project.creatorName||"@"+project.creatorHandle}</span>
    </div>
  </Link>;
}
function WorldCategoryTile({item}:{item:(typeof firstWorlds)[number]}){
  return <Link className="cinema-world-tile cinema-world-category" to={"/discover?category="+item.category} aria-label={"Explore "+item.label}>
    <div className="cinema-world-tile-art"><CosmicArtwork scene={item.scene}/></div>
    <div className="cinema-world-tile-body"><span className="cinema-world-kind">EXPLORE THE CATEGORY</span><strong>{item.label}</strong><span>Awaiting published projects</span></div>
  </Link>;
}

export function CinematicDiscoverySections({projects,creators,state}:Props){
  return <div className="cinema-public-discovery">
    <nav className="cinema-category-ribbon" aria-label="Discover by category">{categories.map(item=><Link key={item.label} to={item.category?"/discover?category="+item.category:"/discover"}><span aria-hidden="true">✧</span>{item.label}</Link>)}</nav>
    <section className="cinema-world-section" aria-labelledby="cinema-featured-worlds">
      <div className="cinema-section-heading"><div><h2 id="cinema-featured-worlds">FEATURED WORLDS</h2><p>Independent games, software and creative experiences.</p></div><Link to="/discover">VIEW ALL <Icon name="arrow" size={14}/></Link></div>
      {state==="loading"&&<LoadingState label="Loading real published worlds"/>}
      {state==="error"&&<ErrorState title="PUBLIC PROJECTS UNAVAILABLE" detail="The verified catalogue cannot be loaded."/>}
      {state==="ready"&&<div className="cinema-world-grid">{projects.length?projects.slice(0,5).map(p=><WorldTile key={p.id} project={p}/>):firstWorlds.map(item=><WorldCategoryTile key={item.category} item={item}/>)}</div>}
      {state==="ready"&&projects.length===0&&<div className="cinema-quiet-note">CATEGORY ART ONLY · No real public creations are available yet.</div>}
    </section>
    <section className="cinema-trending" aria-labelledby="cinema-latest-worlds">
      <div className="cinema-section-heading"><div><h2 id="cinema-latest-worlds">LATEST CREATIONS</h2><p>Recent approved work — genuine ranking signals are not yet available.</p></div><Link to="/discover">VIEW ALL <Icon name="arrow" size={14}/></Link></div>
      {state==="ready"&&(projects.length>5?<div className="cinema-latest-strip">{projects.slice(5,8).map(p=><Link key={p.id} to={projectDetailPath(p.id,"/")} className="cinema-latest-tile"><span className="cinema-latest-img"><CosmicArtwork scene={art[p.category]}/></span><span><strong>{p.title}</strong><small>@{p.creatorHandle}</small><small>CATEGORY ART</small></span></Link>)}</div>:<div className="cinema-latest-empty">Newly approved projects will appear here. No fabricated trends, views or likes.</div>)}
      {state==="loading"&&<div className="cinema-latest-empty">Checking published releases…</div>}
      {state==="error"&&<div className="cinema-latest-empty">Latest public releases are temporarily unavailable.</div>}
    </section>
    <div className="cinema-social-grid">
      <section className="cinema-social-panel cinema-artifact-studies" aria-labelledby="cinema-artifacts">
        <Heading id="cinema-artifacts" title="CELESTIAL ARTIFACTS" description="A visual study of Series One collectible rewards." to="/levels"/>
        <div className="cinema-artifact-row" >{studies.map((motif,i)=><Link key={motif} to="/levels" aria-label={"See artifact study "+(i+1)}><CelestialEmblem motif={motif} size="medium" state="preview"/><span>ART STUDY {String(i+1).padStart(2,"0")}</span></Link>)}</div>
        <p className="cinema-panel-disclaimer">Illustrative artifacts · No rewards or levels are implied as earned.</p>
      </section>
      <section className="cinema-social-panel cinema-public-creators" aria-labelledby="cinema-creators">
        <Heading id="cinema-creators" title="FEATURED CREATORS" description="Real channels from the public catalogue." to="/creators"/>
        {state==="ready"&&(creators.length?<div className="cinema-public-creator-row">{creators.map(c=><Link key={c.handle} to={"/creators/"+encodeURIComponent(c.handle)}><span className="cinema-public-creator-avatar">{c.displayName.slice(0,1).toUpperCase()}</span><strong>{c.displayName}</strong><small>{c.publishedProjects} published</small></Link>)}</div>:<div className="cinema-social-empty">Creator channels appear here after genuine publication. <Link to="/start">START HERE ↗</Link></div>)}
        {state==="loading"&&<div className="cinema-social-empty">Reading creator channels…</div>}
        {state==="error"&&<div className="cinema-social-empty">Creator channels are unavailable.</div>}
      </section>
      <section className="cinema-social-panel cinema-community-panel" aria-labelledby="cinema-community">
        <Heading id="cinema-community" title="COMMUNITY ACTIVITY" description="A shared space for projects and discussion." to="/community"/>
        <div className="cinema-community-empty"><strong>THE CONVERSATION STARTS WITH REAL PEOPLE.</strong><p>Verified community updates will appear when participation opens. Until then, explore how the community will work.</p><Link to="/community">EXPLORE COMMUNITY <Icon name="arrow" size={14}/></Link></div>
      </section>
    </div>
  </div>;
}