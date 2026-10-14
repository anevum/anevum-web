import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { OrbitalMark } from "./OrbitalMark";
import { Icon } from "./Icons";
import { PortalLauncher } from "./PortalLauncher";
import { isEditableTarget } from "../lib/portal-destinations";

// The global menu is intentionally short. Subject filters live in Discover;
// member tools live in Account, and editorial links live within their pages.
const primaryNavigation = [
  ["/discover", "Explore"],
  ["/community", "Community"],
  ["/creators", "Creators"]
] as const;
const drawerNavigation = [["/", "Home"], ...primaryNavigation] as const;

export function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);
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
    menuPanel.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function dismiss(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    }
    function outside(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (!menuPanel.current?.contains(event.target) && !menuButton.current?.contains(event.target)) setMenuOpen(false);
    }
    window.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", outside); };
  }, [menuOpen]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      const command = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.altKey;
      const slash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditableTarget(event.target);
      if (!command && !slash) return;
      event.preventDefault();
      setMenuOpen(false);
      setLauncherOpen(true);
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  return (
    <div className={"site-shell" + (location.pathname === "/" ? " site-shell--home" : "")}>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand-lockup" aria-label="ANEVUM home">
            <OrbitalMark className="brand-mark" />
            <span className="cw-brand-stack"><b>ANEVUM</b><small>CREATE BEYOND WORLDS</small></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary">
            {primaryNavigation.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          </nav>
          <div className="header-utilities">
            <button className="header-launcher" type="button"
              onClick={() => { setMenuOpen(false); setLauncherOpen(true); }}
              aria-label="Open quick navigation" aria-keyshortcuts="Control+K Meta+K">
              <Icon name="search" size={18}/><span>SEARCH</span><kbd>⌘K</kbd>
            </button>
            <Link to="/start" className="header-create">GET STARTED</Link>
            <Link to="/account" className="cw-account-link" aria-label="Member account (invited testing)"
              title="Member account — invited testing"><Icon name="people" size={19}/></Link>
            <button ref={menuButton} className="menu-button" type="button"
              aria-label={menuOpen ? "Close site navigation" : "Open site navigation"}
              aria-expanded={menuOpen} aria-controls="mobile-menu"
              onClick={() => setMenuOpen(value => !value)}><Icon name={menuOpen ? "close" : "menu"}/></button>
          </div>
        </div>
      </header>
      {menuOpen && <nav ref={menuPanel} className="mobile-drawer" id="mobile-menu" aria-label="Site sections">
        <span className="mobile-drawer-heading">EXPLORE ANEVUM</span>
        {drawerNavigation.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>)}
        <Link className="mobile-drawer-cta" to="/start">Find your place <Icon name="arrow" size={16}/></Link>
        <span className="mobile-drawer-footnote">Creator accounts and publishing are in invited testing.</span>
      </nav>}
      <PortalLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)}/>
      <main id="main" tabIndex={-1} className="site-main"><Outlet/></main>
      <footer className="site-footer">
        <div className="site-footer-identity"><strong>ANEVUM</strong><p>Independent creations, software, art and experiences.</p></div>
        <nav aria-label="Explore further">
          <Link to="/start">Start Here</Link>
          <Link to="/guide">Field Guide</Link>
          <Link to="/levels">Levels & Artifacts</Link>
          <Link to="/status">Build status</Link>
          <a href="/portfolio/">Devon's portfolio</a>
          <Link to="/workspace">Private workspace</Link>
        </nav>
        <span className="site-footer-note">Browsing is open. Publishing and member participation are in invited testing.</span>
      </footer>
    </div>
  );
}
