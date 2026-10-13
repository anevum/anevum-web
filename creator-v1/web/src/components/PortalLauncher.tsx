import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./Icons";
import { findPortalDestinations, publishedSearchPath } from "../lib/portal-destinations";
import { OrbitalMark } from "./OrbitalMark";

/**
 * The launcher indexes only hardcoded first-party routes. Published-project
 * search opens the real catalogue; it never invents results or calls private APIs.
 */
export function PortalLauncher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchField = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const matches = findPortalDestinations(query);
  const searchPath = publishedSearchPath(query);
  const entries = [
    ...matches.map(item => ({ id: item.id, path: item.path, title: item.title, detail: item.description, category: item.category, icon: item.icon, gated: !!item.gated, liveSearch: false })),
    ...(searchPath ? [{ id: "published-search", path: searchPath, title: "Search published projects", detail: "Search the real, approved public catalogue for “" + query.trim() + "”", category: "Explore" as const, icon: "search", gated: false, liveSearch: true }] : [])
  ];
  const selected = Math.min(active, entries.length - 1);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) {
      setQuery("");
      setActive(0);
      if (!element.open) element.showModal();
      searchField.current?.focus();
    } else if (element.open) {
      element.close();
    }
  }, [open]);
  useEffect(() => { setActive(0); }, [query]);

  function leave() {
    onClose();
  }
  function onKeyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" && entries.length) {
      event.preventDefault();
      setActive(index => (index + 1) % entries.length);
    } else if (event.key === "ArrowUp" && entries.length) {
      event.preventDefault();
      setActive(index => (index + entries.length - 1) % entries.length);
    } else if (event.key === "Enter" && selected >= 0) {
      event.preventDefault();
      navigate(entries[selected].path);
      leave();
    }
  }
  function onBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.currentTarget === event.target) leave();
  }

  return <dialog ref={dialog} onClose={leave} onClick={onBackdrop} className="portal-launcher" aria-labelledby="portal-launcher-title">
    <div className="portal-launcher-content">
      <header className="portal-launcher-head">
        <span className="portal-launcher-mark" aria-hidden="true"><OrbitalMark/></span>
        <div>
          <span className="kicker">THE ANEVUM SWITCHBOARD</span>
          <h2 id="portal-launcher-title">GO SOMEWHERE.</h2>
          <p>Jump between real pages and category portals. No account needed to browse.</p>
        </div>
        <button className="portal-launcher-close" type="button" aria-label="Close quick navigation" onClick={leave}><Icon name="close" size={22}/></button>
      </header>
      <div className="portal-launcher-search">
        <Icon name="search" size={21}/>
        <label htmlFor={listId+"-input"} className="visually-hidden">Find an ANEVUM page or search public projects</label>
        <input id={listId+"-input"} ref={searchField} type="search" autoComplete="off" spellCheck={false}
          value={query} maxLength={100} onChange={event => setQuery(event.target.value)} onKeyDown={onKeyboard}
          placeholder="WHERE DO YOU WANT TO GO?" aria-describedby={listId+"-hint"}/>
        <kbd>/</kbd>
      </div>
      <p className="portal-launcher-hint" id={listId+"-hint"}>TYPE TO FILTER PAGES · ↑ ↓ TO SELECT · ENTER TO OPEN · ESC TO CLOSE</p>
      <div className="portal-launcher-result-top">
        <span className="kicker">{query.trim() ? "MATCHING DESTINATIONS" : "POPULAR ENTRANCES"}</span>
        <span>{entries.length} {entries.length===1?"ROUTE":"ROUTES"}</span>
      </div>
      <nav className="portal-launcher-results" aria-label="Quick ANEVUM destinations">
        {entries.length ? entries.map((entry, index) =>
          <Link key={entry.id} to={entry.path} onClick={leave} onMouseEnter={()=>setActive(index)}
            className={"portal-launcher-result"+(index===selected?" portal-launcher-result-active":"")}>
            <span className="portal-launcher-result-icon" aria-hidden="true"><Icon name={entry.icon} size={21}/></span>
            <span className="portal-launcher-result-copy">
              <strong>{entry.title}</strong>
              <small>{entry.detail}</small>
            </span>
            <span className="portal-launcher-result-meta">{entry.gated?"INVITED ONLY":entry.liveSearch?"LIVE CATALOGUE":entry.category.toUpperCase()}</span>
            <Icon name="arrow" size={17}/>
          </Link>
        ) : <div className="portal-launcher-empty" role="status">No matching page. Try Games, Guide, Creators, or Build Status.</div>}
      </nav>
      <footer className="portal-launcher-foot">
        <span>LOCAL ROUTE SEARCH / NOT A FAKE LIVE FEED</span>
        <Link to="/start" onClick={leave}>NEW HERE? START HERE <Icon name="arrow" size={15}/></Link>
      </footer>
    </div>
  </dialog>;
}
