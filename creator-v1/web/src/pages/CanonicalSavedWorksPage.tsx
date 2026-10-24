import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {canonicalAuthClient} from "../lib/canonical-beta";
import {memberHealth} from "../lib/member-api";
import {projectEngagementGateway} from "../lib/project-engagement";
import {readCanonicalSavedProjects,setCanonicalProjectSaved,
 type CanonicalSavedProject,CanonicalProjectSaveError} from "../lib/canonical-project-saves";
import {useResource} from "../lib/useResource";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {Category} from "../lib/api";
import {browseSavedWorks,savedCategoryFilters} from "../lib/saved-works-browse";
import {MemberCollectionNav,MEMBER_COLLECTION_NAV_REVIEW} from "../components/MemberCollectionNav";
import "./canonical-saved-works.css";

function SavedWorksCollection({memberId}:{memberId:string}){
 const initial=useResource(signal=>readCanonicalSavedProjects(undefined,signal),[memberId]);
 const [items,setItems]=useState<CanonicalSavedProject[]>([]);
 const [cursor,setCursor]=useState<string|null>(null);
 const [loadingMore,setLoadingMore]=useState(false);
 const [pending,setPending]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [category,setCategory]=useState("all");
 const [query,setQuery]=useState("");
 const [layout,setLayout]=useState<"list"|"grid">("list");
 const categories=savedCategoryFilters(items);
 const safeCategory=category==="all"||categories.some(option=>option.id===category)?category:"all";
 const displayed=browseSavedWorks(items,safeCategory,query);

 useEffect(()=>{
  if(initial.state!=="ready")return;
  setItems(initial.data.items);
  setCursor(initial.data.nextCursor);
 },[initial]);

 async function loadMore(){
  if(!cursor||loadingMore||pending)return;
  setLoadingMore(true);setError("");
  try{
   const next=await readCanonicalSavedProjects(cursor);
   setItems(current=>{
    const known=new Set(current.map(item=>item.id));
    return [...current,...next.items.filter(item=>!known.has(item.id))];
   });
   setCursor(next.nextCursor);
  }catch(cause){
   setError(cause instanceof CanonicalProjectSaveError?cause.message:"Your saved works could not be loaded");
  }finally{setLoadingMore(false)}
 }
 async function remove(id:string){
  if(pending||loadingMore)return;
  setPending(id);setError("");setNotice("");
  try{
   const result=await setCanonicalProjectSaved(id,false);
   if(result.saved)throw Error("The server did not confirm removal");
   setItems(current=>current.filter(item=>item.id!==id));
   setNotice(result.changed?"Project removed from your private collection.":"This project is no longer saved.");
  }catch(cause){
   setError(cause instanceof CanonicalProjectSaveError?cause.message:"The server could not confirm removal. Reload and try again.");
  }finally{setPending(null)}
 }
 return <section className="avsaved-content" data-view={layout} aria-label="Your private saved projects">
  <MemberCollectionNav current="saved"/>
  {initial.state==="loading"&&<p role="status" className="avsaved-message">Checking your saved projects…</p>}
  {initial.state==="error"&&<p role="alert" className="avsaved-message">Your private collection is temporarily unavailable. Your saved choices have not been changed.</p>}
  {initial.state==="ready"&&<>
   <div className="avsaved-counter"><span className="kicker">YOUR SAVED WORK / PRIVATE</span><span>{cursor?items.length+" SHOWN · MORE BELOW":items.length+" SAVED PROJECT"+(items.length===1?"":"S")}</span></div>
   {items.length>0&&<div className="avsaved-organizer" aria-label="Organize saved work">
    <div className="avsaved-organizer-intro"><div><h2>{MEMBER_COLLECTION_NAV_REVIEW?"Browse":"Find what you saved."}</h2><p>Browse by category or search projects already loaded.</p></div>
     <div className="avsaved-layout" role="group" aria-label="Saved work display"><button type="button" aria-pressed={layout==="list"} onClick={()=>setLayout("list")}>List</button><button type="button" aria-pressed={layout==="grid"} onClick={()=>setLayout("grid")}>Gallery</button></div>
    </div>
    <div className="avsaved-controls">
     <label>Search saved work<input type="search" maxLength={100} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Project name or creator"/></label>
     <label>Category<select aria-label="Saved category" value={safeCategory} onChange={e=>setCategory(e.target.value)}><option value="all">All saved ({items.length})</option>{categories.map(group=><option key={group.id} value={group.id}>{group.label} ({group.count})</option>)}</select></label>
    </div>
    <p className="avsaved-filter-count" role="status">Showing {displayed.length} of {items.length} {cursor?"loaded ":""}saved projects{cursor?". More available below.":""}</p>
   </div>}
   {items.length>0?<div className="avsaved-grid">{displayed.map(item=><article className="avsaved-card" key={item.id}>
    <div className="avsaved-art" aria-hidden="true"><CosmicArtwork scene={item.category as Category}/></div>
    <div className="avsaved-card-body">
     <div className="avsaved-card-meta"><span>{item.category.toUpperCase()}</span><span>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(item.savedAt*1000))}</span></div>
     <h2><Link to={"/projects/"+encodeURIComponent(item.id)+"?from="+encodeURIComponent("/saved")}>{item.title}</Link></h2>
     <p>{item.summary}</p>
     <div className="avsaved-card-maker">BY <Link to={"/creators/"+encodeURIComponent(item.creatorHandle)}>@{item.creatorHandle}</Link></div>
     <div className="avsaved-card-actions">
      <Link className="avsaved-open" aria-label={"Open project "+item.title} to={"/projects/"+encodeURIComponent(item.id)+"?from="+encodeURIComponent("/saved")}>OPEN <span aria-hidden="true">↗</span></Link>
      <button type="button" disabled={pending!==null||loadingMore} onClick={()=>void remove(item.id)}>{pending===item.id?"UPDATING…":"REMOVE"}</button>
     </div>
    </div>
   </article>)}</div>:<div className="avsaved-empty">
    <h2>{cursor?"NO PUBLIC WORK ON THIS PAGE.":"YOUR COLLECTION IS OPEN."}</h2>
    <p>{cursor?"Some saved projects have been withdrawn. Continue to older saved work.":"You have no currently visible saved projects. Explore approved creations to build your own collection."}</p>
    <Link to="/discover">DISCOVER APPROVED WORK →</Link>
   </div>}
   {items.length>0&&displayed.length===0&&<section className="avsaved-filter-empty" aria-label="No matching saved projects"><h2>No matches in the projects loaded.</h2><p>Try another search or category. No saved projects were removed.</p><button type="button" onClick={()=>{setCategory("all");setQuery("")}}>Show all saved projects</button></section>}
   {cursor&&<div className="avsaved-more"><button type="button" disabled={loadingMore||pending!==null} onClick={()=>void loadMore()}>{loadingMore?"CHECKING OLDER SAVES…":"SHOW MORE SAVED WORK"}</button></div>}
  </>}
  {notice&&<p className="avsaved-notice" role="status">{notice}</p>}
  {error&&<p className="avsaved-error" role="alert">{error}</p>}
  <p className="avsaved-footnote">Only projects that remain published and approved appear here. Withdrawn projects are excluded. Your saves are private to your verified ANEVUM account, and saving awards no XP.</p>
 </section>;
}

