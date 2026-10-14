import {useEffect,useMemo,useState,type CSSProperties} from "react";
import {Link} from "react-router-dom";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {CosmicScene} from "../components/CosmicIllustration";
import {readCreators,readProjects,readStatus,type Category,type Project} from "../lib/api";
import {useResource} from "../lib/useResource";
import {MorphActivityStream} from "./MorphActivityStream";
import "./morph-home-console.css";

const CATEGORIES:ReadonlyArray<{id:"games"|"tools"|"creative"|"learning";name:string;lead:string;scene:CosmicScene;eyebrow:string}>= [
  {id:"games",name:"THE ARCADE",lead:"Play something unexpected.",scene:"games",eyebrow:"01 / PLAY"},
  {id:"tools",name:"THE WORKSHOP",lead:"Make something useful.",scene:"tools",eyebrow:"02 / BUILD"},
  {id:"creative",name:"THE STUDIO",lead:"Explore something original.",scene:"creative",eyebrow:"03 / IMAGINE"},
  {id:"learning",name:"THE LIBRARY",lead:"Learn something new.",scene:"learning",eyebrow:"04 / LEARN"}
];
const sceneFor:Record<Category,CosmicScene>={
  games:"games",tools:"tools",creative:"creative",learning:"learning",research:"research",
  automation:"automation",libraries:"libraries",other:"other"
};
function dateLabel(date:string|null):string{
  if(!date)return "APPROVED RELEASE";
  const timestamp=Date.parse(date);
  if(!Number.isFinite(timestamp))return "APPROVED RELEASE";
  return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(timestamp)).toUpperCase();
}
function projectLink(project:Project){return "/atlas/projects/"+encodeURIComponent(project.id);}
function preferredName(project:Project){return project.creatorName||project.creatorHandle;}
function previewArtwork(project:Project){
  return <CosmicArtwork scene={sceneFor[project.category]}/>;
}

