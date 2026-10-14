import {
  useEffect,useMemo,useRef,useState,
  type CSSProperties,type MouseEvent as ReactMouseEvent,type PointerEvent as ReactPointerEvent
} from "react";
import {Link,Outlet,useLocation,useNavigate} from "react-router-dom";
import {OrbitalMark} from "../components/OrbitalMark";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {PortalLauncher} from "../components/PortalLauncher";
import {isEditableTarget} from "../lib/portal-destinations";
import {ATLAS_WORLDS,ATLAS_MOBILE_LAYOUT,type AtlasWorld,type AtlasWorldId} from "../lib/atlas-worlds";
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
const clamped=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
type Drag={pointer:number;x:number;y:number;panX:number;panY:number;moved:boolean};
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
function Node({world,index,active,onOpen}:{world:AtlasWorld;index:number;active:boolean;onOpen:()=>void}){
  const mobile=ATLAS_MOBILE_LAYOUT[world.id];
  return <button className={"atm-node atm-node--"+world.id+(active?" atm-node--selected":"")}
    type="button" onClick={onOpen} aria-current={active?"page":undefined}
    aria-label={world.title+" — "+(world.status==="planned"?"planned feature":"open section")}
    style={{
      "--node-index":index,"--node-x":world.coordinates[0],"--node-y":world.coordinates[1],
      "--node-mobile-x":mobile[0],"--node-mobile-y":mobile[1],
      "--node-color":world.accent
    } as CSSProperties}>
    <span className="atm-node-halo" aria-hidden="true"/>
    <span className="atm-node-art" aria-hidden="true"><CosmicArtwork scene={world.scene}/></span>
    <span className="atm-node-sign" aria-hidden="true">{world.glyph}</span>
    <span className="atm-node-title"><small>{world.number} / {world.status==="planned"?"PLANNED":"WORLD"}</small><strong>{world.title}</strong></span>
  </button>;
}
function Overview({onEnter,onSearch}:{onEnter:()=>void;onSearch:()=>void}){
  return <div className="atm-overview">
    <span className="atm-overview-eyebrow">INDEPENDENT CREATION / A NEW KIND OF INTERNET</span>
    <h1>THE INTERNET<br/><i>IS A PLACE.</i></h1>
    <p>Move through interconnected worlds. Make things, discover people, and build together. Every destination leads somewhere real.</p>
    <div className="atm-overview-actions">
      <button type="button" className="atm-overview-start" onClick={onEnter}>ENTER DISCOVERY <span aria-hidden="true">↗</span></button>
      <button type="button" className="atm-overview-quick" onClick={onSearch}>SEARCH ALL WORLDS <span aria-hidden="true">⌕</span></button>
      <span className="atm-overview-instruction">SELECT A WORLD TO RECONFIGURE THE SPACE</span>
    </div>
    <div className="atm-overview-legend"><span>10 WORLDS</span><span>ONE CONNECTED ENVIRONMENT</span><span>NO FALSE ACTIVITY</span></div>
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
  const chosen=chosenId?ATLAS_WORLDS.find(w=>w.id===chosenId)||null:null;
  const focused=chosenId!==null;
  const [pan,setPan]=useState({x:0,y:0});
  const [guide,setGuide]=useState(false);
  const [launcherOpen,setLauncherOpen]=useState(false);
  const drag=useRef<Drag|null>(null);
  const suppress=useRef(false);
  const surface=useRef<HTMLDivElement>(null);
  const content=useRef<HTMLElement>(null);
  const worldHeading=useRef<HTMLHeadingElement>(null);
  const navigation=useRef<HTMLButtonElement|null>(null);
  const wasFocused=useRef(false);

  useEffect(()=>{content.current?.scrollTo({top:0,behavior:"instant"});},[location.pathname,location.search]);
  useEffect(()=>{
    function shortcut(event:KeyboardEvent){
      const command=(event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"&&!event.altKey;
      const slash=event.key==="/"&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!isEditableTarget(event.target);
      if(!command&&!slash)return;
      event.preventDefault();
      setLauncherOpen(true);
      setGuide(false);
    }
    window.addEventListener("keydown",shortcut);
    return()=>window.removeEventListener("keydown",shortcut);
  },[]);
  useEffect(()=>{setLauncherOpen(false);},[location.pathname,location.search]);

  useEffect(()=>{
    if(focused&&!wasFocused.current){
      const request=window.requestAnimationFrame(()=>worldHeading.current?.focus({preventScroll:true}));
      wasFocused.current=true;
      return()=>window.cancelAnimationFrame(request);
    }
    wasFocused.current=focused;
  },[focused]);
  // Browser Back and Forward naturally restore the visited world via React Router.
  // Keep the permanent shell mounted; only the internal route changes.
  function enter(world:AtlasWorld){
    if(suppress.current){suppress.current=false;return;}
    navigation.current=document.activeElement instanceof HTMLButtonElement?document.activeElement:null;
    navigate(WORLDS[world.id]);
    setGuide(false);
  }
  function back(){
    navigate("/atlas");
    requestAnimationFrame(()=>navigation.current?.focus({preventScroll:true}));
  }
  function down(e:ReactPointerEvent<HTMLDivElement>){
    if(focused||e.button!==0||(e.target instanceof Element&&e.target.closest("a,button,input,nav")))return;
    drag.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,panX:pan.x,panY:pan.y,moved:false};
  }
  function move(e:ReactPointerEvent<HTMLDivElement>){
    const d=drag.current;if(!d||e.pointerId!==d.pointer)return;
    const dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(!d.moved&&Math.hypot(dx,dy)>7){
      d.moved=true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if(d.moved)setPan({x:clamped(d.panX+dx,-72,72),y:clamped(d.panY+dy,-65,65)});
  }
  function up(e:ReactPointerEvent<HTMLDivElement>){
    const d=drag.current;if(!d||d.pointer!==e.pointerId)return;
    drag.current=null;
    if(d.moved){suppress.current=true;window.setTimeout(()=>{suppress.current=false;},0);}
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function onInternalLink(e:ReactMouseEvent<HTMLElement>){
    // Reuse existing React site components without remounting a conventional
    // page shell. Only left-click same-origin first-party navigation is captured.
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const target=e.target;
    if(!(target instanceof Element))return;
    const anchor=target.closest("a[href]");
    if(!(anchor instanceof HTMLAnchorElement)||anchor.download||anchor.target&&anchor.target!=="_self")return;
    const url=new URL(anchor.href,window.location.href);
    if(url.origin!==window.location.origin)return;
    // React Router's basename differs between apex (/), and the isolated
    // /creator/ review route. Always resolve within the deployed app base.
    const appBase=import.meta.env.BASE_URL.replace(/\/$/,"");
    if(appBase&&!(url.pathname===appBase||url.pathname.startsWith(appBase+"/")))return;
    const relative=appBase?(url.pathname.slice(appBase.length)||"/"):url.pathname;
    if(relative.startsWith("/atlas/")||relative==="/atlas")return;
    if(relative==="/"){
      e.preventDefault();
      e.stopPropagation();
      navigate("/atlas");
      return;
    }
    const first=relative.split("/").filter(Boolean)[0];
    if(!ROUTES.has(first))return;
    e.preventDefault();
    e.stopPropagation();
    navigate("/atlas"+relative+url.search+url.hash);
  }
  function onGlobalKey(e:React.KeyboardEvent<HTMLDivElement>){
    if(e.key==="Escape"&&focused&&!(e.target instanceof Element&&e.target.closest("dialog,[role=dialog],input,textarea,select,[contenteditable]"))){
      e.preventDefault();back();
    }else if(e.key==="Home"&&!focused&&e.target===surface.current){
      setPan({x:0,y:0});
    }
  }

  return <div className={"atm-shell"+(focused?" atm-shell--focused":" atm-shell--overview")}
    data-experience="ANEVUM MORPH / DESIGN REVIEW" data-layout={focused?"workspace":"overview"}
    style={{"--atm-pan-x":pan.x+"px","--atm-pan-y":pan.y+"px","--atm-accent":chosen?.accent||"#e1c18a"} as CSSProperties}
    onKeyDown={onGlobalKey}>
    <div className="atm-atmosphere" aria-hidden="true"><CosmicArtwork scene={chosen?.scene||"hero"} priority/></div>
    <div className="atm-atmosphere-overlay" aria-hidden="true"/>
    <div className="atm-scanlines" aria-hidden="true"/>
    <header className="atm-header">
      <Link to="/atlas" className="atm-brand" aria-label="ANEVUM Morph home"><OrbitalMark/><span><strong>ANEVUM</strong><small>THE LIVING NETWORK</small></span></Link>
      <div className="atm-header-center"><span className="atm-live-pulse" aria-hidden="true"/> WORLD ENGINE <strong>ANEVUM / MORPH</strong><em>PREVIEW 02</em></div>
      <nav className="atm-actions" aria-label="Universal workspace actions">
        <ProgressSignal/>
        <button type="button" className="atm-launch" onClick={()=>setLauncherOpen(true)} aria-label="Open ANEVUM quick navigation" aria-keyshortcuts="Control+K Meta+K" title="Search all ANEVUM destinations">⌕<span>JUMP</span></button>
        <button type="button" className="atm-help" onClick={()=>setGuide(x=>!x)} aria-expanded={guide} aria-label="Interaction guide">?</button>
        <Link to="/" className="atm-standard">STANDARD SITE ↗</Link>
      </nav>
    </header>
    <div ref={surface} className="atm-field" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      tabIndex={focused?-1:0} aria-label="ANEVUM worlds. Choose a front-facing world to open its workspace; drag empty space to pan.">
      <div className="atm-lattice" aria-hidden="true"/>
      <div className="atm-ring atm-ring--one" aria-hidden="true"/>
      <div className="atm-ring atm-ring--two" aria-hidden="true"/>
      <nav className="atm-constellation" aria-label="ANEVUM worlds">
        {ATLAS_WORLDS.map((world,index)=><Node key={world.id} world={world} index={index}
          active={world.id===chosenId} onOpen={()=>enter(world)}/>)}
      </nav>
      {!focused&&<Overview onEnter={()=>enter(ATLAS_WORLDS[0])} onSearch={()=>setLauncherOpen(true)}/>}
      {focused&&<section className="atm-workspace" aria-label={chosen?.title+" workspace"}>
        <div className="atm-workspace-top">
          <div className="atm-workspace-identity">
            <span>{chosen?.number} / SYSTEM WORLD</span>
            <h2 ref={worldHeading} tabIndex={-1}>{chosen?.title}<em>.</em></h2>
            <p>{chosen?.tagline}</p>
          </div>
          <div className="atm-workspace-controls">
            <span className="atm-workspace-state">{chosen?.status==="planned"?"IN DEVELOPMENT":chosen?.status==="invited"?"INVITED ACCESS":"PUBLIC WORLD"}</span>
            <button type="button" onClick={back} aria-label="Collapse workspace to all worlds">✕ <span>ALL WORLDS</span></button>
          </div>
        </div>
        <main ref={content} className="atm-content" onClickCapture={onInternalLink} id="atm-content" tabIndex={-1}>
          <div key={chosenId||"overview"} className="atm-embedded"><Outlet/></div>
        </main>
        <div className="atm-workspace-foot"><span>ANEVUM / {chosen?.overline}</span><span>THE SHELL STAYS. THE WORLD CHANGES.</span></div>
      </section>}
    </div>
    {focused&&<nav className="atm-mobile-dock" aria-label="Switch worlds without leaving your workspace">
      <button className="atm-mobile-jump" type="button" onClick={()=>setLauncherOpen(true)} aria-label="Search all ANEVUM destinations"><span aria-hidden="true">⌕</span><small>JUMP</small></button>
      {ATLAS_WORLDS.map(world=><button key={world.id} type="button" className={chosenId===world.id?"is-current":""}
        aria-label={"Switch to "+world.title} aria-current={chosenId===world.id?"page":undefined}
        onClick={()=>enter(world)}><span aria-hidden="true">{world.glyph}</span><small>{world.title}</small></button>)}
    </nav>}
    <PortalLauncher open={launcherOpen} onClose={()=>setLauncherOpen(false)} routePrefix="/atlas"/>
    <footer className="atm-footer">
      <div><span className="atm-footer-cross" aria-hidden="true">✣</span> <strong>{focused?chosen?.overline:"CHOOSE A WORLD"}</strong> <span>/ FRONT-FACING WORLD NAVIGATION</span></div>
      <div><Link to="/atlas/orbit">ORIGINAL ROTATING ATLAS ↗</Link> <span> · </span> <span>{focused?"ESC / ALL WORLDS":"DRAG EMPTY SPACE TO PAN"}</span></div>
    </footer>
    {guide&&<aside className="atm-guide" aria-label="How to use ANEVUM Morph">
      <header><strong>FIELD GUIDE / MORPH</strong><button type="button" onClick={()=>setGuide(false)} aria-label="Close guide">✕</button></header>
      <p>Worlds always face you. Selecting one restructures the scene into a persistent workspace. The other worlds become a navigation rail.</p>
      <p>Use the category cards or keyboard Tab and Enter. Escape or the ALL WORLDS button returns to the overview. On your phone, the lower strip switches worlds and can be swiped horizontally.</p>
      <p>Discover, profiles, public projects and guides use real ANEVUM React pages. Private creator and account tools remain invitation-gated. Messages and realtime shared editing are not live.</p>
    </aside>}
  </div>;
}
