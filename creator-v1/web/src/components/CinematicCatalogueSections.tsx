import {Link} from "react-router-dom";
import {CelestialEmblem} from "./CelestialEmblem";
import {CosmicArtwork} from "./CosmicArtwork";
import type {CosmicScene} from "./CosmicIllustration";
import {Icon} from "./Icons";
import {projectDetailPath} from "../lib/navigation";
import type {Creator, Project} from "../lib/api";

/**
 * Locked reference A: panoramic creator catalogue, compact editorial shelves,
 * real API-published projects, artwork studies not passed off as real uploads.
 *
 * No "trending", fake views, likes, creator photos, activity stream or
 * community counts until those have verified public-data endpoints.
 */

type CategoryShortcut = {label:string;category:string|null;scene:CosmicScene;symbol:string};
const browse:readonly CategoryShortcut[]=[
  {label:"ALL",category:null,scene:"hero",symbol:"◎"},
  {label:"GAMES",category:"games",scene:"games",symbol:"✦"},
  {label:"ART & AI",category:"creative",scene:"creative",symbol:"✧"},
  {label:"APPS",category:"tools",scene:"tools",symbol:"⌘"},
  {label:"CODE",category:"libraries",scene:"libraries",symbol:"⌁"},
  {label:"LEARNING",category:"learning",scene:"learning",symbol:"◇"},
  {label:"RESEARCH",category:"research",scene:"research",symbol:"✶"},
  {label:"MORE",category:"other",scene:"other",symbol:"⊕"}
];
const categories:readonly CategoryShortcut[]=browse.filter(c=>c.category!==null);
const images:Record<Project["category"],CosmicScene>={
  games:"games",tools:"tools",automation:"automation",research:"research",
  creative:"creative",learning:"learning",libraries:"libraries",other:"other"
};
const studies=[
  {motif:"beacon",name:"THE FIRST LIGHT"},
  {motif:"atlas",name:"WORLD BUILDER"},
  {motif:"compass",name:"EXPLORER"},
  {motif:"lens",name:"CREATOR"},
  {motif:"light",name:"TRANSCENDENT"}
] as const;

function SectionHead({name,to,description}:{name:string;to:string;description:string}){
  return <div className="cinema-section-head">
    <div><h2>{name}</h2><p>{description}</p></div>
    <Link to={to}>VIEW ALL <Icon name="arrow" size={15}/></Link>
  </div>;
}

function ArtCard({entry}:{entry:CategoryShortcut}){
  const href=entry.category?"/discover?category="+entry.category:"/discover";
  return <Link className="cinema-world-card cinema-world-card--study" to={href}>
    <span className="cinema-world-art" aria-hidden="true"><CosmicArtwork scene={entry.scene}/></span>
    <span className="cinema-world-shade"/>
    <span className="cinema-world-overline">CATEGORY ART / PUBLIC PROJECTS PENDING</span>
    <span className="cinema-world-title">{entry.label}</span>
    <span className="cinema-world-footer">EXPLORE CATEGORY <Icon name="arrow" size={13}/></span>
  </Link>;
}

function ProjectArtCard({project}:{project:Project}){
  return <Link className="cinema-world-card" to={projectDetailPath(project.id,"/")}>
    <span className="cinema-world-art" aria-hidden="true"><CosmicArtwork scene={images[project.category]}/></span>
    <span className="cinema-world-shade"/>
    <span className="cinema-world-overline">PUBLISHED / {project.category.toUpperCase()} / CATEGORY ILLUSTRATION</span>
    <span className="cinema-world-title">{project.title}</span>
    <span className="cinema-world-footer">@{project.creatorHandle}<Icon name="arrow" size={13}/></span>
  </Link>;
}

export function CinematicCategoryStrip(){
  return <nav className="cinema-category-strip" aria-label="Browse published projects by type">
    {browse.map((category,index)=><Link key={category.label} to={category.category?"/discover?category="+category.category:"/discover"} className={index===0?"cinema-category-selected":undefined}>
      <span aria-hidden="true">{category.symbol}</span><strong>{category.label}</strong>
    </Link>)}
  </nav>;
}

