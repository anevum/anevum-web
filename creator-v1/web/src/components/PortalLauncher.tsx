import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./Icons";
import { findPortalDestinations, publishedSearchPath } from "../lib/portal-destinations";
import { publicCreatorHandle } from "../lib/public-creator-handle";
import { OrbitalMark } from "./OrbitalMark";
import { readProjects,readCreators,type Project,type Creator } from "../lib/api";
import {useModalScrollLock} from "../lib/useModalScrollLock";

/**
 * Primary navigation indexes fixed first-party routes. For every route, a debounced
 * lookup searches actual approved projects and creator channels.
 * No private API access, invented accounts, or synthetic search results.
 */
export function PortalLauncher({ open, onClose, routePrefix="", initialQuery="" }: { open: boolean; onClose: () => void; routePrefix?: "" | "/atlas"; initialQuery?:string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchField = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<{element:HTMLElement|null;url:string}>({element:null,url:""});
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  useModalScrollLock(open);
  const [live,setLive]=useState<{
    status:"idle"|"loading"|"ready"|"error";
    query:string;
    partial?:boolean;
    projects:Project[];
    creators:Creator[];
  }>({status:"idle",query:"",projects:[],creators:[]});
  const matches = findPortalDestinations(query);
  const liveQuery=query.trim();
  const liveEnabled=open&&liveQuery.length>=2;
  const searchPath = publishedSearchPath(query);
  const entries = [
    ...matches.map(item => ({ id: item.id, path: item.path, title: item.title, detail: item.description, category: item.category, icon: item.icon, gated: !!item.gated, liveSearch: false })),
    ...(searchPath ? [{ id: "published-search", path: searchPath, title: "Search published projects", detail: "Search the real, approved public catalogue for “" + query.trim() + "”", category: "Explore" as const, icon: "search", gated: false, liveSearch: true }] : []),
    ...(liveEnabled&&live.query===liveQuery&&live.status==="ready"?[
      ...live.projects.map(project=>({
        id:"project-"+project.id,path:"/projects/"+encodeURIComponent(project.id),title:project.title,
        detail:"Approved "+project.category+" by "+(publicCreatorHandle(project.creatorHandle)?"@"+publicCreatorHandle(project.creatorHandle):project.creatorName||"ANEVUM member"),category:"Explore" as const,
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
      const active=document.activeElement instanceof HTMLElement?document.activeElement:null;
      restoreFocus.current={element:active?.closest("dialog")?document.querySelector<HTMLButtonElement>(".av9-menu-trigger"):active,url:window.location.href};
      setQuery(initialQuery);
      setActive(0);
      if (!element.open) element.showModal();
      searchField.current?.focus();
    } else if (element.open) {
      element.close();
    }
  }, [open]);
  useEffect(()=>{
    if(open)document.getElementById(listId+"-result-"+selected)?.scrollIntoView({block:"nearest"});
  },[open,selected,listId]);
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
            status:"ready",query:liveQuery,partial:projects.status==="rejected"||creators.status==="rejected",
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
    if(restoreFocus.current.url===window.location.href)restoreFocus.current.element?.focus();
  }
  function onKeyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    // Search inputs can consume the first Escape to clear text. The advertised
    // shortcut must close the overlay and release the shared page scroll lock.
    if (event.key === "Escape") {
      event.preventDefault();
      leave();
      return;
    }
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

  return <dialog ref={dialog} onClose={leave} onClick={onBackdrop} onCancel={()=>{
    if(restoreFocus.current.url===window.location.href)restoreFocus.current.element?.focus();
  }} className="portal-launcher" aria-labelledby="portal-launcher-title">
    <div className="portal-launcher-content">
      <header className="portal-launcher-head">
        <span className="portal-launcher-mark" aria-hidden="true"><OrbitalMark/></span>
        <div>
          <span className="kicker">THE ANEVUM SWITCHBOARD</span>
          <h2 id="portal-launcher-title">Search ANEVUM</h2>
          <p>Find published work, creators and places in the network.</p>
        </div>
        <button className="portal-launcher-close" type="button" aria-label="Close quick navigation" onClick={leave}><Icon name="close" size={22}/></button>
      </header>
      <div className="portal-launcher-search">
        <Icon name="search" size={21}/>
        <label htmlFor={listId+"-input"} className="visually-hidden">Find an ANEVUM page or search public projects</label>
        <input id={listId+"-input"} ref={searchField} type="search" autoComplete="off" spellCheck={false}
          value={query} maxLength={100} onChange={event => setQuery(event.target.value)} onKeyDown={onKeyboard}
          placeholder="Search projects, creators or pages" role="combobox" aria-expanded={entries.length>0}
          aria-controls={listId+"-results"} aria-autocomplete="list"
          aria-activedescendant={selected>=0?listId+"-result-"+selected:undefined}
          aria-describedby={listId+"-hint"}/>
        <kbd>/</kbd>
      </div>
      <p className="portal-launcher-hint" id={listId+"-hint"}>FIND REAL PROJECTS AND CREATORS · ↑ ↓ TO SELECT · ENTER TO OPEN · ESC TO CLOSE</p>
      {liveEnabled&&<div className="portal-launcher-live-status" role="status" aria-live="polite">
        {live.status==="loading"?"SEARCHING REAL RELEASES AND CREATOR CHANNELS…":
         live.status==="error"?"Live directory search is temporarily unavailable. Full catalogue search is still available.":
         live.status==="ready"?(live.projects.length+live.creators.length)+" DIRECT MATCHES FROM THE PUBLIC DIRECTORY"+(live.partial?" · Some directory results are unavailable.":""):
         "SEARCH PUBLIC PROJECTS AND CREATORS"}
      </div>}
      <div className="portal-launcher-result-top">
        <span className="kicker">{query.trim() ? "MATCHING DESTINATIONS" : "PLACES IN ANEVUM"}</span>
        <span>{entries.length} {entries.length===1?"ROUTE":"ROUTES"}</span>
      </div>
      <div id={listId+"-results"} role="listbox" className="portal-launcher-results" aria-label="Quick ANEVUM destinations">
        {entries.length ? entries.map((entry, index) =>
          <Link key={entry.id} id={listId+"-result-"+index} role="option" aria-selected={index===selected}
            to={insideWorkspace(entry.path)} onClick={leave} onMouseEnter={()=>setActive(index)}
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
      </div>
      <footer className="portal-launcher-foot">
        <span>PUBLIC WORK / CREATOR CHANNELS</span>
        <Link to={insideWorkspace("/start")} onClick={leave}>NEW HERE? START HERE <Icon name="arrow" size={15}/></Link>
      </footer>
    </div>
  </dialog>;
}
