import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./Icons";
import { findPortalDestinations, publishedSearchPath } from "../lib/portal-destinations";
import { OrbitalMark } from "./OrbitalMark";
import { readProjects,readCreators,type Project,type Creator } from "../lib/api";

/**
 * Primary navigation indexes fixed first-party routes. Inside Atlas, a debounced
 * lookup additionally searches actual approved projects and creator channels.
 * No private API access, invented accounts, or synthetic search results.
 */
export function PortalLauncher({ open, onClose, routePrefix="" }: { open: boolean; onClose: () => void; routePrefix?: "" | "/atlas" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchField = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [live,setLive]=useState<{
    status:"idle"|"loading"|"ready"|"error";
    query:string;
    projects:Project[];
    creators:Creator[];
  }>({status:"idle",query:"",projects:[],creators:[]});
  const matches = findPortalDestinations(query);
  const liveQuery=query.trim();
  const liveEnabled=open&&routePrefix==="/atlas"&&liveQuery.length>=2;
  const searchPath = publishedSearchPath(query);
  const entries = [
    ...matches.map(item => ({ id: item.id, path: item.path, title: item.title, detail: item.description, category: item.category, icon: item.icon, gated: !!item.gated, liveSearch: false })),
    ...(searchPath ? [{ id: "published-search", path: searchPath, title: "Search published projects", detail: "Search the real, approved public catalogue for “" + query.trim() + "”", category: "Explore" as const, icon: "search", gated: false, liveSearch: true }] : []),
    ...(liveEnabled&&live.query===liveQuery&&live.status==="ready"?[
      ...live.projects.map(project=>({
        id:"project-"+project.id,path:"/projects/"+encodeURIComponent(project.id),title:project.title,
        detail:"Approved "+project.category+" by @"+project.creatorHandle,category:"Explore" as const,
        icon:"star",gated:false,liveSearch:true
      })),
      ...live.creators.map(creator=>({
        id:"creator-"+creator.handle,path:"/creators/"+encodeURIComponent(creator.handle),title:creator.displayName,
        detail:"Creator @"+creator.handle+" · "+creator.publishedProjects+" approved projects",category:"Community" as const,
        icon:"people",gated:false,liveSearch:true
      }))
    ]:[])
  ];
  const selected = Math.min(active, entries.length - 1);
  const insideWorkspace=(path:string)=>routePrefix==="/atlas"?(path==="/"||path==="/atlas"?"/atlas":"/atlas"+path):path;

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
  useEffect(()=>{
    if(!liveEnabled){setLive({status:"idle",query:"",projects:[],creators:[]});return;}
    const controller=new AbortController();
    let present=true;
    setLive({status:"loading",query:liveQuery,projects:[],creators:[]});
    const timer=window.setTimeout(async()=>{
      try{
        // Read-only public endpoints, abort and discard stale requests.
        // Show partial real results if only one independent endpoint fails.
        const [projects,creators]=await Promise.allSettled([
          readProjects({q:liveQuery,limit:"5"},controller.signal),
          readCreators({q:liveQuery,limit:"4"},controller.signal)
        ]);
        if(!present||controller.signal.aborted)return;
        if(projects.status==="rejected"&&creators.status==="rejected"){
          setLive({status:"error",query:liveQuery,projects:[],creators:[]});
        }else{
          setLive({
            status:"ready",query:liveQuery,
            projects:projects.status==="fulfilled"?projects.value.items:[],
            creators:creators.status==="fulfilled"?creators.value.items:[]
          });
        }
      }catch{
        if(present&&!controller.signal.aborted)setLive({status:"error",query:liveQuery,projects:[],creators:[]});
      }
    },260);
    return()=>{present=false;window.clearTimeout(timer);controller.abort();};
  },[liveEnabled,liveQuery,routePrefix]);


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
      if(routePrefix==="/atlas")navigate(insideWorkspace(entries[selected].path));
      else navigate(entries[selected].path);
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
      <p className="portal-launcher-hint" id={listId+"-hint"}>{routePrefix==="/atlas"?"FIND REAL PROJECTS AND CREATORS · ↑ ↓ TO SELECT · ENTER TO OPEN · ESC TO CLOSE":"TYPE TO FILTER PAGES · ↑ ↓ TO SELECT · ENTER TO OPEN · ESC TO CLOSE"}</p>
      {liveEnabled&&<div className="portal-launcher-live-status" role="status" aria-live="polite">
        {live.status==="loading"?"SEARCHING REAL RELEASES AND CREATOR CHANNELS…":
         live.status==="error"?"Live directory search is temporarily unavailable. Full catalogue search is still available.":
         live.status==="ready"?(live.projects.length+live.creators.length)+" DIRECT MATCHES FROM THE PUBLIC DIRECTORY":
         "SEARCH PUBLIC PROJECTS AND CREATORS"}
      </div>}
      <div className="portal-launcher-result-top">
        <span className="kicker">{query.trim() ? "MATCHING DESTINATIONS" : "POPULAR ENTRANCES"}</span>
        <span>{entries.length} {entries.length===1?"ROUTE":"ROUTES"}</span>
      </div>
      <nav className="portal-launcher-results" aria-label="Quick ANEVUM destinations">
        {entries.length ? entries.map((entry, index) =>
          <Link key={entry.id} to={insideWorkspace(entry.path)} onClick={leave} onMouseEnter={()=>setActive(index)}
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
        <Link to={insideWorkspace("/start")} onClick={leave}>NEW HERE? START HERE <Icon name="arrow" size={15}/></Link>
      </footer>
    </div>
  </dialog>;
}