export function CinematicCatalogueSections({projects,creators}:{projects:Project[];creators:Creator[]}){
  const shown=projects.slice(0,5);
  const recent=projects.slice(0,5);
  return <div className="cinema-catalogue">
    <section className="cinema-featured-worlds" aria-label="Featured published worlds">
      <SectionHead name="✧ FEATURED WORLDS" to="/discover" description="Discover genuine independent projects and original experiences."/>
      <div className="cinema-featured-world-grid">
        {shown.length?shown.map(project=><ProjectArtCard key={project.id} project={project}/>):categories.slice(0,5).map(entry=><ArtCard key={entry.label} entry={entry}/>)}
      </div>
      {!shown.length&&<p className="cinema-catalogue-state">PUBLIC SHOWCASE IN PREPARATION · These illustrated category gateways are not uploaded projects.</p>}
    </section>

    <section className="cinema-recent-releases" aria-label="Recent public releases">
      <SectionHead name="✦ NEW & NOTEWORTHY" to="/discover" description={recent.length?"Recently published projects — not algorithmic popularity rankings.":"The catalogue is preparing for its first approved releases."}/>
      {recent.length?
        <div className="cinema-recent-grid">{recent.map(project=><Link key={project.id} className="cinema-recent-item" to={projectDetailPath(project.id,"/")}>
          <span className="cinema-recent-art" aria-hidden="true"><CosmicArtwork scene={images[project.category]}/></span>
          <span className="cinema-recent-copy"><strong>{project.title}</strong><small>@{project.creatorHandle}</small><small>{project.category.toUpperCase()}</small></span>
        </Link>)}</div>:
        <div className="cinema-recent-empty"><span>YOUR NEXT FAVORITE CREATION COULD START HERE.</span><Link to="/start">START HERE <Icon name="arrow" size={14}/></Link></div>}
    </section>

    <div className="cinema-reference-lower">
      <section className="cinema-reference-panel cinema-artifacts-panel">
        <SectionHead name="✧ CELESTIAL ARTIFACTS" to="/levels" description="The first sixty named collectibles begin a progression system with no final level."/>
        <div className="cinema-artifact-row">{studies.map((item,i)=><Link key={item.motif} to="/levels" className="cinema-artifact-tile">
          <CelestialEmblem motif={item.motif} size="medium" state="preview"/>
          <strong>{item.name}</strong>
          <span>ART STUDY {String(i+1).padStart(2,"0")}</span>
        </Link>)}</div>
      </section>
      <section className="cinema-reference-panel cinema-people-panel">
        <SectionHead name="✧ FEATURED CREATORS" to="/creators" description="Real people sharing what they make."/>
        {creators.length?
          <div className="cinema-reference-people">{creators.slice(0,5).map(creator=><Link to={"/creators/"+encodeURIComponent(creator.handle)} key={creator.handle}>
            <span className="cinema-reference-avatar">{creator.displayName.charAt(0).toUpperCase()}</span>
            <strong>{creator.displayName}</strong>
            <small>{creator.publishedProjects} {creator.publishedProjects===1?"project":"projects"}</small>
          </Link>)}</div>:
          <div className="cinema-reference-empty"><strong>THE FIRST CREATORS ARE AHEAD.</strong><span>Public profiles appear only after approved publication.</span><Link to="/start">BECOME PART OF ANEVUM →</Link></div>}
      </section>
      <section className="cinema-reference-panel cinema-social-panel">
        <SectionHead name="✧ COMMUNITY ACTIVITY" to="/community" description="Discussion, collaboration and useful feedback."/>
        <div className="cinema-reference-empty"><strong>THE COMMUNITY IS TAKING SHAPE.</strong><span>Public forums and activity feeds are not yet open; no fake conversations are displayed.</span><Link to="/community">EXPLORE COMMUNITY →</Link><Link to="/guide">READ THE FIELD GUIDE →</Link></div>
      </section>
    </div>
  </div>;
}
