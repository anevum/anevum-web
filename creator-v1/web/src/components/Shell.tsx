import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { type FormEvent, useEffect, useRef, useState, lazy, Suspense } from "react";
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

export function Shell(){
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
  const previousPage=useRef(location.pathname+location.search);

  useEffect(()=>{setMenuOpen(false);setLauncherOpen(false);},[location.pathname,location.search]);
  useEffect(()=>{
    const dialog=menuDialog.current;
    if(!dialog)return;
    if(menuOpen&&!dialog.open)dialog.showModal();
    if(!menuOpen&&dialog.open)dialog.close();
  },[menuOpen]);
  useEffect(()=>{
    const page=location.pathname+location.search;
    if(previousPage.current===page)return;
    previousPage.current=page;
    if(!location.hash)window.scrollTo({top:0,behavior:"instant"});
    document.getElementById("main")?.focus({preventScroll:true});
  },[location.pathname,location.search,location.hash]);
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
  const home=location.pathname==="/";
  return <div className={"site-shell site-shell--cinematic av9-shell"+(home?" site-shell--home":"")}>
    {!(FullParityHeader&&home)&&<ContinuanceWorldStage path={location.pathname}/>}
    {FullParityHeader?<Suspense fallback={<header className="p136-header" aria-label="ANEVUM navigation loading"/>}><FullParityHeader memberDestination={memberDestination} canonicalMember={canonicalMember} query={query} onQuery={setQuery} onSearch={search} onOpenLauncher={()=>setLauncherOpen(true)} onOpenIren={()=>window.dispatchEvent(new Event("anevum:iren-open"))} menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(v=>!v)} menuButton={menuButton}/></Suspense>:<header className="site-header av9-header">
      <div className="header-inner av9-header-inner">
        <Link to="/" className="brand-lockup av9-brand" aria-label="ANEVUM homepage">
          <OrbitalMark className="brand-mark"/>
          <span className="cw-brand-stack"><b>ANEVUM</b><small>THE CREATIVE NETWORK</small></span>
        </Link>
        <nav className="desktop-nav av9-primary" aria-label="Primary navigation">
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
            onClick={()=>{setMenuOpen(false);window.dispatchEvent(new Event("anevum:iren-open"));}}>
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
          </section>
        </div>
        <footer className="av79-navigation-foot"><span aria-hidden="true" className="av79-footer-star"/> THE CONTINUANCE INSTITUTE <span>EXPLORE / MAKE / BELONG</span></footer>
      </div>
    </dialog>
    <IrenGuidedContinuance memberId={canonicalMember?canonicalSession?.user?.id||null:null}/>
    <PortalLauncher open={launcherOpen} onClose={()=>setLauncherOpen(false)}/>
    <main id="main" tabIndex={-1} className="site-main av9-main">
      {!(FullParityHeader&&home)&&<VisualKitAtmosphere room={publicVisualRoom(location.pathname)}/>}
      {home?<Outlet/>:<div className="av5-site-frame av9-unified-frame"><div className="av5-site-content"><Outlet/></div></div>}
    </main>
    <footer className="site-footer av9-footer">
      <span>ANEVUM / A WORLD OF THINGS PEOPLE MAKE</span>
      <nav aria-label="Site information"><Link to="/start">Start Here</Link><Link to="/guide">Field Guide</Link><Link to="/boards">Boards</Link><Link to="/status">Status</Link></nav>
      <span>PUBLIC DISCOVERY IS OPEN · CREATOR PUBLISHING IN TESTING</span>
    </footer>
  </div>;
}
