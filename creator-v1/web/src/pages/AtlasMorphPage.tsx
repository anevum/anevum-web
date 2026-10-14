import {
  useEffect,useMemo,useRef,useState,
  type CSSProperties,type MouseEvent as ReactMouseEvent
} from "react";
import {Link,Outlet,useLocation,useNavigate} from "react-router-dom";
import {OrbitalMark} from "../components/OrbitalMark";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {PortalLauncher} from "../components/PortalLauncher";
import {isEditableTarget} from "../lib/portal-destinations";
import {ATLAS_WORLDS,type AtlasWorld,type AtlasWorldId} from "../lib/atlas-worlds";
import {memberHealth,memberMe,memberProgress,type Progression} from "../lib/member-api";
import "./atlas-morph.css";

const WORLDS:Readonly<Record<AtlasWorldId,string>>={
  discover:"/atlas/discover",
  play:"/atlas/discover?category=games",
  apps:"/atlas/discover?category=tools",
  creative:"/atlas/discover?category=creative",
  studio:"/atlas/create",
  commons:"/atlas/community",
  collaborate:"/atlas/collaborate",
  signals:"/atlas/signals",
  artifacts:"/atlas/levels",
  identity:"/atlas/account"
};
const ROUTES=new Set([
  "discover","projects","creators","community","create","library","account","levels",
  "workspace","status","start","guide"
]);
type Progress={level:number;xp:number;artifact:string|null};
function worldFor(pathname:string,search:string):AtlasWorldId|null {
  if(pathname==="/atlas"||pathname==="/atlas/")return null;
  if(pathname.startsWith("/atlas/discover")){
    const category=new URLSearchParams(search).get("category");
    return category==="games"?"play":category==="tools"?"apps":category==="creative"?"creative":"discover";
  }
  if(pathname.startsWith("/atlas/projects/"))return "discover";
  if(pathname.startsWith("/atlas/creators"))return "commons";
  if(pathname.startsWith("/atlas/community")||pathname.startsWith("/atlas/start")||pathname.startsWith("/atlas/guide"))return "commons";
  if(pathname.startsWith("/atlas/workspace")||pathname.startsWith("/atlas/collaborate"))return "collaborate";
  if(pathname.startsWith("/atlas/signals"))return "signals";
  if(pathname.startsWith("/atlas/create"))return "studio";
  if(pathname.startsWith("/atlas/account")||pathname.startsWith("/atlas/library"))return "identity";
  if(pathname.startsWith("/atlas/levels"))return "artifacts";
  if(pathname.startsWith("/atlas/status"))return "discover";
  return null;
}
function ProgressSignal(){
  const [verified,setVerified]=useState<Progression|null>(null);
  const [milestone,setMilestone]=useState<Progress|null>(null);
  const previous=useRef<{id:string;level:number;xp:number}|null>(null);
  useEffect(()=>{
    let present=true;
    const controller=new AbortController();
    async function check(){
      try{
        const health=await memberHealth(controller.signal);
        if(health.status!=="ok")return;
        const {member}=await memberMe(controller.signal);
        const {progression}=await memberProgress(controller.signal);
        if(!present)return;
        const before=previous.current;
        if(before&&before.id===member.id&&progression.level>before.level&&progression.xp>before.xp){
          setMilestone({level:progression.level,xp:progression.xp,artifact:progression.artifact});
        }
        previous.current={id:member.id,level:progression.level,xp:progression.xp};
        setVerified(progression);
      }catch{/* Never invent a session, unread message, XP gain or achievement. */}
    }
    const focus=()=>{if(document.visibilityState==="visible")void check();};
    void check();
    window.addEventListener("focus",focus);
    document.addEventListener("visibilitychange",focus);
    return()=>{present=false;controller.abort();window.removeEventListener("focus",focus);document.removeEventListener("visibilitychange",focus);};
  },[]);
  useEffect(()=>{
    if(!milestone)return;
    const timeout=window.setTimeout(()=>setMilestone(null),6500);
    return()=>window.clearTimeout(timeout);
  },[milestone]);
  return <>
    <Link to="/atlas/account" className="atm-progress" aria-label={verified?"Verified member level "+verified.level:"Account access information"}>
      <span aria-hidden="true">✶</span><span><small>{verified?"ACCOUNT PROGRESSION":"YOUR PROGRESSION"}</small>
        <strong>{verified?"LEVEL "+verified.level+" · "+verified.xp.toLocaleString()+" XP":"INVITED TESTING"}</strong></span>
    </Link>
    {milestone&&<div className="atm-milestone" role="status" aria-live="polite">
      <div className="atm-milestone-stars" aria-hidden="true">✦ ✧ ✶ ✧ ✦</div>
      <span>SERVER-VERIFIED ACHIEVEMENT</span><strong>LEVEL {milestone.level}</strong>
      <p>{milestone.artifact||"Another orbit reached."} · {milestone.xp.toLocaleString()} XP</p>
      <button type="button" onClick={()=>setMilestone(null)}>CONTINUE EXPLORING</button>
    </div>}
  </>;
}
const PRIMARY_WORLDS:readonly AtlasWorldId[]=["discover","play","apps","creative","commons","studio"];
const selectedWorld=(id:AtlasWorldId)=>ATLAS_WORLDS.find(w=>w.id===id)!;

