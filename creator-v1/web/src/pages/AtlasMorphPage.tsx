import {
  useEffect,useMemo,useRef,useState,
  type CSSProperties,type MouseEvent as ReactMouseEvent
} from "react";
import {Link,Outlet,useLocation,useNavigate} from "react-router-dom";
import {OrbitalMark} from "../components/OrbitalMark";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {PortalLauncher} from "../components/PortalLauncher";
import {MorphHomeConsole} from "./MorphHomeConsole";
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
  const [name,setName]=useState<string|null>(null);
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
        if(present)setName(member.displayName?.trim()||member.handle||"MEMBER");
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
    <Link to="/atlas/account" className="atm-profile-card" aria-label={name?"My ANEVUM account for "+name:"Invited member account information"}>
      <span className="atm-profile-avatar" aria-hidden="true">◈</span>
      <span className="atm-profile-text"><strong>{name||"VISITOR"}</strong><small>{verified?"LV "+verified.level+" · "+verified.xp.toLocaleString()+" XP":"PRIVATE SPACE / INVITED"}</small></span>
      <span className="atm-profile-chevron" aria-hidden="true">↗</span>
    </Link>
    <Link to="/atlas/account/edit" className="atm-profile-settings" aria-label="Edit creator profile settings" title="Profile settings">⚙</Link>
    {milestone&&<div className="atm-milestone" role="status" aria-live="polite">
      <div className="atm-milestone-stars" aria-hidden="true">✦ ✧ ✶ ✧ ✦</div>
      <span>SERVER-VERIFIED ACHIEVEMENT</span><strong>LEVEL {milestone.level}</strong>
      <p>{milestone.artifact||"Another orbit reached."} · {milestone.xp.toLocaleString()} XP</p>
      <button type="button" onClick={()=>setMilestone(null)}>CONTINUE EXPLORING</button>
    </div>}
  </>;
}
const selectedWorld=(id:AtlasWorldId)=>ATLAS_WORLDS.find(w=>w.id===id)!;

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
  const [previewWorld,setPreviewWorld]=useState<AtlasWorldId>("discover");
  const main=useRef<HTMLElement>(null);
  const menuDialog=useRef<HTMLDialogElement>(null);
  const previousRoute=useRef(location.pathname+location.search);
  const menuPreview=selectedWorld(previewWorld);

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
    const dialog=menuDialog.current;if(!dialog)return;
    if(menuOpen&&!dialog.open)dialog.showModal();
    if(!menuOpen&&dialog.open)dialog.close();
  },[menuOpen]);

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
    setMenuOpen(false);
    navigate(WORLDS[world.id]);
  }
  function home(){
    setMenuOpen(false);
    navigate("/atlas");
  }
  function onInternalLink(e:ReactMouseEvent<HTMLElement>){
    // Preserve normal external, download and modified clicks, but keep native
    // ANEVUM public links inside the persistent routed full-screen interface.
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const target=e.target;if(!(target instanceof Element))return;
    const anchor=target.closest("a[href]");
    if(!(anchor instanceof HTMLAnchorElement)||anchor.download||(anchor.target&&anchor.target!=="_self"))return;
    const url=new URL(anchor.href,window.location.href);
    if(url.origin!==window.location.origin)return;
    const appBase=import.meta.env.BASE_URL.replace(/\/$/,"");
    if(appBase&&!(url.pathname===appBase||url.pathname.startsWith(appBase+"/")))return;
    const relative=appBase?(url.pathname.slice(appBase.length)||"/"):url.pathname;
    if(relative.startsWith("/atlas/")||relative==="/atlas")return;
    if(relative==="/"){e.preventDefault();e.stopPropagation();home();return;}
    const first=relative.split("/").filter(Boolean)[0];
    if(!ROUTES.has(first))return;
    e.preventDefault();e.stopPropagation();
    navigate("/atlas"+relative+url.search+url.hash);
  }
  function onShellKey(e:React.KeyboardEvent<HTMLDivElement>){
    if(e.key!=="Escape"||launcherOpen)return;
    if(menuOpen){e.preventDefault();setMenuOpen(false);return;}
    if(!focused||(e.target instanceof Element&&e.target.closest("dialog,[role=dialog],input,textarea,select,[contenteditable]")))return;
    e.preventDefault();home();
  }
  function openSearch(){
    setMenuOpen(false);
    setLauncherOpen(true);
  }

  return <div className={"atm-shell"+(focused?" atm-shell--focused":" atm-shell--overview")}
    data-experience="ANEVUM MORPH / CREATIVE CONSOLE"
    data-layout={focused?"workspace":"overview"}
    onKeyDown={onShellKey}
    style={{"--atm-accent":chosen?.accent||"#e3c38f"} as CSSProperties}>
    <div className="atm-atmosphere" aria-hidden="true"><CosmicArtwork scene={chosen?.scene||"hero"} priority/></div>
    <div className="atm-atmosphere-overlay" aria-hidden="true"/>
    <header className="atm-header">
      <button type="button" className={"atm-menu-button"+(menuOpen?" is-open":"")}
        aria-expanded={menuOpen} aria-controls="atm-navigation-overlay" aria-haspopup="dialog"
        onClick={()=>setMenuOpen(value=>!value)}>
        <span className="atm-menu-icon" aria-hidden="true"><i/><i/><i/></span>
        <span>MENU</span>
      </button>
      <Link to="/atlas" className="atm-brand" aria-label="Return to ANEVUM front page" onClick={()=>setMenuOpen(false)}>
        <OrbitalMark/>
        <span><strong>ANEVUM</strong><small>THE CREATIVE NETWORK</small></span>
      </Link>
      <div className="atm-header-spacer" aria-hidden="true"><span>ANEVUM / WORLD SYSTEM</span><b>✧</b><span>EXPLORE. CREATE. CONNECT.</span></div>
      <nav className="atm-actions" aria-label="Member account and settings">
        <ProgressSignal/>
      </nav>
    </header>
    <dialog ref={menuDialog} id="atm-navigation-overlay" className="atm-navigation-overlay"
      aria-labelledby="atm-overlay-heading"
      onClose={()=>setMenuOpen(false)}
      onCancel={()=>setMenuOpen(false)}
      onClick={e=>{if(e.target===menuDialog.current)setMenuOpen(false);}}>
      <div className="atm-navigation-inside">
        <aside className="atm-navigation-feature">
          <div className="atm-navigation-art" key={menuPreview.id} aria-hidden="true"><CosmicArtwork scene={menuPreview.scene}/></div>
          <div className="atm-navigation-veil" aria-hidden="true"/>
          <div className="atm-navigation-feature-copy">
            <span>WORLD {menuPreview.number} / {menuPreview.overline}</span>
            <h3>{menuPreview.title}<em>.</em></h3>
            <p>{menuPreview.tagline}</p>
            <small>{menuPreview.status==="planned"?"FUTURE FEATURE — NOT LIVE":menuPreview.status==="invited"?"INVITED MEMBER ACCESS":"OPEN PUBLIC DESTINATION"}</small>
          </div>
        </aside>
        <section className="atm-navigation-directory">
          <div className="atm-navigation-head">
            <div><span>ANEVUM / UNIVERSE DIRECTORY</span><h2 id="atm-overlay-heading">WHERE TO <em>NEXT?</em></h2></div>
            <button type="button" className="atm-navigation-close" onClick={()=>setMenuOpen(false)} aria-label="Close navigation overlay">CLOSE <span aria-hidden="true">×</span></button>
          </div>
          <nav className="atm-navigation-links" aria-label="ANEVUM destinations">
            {ATLAS_WORLDS.map(world=><button type="button" key={world.id}
              className={"atm-navigation-link"+(chosenId===world.id?" is-active":"")}
              onMouseEnter={()=>setPreviewWorld(world.id)}
              onFocus={()=>setPreviewWorld(world.id)}
              aria-current={chosenId===world.id?"page":undefined}
              onClick={()=>enter(world)}>
              <span className="atm-navigation-number">{world.number}</span>
              <span className="atm-navigation-link-copy"><strong>{world.title}</strong><small>{world.status==="planned"?"PLANNED / "+world.tagline:world.tagline}</small></span>
              <span className="atm-navigation-arrow" aria-hidden="true">↗</span>
            </button>)}
          </nav>
          <div className="atm-navigation-tools">
            <button type="button" onClick={openSearch} className="atm-navigation-search"><span aria-hidden="true">⌕</span> FIND ANYTHING <small>⌘ / CTRL + K</small></button>
            <div className="atm-navigation-utility-links">
              <Link to="/atlas/creators" onClick={()=>setMenuOpen(false)}>CREATORS ↗</Link>
              <Link to="/atlas/library" onClick={()=>setMenuOpen(false)}>MY LIBRARY ↗</Link>
              <Link to="/atlas/guide" onClick={()=>setMenuOpen(false)}>FIELD GUIDE ↗</Link>
              <Link to="/" onClick={()=>setMenuOpen(false)}>STANDARD WEBSITE ↗</Link>
            </div>
          </div>
        </section>
      </div>
    </dialog>
    <main id="atm-content" ref={main}
      className={"atm-content"+(focused?" atm-content--page":" atm-content--overview")}
      onClickCapture={onInternalLink} tabIndex={-1}
      aria-label={focused?(chosen?.title||"ANEVUM")+" section":"ANEVUM front page"}>
      {focused?<div key={chosenId||"world"} className="atm-embedded"><Outlet/></div>
        :<MorphHomeConsole onExplore={()=>setMenuOpen(true)}/>}
    </main>
    <PortalLauncher open={launcherOpen} onClose={()=>setLauncherOpen(false)} routePrefix="/atlas"/>
  </div>;
}
