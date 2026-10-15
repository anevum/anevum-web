import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { OrbitalMark } from "./OrbitalMark";
import { CosmicArtwork } from "./CosmicArtwork";
import { Icon } from "./Icons";
import { PortalLauncher } from "./PortalLauncher";
import { isEditableTarget } from "../lib/portal-destinations";

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
const portalCategories = [
  {to:"/discover?category=games",label:"Games & Play",number:"01",description:"Independent worlds and experiments",scene:"games"},
  {to:"/discover?category=tools",label:"Apps & Tools",number:"02",description:"Useful software made by people",scene:"tools"},
  {to:"/discover?category=creative",label:"Creative & AI",number:"03",description:"Original work and curious ideas",scene:"creative"},
  {to:"/discover?category=libraries",label:"Open Source",number:"04",description:"Shared tools and reusable knowledge",scene:"libraries"}
] as const;
const directory = [
  {to:"/boards",label:"Public boards",detail:"Reviewed releases and first looks"},
  {to:"/levels",label:"Artifacts & levels",detail:"Earned contributions and recognition"},
  {to:"/create",label:"Creator Studio",detail:"Invited member publishing"},
  {to:"/library",label:"My library",detail:"Your saved work, when signed in"},
  {to:"/account",label:"My profile",detail:"Private member controls"},
  {to:"/start",label:"Start here",detail:"How ANEVUM works"},
  {to:"/guide",label:"Field guide",detail:"Learn and explore"},
  {to:"/status",label:"Platform status",detail:"What's genuinely available"}
] as const;

export function Shell(){
  const navigate=useNavigate();
  const location=useLocation();
  const [query,setQuery]=useState("");
  const [menuOpen,setMenuOpen]=useState(false);
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
    <header className="site-header av9-header">
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
          <Link to="/create" className="header-create av9-create"><Icon name="create" size={17}/><span>Share work</span></Link>
          <Link to="/account" className="cw-account-link av9-account" aria-label="Member account; sign-in availability depends on invitation"><Icon name="people" size={20}/></Link>
          <button ref={menuButton} className="menu-button av9-menu-trigger" type="button"
            aria-label={menuOpen ? "Close site navigation" : "Open site navigation"}
            aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="av9-navigation"
            onClick={()=>setMenuOpen(value=>!value)}>
            <span className="av9-menu-trigger-text">Menu</span>
            <Icon name={menuOpen?"close":"menu"} size={21}/>
          </button>
        </div>
      </div>
    </header>
    <dialog ref={menuDialog} id="av9-navigation" className="av9-navigation"
      aria-label="Explore ANEVUM"
      onClose={()=>{setMenuOpen(false);menuButton.current?.focus();}}
      onCancel={()=>setMenuOpen(false)}
      onClick={event=>{if(event.target===menuDialog.current)setMenuOpen(false);}}>
      <div className="av9-navigation-sheet">
        <header className="av9-navigation-top">
          <div><span className="av9-overline">ANEVUM / UNIVERSAL DIRECTORY</span><h2>Choose your <em>world.</em></h2></div>
          <button className="av9-menu-close" type="button" onClick={()=>setMenuOpen(false)}>Close <Icon name="close" size={18}/></button>
        </header>
        <div className="av9-navigation-body">
          <section className="av9-navigation-worlds" aria-label="Worlds to explore">
            {portalCategories.map(item=><Link to={item.to} key={item.to} className="av9-navigation-world" onClick={()=>setMenuOpen(false)}>
              <span className="av9-navigation-world-art" aria-hidden="true"><CosmicArtwork scene={item.scene}/></span>
              <span className="av9-navigation-world-copy"><small>{item.number} / EXPLORE</small><strong>{item.label}</strong><span>{item.description}</span></span>
              <Icon name="arrow" size={18}/>
            </Link>)}
          </section>
          <div className="av9-navigation-links">
            <span className="av9-overline">COMMUNITY / MEMBER SPACES</span>
            {directory.map(item=><Link key={item.to} to={item.to} onClick={()=>setMenuOpen(false)}>
              <span><strong>{item.label}</strong><small>{item.detail}</small></span><Icon name="arrow" size={17}/>
            </Link>)}
            <button className="av9-open-switcher" type="button" onClick={()=>{setMenuOpen(false);setLauncherOpen(true);}}>
              <Icon name="search" size={18}/> Quick switch <kbd>⌘ K</kbd>
            </button>
          </div>
        </div>
        <footer className="av9-navigation-foot">DISCOVER FREELY / CONTRIBUTION ACCESS REMAINS INVITATION-BASED</footer>
      </div>
    </dialog>
    <PortalLauncher open={launcherOpen} onClose={()=>setLauncherOpen(false)}/>
    <main id="main" tabIndex={-1} className="site-main av9-main">
      {home?<Outlet/>:<div className="av5-site-frame av9-unified-frame"><div className="av5-site-content"><Outlet/></div></div>}
    </main>
    <footer className="site-footer av9-footer">
      <span>ANEVUM / A WORLD OF THINGS PEOPLE MAKE</span>
      <nav aria-label="Site information"><Link to="/start">Start Here</Link><Link to="/guide">Field Guide</Link><Link to="/boards">Boards</Link><Link to="/status">Status</Link></nav>
      <span>PUBLIC DISCOVERY IS OPEN · MEMBER ACCESS IS IN TESTING</span>
    </footer>
  </div>;
}
