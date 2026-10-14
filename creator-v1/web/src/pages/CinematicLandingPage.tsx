import {Link} from "react-router-dom";
import {readCreators, readProjects, readStatus, type Project} from "../lib/api";
import {useResource} from "../lib/useResource";
import {projectDetailPath} from "../lib/navigation";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {CosmicScene} from "../components/CosmicIllustration";
import {LevelPanel} from "../components/LevelPanel";
import {Icon} from "../components/Icons";
import {ErrorState, LoadingState} from "../components/States";

/**
 * LOCKED DIRECTION 2026-10-13
 * Desktop and mobile source references:
 * ANEVUM/Visual-References/2026-10-13-Cinematic-World.
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
  function moveScene(event:React.PointerEvent<HTMLElement>){
    if(event.pointerType==="touch")return;
    const node=event.currentTarget;
    const bounds=node.getBoundingClientRect();
    const x=((event.clientX-bounds.left)/bounds.width-.5)*2;
    const y=((event.clientY-bounds.top)/bounds.height-.5)*2;
    node.style.setProperty("--cinema-pointer-x",x.toFixed(3));
    node.style.setProperty("--cinema-pointer-y",y.toFixed(3));
  }
  function resetScene(event:React.PointerEvent<HTMLElement>){
    event.currentTarget.style.setProperty("--cinema-pointer-x","0");
    event.currentTarget.style.setProperty("--cinema-pointer-y","0");
  }

  return <div className="anevum-cinema">
    <CinematicRail/>
    <div className="cinema-content">
      <section className="cinema-hero" aria-labelledby="cinema-hero-title" onPointerMove={moveScene} onPointerLeave={resetScene}>
        <div className="cinema-hero-art" aria-hidden="true"><CosmicArtwork scene="hero" priority/></div>
        <div className="cinema-hero-light" aria-hidden="true"/>
        <div className="cinema-hero-layout">
          <div className="cinema-hero-copy">
            <div className="cinema-kicker">CREATE <span>·</span> EXPLORE <span>·</span> TOGETHER</div>
            <h1 id="cinema-hero-title">A CREATIVE<br/>TECHNOLOGY<br/>PLAYGROUND</h1>
            <p>Build worlds. Create without limits.<br/>Explore a universe of imagination.</p>
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

      <section className="cinema-modules" aria-label="More to discover">
        {modules.map(item=><SceneLink key={item.title} item={item} variant="module"/>)}
      </section>

      <section className="cinema-dashboard" aria-label="Discover creators, projects, and your ANEVUM space">
        <div className="cinema-panel cinema-creators">
          <div className="cinema-panel-heading"><h2>FEATURED CREATORS</h2><Link to="/creators">VIEW ALL <Icon name="arrow" size={14}/></Link></div>
          {portal.state==="loading"&&<LoadingState label="Reading public creators"/>}
          {portal.state==="error"&&<ErrorState title="CREATORS UNAVAILABLE" detail="Unable to retrieve public creator channels."/>}
          {isReady&&(creators.length?
            <div className="cinema-creator-grid">{creators.map(creator=><Link className="cinema-creator" key={creator.handle} to={"/creators/"+encodeURIComponent(creator.handle)}>
              <span className="cinema-creator-avatar" aria-hidden="true">{creator.displayName.slice(0,1).toUpperCase()}</span>
              <strong>{creator.displayName}</strong>
              <span>{creator.publishedProjects} {creator.publishedProjects===1?"project":"projects"}</span>
            </Link>)}</div>:
            <div className="cinema-creator-empty"><CosmicArtwork scene="creative"/><strong>Meet the first creators.</strong><p>Public channels appear here after real publication approval.</p><Link to="/start">HOW TO PARTICIPATE <Icon name="arrow" size={14}/></Link></div>)}
        </div>

        <div className="cinema-panel cinema-projects">
          <div className="cinema-panel-heading"><h2>EXPLORE PROJECTS</h2><Link to="/discover">VIEW ALL <Icon name="arrow" size={14}/></Link></div>
          <div className="cinema-filter-labels" aria-label="Browse project categories"><Link to="/discover">ALL</Link>{categories.map(item=><Link key={item.title} to={item.to}>{item.title}</Link>)}</div>
          {portal.state==="loading"&&<LoadingState label="Reading real published projects"/>}
          {portal.state==="error"&&<ErrorState title="CATALOGUE UNAVAILABLE" detail="Public catalogue data could not be loaded."/>}
          {isReady&&(projects.length?
            <div className="cinema-project-list">{projects.slice(0,3).map(project=><Link key={project.id} className="cinema-project-tile" to={projectDetailPath(project.id,"/")}>
              <div className="cinema-project-art"><CosmicArtwork scene={categoryArt[project.category]}/><span>CATEGORY ART</span></div>
              <strong>{project.title}</strong><small>@{project.creatorHandle}</small>
            </Link>)}</div>:
            <div className="cinema-discovery-empty">
              <p>THE FIRST PUBLIC PROJECTS ARE AHEAD.</p>
              <div className="cinema-project-list">{categories.map(item=><Link key={item.title} to={item.to} className="cinema-project-tile">
                <div className="cinema-project-art"><CosmicArtwork scene={item.scene}/></div>
                <strong>{item.title}</strong><small>EXPLORE CATEGORY</small>
              </Link>)}</div>
            </div>)}
        </div>

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
