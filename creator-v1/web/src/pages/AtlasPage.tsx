import {useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent,type WheelEvent as ReactWheelEvent,type KeyboardEvent as ReactKeyboardEvent} from "react";
import {Link,useNavigate} from "react-router-dom";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {OrbitalMark} from "../components/OrbitalMark";
import {CelestialEmblem} from "../components/CelestialEmblem";
import {seriesOneMotif} from "../lib/artifact-art";
import {readProjects,readStatus,type Project,type Status} from "../lib/api";
import {memberHealth,memberMe,memberProgress,type Progression} from "../lib/member-api";
import {ATLAS_LINKS,ATLAS_WORLDS,ATLAS_WORLD_BY_ID,type AtlasWorld,type AtlasWorldId} from "../lib/atlas-worlds";
import "./atlas.css";

type View={pitch:number;yaw:number;zoom:number};
type Drag={x:number;y:number;pitch:number;yaw:number;moved:boolean;pointerId:number};
const START:View={pitch:-11,yaw:-9,zoom:1};
const MIN_ZOOM=.72,MAX_ZOOM=1.42;
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
const typeLabel=(world:AtlasWorld)=>world.status==="planned"?"DESIGN PHASE":world.status==="invited"?"INVITED TESTING":"OPEN PUBLIC PATH";

function AtlasEarnedSignal(){
  const [current,setCurrent]=useState<Progression|null>(null);
  const [gain,setGain]=useState<{level:number;xp:number;artifact:string|null}|null>(null);
  const prior=useRef<{id:string;level:number;xp:number}|null>(null);
  const controller=useRef<AbortController|null>(null);
  const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{
    let active=true;
    async function refresh(){
      controller.current?.abort();
      const request=new AbortController();
      controller.current=request;
      try{
        const h=await memberHealth(request.signal);
        if(h.status!=="ok")return;
        const {member}=await memberMe(request.signal);
        const {progression}=await memberProgress(request.signal);
        if(!active||request.signal.aborted)return;
        const previous=prior.current;
        if(previous?.id===member.id&&progression.level>previous.level&&progression.xp>previous.xp){
          setGain({level:progression.level,xp:progression.xp,artifact:progression.artifact});
          if(timeout.current!==null)clearTimeout(timeout.current);
          timeout.current=setTimeout(()=>setGain(null),5400);
        }
        prior.current={id:member.id,level:progression.level,xp:progression.xp};
        setCurrent(progression);
      }catch{/* Member service may be closed. Never invent member XP. */}
    }
    function focus(){if(document.visibilityState==="visible")void refresh();}
    void refresh();
    window.addEventListener("focus",focus);
    document.addEventListener("visibilitychange",focus);
    return()=>{
      active=false;controller.current?.abort();
      window.removeEventListener("focus",focus);
      document.removeEventListener("visibilitychange",focus);
      if(timeout.current!==null)clearTimeout(timeout.current);
    };
  },[]);
  return <>
    <Link className="atlas-xp-mini" to="/account" aria-label={current?"Account, verified level "+current.level+", "+current.xp+" XP":"Member progression details"}>
      <span className="atlas-xp-mini-mark" aria-hidden="true">{current?"✶":"◈"}</span>
      <span><small>{current?"SERVER-VERIFIED XP":"PROGRESSION"}</small><strong>{current?"LV "+current.level+" · "+current.xp.toLocaleString()+" XP":"INVITED TESTING"}</strong></span>
    </Link>
    {gain&&<div className="atlas-gain" role="status" aria-live="polite" aria-label={"Verified level "+gain.level+" reached"}>
      <div className="atlas-gain-radiance" aria-hidden="true"/>
      <div className="atlas-gain-art"><CelestialEmblem motif={seriesOneMotif(gain.level,gain.artifact)} size="hero" state={gain.artifact?"earned":"preview"}/></div>
      <span>SERVER-VERIFIED MILESTONE</span>
      <strong>LEVEL {gain.level}</strong>
      <p>{gain.artifact||"A new orbit unlocked."} · {gain.xp.toLocaleString()} earned XP</p>
      <button type="button" onClick={()=>setGain(null)}>DISMISS CELEBRATION</button>
    </div>}
  </>;
}

