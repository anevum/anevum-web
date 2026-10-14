import {useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {readProjects,type Category,type Project} from "../lib/api";

type FeedFilter="all"|"games"|"tools"|"creative"|"learning";
type LoadState="loading"|"ready"|"more"|"error";
const FILTERS:readonly {id:FeedFilter;label:string}[]=[
  {id:"all",label:"ALL"},
  {id:"games",label:"PLAY"},
  {id:"tools",label:"TOOLS"},
  {id:"creative",label:"CREATE"},
  {id:"learning",label:"LEARN"}
];
const PAGE_SIZE="8";

function publishLabel(value:string|null){
  if(!value)return "DATE UNLISTED";
  const timestamp=Date.parse(value);
  return Number.isFinite(timestamp)?new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"short",day:"numeric",year:"numeric"}).format(new Date(timestamp)).toUpperCase():"DATE UNLISTED";
}
function mergeProjects(existing:Project[],incoming:Project[]){
  const unique=new Map(existing.map(item=>[item.id,item]));
  for(const item of incoming)unique.set(item.id,item);
  return [...unique.values()];
}

/** Genuine approved-project activity. No synthetic messages, fake activity, or IREN agent authority. */
export function MorphActivityStream(){
  const [filter,setFilter]=useState<FeedFilter>("all");
  const [cursor,setCursor]=useState("");
  const [revision,setRevision]=useState(0);
  const [items,setItems]=useState<Project[]>([]);
  const [nextCursor,setNextCursor]=useState<string|null>(null);
  const [state,setState]=useState<LoadState>("loading");
  const [error,setError]=useState<string|null>(null);
  const [checkedAt,setCheckedAt]=useState<string|null>(null);
  const cursorInFlight=useRef<string|null>(null);

  useEffect(()=>{
    if(cursor)return; // Never disrupt a person reading later activity pages.
    const onVisible=()=>{if(document.visibilityState==="visible")setRevision(n=>n+1);};
    const timer=window.setInterval(onVisible,120000);
    document.addEventListener("visibilitychange",onVisible);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisible);};
  },[cursor]);

  useEffect(()=>{
    const controller=new AbortController();
    let active=true;
    const paging=cursor.length>0;
    setState(paging?"more":"loading");
    setError(null);
    if(!paging){setItems([]);setNextCursor(null);}
    cursorInFlight.current=cursor;
    readProjects({
      limit:PAGE_SIZE,
      ...(filter!=="all"?{category:filter as Category}:{}),
      ...(paging?{cursor}:{})
    },controller.signal).then(page=>{
      if(!active||controller.signal.aborted)return;
      setItems(current=>paging?mergeProjects(current,page.items):page.items);
      setNextCursor(page.nextCursor);
      setCheckedAt(new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(new Date()));
      cursorInFlight.current=null;
      setState("ready");
    }).catch(()=>{
      if(!active||controller.signal.aborted)return;
      cursorInFlight.current=null;
      setError(paging?"The next page could not be loaded. You can retry.":"The public catalogue could not be reached. No activity was invented.");
      setState("error");
    });
    return()=>{active=false;controller.abort();};
  },[filter,cursor,revision]);

  function choose(next:FeedFilter){
    if(next===filter)return;
    setFilter(next);
    setCursor("");
    setRevision(n=>n+1);
  }
  function refresh(){
    setCursor("");
    setRevision(n=>n+1);
  }
  function loadMore(){
    if(!nextCursor||state!=="ready"||cursorInFlight.current!==null)return;
    setCursor(nextCursor);
  }
  function retry(){
    // Increment the request revision even if the failing cursor did not change.
    setRevision(n=>n+1);
  }
  const busy=state==="loading"||state==="more";
  const viewEmpty=items.length===0&&!busy;

  return <aside className="mhc-signal" aria-label="Approved release activity">
    <div className="mhc-signal-head">
      <span className="mhc-signal-index"><span aria-hidden="true">⌁</span> SUBMISSIONS / APPROVED</span>
      <button type="button" onClick={refresh} disabled={busy} aria-label="Refresh actual public submissions">↻ <span>REFRESH</span></button>
    </div>
    <div className="mhc-signal-heading">
      <h2>CREATOR <em>SUBMISSIONS.</em></h2>
      <p>Browse actual approved projects from the community. Choose a channel or open a creator's work.</p>
    </div>
    <div className="mhc-signal-source">
      <span className="mhc-signal-light" aria-hidden="true"/>
      <div><strong>APPROVED SUBMISSIONS</strong><small>{checkedAt?"LAST CHECKED "+checkedAt:"CONNECTING TO PUBLIC CATALOGUE"}</small></div>
    </div>
    <div className="mhc-feed-filters" role="group" aria-label="Filter the release feed by category">
      {FILTERS.map(item=><button key={item.id} type="button" aria-pressed={filter===item.id}
        className={filter===item.id?"is-active":""} onClick={()=>choose(item.id)}>{item.label}</button>)}
    </div>
    <div className="mhc-signal-items" aria-live="polite" aria-atomic="false">
      {state==="loading"&&<p className="mhc-signal-notice" role="status">Reading approved {filter==="all"?"public":filter} submissions…</p>}
      {items.map((project,i)=><Link to={"/atlas/projects/"+encodeURIComponent(project.id)}
        className="mhc-signal-item" key={project.id}>
        <span className="mhc-signal-item-number">{String(i+1).padStart(2,"0")}</span>
        <span className="mhc-feed-image" aria-hidden="true"><CosmicArtwork scene={project.category}/></span>
        <span className="mhc-signal-item-content">
          <small>{project.category.toUpperCase()} · {publishLabel(project.publishedAt)}</small>
          <strong>{project.title}</strong>
          <em>{project.summary}</em>
          <small>BY @{project.creatorHandle}</small>
        </span>
        <span className="mhc-signal-arrow" aria-hidden="true">↗</span>
      </Link>)}
      {viewEmpty&&<div className="mhc-signal-empty" role="status">
        <span aria-hidden="true">✦</span>
        <strong>{state==="error"?"CATALOGUE UNAVAILABLE":"NO APPROVED RELEASES"}</strong>
        <p>{error||"No approved submissions match this feed. Select another channel or explore the catalogue."}</p>
        {state==="error"?<button type="button" onClick={retry}>RETRY ↗</button>:
          <Link to="/atlas/discover">EXPLORE DISCOVERY ↗</Link>}
      </div>}
      {state==="error"&&items.length>0&&<div className="mhc-signal-paging-error" role="status">
        <p>{error}</p><button type="button" onClick={retry}>RETRY PAGE ↗</button>
      </div>}
    </div>
    <div className="mhc-feed-pager">
      {state==="more"&&<span role="status">LOADING MORE APPROVED WORK…</span>}
      {nextCursor&&state==="ready"&&<button type="button" onClick={loadMore}>LOAD MORE RELEASES ↓</button>}
      {!nextCursor&&state==="ready"&&<span>{items.length} {items.length===1?"RELEASE":"RELEASES"} ON THIS FEED · END OF AVAILABLE PAGES</span>}
    </div>
    <div className="mhc-signal-footer">
      <span>IREN EDITORIAL: NOT CONNECTED</span>
      <Link to="/atlas/discover">OPEN DISCOVERY ↗</Link>
    </div>
  </aside>;
}
