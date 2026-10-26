import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState, lazy, Suspense } from "react";
import { OrbitalMark } from "./OrbitalMark";
import { Icon } from "./Icons";
import { PortalLauncher } from "./PortalLauncher";
import {VisualKitAtmosphere,publicVisualRoom} from "./VisualKit";
import {ContinuanceWorldStage} from "./ContinuanceWorldStage";
import { isEditableTarget } from "../lib/portal-destinations";
import { canonicalAuthClient } from "../lib/canonical-beta";
import { CompactMemberIdentity } from "./CompactMemberIdentity";
import { useOwnPlayerCard } from "../lib/useOwnPlayerCard";
import {IrenGuidedContinuance} from "./IrenGuidedContinuance";
import {VerifiedStaffShortcut} from "./VerifiedStaffShortcut";
import {LivingWorldProvider,useLivingWorld,type WorldSector} from "../parity/LivingWorldState";
import {LivingWorldField} from "../parity/LivingWorldField";
import {ConsoleWayfinderV136} from "../parity/ConsoleWayfinderV136";
import {ControllerBridgeV136} from "../parity/ControllerBridgeV136";
import {StudioSpatialWorkspaceV136} from "../parity/StudioSpatialWorkspaceV136";
import "../parity/spatial-surface-v136.css";

const FullParityHeader=import.meta.env.VITE_PARITY_V136_FULL==="true" ? lazy(()=>import("../parity/ParityHeaderV136").then(m=>({default:m.ParityHeaderV136}))) : null;
/** ANEVUM V009 — one public navigation system across every Creator V1 page.
 * This component is presentation only. Private routes remain MemberGate-owned;
 * no signup capability or session is inferred from an account shortcut.
 */
const desktopNav = [
  {to:"/",label:"Home"},
  {to:"/discover",label:"Discover"},
  {to:"/community",label:"Community"},
  {to:"/creators",label:"Creators"}
] as const;
const menuDestinations = [
  {to:"/discover?category=games",label:"Play",detail:"Games and interactive worlds",icon:"star"},
  {to:"/discover",label:"Discover",detail:"Projects worth finding",icon:"explore"},
  {to:"/community",label:"Community",detail:"Creators and conversations",icon:"community"},
  {to:"/create",label:"Create",detail:"Your studio and uploads",icon:"create"}
] as const;
const menuCategories = [
  {to:"/discover?category=tools",label:"Apps & tools"},
  {to:"/discover?category=creative",label:"Art & AI"},
  {to:"/discover?category=libraries",label:"Open source"},
  {to:"/discover?category=learning",label:"Learning"}
] as const;
const menuUtilities = [
  {to:"/creators",label:"Creators"},
  {to:"/boards",label:"Boards"},
  {to:"/levels",label:"Evolution"},
  {to:"/recognition",label:"Rewards"},
  {to:"/library",label:"My library"},
  {to:"/status",label:"Status"}
] as const;

