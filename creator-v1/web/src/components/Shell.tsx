import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FormEvent, useEffect, useRef, useState } from "react";
import { OrbitalMark } from "./OrbitalMark";
import { Icon } from "./Icons";
import { PortalLauncher } from "./PortalLauncher";
import { DashboardLeftRail } from "./DashboardRails";
import { DashboardContextBar, dashboardSectionForPath } from "./DashboardContextBar";
import { isEditableTarget } from "../lib/portal-destinations";

const desktopNav = [
  ["/", "Home"], ["/discover", "Explore"], ["/creators", "Creators"], ["/community", "Community"], ["/levels", "Levels"]
] as const;
const portalCategories = [
  ["/discover?category=games", "Games"],
  ["/discover?category=tools", "Apps & Tools"],
  ["/discover?category=creative", "Creative / AI"],
  ["/discover?category=libraries", "Open Source"],
  ["/discover?category=automation", "Automation"],
  ["/discover?category=learning", "Learning"]
] as const;
export function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardSection = dashboardSectionForPath(location.pathname);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const previousPage = useRef(location.pathname + location.search);
  useEffect(() => { setMenuOpen(false); setLauncherOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const page = location.pathname + location.search;
    if (previousPage.current === page) return;
    previousPage.current = page;
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [location.pathname, location.search, location.hash]);
  useEffect(() => {
    if (!menuOpen) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    }
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [menuOpen]);
  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      const command = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.altKey;
      const slash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditableTarget(event.target);
      if (!command && !slash) return;
      event.preventDefault();
      setLauncherOpen(true);
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
  }

  return (
    <div className={"site-shell"+(location.pathname==="/"?" site-shell--home":"")+(dashboardSection?" site-shell--dashboard":"")}>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand-lockup" aria-label="ANEVUM home"><OrbitalMark className="brand-mark" /><span className="cw-brand-stack"><b>ANEVUM</b><small>CREATE BEYOND WORLDS</small></span></Link>
          <nav className="desktop-nav" aria-label="Primary">{desktopNav.map(([to,label]) => <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>)}</nav>
          <form className="header-search" role="search" onSubmit={search}><Icon name="search" size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} maxLength={100} placeholder="Search worlds, creators, projects..." aria-label="Search published projects"/></form>
          <button className="header-launcher" type="button" onClick={() => setLauncherOpen(true)} aria-label="Open quick navigation" aria-keyshortcuts="Control+K Meta+K"><Icon name="explore" size={19}/><span>PORTALS</span><kbd>⌘K</kbd></button>
          <Link to="/create" className="header-create">CREATE</Link>
          <Link to="/account" className="cw-account-link" aria-label="Your member account"><Icon name="people" size={19}/></Link>
          <button ref={menuButton} className="menu-button" type="button" aria-label={menuOpen ? "Close site navigation" : "Open site navigation"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={()=>setMenuOpen(value=>!value)}><Icon name={menuOpen ? "close" : "menu"}/></button>
        </div>
      </header>
      <div className="portal-navigation"><div className="portal-navigation-inner"><span className="portal-navigation-label">EXPLORE WORLDS /</span><nav aria-label="Browse by creation type">{portalCategories.map(([to,label])=><Link to={to} key={to}>{label}</Link>)}</nav><Link to="/create" className="portal-navigation-submit">+ SUBMIT WORK</Link></div></div>
      <div className="signal-strip"><span>ANEVUM / CREATIVE UNIVERSE</span><span className="signal-dot"/><span>CREATE BEYOND WORLDS</span><span className="signal-tail">INVITED PARTICIPATION IN TESTING</span></div>
      {menuOpen && <nav className="mobile-drawer" id="mobile-menu" aria-label="More navigation">{[...desktopNav,["/start","Start Here"] as const,["/guide","Field Guide"] as const,["/create","Submit work"] as const,["/library","Saved library"] as const,["/account","My profile"] as const,["/workspace","Private workspace"] as const,["/status","Build status"] as const].map(([to,label])=><NavLink key={to} to={to} end={to==="/"}>{label}</NavLink>)}<a href="/portfolio/">Devon's portfolio</a></nav>}
      <PortalLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)}/>
      <main id="main" tabIndex={-1} className="site-main">{dashboardSection ?
        <div className="av4-page-frame">
          <DashboardLeftRail/>
          <div className="av4-page-content"><DashboardContextBar section={dashboardSection}/><Outlet/></div>
        </div> : <Outlet/>}</main>
      <footer className="site-footer"><span>ANEVUM / A WORLD OF THINGS PEOPLE MAKE</span><nav aria-label="Useful links"><Link to="/start">Start Here</Link><Link to="/guide">Field Guide</Link><a href="/portfolio/">Devon's portfolio</a><Link to="/workspace">Private workspace</Link><Link to="/status">What's live</Link></nav><span>Explore freely. Member participation is in invited testing.</span></footer>
      
    </div>
  );
}
