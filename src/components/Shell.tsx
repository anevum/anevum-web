import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Mark from "./Mark";

const nav = [
  ["Work", "/work"],
  ["Lab", "/lab"],
  ["Record", "/record"],
  ["Notes", "/notes"],
  ["Wiki", "/wiki"],
  ["About", "/about"]
] as const;

const searchEntries = [
  ["ANEVUM", "Home and current work", "/"],
  ["Work", "Projects, systems, and active builds", "/work"],
  ["Lab", "Experiments and hypotheses", "/lab"],
  ["Record", "Results, changes, and public evidence", "/record"],
  ["Notes", "Working ideas and longer-form thinking", "/notes"],
  ["Wiki", "Structured map of ANEVUM", "/wiki"],
  ["Transcosmic Archive", "Preserved creative and publishing work", "/wiki/archive/transcosmic"],
  ["About", "Devon Akins and why ANEVUM exists", "/about"],
  ["RHENLINK", "Identity and authenticated access", "/rhenlink"],
  ["Command", "Private operating console", "/command"]
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { commandAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return searchEntries.filter(
      ([title, note]) => !term || (title + " " + note).toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <div className="site-frame">
      <a className="skip-link" href="#content">Skip to content</a>

      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="ANEVUM home">
            <Mark />
            <span>ANEVUM</span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {nav.map(([label, route]) => (
              <NavLink key={route} to={route} className={({ isActive }) => (isActive ? "active" : "")}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="header-tools">
            <button
              className="quiet-button search-trigger"
              onClick={() => setSearchOpen(true)}
              type="button"
            >
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <Link className="identity-link" to="/rhenlink">RHENLINK</Link>
            {commandAdmin && <Link className="command-link" to="/command">Command</Link>}
            <button
              className="menu-trigger"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              className="mobile-nav"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {nav.map(([label, route]) => (
                <Link key={route} to={route}>{label}<span>↗</span></Link>
              ))}
              <Link to="/rhenlink">RHENLINK<span>↗</span></Link>
              {commandAdmin && <Link to="/command">Command<span>↗</span></Link>}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="content" className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Mark />
            <div>
              <strong>ANEVUM</strong>
              <span>Devon Akins / Working archive</span>
            </div>
          </div>
          <div className="footer-links">
            <Link to="/work">Work</Link>
            <Link to="/record">Record</Link>
            <Link to="/wiki">Wiki</Link>
            <Link to="/about">About</Link>
          </div>
          <p>Systems, experiments, writing, research, and the record of what gets built.</p>
        </div>
        <div className="footer-base">
          <span>ANEVUM / 2026</span>
          <span>Independent work</span>
        </div>
      </footer>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="search-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Search ANEVUM"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSearchOpen(false);
            }}
          >
            <motion.div
              className="search-dialog"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
            >
              <div className="search-field">
                <span>⌕</span>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search ANEVUM"
                  aria-label="Search ANEVUM"
                />
                <button type="button" onClick={() => setSearchOpen(false)}>Esc</button>
              </div>
              <div className="search-results">
                {results.map(([title, note, route]) => (
                  <Link key={route} to={route}>
                    <div>
                      <strong>{title}</strong>
                      <span>{note}</span>
                    </div>
                    <b>↗</b>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
