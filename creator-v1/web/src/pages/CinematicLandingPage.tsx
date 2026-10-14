import {Link} from "react-router-dom";
import type {PointerEvent} from "react";
import {readCreators, readProjects, readStatus, type Project} from "../lib/api";
import {useResource} from "../lib/useResource";
import {projectDetailPath} from "../lib/navigation";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {CosmicScene} from "../components/CosmicIllustration";
import {LevelPanel} from "../components/LevelPanel";
import {Icon} from "../components/Icons";
import {CinematicCategoryStrip,CinematicCatalogueSections} from "../components/CinematicCatalogueSections";
import {ErrorState, LoadingState} from "../components/States";
import {CinematicPortalFX} from "../components/CinematicPortalFX";
import {CinematicAtmosphere} from "../components/CinematicAtmosphere";
import {CinematicDiscoverySections} from "../components/CinematicDiscoverySections";
import {HotCommunityPosts} from "./HotCommunityPosts";

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
const modules:readonly Gate[]=[
  {title:"CREATOR STUDIO",eyebrow:"Make, manage and prepare your work.",to:"/create",scene:"tools"},
  {title:"COMMUNITY",eyebrow:"Meet makers and discover their work.",to:"/community",scene:"other"},
  {title:"APPS & TOOLS",eyebrow:"Try original independent software.",to:"/discover?category=tools",scene:"automation"},
  {title:"LEARN & RESEARCH",eyebrow:"Explore shared learning and research.",to:"/guide",scene:"research"},
  {title:"FIELD NOTES",eyebrow:"Guides, ideas and the field guide.",to:"/guide",scene:"libraries"}
];
const categories:readonly {title:string;scene:CosmicScene;to:string}[]=[
  {title:"GAMES",scene:"games",to:"/discover?category=games"},
  {title:"APPS",scene:"tools",to:"/discover?category=tools"},
  {title:"ART & AI",scene:"creative",to:"/discover?category=creative"}
];
const railMain=[
  {label:"Home",to:"/",icon:"home"},
  {label:"Explore",to:"/discover",icon:"explore"},
  {label:"Create",to:"/create",icon:"create"},
  {label:"Community",to:"/community",icon:"community"},
  {label:"Apps",to:"/discover?category=tools",icon:"explore"},
  {label:"Lab",to:"/workspace",icon:"status"},
  {label:"Field Notes",to:"/guide",icon:"library"}
] as const;
const railPersonal=[
  {label:"Library",to:"/library",icon:"library"},
  {label:"Rewards",to:"/levels",icon:"star"},
  {label:"Account",to:"/account",icon:"people"}
] as const;
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

function CinematicRail(){
  return <aside className="cinema-rail" aria-label="Desktop navigation">
    <nav aria-label="Main shortcuts">
      {railMain.map(item=><Link key={item.label} to={item.to} className={item.to==="/"?"cinema-rail-active":undefined}><Icon name={item.icon} size={17}/><span>{item.label}</span></Link>)}
    </nav>
    <div className="cinema-rail-rule"/>
    <nav aria-label="Personal shortcuts">
      {railPersonal.map(item=><Link key={item.label} to={item.to}><Icon name={item.icon} size={17}/><span>{item.label}</span></Link>)}
    </nav>
    <div className="cinema-rail-world">
      <CosmicArtwork scene="research"/>
      <div><small>ANEVUM</small><strong>A WORLD OF THINGS PEOPLE MAKE.</strong></div>
    </div>
  </aside>;
}