/** One world provider survives every public route transition. */
export function Shell(){
  return FullParityHeader?<LivingWorldProvider><ShellContent/></LivingWorldProvider>:<ShellContent/>;
}
function worldSector(pathname:string,search:string):WorldSector{
  if(pathname==="/community")return "community";
  if(pathname==="/creators")return "creators";
  if(pathname==="/studio")return "studio";
  if(pathname!=="/discover")return "hero";
  const category=new URLSearchParams(search).get("category");
  const valid:WorldSector[]=["games","tools","automation","research","creative","learning","libraries","other"];
  return category&&valid.some(item=>item===category)?category as WorldSector:"portal";
}
function ShellContent(){
  const {paused,setPaused}=useLivingWorld();
  const {data:canonicalSession}=canonicalAuthClient.useSession();
  const canonicalMember=Boolean(canonicalSession?.user?.id&&canonicalSession.user.emailVerified===true);
  const memberDestination=canonicalMember?"/member":"/join";
  const navigate=useNavigate();
  const location=useLocation();
  const [query,setQuery]=useState("");
  const [menuOpen,setMenuOpen]=useState(false);
  const ownCard=useOwnPlayerCard(menuOpen);
  const [launcherOpen,setLauncherOpen]=useState(false);
  const menuButton=useRef<HTMLButtonElement>(null);
  const menuDialog=useRef<HTMLDialogElement>(null);
  const previousPage=useRef(location.pathname);
  const routeMotion=useRef<HTMLDivElement>(null);

  useEffect(()=>{setMenuOpen(false);setLauncherOpen(false);},[location.pathname,location.search]);
  useEffect(()=>{
    const dialog=menuDialog.current;
    if(!dialog)return;
    if(menuOpen&&!dialog.open)dialog.showModal();
    if(!menuOpen&&dialog.open)dialog.close();
  },[menuOpen]);
  useEffect(()=>{
    // A filter/search update belongs to the current page. Moving focus to
    // main during that update can steal the next Enter key from a searchbox
    // and also breaks keyboard filter browsing. Only page traversal resets it.
    const page=location.pathname;
    if(previousPage.current===page)return;
    previousPage.current=page;
    if(!location.hash)window.scrollTo({top:0,behavior:"instant"});
    document.getElementById("main")?.focus({preventScroll:true});
    // Animate the real DOM once per page traversal. Experimental React
    // ViewTransition update snapshots also intercept controlled form updates;
    // those must remain synchronous and never replace the interactive tree.
    if(FullParityHeader&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      routeMotion.current?.animate([{opacity:.6,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:230,easing:'cubic-bezier(.2,.75,.2,1)'});
    }
  },[location.pathname,location.hash]);
  useEffect(()=>{
    function onShortcut(event:KeyboardEvent){
      const command=(event.metaKey || event.ctrlKey)&&event.key.toLowerCase()==="k"&&!event.altKey;
      const slash=event.key === "/"&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!isEditableTarget(event.target);
      if(!command&&!slash)return;
      event.preventDefault();
      setMenuOpen(false);
      setLauncherOpen(true);
    }
    window.addEventListener("keydown",onShortcut);
    return()=>window.removeEventListener("keydown", onShortcut);
  },[]);

  function search(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const trimmed=query.trim();
    setMenuOpen(false);
    navigate(trimmed?"/discover?q="+encodeURIComponent(trimmed):"/discover");
  }
  // Console-style navigation remains DOM focus, so it works with keyboard,
  // assistive technology and any future gamepad-to-focus adapter.
  function menuDirectionalKey(event:ReactKeyboardEvent<HTMLDialogElement>){
    if(!FullParityHeader||isEditableTarget(event.target)||
      !['ArrowDown','ArrowUp','ArrowRight','ArrowLeft'].includes(event.key))return;
    const items=Array.from(menuDialog.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')||[])
      .filter(node=>node.getClientRects().length>0);
    if(!items.length)return;
    const current=items.indexOf(document.activeElement as HTMLElement);
    const direction=event.key==='ArrowDown'||event.key==='ArrowRight'?1:-1;
    const next=current<0?(direction>0?0:items.length-1):(current+direction+items.length)%items.length;
    event.preventDefault();
    items[next]?.focus();
  }
  const home=location.pathname==="/";
  const parityProfile=/^\/(?:creators\/[a-z][a-z0-9_]{2,29}|@[a-z][a-z0-9_]{2,29})$/.test(location.pathname);
  const parityFullBleed=Boolean(FullParityHeader&&(home||["/discover","/community","/creators","/boards"].includes(location.pathname)||parityProfile));
  const publicSpatial=Boolean(FullParityHeader&&["/","/discover","/community","/creators"].includes(location.pathname));
  // PARITY destinations own a full-bleed spatial canvas, not a nested page box.
  // Legacy routes retain their protected frame until individually transformed.
  // One stable route surface keeps navigation, IREN and launcher mounted.
  // Private playable build authoring belongs inside the same session-bound
  // workstation as canonical project records. The isolated player does not.
  const studioWorkspace=Boolean(FullParityHeader&&canonicalMember&&
    (location.pathname==="/studio"||location.pathname==="/studio/records"||
    location.pathname==="/studio/new"||location.pathname==="/studio/review"||
    location.pathname==="/studio/packages"||
    location.pathname==="/studio/packages/new"||
    location.pathname==="/studio/packages/review"||
    /^\/studio\/packages\/[0-9a-f-]{36}$/.test(location.pathname)||
    /^\/studio\/[0-9a-f-]{36}$/.test(location.pathname)));
  const routeSurface=studioWorkspace?
    <StudioSpatialWorkspaceV136 key={canonicalSession?.user?.id||"unavailable"} memberId={canonicalSession?.user?.id||""}>
      <Outlet/>
    </StudioSpatialWorkspaceV136>:
    home||parityFullBleed?<Outlet/>:
    <div className="av5-site-frame av9-unified-frame"><div className="av5-site-content"><Outlet/></div></div>;
  return <div className={"site-shell site-shell--cinematic av9-shell"+(home?" site-shell--home":"")}>
    {FullParityHeader&&<LivingWorldField enabled={publicSpatial} sector={worldSector(location.pathname,location.search)}/>}
    {FullParityHeader&&<ControllerBridgeV136 navigationEnabled={publicSpatial}/>}

    {!publicSpatial&&!parityFullBleed&&<ContinuanceWorldStage path={location.pathname}/>}
    {FullParityHeader?<Suspense fallback={<header className="p136-header" aria-label="ANEVUM navigation loading"/>}><FullParityHeader memberDestination={memberDestination} canonicalMember={canonicalMember} query={query} onQuery={setQuery} onSearch={search} onOpenLauncher={()=>setLauncherOpen(true)} onOpenIren={()=>window.dispatchEvent(new Event("anevum:iren-open"))} menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(v=>!v)} menuButton={menuButton}/></Suspense>:<header className="site-header av9-header">
      <div className="header-inner av9-header-inner">
        <Link to="/" className="brand-lockup av9-brand" aria-label="ANEVUM homepage">
          <OrbitalMark className="brand-mark"/>
          <span className="cw-brand-stack"><b>ANEVUM</b><small>THE CREATIVE NETWORK</small></span>
        </Link>
        <nav data-iren-anchor="navigation-desktop" className="desktop-nav av9-primary" aria-label="Primary navigation">
          {desktopNav.map(item=><NavLink key={item.to} to={item.to} end={item.to==="/"}>{item.label}</NavLink>)}
        </nav>
        <form className="header-search av9-header-search" role="search" onSubmit={search}>
          <Icon name="search" size={18}/>
          <input type="search" maxLength={100} value={query} onChange={event=>setQuery(event.target.value)}
            aria-label="Search published projects" placeholder="Find worlds, projects, people"/>
          <kbd aria-hidden="true">↵</kbd>
        </form>
        <div className="av9-header-actions">
          <button type="button" className="av9-search-mobile" onClick={()=>setLauncherOpen(true)}
            aria-label="Open quick navigation" aria-keyshortcuts="Control+K Meta+K"><Icon name="search" size={20}/></button>
          <Link to={memberDestination} className="header-create av9-create"><Icon name={canonicalMember?"people":"create"} size={17}/><span>{canonicalMember?"My space":"Join"}</span></Link>
          <Link to={memberDestination} className="cw-account-link av9-account" aria-label={canonicalMember?"Open my verified member account":"Join ANEVUM or sign in"}><Icon name="people" size={20}/></Link>
          <button data-iren-anchor="navigation" ref={menuButton} className="menu-button av9-menu-trigger" type="button"
            aria-label={menuOpen ? "Close site navigation" : "Open site navigation"}
            aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="av79-navigation"
            onClick={()=>setMenuOpen(value=>!value)}>
            <span className="av9-menu-trigger-text">Menu</span>
            <Icon name={menuOpen?"close":"menu"} size={21}/>
          </button>
        </div>
      </div>
    </header>}
    <dialog ref={menuDialog} id="av79-navigation" className="av79-navigation"
      aria-label="ANEVUM navigation"
      onKeyDown={menuDirectionalKey}
      onClose={()=>{setMenuOpen(false);menuButton.current?.focus();}}
      onCancel={()=>setMenuOpen(false)}
      onClick={event=>{if(event.target===menuDialog.current)setMenuOpen(false);}}>
      <div className="av79-navigation-shell">
        <header className="av79-navigation-top">
          <span className="av79-overline"><OrbitalMark className="av79-wayfinder-mark"/> ANEVUM / WAYFINDER</span>
          <button className="av79-menu-close" type="button" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"><Icon name="close" size={19}/></button>
        </header>
        <div className="av79-navigation-intro">
          <h2>Where to <em>next?</em></h2>
          <p>One tap to the people, work and worlds you came for.</p>
        </div>
        <button type="button" className="av79-navigation-search"
          onClick={()=>{setMenuOpen(false);setLauncherOpen(true);}}>
          <Icon name="search" size={19}/><span>Search ANEVUM</span><kbd>⌘ K</kbd>
        </button>
        {canonicalMember?<section className="av79-navigation-identity" aria-label="Your player card">
          <div className="av79-navigation-label"><span>YOUR PLAYER CARD</span><Link to="/member" onClick={()=>setMenuOpen(false)}>MY SPACE <Icon name="arrow" size={13}/></Link></div>
          {ownCard?<CompactMemberIdentity member={ownCard} href="/member" size="compact" className="av79-my-card"/>:
            <Link className="av79-identity-loading" to="/member" onClick={()=>setMenuOpen(false)}>Open your verified member space <Icon name="arrow" size={16}/></Link>}
          <VerifiedStaffShortcut location="wayfinder"/>
        </section>:<Link to="/join" className="av79-navigation-join" onClick={()=>setMenuOpen(false)}>
          <span><strong>Become part of ANEVUM</strong><small>Your identity, creations and earned recognition start here.</small></span>
          <Icon name="arrow" size={18}/>
        </Link>}
        <nav className="av79-navigation-primary" aria-label="Main destinations">
          {menuDestinations.map(item=><Link to={item.to} key={item.to} onClick={()=>setMenuOpen(false)} className="av79-destination">
            <span className="av79-destination-icon"><Icon name={item.icon} size={22}/></span>
            <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            <Icon name="arrow" size={16}/>
          </Link>)}
          <button type="button" className="ir80-wayfinder-entry"
            onClick={()=>{setMenuOpen(false);window.requestAnimationFrame(()=>{
              // The IREN panel remembers its opener. Use the persistent menu
              // trigger after the dialog closes, so returning never focuses
              // an entry inside a closed dialog.
              menuButton.current?.focus({preventScroll:true});
              window.dispatchEvent(new Event("anevum:iren-open"));
            });}}>
            <span className="av79-destination-icon"><Icon name="star" size={21}/></span>
            <span><strong>IREN / Field assistant</strong><small>Get help or take a guided tour at any time</small></span>
            <span className="ir80-wayfinder-action">OPEN IREN HELP</span>
          </button>
        </nav>
        <div className="av79-navigation-lower">
          <section aria-label="Browse by interest"><span className="av79-lower-label">EXPLORE BY INTEREST</span>
            <div className="av79-category-links">{menuCategories.map(item=>
              <Link to={item.to} key={item.to} onClick={()=>setMenuOpen(false)}>{item.label}</Link>)}</div>
          </section>
          <section aria-label="More destinations"><span className="av79-lower-label">ALSO IN ANEVUM</span>
            <div className="av79-utility-links">{menuUtilities.map(item=>
              <Link to={item.to==="/library"&&canonicalMember?"/saved":item.to} key={item.to} onClick={()=>setMenuOpen(false)}>{item.label}</Link>)}</div>
            {FullParityHeader&&<button type="button" className="p136-wayfinder-motion"
              aria-label="Atmospheric animation" aria-pressed={!paused}
              onClick={()=>setPaused(previous=>!previous)}>
              <Icon name="status" size={17}/><span>Environmental motion</span>
              <small>{paused?'STILL':'ON'}</small>
            </button>}
          </section>
        </div>
        <footer className="av79-navigation-foot"><span aria-hidden="true" className="av79-footer-star"/> THE CONTINUANCE INSTITUTE <span>EXPLORE / MAKE / BELONG</span></footer>
      </div>
    </dialog>
    <IrenGuidedContinuance memberId={canonicalMember?canonicalSession?.user?.id||null:null}/>
    {FullParityHeader&&<ConsoleWayfinderV136 onOpenSearch={()=>setLauncherOpen(true)} onOpenIren={()=>window.dispatchEvent(new Event("anevum:iren-open"))} memberDestination={memberDestination} memberLabel={canonicalMember?"Open my verified member profile":"Join ANEVUM or sign in"} memberInitial={canonicalMember?(canonicalSession?.user?.name?.trim().slice(0,1).toUpperCase()||null):null}/> }
    <PortalLauncher open={launcherOpen} onClose={()=>setLauncherOpen(false)}/>
    <main id="main" tabIndex={-1} className="site-main av9-main">
      {!publicSpatial&&!parityFullBleed&&<VisualKitAtmosphere room={publicVisualRoom(location.pathname)}/>}
      {FullParityHeader?<div ref={routeMotion} className={parityFullBleed?"p136-route-surface":undefined}>{routeSurface}</div>:routeSurface}
    </main>
    <footer className="site-footer av9-footer">
      <span>ANEVUM / A WORLD OF THINGS PEOPLE MAKE</span>
      <nav aria-label="Site information"><Link to="/start">Start Here</Link><Link to="/guide">Field Guide</Link><Link to="/boards">Boards</Link><Link to="/status">Status</Link></nav>
      <span>PUBLIC DISCOVERY IS OPEN · CREATOR PUBLISHING IN TESTING</span>
    </footer>
  </div>;
}