/** Distinct from the historical Creator V1 /library route and its old identity.
 * The canonical member collection is inert until the server advertises a
 * separately approved, migrated and enabled project-save capability.
 */
export function CanonicalSavedWorksPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const capability=useResource(async signal=>projectEngagementGateway(await memberHealth(signal)),[]);
 if(isPending||capability.state==="loading")
  return <section className="avsaved-shell"><p role="status">VERIFYING PRIVATE LIBRARY ACCESS…</p></section>;
 const active=capability.state==="ready"&&capability.data.kind==="canonical-saves";
 const member=session?.user;
 const verified=Boolean(member?.id&&member.emailVerified===true);
 return <section className="avsaved-shell">
  <header className="avsaved-header">
   <span className="kicker">ANEVUM / SAVED WORK</span>
   <h1>YOUR <em>LIBRARY.</em></h1>
   <p>Everything you saved, organized in one private place.</p>
   <div className="avsaved-header-links"><Link to="/discover">FIND PROJECTS <span aria-hidden="true">↗</span></Link>
    {verified&&!MEMBER_COLLECTION_NAV_REVIEW&&<Link to="/member">MY SPACE <span aria-hidden="true">↗</span></Link>}</div>
  </header>
  {!active?<section className="avsaved-inactive" aria-label="Saved works availability">
   <span className="kicker">PRIVATE COLLECTION / IN DEVELOPMENT</span>
   <h2>SAVED WORKS ARE NOT YET ACTIVE.</h2>
   <p>The verified-member collection remains under review. Public projects are available to explore, but saving is not enabled in this environment. No account data has been changed.</p>
   <Link to="/discover">RETURN TO DISCOVERY →</Link>
  </section>:!verified?<section className="avsaved-inactive" aria-label="Member sign-in required">
   <span className="kicker">ACCOUNT / VERIFICATION REQUIRED</span>
   <h2>THIS SPACE BELONGS TO YOU.</h2>
   <p>Sign in with your verified ANEVUM member account to view your private saved works. Your collection is never public.</p>
   <Link to="/join">MEMBER ACCESS →</Link>
  </section>:<SavedWorksCollection key={member!.id} memberId={member!.id}/>}
 </section>;
}