function FeaturedScene({project}:{project:Project|null}){
  const href=project?projectDetailPath(project.id,"/"):"/start";
  const label=project?"FEATURED PUBLISHED PROJECT":"FIRST SHOWCASE / IN PREPARATION";
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
      readStatus(signal),readProjects({limit:"8"},signal),readCreators({limit:"4"},signal)
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
    <CinematicRail/>
    <div className="cinema-content">
      <section className="cinema-hero" aria-labelledby="cinema-hero-title" onPointerMove={moveScene} onPointerLeave={resetScene}>
        <div className="cinema-hero-art" aria-hidden="true"><CosmicArtwork scene="hero" priority/></div>
        <CinematicAtmosphere/>
        <div className="cinema-hero-light" aria-hidden="true"/>
        <CinematicPortalFX/>
        <div className="cinema-hero-layout">
          <div className="cinema-hero-copy">
            <div className="cinema-kicker">A CREATIVE UNIVERSE</div>
            <h1 id="cinema-hero-title">CREATE<br/>BEYOND<br/>WORLDS</h1>
            <p>Games. Apps. Art. Experiments. Worlds.<br/>A universe for creators, by creators.</p>
            <div className="cinema-actions">
              <Link to="/discover" className="cinema-button cinema-button--primary">EXPLORE WORLDS <Icon name="arrow" size={17}/></Link>
              <Link to="/start" className="cinema-button cinema-button--secondary">DISCOVER ANEVUM <Icon name="arrow" size={16}/></Link>
            </div>
          </div>
          <FeaturedScene project={featured}/>
        </div>
      </section>

      <nav className="cinema-gateways" aria-label="Explore ANEVUM worlds">
        {gates.map(item=><SceneLink key={item.title} item={item} variant="gate"/>)}
      </nav>

      <CinematicCategoryStrip/>
      {isReady&&<CinematicCatalogueSections projects={projects} creators={creators}/>}

      <CinematicDiscoverySections projects={projects} creators={creators} state={portal.state}/>

      <section className="cinema-community" aria-label="Connected community boards and discussions">
        <div className="cinema-panel cinema-community-board">
          <div className="cinema-panel-heading"><h2>FROM THE COMMUNITY</h2><Link to="/boards">OPEN BOARDS <Icon name="arrow" size={14}/></Link></div>
          <p>Discover approved releases, give new makers a first look, and follow the conversation around their work.</p>
          <nav aria-label="Community board views"><Link className="cinema-button cinema-button--secondary" to="/boards">LATEST RELEASES</Link><Link className="cinema-button cinema-button--secondary" to="/boards?view=firstLooks">FIRST LOOKS</Link><Link className="cinema-button cinema-button--secondary" to="/boards?view=publishing">CREATOR ACTIVITY</Link></nav>
        </div>
        <HotCommunityPosts/>
      </section>

      <section className="cinema-modules" aria-label="More to discover">
        {modules.map(item=><SceneLink key={item.title} item={item} variant="module"/>)}
      </section>

      <section className="cinema-dashboard cinema-dashboard--private" aria-label="Private workspace and member progression">
        <div className="cinema-panel cinema-rhen">
          <div className="cinema-panel-heading"><h2><span className="cinema-status-dot"/> RHEN TERMINAL</h2><Link to="/workspace">PRIVATE <Icon name="arrow" size={14}/></Link></div>
          <div className="cinema-terminal-scene" aria-hidden="true"><CosmicArtwork scene="tools"/></div>
          <div className="cinema-terminal-info"><strong>PRIVATE WORKSPACE</strong><span>Research and brokerage data remain owner-protected. No public live trading feed.</span></div>
          <Link to="/workspace" className="cinema-terminal-action">OPEN WORKSPACE <Icon name="arrow" size={15}/></Link>
        </div>

        <div className="cinema-panel cinema-rewards">
          <div className="cinema-panel-heading"><h2>YOUR JOURNEY</h2><Link to="/levels">ARTIFACTS <Icon name="arrow" size={14}/></Link></div>
          <LevelPanel compact/>
        </div>
      </section>

      {isReady&&<div className="cinema-verification-note">{portal.data.status.counts.publishedProjects} APPROVED PUBLIC PROJECTS · {portal.data.status.counts.publishedCreators} PUBLIC CREATOR CHANNELS · Only genuine published activity is shown.</div>}
    </div>
  </div>;
}