function WorldTile({world,onEnter}:{world:AtlasWorld;onEnter:()=>void}){
  return <button className={"atm-world-tile atm-world-tile--"+world.id} type="button" onClick={onEnter}
    aria-label={world.title+" — "+world.tagline+"; "+(world.status==="planned"?"planned feature":"open world")}
    style={{"--tile-color":world.accent} as CSSProperties}>
    <span className="atm-world-art" aria-hidden="true"><CosmicArtwork scene={world.scene}/></span>
    <span className="atm-world-overlay" aria-hidden="true"/>
    <span className="atm-world-top"><span>{world.number} / {world.status==="planned"?"IN DEVELOPMENT":world.status==="invited"?"INVITED":"WORLD"}</span><b aria-hidden="true">{world.glyph}</b></span>
    <span className="atm-world-bottom"><strong>{world.title}</strong><small>{world.tagline}</small></span>
    <span className="atm-world-arrow" aria-hidden="true">↗</span>
  </button>;
}
function Overview({onEnter,onSearch}:{onEnter:(world:AtlasWorld)=>void;onSearch:()=>void}){
  return <div className="atm-overview">
    <section className="atm-overview-lead">
      <span className="atm-overview-eyebrow">ANEVUM / A CREATIVE UNIVERSE</span>
      <h1>GO<br/><em>BEYOND.</em></h1>
      <p>Games, ideas, people, and tools worth discovering. Every world is part of one connected environment.</p>
      <div className="atm-overview-actions">
        <button className="atm-overview-start" type="button" onClick={()=>onEnter(selectedWorld("discover"))}>ENTER THE UNIVERSE <span aria-hidden="true">↗</span></button>
        <button className="atm-overview-quick" type="button" onClick={onSearch} aria-label="Search all ANEVUM destinations">QUICK JUMP <span aria-hidden="true">⌕</span></button>
      </div>
      <div className="atm-overview-context"><span>10 INTERCONNECTED WORLDS</span><span>ONE UNINTERRUPTED EXPERIENCE</span></div>
    </section>
    <section className="atm-world-gallery" aria-label="Explore ANEVUM worlds">
      <div className="atm-world-gallery-title"><span>WORLD DIRECTORY</span><span>CHOOSE WHERE TO BEGIN ↓</span></div>
      <div className="atm-world-grid">
        {ATLAS_WORLDS.map(world=><WorldTile world={world} onEnter={()=>onEnter(world)} key={world.id}/>)}
      </div>
    </section>
  </div>;
}

export function AtlasFuture({kind}:{kind:"collaborate"|"signals"}){
  const isRoom=kind==="collaborate";
  return <div className="atm-future">
    <div className="atm-future-mark" aria-hidden="true">{isRoom?"⟡":"⌁"}</div>
    <span className="atm-future-index">FUTURE WORLD / ARCHITECTURE IN DEVELOPMENT</span>
    <h2>{isRoom?"MAKE SPACE":"STAY IN THE"}<br/><em>{isRoom?"FOR OTHERS.":"CONVERSATION."}</em></h2>
    <p>{isRoom
      ?"The collaboration layer will connect creators to projects, shared workspaces, review tasks, files, and teammates. No actual simultaneous editing, invitations, or live presence is available today."
      :"The communication layer will provide private messages, project mentions, invitations and opted-in notifications. There is no live message inbox, unread counter or push notification service today."}</p>
    <div className="atm-future-grid">
      {(isRoom?
        [["01","INVITE","Project-scoped member roles and approvals"],
         ["02","BUILD","Shared assets and contributions with revisions"],
         ["03","REVIEW","Useful feedback, tasks and moderation"]]:
        [["01","CONVERSE","Private threads with consent and reporting"],
         ["02","FOLLOW","Updates from projects you choose"],
         ["03","CONTROL","Mute, block, notification and privacy settings"]]
      ).map(([number,title,description])=><article key={number}>
        <span>{number} / ROADMAP</span><strong>{title}</strong><p>{description}</p>
      </article>)}
    </div>
    <Link className="atm-future-action" to={isRoom?"/atlas/workspace":"/atlas/community"}>VIEW CURRENT PUBLIC WORKSPACE ↗</Link>
  </div>;
}

