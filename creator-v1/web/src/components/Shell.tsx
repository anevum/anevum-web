import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FormEvent, useEffect, useRef, useState } from "react";
import { OrbitalMark } from "./OrbitalMark";
import { Icon } from "./Icons";
import { PortalLauncher } from "./PortalLauncher";
import { CinematicSiteRail } from "./CinematicSiteRail";
import { isEditableTarget } from "../lib/portal-destinations";
import { PRIMARY_NAV, DISCOVERY_NAV, MEMBER_NAV, SUPPORT_NAV, isSiteLinkSelected, type SiteLink } from "../lib/site-navigation";

/** All destinations reuse real current routes; gated routes stay behind MemberGate. */
const DRAWER_GROUPS: readonly { title:string; links:readonly SiteLink[] }[] = [
  {title:"NAVIGATE",links:PRIMARY_NAV},
  {title:"EXPLORE",links:DISCOVERY_NAV},
  {title:"YOUR SPACE",links:MEMBER_NAV},
  {title:"MORE",links:SUPPORT_NAV}
];
export function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  // Presentation only: preserve MemberGate and Atlas's independent shell.
  const cinematicPublic = ["/discover","/creators","/community","/boards","/levels","/start","/guide","/status","/workspace"].includes(location.pathname) ||
    location.pathname.startsWith("/projects/") ||
    location.pathname.startsWith("/creators/") ||
    location.pathname.startsWith("/community/posts/");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const firstMenuLink = useRef<HTMLAnchorElement>(null);
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
    firstMenuLink.current?.focus();
    function dismiss(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    }
    function dismissOutside(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node) || menuButton.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", dismissOutside);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismissOutside);
    };
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
    <div className={"site-shell"+(location.pathname==="/"?" site-shell--home":"")+(cinematicPublic?" site-shell--cinematic":"")}>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand-lockup" aria-label="ANEVUM home"><OrbitalMark className="brand-mark" /><span className="cw-brand-stack"><b>ANEVUM</b><small>CREATE BEYOND WORLDS</small></span></Link>
          {/* Navigation lives in one concise menu, not several competing toolbars. */}
          <form className="header-search" role="search" onSubmit={search}><Icon name="search" size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} maxLength={100} placeholder="Search worlds, creators, projects..." aria-label="Search published projects"/></form>
          <button className="header-launcher" type="button" onClick={() => setLauncherOpen(true)} aria-label="Search or jump to an ANEVUM page" aria-keyshortcuts="Control+K Meta+K"><Icon name="explore" size={19}/><span>SEARCH</span><kbd>⌘K</kbd></button>
          <button type="button" className="cinema-mobile-search" aria-label="Search ANEVUM pages and approved projects" onClick={() => setLauncherOpen(true)}><Icon name="search" size={19}/></button>
          <Link to="/account" className="cw-account-link" aria-label="Your member account"><Icon name="people" size={19}/></Link>
          <button ref={menuButton} className="menu-button" type="button" aria-label={menuOpen ? "Close site navigation" : "Open site navigation"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={()=>setMenuOpen(value=>!value)}><Icon name={menuOpen ? "close" : "menu"}/></button>
        </div>
      </header>
      <div className="signal-strip"><span>ANEVUM / CREATIVE UNIVERSE</span><span className="signal-dot"/><span>CREATE BEYOND WORLDS</span><span className="signal-tail">INVITED PARTICIPATION IN TESTING</span></div>
      {menuOpen && <nav ref={menuRef} className="mobile-drawer" id="mobile-menu" aria-label="ANEVUM site navigation">
        {DRAWER_GROUPS.map((group,groupIndex)=><div key={group.title} className="nav-drawer-group">
          <span className="nav-drawer-heading">{group.title}</span>
          {group.links.map((item,itemIndex)=><NavLink
            key={item.key} ref={groupIndex===0&&itemIndex===0?firstMenuLink:undefined}
            className="nav-drawer-entry" to={item.to} end={item.to==="/"}
            aria-current={isSiteLinkSelected(location.pathname,item.to)?"page":undefined}
            onClick={()=>setMenuOpen(false)}>
            <Icon name={item.icon} size={18}/>
            <span><strong>{item.label}</strong><small>{item.detail}</small></span>
          </NavLink>)}
        </div>)}
        <p className="nav-drawer-footer">Member tools require a verified account. Messages and collaboration will be available only after private security testing.</p>
      </nav>}
      <PortalLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)}/>
      <main id="main" tabIndex={-1} className="site-main">{cinematicPublic ?
        <div className="av5-site-frame">
          <CinematicSiteRail/>
          <div className="av5-site-content"><Outlet/></div>
        </div> : <Outlet/>}</main>
      <footer className="site-footer"><span>ANEVUM / A WORLD OF THINGS PEOPLE MAKE</span><nav aria-label="Useful links"><Link to="/start">Start Here</Link><Link to="/guide">Field Guide</Link><Link to="/creators">Creator Directory</Link><Link to="/boards">Community Boards</Link></nav><span>Explore freely. Member participation is in invited testing.</span></footer>
      
    </div>
  );
}