export function MorphHomeConsole({onExplore}:{onExplore:()=>void}){
  const [refresh,setRefresh]=useState(0);
  const [spotlightIndex,setSpotlightIndex]=useState(0);
  const feed=useResource(async signal=>{
    const [projects,status,creators]=await Promise.allSettled([
      readProjects({limit:"16"},signal),
      readStatus(signal),
      readCreators({limit:"6"},signal)
    ]);
    // Recent releases and public projects stay usable if the status and
    // creator directory services experience an independent outage.
    if(projects.status!=="fulfilled")throw projects.reason;
    return {
      projects:projects.value,
      status:status.status==="fulfilled"?status.value:null,
      creators:creators.status==="fulfilled"?creators.value:null
    };
  },[refresh]);
  useEffect(()=>{
    const onVisible=()=>{if(document.visibilityState==="visible")setRefresh(value=>value+1);};
    const timer=window.setInterval(()=>{
      if(document.visibilityState==="visible")setRefresh(value=>value+1);
    },120000);
    document.addEventListener("visibilitychange",onVisible);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisible);};
  },[]);
  const releases=useMemo(()=>feed.state==="ready"?
    [...feed.data.projects.items].sort((a,b)=>(Date.parse(b.publishedAt||"")||0)-(Date.parse(a.publishedAt||"")||0))
    :[],[feed]);
  const spotlight=releases.slice(0,5);
  const lead=spotlight[spotlightIndex%Math.max(1,spotlight.length)]||null;
  const spotlightCount=spotlight.length;
  const advance=(direction:1|-1)=>setSpotlightIndex(index=>(
    spotlightCount?(index+direction+spotlightCount)%spotlightCount:0
  ));
  const published=feed.state==="ready"?feed.data.status?.counts.publishedProjects??null:null;
  const creators=feed.state==="ready"?feed.data.creators?.items||[]:[];

  return <div className="mhc-console">
    <header className="mhc-broadcast">
      <span><b aria-hidden="true">◉</b> ANEVUM NETWORK / FRONT PAGE</span>
      <span>INDEPENDENT DIGITAL CREATION · PUBLIC EDITION</span>
    </header>
    <section className="mhc-feature-zone" aria-label="What's happening on ANEVUM">
      <div className="mhc-headliner">
        <div className="mhc-hero-art" aria-hidden="true">{lead?previewArtwork(lead):<CosmicArtwork scene="hero" priority/>}</div>
        <div className="mhc-hero-vignette" aria-hidden="true"/>
        <div className="mhc-hero-upper">
          <span className="mhc-hero-orbit">ANEVUM / CREATIVE NETWORK</span>
          <span className="mhc-hero-edition">{lead?"LATEST APPROVED RELEASE":"THE NETWORK IS OPEN FOR EXPLORATION"}</span>
        </div>
        <div className="mhc-hero-copy">
          <span className="mhc-feature-kicker">{lead?lead.category.toUpperCase()+" / "+dateLabel(lead.publishedAt):"WORLD 00 / THE FRONTIER"}</span>
          <h1>{lead?lead.title:<>THE FUTURE<br/>IS <em>CREATED.</em></>}</h1>
          <p>{lead?lead.summary:"A home for remarkable games, experimental software, digital art, and the people making them. Follow real creations as the network grows."}</p>
          {spotlightCount>1&&<div className="mhc-spotlight-controls" aria-label="Featured approved releases">
            <span>FEATURE {String(spotlightIndex%spotlightCount+1).padStart(2,"0")} / {String(spotlightCount).padStart(2,"0")}</span>
            <button type="button" onClick={()=>advance(-1)} aria-label="Previous featured release">←</button>
            <button type="button" onClick={()=>advance(1)} aria-label="Next featured release">→</button>
          </div>}
          <div className="mhc-feature-actions">
            <Link to={lead?projectLink(lead):"/atlas/discover"} className="mhc-primary-action">
              {lead?"OPEN RELEASE":"DISCOVER WORK"} <span aria-hidden="true">↗</span>
            </Link>
            <button type="button" onClick={onExplore} className="mhc-secondary-action">EXPLORE THE WORLDS <span aria-hidden="true">⌄</span></button>
          </div>
          {lead&&<span className="mhc-feature-attribution">BY {preferredName(lead)} / @{lead.creatorHandle} · CATEGORY ILLUSTRATION</span>}
        </div>
      </div>
      <MorphActivityStream/>
    </section>

    <section className="mhc-newsroom" aria-labelledby="mhc-news-heading">
      <div className="mhc-section-title">
        <div><span>THE CREATIVE NETWORK / CURRENT ISSUE</span><h2 id="mhc-news-heading">RECENT <em>ARRIVALS.</em></h2></div>
        <Link to="/atlas/discover">THE FULL ARCHIVE <span aria-hidden="true">↗</span></Link>
      </div>
      {feed.state==="ready"&&releases.length>0?
        <div className="mhc-release-rail">
          {releases.slice(0,4).map((project,i)=><article className="mhc-release" key={project.id}>
            <Link to={projectLink(project)} className="mhc-release-media" aria-label={"Open "+project.title}>
              {previewArtwork(project)}<span>CATEGORY ILLUSTRATION</span>
            </Link>
            <div className="mhc-release-copy"><span>{String(i+1).padStart(2,"0")} / {project.category.toUpperCase()} · {dateLabel(project.publishedAt)}</span>
              <h3><Link to={projectLink(project)}>{project.title}</Link></h3><p>{project.summary}</p>
              <Link to={projectLink(project)} className="mhc-release-open">VIEW RELEASE ↗</Link>
            </div>
          </article>)}
        </div>:
        <div className="mhc-release-empty">
          <span>✧</span><div><strong>{feed.state==="error"?"PUBLIC RELEASES ARE UNAVAILABLE":"THE STORY IS JUST BEGINNING."}</strong>
          <p>{feed.state==="error"?"Please retry the public catalogue.":"The first approved creator releases will appear here. Explore a category while the community takes shape."}</p></div>
          <Link to="/atlas/discover">BROWSE DISCOVERY ↗</Link>
        </div>}
    </section>

    <div className="mhc-bottom-grid">
      <section className="mhc-departments" aria-labelledby="mhc-departments-heading">
        <div className="mhc-section-title">
          <div><span>STUDIOS / PROGRAMS / DEPARTMENTS</span><h2 id="mhc-departments-heading">FIND YOUR <em>FREQUENCY.</em></h2></div>
        </div>
        <div className="mhc-department-rows">
          {CATEGORIES.map(row=><Link className="mhc-department" to={"/atlas/discover?category="+row.id} key={row.id}>
            <div className="mhc-department-art" aria-hidden="true"><CosmicArtwork scene={row.scene}/></div>
            <span className="mhc-department-code">{row.eyebrow}</span>
            <span className="mhc-department-name"><strong>{row.name}</strong><small>{row.lead}</small></span>
            <span className="mhc-department-arrow" aria-hidden="true">↗</span>
          </Link>)}
        </div>
      </section>
      <aside className="mhc-community" aria-labelledby="mhc-community-heading">
        <div className="mhc-section-title"><div><span>PEOPLE / PUBLIC CHANNELS</span><h2 id="mhc-community-heading">THE <em>MAKERS.</em></h2></div></div>
        <p>Find independent creators, explore their published work, and follow the development of our collaborative spaces.</p>
        {feed.state==="ready"&&creators.length?
          <div className="mhc-maker-list">{creators.slice(0,4).map((creator,i)=><Link to={"/atlas/creators/"+encodeURIComponent(creator.handle)} key={creator.handle}>
            <span className="mhc-maker-number">{String(i+1).padStart(2,"0")}</span>
            <span><strong>{creator.displayName}</strong><small>@{creator.handle} · {creator.publishedProjects} RELEASES</small></span>
            <span className="mhc-maker-open" aria-hidden="true">↗</span>
          </Link>)}</div>:
          <div className="mhc-community-pending">No public creator channels are available to display. We don't invent people, posts or participation.</div>}
        <Link className="mhc-maker-cta" to="/atlas/community">EXPLORE COMMUNITY ↗</Link>
      </aside>
    </div>
    <footer className="mhc-console-end">
      <span>ANEVUM / AN INDEPENDENT CREATOR NETWORK</span>
      <span>{published===null?"PUBLIC METRICS UNAVAILABLE":published+" APPROVED PUBLIC PROJECTS"} · IREN EDITORIAL AUTOMATION PLANNED</span>
    </footer>
  </div>;
}