function AtlasDeck({world,onDismiss}:{world:AtlasWorld|null;onDismiss:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const navigate=useNavigate();
  const [projects,setProjects]=useState<Project[]>([]);
  const [state,setState]=useState<"loading"|"ready"|"error">("loading");
  const [query,setQuery]=useState("");
  useEffect(()=>{
    const el=dialog.current;
    if(!el)return;
    if(world&&!el.open)el.showModal();
    if(!world&&el.open)el.close();
  },[world]);
  useEffect(()=>{
    if(!world||world.type!=="catalogue"){setProjects([]);setState("ready");return;}
    const abort=new AbortController();
    setState("loading");setProjects([]);
    readProjects(world.category?{category:world.category,limit:"6"}:{limit:"6"},abort.signal).then(
      r=>{if(!abort.signal.aborted){setProjects(r.items);setState("ready");}},
      ()=>{if(!abort.signal.aborted)setState("error");}
    );
    return()=>abort.abort();
  },[world?.id]);
  if(!world)return <dialog ref={dialog} className="atlas-deck" onClose={onDismiss}/>;
  function onBackground(e:ReactMouseEvent<HTMLDialogElement>){if(e.target===dialog.current)onDismiss();}
  const search=world.id==="discover"||world.id==="play"||world.id==="apps"||world.id==="creative";
  const nextPath=query.trim()?"/discover?q="+encodeURIComponent(query.trim().slice(0,100)):"/discover";
  return <dialog ref={dialog} className="atlas-deck" aria-labelledby="atlas-deck-title"
    onClose={onDismiss} onCancel={onDismiss} onClick={onBackground}>
    <div className="atlas-deck-shell" style={{"--world-color":world.accent} as CSSProperties}>
      <header className="atlas-deck-topbar">
        <div className="atlas-deck-identity"><span className="atlas-deck-mini-glyph">{world.glyph}</span><div>
          <small>ANEVUM / ATLAS / DECK {world.number}</small><strong>{world.overline}</strong>
        </div></div>
        <span className="atlas-deck-condition">{typeLabel(world)}</span>
        <button className="atlas-deck-close" aria-label="Close deck and return to Atlas" type="button" onClick={onDismiss}>× <span>BACK TO ATLAS</span></button>
      </header>
      <div className="atlas-deck-scroll">
        <div className="atlas-deck-hero">
          <div className="atlas-deck-hero-art" aria-hidden="true"><CosmicArtwork scene={world.scene}/></div>
          <div className="atlas-deck-hero-veil" aria-hidden="true"/>
          <div className="atlas-deck-hero-copy">
            <span className="atlas-deck-caption">ANEVUM // {world.overline}</span>
            <h2 id="atlas-deck-title">{world.title}<span>.</span></h2>
            <strong>{world.tagline}</strong>
            <p>{world.description}</p>
            <div className="atlas-deck-actions">
              <Link className="atlas-deck-action" to={world.route}>{world.action} <span aria-hidden="true">↗</span></Link>
              <button type="button" className="atlas-deck-secondary" onClick={onDismiss}>RETURN TO ORBIT</button>
            </div>
          </div>
        </div>
        {search&&<form className="atlas-deck-search" onSubmit={e=>{e.preventDefault();navigate(nextPath);}}>
          <label htmlFor="atlas-catalogue-search">SEARCH THE APPROVED CATALOGUE</label>
          <div><input id="atlas-catalogue-search" value={query} onChange={e=>setQuery(e.target.value)}
            maxLength={100} type="search" autoComplete="off" placeholder="What are you looking for?"/>
            <Link to={nextPath}>SEARCH ↗</Link></div>
        </form>}
        {world.type==="catalogue"&&<div className="atlas-deck-feed">
          <div className="atlas-deck-feed-header"><h3>REAL RELEASES</h3><span>APPROVED PUBLIC PROJECTS ONLY</span></div>
          {state==="loading"&&<p role="status">Connecting to the real ANEVUM catalogue…</p>}
          {state==="error"&&<p role="status">Catalogue unavailable. No placeholder projects were substituted.</p>}
          {state==="ready"&&(projects.length?
            <div className="atlas-deck-projects">{projects.map(project=><Link key={project.id} to={"/projects/"+encodeURIComponent(project.id)} className="atlas-deck-project">
              <span className="atlas-deck-project-glyph" aria-hidden="true">✦</span>
              <span><strong>{project.title}</strong><small>BY @{project.creatorHandle} / {project.category.toUpperCase()}</small><em>{project.summary}</em></span>
              <b aria-hidden="true">↗</b>
            </Link>)}</div>:
            <div className="atlas-deck-empty"><span aria-hidden="true">✧</span><strong>AN OPEN ORBIT.</strong><p>No approved public projects currently match this world. The space is real; we won't invent creators or activity to fill it.</p><Link to="/discover">BROWSE ALL WORLDS ↗</Link></div>
          )}
        </div>}
        {world.type==="roadmap"&&<div className="atlas-deck-roadmap"><span>DESIGN PHASE / NO LIVE ROOM OR INBOX</span>
          <h3>{world.id==="signals"?"MESSAGING AND NOTIFICATIONS":"COLLABORATIVE ENVIRONMENTS"}</h3>
          <p>{world.id==="signals"
            ?"The intended system includes private conversations, project invitations, mentions, replies, opt-in notifications and moderation controls. No real inbox, unread count, messages or delivery is live."
            :"The intended system includes shared project spaces, invited teams, permissions, revision history, feedback sessions and eventually synchronized editing. No actual live presence or shared editor exists."}</p>
          <Link to={world.route}>VIEW CURRENT ROADMAP ↗</Link>
        </div>}
        {world.id==="artifacts"&&<div className="atlas-deck-rule"><span>01 / EARNED IDENTITY</span><p>XP comes from verified contributions, not page visits, simulated clicks, random animations or paid purchases. Celebrations appear only after a verified level increase.</p></div>}
        <footer className="atlas-deck-footer"><span>CREATIONS OVER COUNTERS. PEOPLE OVER ENGAGEMENT.</span><span>ESC / CLOSE · OPEN REAL PAGES</span></footer>
      </div>
    </div>
  </dialog>;
}

export function AtlasPage(){
  const [view,setView]=useState<View>(START);
  const [selected,setSelected]=useState<AtlasWorld|null>(null);
  const [focused,setFocused]=useState<AtlasWorldId>("discover");
  const [help,setHelp]=useState(false);
  const [status,setStatus]=useState<Status|null>(null);
  const [statusError,setStatusError]=useState(false);
  const stage=useRef<HTMLDivElement>(null);
  const drag=useRef<Drag|null>(null);
  const suppressClick=useRef(false);
  const lastActive=useRef<HTMLButtonElement|null>(null);
  const focusTargets=useRef(new Map<AtlasWorldId,HTMLButtonElement>());
  const selectedId=selected?.id||null;

  useEffect(()=>{
    const abort=new AbortController();
    readStatus(abort.signal).then(setStatus,()=>setStatusError(true));
    return()=>abort.abort();
  },[]);
  useEffect(()=>{
    if(selectedId!==null)return;
    lastActive.current?.focus({preventScroll:true});
  },[selectedId]);

  function launch(world:AtlasWorld){
    if(suppressClick.current){suppressClick.current=false;return;}
    const target=focusTargets.current.get(world.id);
    lastActive.current=target||null;
    setFocused(world.id);
    setSelected(world);
    setHelp(false);
  }
  function onPointerDown(e:ReactPointerEvent<HTMLDivElement>){
    if(e.button!==0||selected||(e.target instanceof Element&&e.target.closest("a,input,dialog")))return;
    // Allow a tap to open a node; capture the pointer only after actual movement.
    // Dragging a world portrait rotates the constellation instead of trapping touch.
    drag.current={x:e.clientX,y:e.clientY,pitch:view.pitch,yaw:view.y,moved:false,pointerId:e.pointerId};
  }
  function onPointerMove(e:ReactPointerEvent<HTMLDivElement>){
    const p=drag.current;if(!p||p.pointerId!==e.pointerId)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(!p.moved&&Math.hypot(dx,dy)>7){
      p.moved=true;
      if(!e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.setPointerCapture(e.pointerId);
    }
    if(!p.moved)return;
    setView(current=>({...current,pitch:clamp(p.pitch-dy*.12,-31,31),yaw:clamp(p.yaw+dx*.18,-59,59)}));
  }
  function onPointerUp(e:ReactPointerEvent<HTMLDivElement>){
    const p=drag.current;
    if(!p||p.pointerId!==e.pointerId)return;
    drag.current=null;
    if(p.moved){
      // A release following a drag must not accidentally activate a world button.
      suppressClick.current=true;
      window.setTimeout(()=>{suppressClick.current=false;},0);
    }
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function onWheel(e:ReactWheelEvent<HTMLDivElement>){
    if(selected)return;
    const delta=e.deltaY>0?-.06:.06;
    setView(x=>({...x,zoom:clamp(Math.round((x.zoom+delta)*100)/100,MIN_ZOOM,MAX_ZOOM)}));
  }
  function onMapKey(e:ReactKeyboardEvent<HTMLDivElement>){
    if(e.target!==e.currentTarget)return;
    if(e.key==="ArrowLeft"||e.key==="ArrowRight"){
      e.preventDefault();setView(x=>({...x,yaw:clamp(x.yaw+(e.key==="ArrowRight"?8:-8),-59,59)}));
    }else if(e.key==="ArrowUp"||e.key==="ArrowDown"){
      e.preventDefault();setView(x=>({...x,pitch:clamp(x.pitch+(e.key==="ArrowUp"?8:-8),-31,31)}));
    }else if(e.key==="+"||e.key==="="||e.key==="-"){
      e.preventDefault();setView(x=>({...x,zoom:clamp(x.zoom+(e.key==="-"?-.08:.08),MIN_ZOOM,MAX_ZOOM)}));
    }else if(e.key==="Home"){
      e.preventDefault();setView(START);
    }
  }
  return <div className="atlas-page" data-experience="ANEVUM ATLAS / PREVIEW" aria-label="ANEVUM interactive spatial navigation">
    <div className="atlas-background" aria-hidden="true"><CosmicArtwork scene="hero" priority/></div>
    <div className="atlas-backdrop-veils" aria-hidden="true"/>
    <header className="atlas-top">
      <Link to="/" className="atlas-brand" aria-label="Return to ANEVUM home"><OrbitalMark/><span><strong>ANEVUM</strong><small>A LIVING CREATIVE UNIVERSE</small></span></Link>
      <span className="atlas-top-center">ATLAS // WORLD NAVIGATION <i>·</i> INTERACTIVE PREVIEW</span>
      <nav className="atlas-top-actions" aria-label="Atlas utilities">
        <AtlasEarnedSignal/>
        <button type="button" onClick={()=>setHelp(x=>!x)} aria-expanded={help} className="atlas-top-help">HOW TO MOVE <span>?</span></button>
        <Link to="/" className="atlas-exit">EXIT ATLAS ↗</Link>
      </nav>
    </header>
    <aside className="atlas-left-hud" aria-label="Current world">
      <span className="atlas-kicker">THE SPATIAL INTERFACE</span>
      <h1>GO <i>BEYOND.</i></h1>
      <p>Drag the universe. Find a world. Open a deck.</p>
      <div className="atlas-hud-status"><span className={status?"atlas-hud-light is-online":"atlas-hud-light"}/>
        <span>{status?status.counts.publishedProjects+" genuine public releases":statusError?"PUBLIC CATALOGUE OFFLINE":"CONNECTING TO CATALOGUE"}</span>
      </div>
    </aside>
    <div className="atlas-orbit-hint" aria-hidden="true"><span>01 // THE ANEVUM CONSTELLATION</span><span>DRAG · EXPLORE · ENTER</span></div>
    <div ref={stage} className="atlas-universe-viewport" role="region" tabIndex={0} aria-label="Spatial Atlas. Drag to rotate. Use arrow keys, plus, minus and Home to adjust the view." onKeyDown={onMapKey}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}
      style={{"--atlas-pitch":view.pitch+"deg","--atlas-yaw":view.yaw+"deg","--atlas-zoom":view.zoom} as CSSProperties}>
      <div className="atlas-universe" aria-hidden={selectedId!==null}>
        <div className="atlas-ring atlas-ring-outer" aria-hidden="true"/>
        <div className="atlas-ring atlas-ring-inner" aria-hidden="true"/>
        <div className="atlas-ring atlas-ring-tilted" aria-hidden="true"/>
        <svg className="atlas-lattice" viewBox="-500 -380 1000 760" aria-hidden="true">
          <defs><linearGradient id="atlas-tether-paint" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#7e9dce" stopOpacity=".35"/><stop offset="54%" stopColor="#dcbd83" stopOpacity=".7"/><stop offset="100%" stopColor="#cf93cf" stopOpacity=".3"/></linearGradient></defs>
          {ATLAS_LINKS.map(([start,end])=>{
            const a=ATLAS_WORLD_BY_ID.get(start)!,b=ATLAS_WORLD_BY_ID.get(end)!;
            return <line key={start+end} x1={a.coordinates[0]*100} y1={a.coordinates[1]*100}
              x2={b.coordinates[0]*100} y2={b.coordinates[1]*100} stroke="url(#atlas-tether-paint)" strokeWidth="1.2" strokeDasharray="3 7"/>;
          })}
        </svg>
        {ATLAS_WORLDS.map(world=><button type="button" key={world.id}
          ref={node=>{if(node)focusTargets.current.set(world.id,node);else focusTargets.current.delete(world.id);}}
          className={"atlas-world atlas-world--"+world.id+(world.id===focused?" atlas-world--focused":"")}
          aria-label={world.title+". "+typeLabel(world)+". Open its deck."}
          aria-haspopup="dialog"
          onPointerDown={e=>{if(e.button!==0)return; /* Keep focus and native button click available for touch and keyboard. */}}
          onClick={()=>launch(world)}
          onFocus={()=>setFocused(world.id)}
          style={{"--atlas-x":world.coordinates[0],"--atlas-y":world.coordinates[1],"--atlas-z":world.coordinates[2],"--world-color":world.accent} as CSSProperties}>
          <span className="atlas-world-aura" aria-hidden="true"/>
          <span className="atlas-world-portrait" aria-hidden="true"><CosmicArtwork scene={world.scene}/></span>
          <span className="atlas-world-medallion" aria-hidden="true">{world.glyph}</span>
          <span className="atlas-world-copy"><small>{world.number} / {world.status==="planned"?"FUTURE":"WORLD"}</small><strong>{world.title}</strong></span>
        </button>)}
      </div>
    </div>
    <div className="atlas-view-controls" role="group" aria-label="Spatial view controls">
      <button type="button" onClick={()=>setView(x=>({...x,zoom:clamp(x.zoom+.1,MIN_ZOOM,MAX_ZOOM)}))} aria-label="Zoom in">+</button>
      <button type="button" onClick={()=>setView(START)} aria-label="Reset orientation">◎</button>
      <button type="button" onClick={()=>setView(x=>({...x,zoom:clamp(x.zoom-.1,MIN_ZOOM,MAX_ZOOM)}))} aria-label="Zoom out">−</button>
    </div>
    {help&&<aside className="atlas-help" aria-label="Atlas navigation instructions">
      <div><strong>FLIGHT MANUAL</strong><button onClick={()=>setHelp(false)} aria-label="Close instructions">×</button></div>
      <p>Drag empty space to rotate the world. Scroll or tap + / − to zoom. Select a node to open a deck.</p>
      <p>Keyboard: Tab to worlds, Enter to open, arrows to rotate when the scene is focused, Home to recenter, Escape to close a deck.</p>
      <p>Motion follows reduced-motion settings. All essential destinations also appear in the quick dock below.</p>
    </aside>}
    <nav className="atlas-bottom" aria-label="Atlas destinations">
      <span className="atlas-bottom-label">JUMP TO WORLD <i>↗</i></span>
      {ATLAS_WORLDS.map(world=><button type="button" key={world.id}
        className={focused===world.id?"is-focused":""} onClick={()=>launch(world)}
        title={world.title+" — "+typeLabel(world)}>{world.glyph}<span>{world.title}</span></button>)}
    </nav>
    <div className="atlas-bottom-edge" aria-hidden="true"><span>ANEVUM ATLAS / INTERACTIVE CONCEPT</span><span>ORIGINAL ART + REAL DESTINATIONS · NO SYNTHETIC SOCIAL ACTIVITY</span></div>
    <AtlasDeck world={selected} onDismiss={()=>setSelected(null)}/>
  </div>;
}
