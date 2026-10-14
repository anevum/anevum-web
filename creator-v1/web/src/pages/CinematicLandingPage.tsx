import {Link} from "react-router-dom";
import type {PointerEvent} from "react";
import {readCreators, readProjects, readStatus, type Project} from "../lib/api";
import {useResource} from "../lib/useResource";
import {projectDetailPath} from "../lib/navigation";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {CosmicScene} from "../components/CosmicIllustration";
import {Icon} from "../components/Icons";
import {CinematicSiteRail} from "../components/CinematicSiteRail";
import {CinematicPortalFX} from "../components/CinematicPortalFX";
import {CinematicAtmosphere} from "../components/CinematicAtmosphere";
import {CommunityHomeFeed} from "../components/CommunityHomeFeed";

/**
 * LOCKED DIRECTION 2026-10-13
 * Owner-supplied reference screenshots A + B:
 * ANEVUM/Visual-References/2026-10-13-Cinematic-World.
 * Both are desktop design boards. Mobile geometry is designed separately.
 *
 * Real controls and genuine API data always sit above decorative scene imagery.
 * Nothing inside a raster environment is an imitation navigation or fake statistic.
 * This is a reversible candidate, NOT production release acceptance.
 */

type Gate = {title:string;eyebrow:string;to:string;scene:CosmicScene};
const gates:readonly Gate[]=[
  {title:"EXPLORE",eyebrow:"WORLDS & PROJECTS",to:"/discover",scene:"creative"},
  {title:"CREATE",eyebrow:"TOOLS & STUDIO",to:"/create",scene:"tools"},
  {title:"PLAY",eyebrow:"EXPERIENCES",to:"/discover?category=games",scene:"games"},
  {title:"LEARN",eyebrow:"GUIDES & RESEARCH",to:"/guide",scene:"learning"},
  {title:"COMMUNITY",eyebrow:"CREATORS & FRIENDS",to:"/community",scene:"other"}
];
const categoryArt:Record<Project["category"],CosmicScene>={
  games:"games",tools:"tools",automation:"automation",research:"research",
  creative:"creative",learning:"learning",libraries:"libraries",other:"other"
};

function SceneLink({item,variant}:{item:Gate;variant:"gate"|"module"}){
  return <Link to={item.to} className={"cinema-scene-link cinema-scene-link--"+variant}>
    <div className="cinema-scene-link-art" aria-hidden="true"><CosmicArtwork scene={item.scene}/></div>
    <div className="cinema-scene-link-copy"><strong>{item.title}</strong><span>{item.eyebrow}</span></div>
    <span className="cinema-scene-link-arrow" aria-hidden="true"><Icon name="arrow" size={16}/></span>
  </Link>;
}

function FeaturedScene({project}:{project:Project|null}){
  const href=project?projectDetailPath(project.id,"/"):"/start";
  const label=project?"LATEST APPROVED RELEASE":"FIRST SHOWCASE / IN PREPARATION";
  return <aside className="cinema-feature" aria-label="Featured project">
    <div className="cinema-feature-art" aria-hidden="true">
      <CosmicArtwork scene={project?categoryArt[project.category]:"portal"} priority/>
    </div>
    <div className="cinema-feature-overlay">
      <span className="cinema-micro"><span className="cinema-status-dot"/> {label}</span>
      <h2>{project?project.title:"New worlds are forming."}</h2>
      <p>{project?project.summary:"Original games, tools and experiences are coming to the ANEVUM catalogue. No fictional projects are listed as live."}</p>
      <Link to={href} className="cinema-feature-action">{project?"EXPLORE PROJECT":"START EXPLORING"} <Icon name="arrow" size={15}/></Link>
    </div>
  </aside>;
}

export function CinematicLandingPage(){
  const portal=useResource(async signal=>{
    const [status,projectResponse,creatorResponse]=await Promise.all([
      readStatus(signal),readProjects({limit:"32"},signal),readCreators({limit:"6"},signal)
    ]);
    return {status,projects:projectResponse.items,creators:creatorResponse.items};
  },[]);
  const isReady=portal.state==="ready";
  const projects=isReady?portal.data.projects:[];
  const creators=isReady?portal.data.creators:[];
  const featured=projects[0]??null;
  function moveScene(event:PointerEvent<HTMLElement>){
    if(event.pointerType==="touch")return;
    const node=event.currentTarget;
    const bounds=node.getBoundingClientRect();
    const x=((event.clientX-bounds.left)/bounds.width-.5)*2;
    const y=((event.clientY-bounds.top)/bounds.height-.5)*2;
    node.style.setProperty("--cinema-pointer-x",x.toFixed(3));
    node.style.setProperty("--cinema-pointer-y",y.toFixed(3));
  }
  function resetScene(event:PointerEvent<HTMLElement>){
    event.currentTarget.style.setProperty("--cinema-pointer-x","0");
    event.currentTarget.style.setProperty("--cinema-pointer-y","0");
  }

  return <div className="anevum-cinema">
    <CinematicSiteRail/>
    <div className="cinema-content">
      <section className="cinema-hero" aria-labelledby="cinema-hero-title" onPointerMove={moveScene} onPointerLeave={resetScene}>
        <div className="cinema-hero-art" aria-hidden="true"><CosmicArtwork scene="hero" priority/></div>
        <CinematicAtmosphere/>
        <div className="cinema-hero-light" aria-hidden="true"/>
        <CinematicPortalFX/>
        <div className="av5-orbit-wordmark" aria-hidden="true"><strong>ANEVUM</strong><span>CREATE · EXPLORE · BUILD · TOGETHER</span></div>
        <div className="cinema-hero-layout">
          <div className="cinema-hero-copy">
            <div className="cinema-kicker">ANEVUM / PUBLIC COMMONS</div>
            <h1 id="cinema-hero-title">A universe<br/>made by <em>people.</em></h1>
            <p>An independent creative home for games, art, useful software, learning, and the people who make them. Find something worth exploring—or share what you build.</p>
            <div className="cinema-actions">
              <Link to="/discover" className="cinema-button cinema-button--primary">EXPLORE WORLDS <Icon name="arrow" size={17}/></Link>
              <a href="#community-index" className="cinema-button cinema-button--secondary">COMMUNITY INDEX <Icon name="arrow" size={16}/></a>
            </div>
          </div>
          <FeaturedScene project={featured}/>
        </div>
      </section>

      <nav className="cinema-gateways" aria-label="Explore ANEVUM worlds">
        {gates.map(item=><SceneLink key={item.title} item={item} variant="gate"/>)}
      </nav>

      <CommunityHomeFeed projects={projects} creators={creators} state={portal.state} communityEnabled={isReady&&portal.data.status.features?.communityPosts===true}/>

      {isReady&&<div className="cinema-verification-note">{portal.data.status.counts.publishedProjects} APPROVED PUBLIC PROJECTS · {portal.data.status.counts.publishedCreators} PUBLIC CREATOR CHANNELS · Only genuine published activity is shown.</div>}
    </div>
  </div>;
}