export function AtlasMorphLayout(){
  const navigate=useNavigate();
  const location=useLocation();
  const chosenId=useMemo(()=>worldFor(location.pathname,location.search),[location.pathname,location.search]);
  const chosen=chosenId?selectedWorld(chosenId):null;
  const focused=chosenId!==null;
  const [menuOpen,setMenuOpen]=useState(false);
  const [launcherOpen,setLauncherOpen]=useState(false);
  const main=useRef<HTMLElement>(null);
  const lastNav=useRef<HTMLElement|null>(null);
  const previousRoute=useRef(location.pathname+location.search);

  useEffect(()=>{
    const route=location.pathname+location.search;
    if(previousRoute.current!==route){
      previousRoute.current=route;
      main.current?.scrollTo({top:0,behavior:"instant"});
      main.current?.focus({preventScroll:true});
    }
    setMenuOpen(false);
    setLauncherOpen(false);
  },[location.pathname,location.search]);

  useEffect(()=>{
    function shortcut(event:KeyboardEvent){
      const command=(event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"&&!event.altKey;
      const slash=event.key==="/"&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!isEditableTarget(event.target);
      if(!command&&!slash)return;
      event.preventDefault();
      setMenuOpen(false);
      setLauncherOpen(true);
    }
    window.addEventListener("keydown",shortcut);
    return()=>window.removeEventListener("keydown",shortcut);
  },[]);

  function enter(world:AtlasWorld){
    lastNav.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    navigate(WORLDS[world.id]);
    setMenuOpen(false);
  }
  function home(){
    navigate("/atlas");
    setMenuOpen(false);
  }
  function onInternalLink(e:ReactMouseEvent<HTMLElement>){
    // Keep real site links inside the persistent Morph route, including nested project pages.
    // Preserve explicit external, download, modified-click and private API destinations.
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const target=e.target;
    if(!(target instanceof Element))return;
    const anchor=target.closest("a[href]");
    if(!(anchor instanceof HTMLAnchorElement)||anchor.download||(anchor.target&&anchor.target!=="_self"))return;
    const url=new URL(anchor.href,window.location.href);
    if(url.origin!==window.location.origin)return;
    const appBase=import.meta.env.BASE_URL.replace(/\/$/,"");
    if(appBase&&!(url.pathname===appBase||url.pathname.startsWith(appBase+"/")))return;
    const relative=appBase?(url.pathname.slice(appBase.length)||"/"):url.pathname;
    if(relative.startsWith("/atlas/")||relative==="/atlas")return;
    if(relative==="/"){
      e.preventDefault();e.stopPropagation();home();return;
    }
    const first=relative.split("/").filter(Boolean)[0];
    if(!ROUTES.has(first))return;
    e.preventDefault();e.stopPropagation();
    navigate("/atlas"+relative+url.search+url.hash);
  }
  function onShellKey(e:React.KeyboardEvent<HTMLDivElement>){
    if(e.key!=="Escape"||launcherOpen)return;
    if(menuOpen){e.preventDefault();setMenuOpen(false);return;}
    if(!focused||e.target instanceof Element&&e.target.closest("dialog,[role=dialog],input,textarea,select,[contenteditable]"))return;
    e.preventDefault();
    home();
    window.requestAnimationFrame(()=>lastNav.current?.focus({preventScroll:true}));
  }
  function navButton(world:AtlasWorld,additional=""){
    return <button type="button" key={world.id}
      className={"atm-nav-link "+additional+(chosenId===world.id?" is-active":"")}
      aria-current={chosenId===world.id?"page":undefined}
      onClick={()=>enter(world)}>
      <span className="atm-nav-glyph" aria-hidden="true">{world.glyph}</span>
      <span>{world.title}</span>
    </button>;
  }
  return <div className={"atm-shell"+(focused?" atm-shell--focused":" atm-shell--overview")}
    data-experience="ANEVUM MORPH / SINGLE NAV REVIEW"
    data-layout={focused?"workspace":"overview"}
    onKeyDown={onShellKey}
    style={{"--atm-accent":chosen?.accent||"#e3c38f"} as CSSProperties}>
    <div className="atm-atmosphere" aria-hidden="true"><CosmicArtwork scene={chosen?.scene||"hero"} priority/></div>
    <div className="atm-atmosphere-overlay" aria-hidden="true"/>
    <header className="atm-header">
      <Link to="/atlas" className="atm-brand" aria-label="ANEVUM home in Morph">
        <OrbitalMark/>
        <span><strong>ANEVUM</strong><small>CREATE BEYOND WORLDS</small></span>
      </Link>
      <nav className="atm-primary-nav" aria-label="Main ANEVUM navigation">
        {PRIMARY_WORLDS.map(id=>navButton(selectedWorld(id),id==="apps"||id==="creative"?"atm-nav-optional":""))}
        <button type="button" className={"atm-worlds-trigger"+(menuOpen?" is-open":"")}
          aria-expanded={menuOpen} aria-controls="atm-worlds-menu"
          onClick={()=>setMenuOpen(v=>!v)}>
          <span className="atm-worlds-trigger-label">WORLDS</span>
          <span className="atm-worlds-current">{chosen?.title||"EXPLORE"}</span>
          <span aria-hidden="true">{menuOpen?"×":"⌄"}</span>
        </button>
      </nav>
      <div className="atm-actions">
        <ProgressSignal/>
        <button type="button" className="atm-search" onClick={()=>{setMenuOpen(false);setLauncherOpen(true);}}
          aria-label="Search all ANEVUM destinations" aria-keyshortcuts="Control+K Meta+K" title="Quick Jump /">
          <span aria-hidden="true">⌕</span><small>JUMP</small>
        </button>
        <Link to="/atlas/account" className="atm-account" aria-label="My ANEVUM account and profile">
          <span aria-hidden="true">◈</span>
        </Link>
      </div>
      {menuOpen&&<div className="atm-worlds-menu" id="atm-worlds-menu">
        <div className="atm-worlds-menu-intro"><span>THE WORLDS OF ANEVUM</span><strong>WHERE TO NEXT?</strong></div>
        <nav className="atm-worlds-menu-grid" aria-label="All ANEVUM worlds">
          {ATLAS_WORLDS.map(world=><button type="button" key={world.id} onClick={()=>enter(world)}
            className={world.id===chosenId?"is-active":""} aria-current={world.id===chosenId?"page":undefined}>
            <span className="atm-menu-glyph" aria-hidden="true">{world.glyph}</span>
            <span><strong>{world.title}</strong><small>{world.status==="planned"?"COMING LATER":world.tagline}</small></span>
            <span aria-hidden="true" className="atm-menu-arrow">↗</span>
          </button>)}
        </nav>
        <div className="atm-worlds-menu-utilities">
          <Link to="/atlas/creators" onClick={()=>setMenuOpen(false)}>CREATORS</Link>
          <Link to="/atlas/guide" onClick={()=>setMenuOpen(false)}>FIELD GUIDE</Link>
          <Link to="/atlas/library" onClick={()=>setMenuOpen(false)}>MY LIBRARY</Link>
          <Link to="/atlas/account/edit" onClick={()=>setMenuOpen(false)}>EDIT PROFILE</Link>
          <Link to="/atlas/status" onClick={()=>setMenuOpen(false)}>BUILD STATUS</Link>
          <Link to="/" onClick={()=>setMenuOpen(false)}>STANDARD SITE ↗</Link>
        </div>
      </div>}
    </header>
    {menuOpen&&<button type="button" tabIndex={-1} aria-label="Close worlds menu"
      className="atm-menu-dismiss" onClick={()=>setMenuOpen(false)}/>}
    <main id="atm-content" ref={main}
      className={"atm-content"+(focused?" atm-content--page":" atm-content--overview")}
      onClickCapture={onInternalLink} tabIndex={-1}
      aria-label={focused?(chosen?.title||"ANEVUM")+" section":"ANEVUM universe home"}>
      {focused?<div key={chosenId||"world"} className="atm-embedded"><Outlet/></div>
        :<Overview onEnter={enter} onSearch={()=>{setMenuOpen(false);setLauncherOpen(true);}}/>}
    </main>
    <PortalLauncher open={launcherOpen} onClose={()=>setLauncherOpen(false)} routePrefix="/atlas"/>
  </div>;
}
