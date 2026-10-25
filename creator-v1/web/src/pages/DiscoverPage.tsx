import { FormEvent, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { readCategories,readProjects, type Category } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ProjectCard } from "../components/ProjectCard";
import {WorkCard,packageGalleryUIEnabled} from "../components/CreatorPackageGallery";
import {readPackageCatalogue,packageDiscoveryResults} from "../lib/creator-package-gallery-v010";
import { PageNav } from "../components/PageNav";
import { PortalHeading } from "../components/PortalHeading";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

// The protected catalogue logic stays canonical; PARITY loads only when enabled.
const FullParityDiscover=import.meta.env.VITE_PARITY_V136_FULL==="true"
  ?lazy(()=>import("../parity/ParityDiscoverV136").then(mod=>({default:mod.ParityDiscoverV136})))
  :null;

const channels: ReadonlyArray<{id:Category;label:string;description:string;mark:string}> = [
  {id:"games",label:"Games",description:"Independent play and interactive experiments",mark:"✦"},
  {id:"tools",label:"Apps & Tools",description:"Useful software from independent makers",mark:"⌘"},
  {id:"creative",label:"Creative / AI",description:"Artwork, experiences, AI-assisted creations",mark:"✳"},
  {id:"libraries",label:"Open Source",description:"Libraries, code and shared tools",mark:"⟡"},
  {id:"automation",label:"Automation",description:"Workflows that save time",mark:"↗"},
  {id:"research",label:"Research",description:"Experiments, evidence and ideas",mark:"⊕"},
  {id:"learning",label:"Learning",description:"Educational experiences and guides",mark:"◇"},
  {id:"other",label:"More",description:"Everything else worth discovering",mark:"+"}
];

const immersiveWorlds:Partial<Record<Category,{
  eyebrow:string;title:string;accent:string;description:string;index:string;
  scene:"games"|"tools"|"creative";searchTitle:string;stamp:string;
}>>={
  games:{
    eyebrow:"ANEVUM / THE PLAY WORLD",title:"ENTER THE",accent:"ARCADE.",
    description:"Find independently created games and interactive experiments. Try approved creator-hosted experiences; native ANEVUM game hosting is still in development.",
    index:"PLAY / 001",scene:"games",searchTitle:"FIND SOMETHING TO PLAY",stamp:"GAMES / TRY / PLAY"
  },
  tools:{
    eyebrow:"ANEVUM / THE MAKER'S TOOLBOX",title:"SOFTWARE",accent:"WITH SOUL.",
    description:"Discover useful software built by independent people. Follow authentic demos and sources, without fabricated usage or sponsorship rankings.",
    index:"TOOLS / 002",scene:"tools",searchTitle:"FIND YOUR NEXT TOOL",stamp:"APPS / SOFTWARE"
  },
  creative:{
    eyebrow:"ANEVUM / UNUSUAL CREATIONS",title:"FIND THE",accent:"UNEXPECTED.",
    description:"Explore independently made art, interactive experiences and AI-assisted experiments. Every public project comes from the real approved catalogue.",
    index:"CREATE / 003",scene:"creative",searchTitle:"EXPLORE NEW IDEAS",stamp:"ART / EXPERIMENTS"
  }
};

export function DiscoverPage({immersive=false}:{immersive?:boolean}={}){
  const [params,setParams]=useSearchParams();
  const navigate=useNavigate();
  const q=params.get("q")||"",category=params.get("category")||"",cursor=params.get("cursor")||"",freeOnly=params.get("free")==="1";
  const [draft,setDraft]=useState(q);
  // Layout is part of the public URL, like category, search and cursor. This
  // restores Grid/List on share, reload and Back/Forward without a duplicate
  // private state or an unnecessary catalogue fetch.
  const view=params.get("view")==="list"?"compact":"covers";
  const clearHref=view==="compact"?"/discover?view=list":"/discover";
  useEffect(()=>setDraft(q),[q]);
  const resource=useResource(async signal=>{
    const [projects,categories]=await Promise.all([
      readProjects({q:q||undefined,category:category||undefined,cursor:cursor||undefined,free:freeOnly?"1":undefined,limit:"24"},signal),
      readCategories(signal)
    ]);
    return {projects,categories};
  },[q,category,cursor,freeOnly]);
  const packagesInScope=packageGalleryUIEnabled&&!cursor&&!freeOnly;
  const packageResource=useResource(signal=>readPackageCatalogue(packagesInScope,signal),[packagesInScope]);
  const current="/discover"+(params.size?"?"+params.toString():"");
  const active=useMemo(()=>channels.find(x=>x.id===category),[category]);
  const world=immersive?immersiveWorlds[category as Category]:undefined;

  function commitSearch(raw:string){
    // Read current URL at the moment of activation, not a suspended render's
    // captured params. React ViewTransition may defer a component update.
    const value=raw.trim(),next=new URLSearchParams(window.location.search);
    if(value)next.set("q",value);else next.delete("q");
    next.delete("cursor");
    const query=next.toString();
    navigate({pathname:"/discover",search:query?"?"+query:""});
  }
  function search(e:FormEvent){
    e.preventDefault();
    const field=(e.currentTarget as HTMLFormElement).elements.namedItem("q") as HTMLInputElement|null;
    commitSearch(field?.value??draft);
  }
  function selectCategory(id:string){
    setParams(current=>{
      const next=new URLSearchParams(current);
      if(id)next.set("category",id);else next.delete("category");
      next.delete("cursor");
      return next;
    });
  }
  function toggleFreeOnly(){
    setParams(current=>{
      const next=new URLSearchParams(current);
      if(next.get("free")==="1")next.delete("free");else next.set("free","1");
      next.delete("cursor");
      return next;
    });
  }
  function chooseView(next:"covers"|"compact"){
    setParams(current=>{
      const nextParams=new URLSearchParams(current);
      if(next==="compact")nextParams.set("view","list");
      else nextParams.delete("view");
      // Layout changes must not reset the real server query or its cursor.
      return nextParams;
    });
  }
  const categories=resource.state==="ready"?resource.data.categories.categories:[];
  const countByCategory=new Map(categories.map(x=>[x.category,x.count]));
  const legacyProjects=resource.state==="ready"?resource.data.projects.items:[];
  const packages=packageResource.state==="ready"?packageResource.data||[]:[];
  // Uploaded releases are a bounded first-page feed; never repeat the same
  // packages on every older catalogue cursor page or change its cursor format.
  const packageProjects=packagesInScope?packageDiscoveryResults(packages,{query:q,category,freeOnly},legacyProjects):[];
  const shown=legacyProjects.length+packageProjects.length;
  const resultsReady=resource.state==="ready"||(packagesInScope&&packageResource.state==="ready");
  const emptyVerified=resource.state==="ready"&&(!packagesInScope||packageResource.state==="ready")&&shown===0;
  if(FullParityDiscover)return <Suspense fallback={<LoadingState label="Opening the public discovery index"/>}>
    <FullParityDiscover
      channels={channels} category={category} activeLabel={active?.label||null}
      query={q} cursor={cursor} freeOnly={freeOnly}
      draft={draft} onDraft={setDraft} onSearch={search} onSearchValue={commitSearch}
      onCategory={selectCategory} onToggleFree={toggleFreeOnly}
      view={view} onView={chooseView}
      resourceState={resource.state} packageState={packageResource.state}
      packagesInScope={packagesInScope} packagesCount={packages.length}
      packageProjects={packageProjects} legacyProjects={legacyProjects}
      shown={shown} resultsReady={resultsReady} emptyVerified={emptyVerified}
      current={current} params={params}
      nextCursor={resource.state==="ready"?resource.data.projects.nextCursor:null}
    />
  </Suspense>;
  return <div data-iren-anchor="discover" className="portal-discover av73-discover" data-discovery-phase="v136.026">
    {immersive?<PortalHeading
      eyebrow={world?.eyebrow||"THE PORTALS / EVERYTHING WORTH TRYING"}
      title={world?.title||"EXPLORE THE"} accent={world?.accent||"UNIVERSE."}
      description={world?.description||"Games, apps, interactive experiments and independent work. Search actual published projects, not paid placement or invented activity."}
      index={world?.index||"DISCOVER / 001"} scene={world?.scene||"portal"}/>:
      <header className="av73-discover-intro">
        <span className="av73-discover-eyebrow">ANEVUM / DISCOVER</span>
        <h1>{active?"Explore "+active.label:"Find something worth opening."}</h1>
        <p>Search genuine, approved games, apps, art and shared tools. See what's actually published before deciding what to explore.</p>
      </header>}
    <div className="portal-browse-layout">
      <div className="portal-browse-main">
        <section className="portal-box portal-search-hall" aria-label="Search and browse published projects">
          <div className="portal-box-header">
            <div><span className="kicker">PUBLIC CATALOGUE</span><h2>{world?.searchTitle||"Browse published work"}</h2></div>
            <span className="portal-hall-stamp">{world?.stamp||"Approved releases only"}</span>
          </div>
          <form className="portal-wide-search" role="search" onSubmit={search}>
            <label htmlFor="portal-project-query" className="visually-hidden">Search published projects</label>
            <input id="portal-project-query" name="q" type="search" maxLength={100} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Search projects" />
            {view==="compact"&&<input type="hidden" name="view" value="list"/>}
            <button type="submit">Search <span aria-hidden="true">↗</span></button>
          </form>
          <div className="av73-discover-filter-heading"><strong>Filter by type</strong><span>Scroll to see all categories →</span></div>
          <nav className="portal-channel-filters" aria-label="Filter by project type">
            <button type="button" onClick={()=>selectCategory("")} className={!category?"active":""} aria-pressed={!category}>All work</button>
            {channels.map(x=><button key={x.id} type="button" aria-pressed={category===x.id} className={category===x.id?"active":""} onClick={()=>selectCategory(x.id)}>
              <span aria-hidden="true">{x.mark}</span><span>{x.label}</span>{resource.state==="ready"&&!packageGalleryUIEnabled&&<span className="av73-filter-count">{countByCategory.get(x.id)||0}</span>}
            </button>)}
          </nav>
          <div className="portal-availability-filter" role="group" aria-label="Filter by access cost">
            <span className="kicker">ACCESS</span>
            <button type="button" onClick={toggleFreeOnly} aria-pressed={freeOnly} aria-describedby="av73-free-note" className={freeOnly?"active":""}>Only marked free {freeOnly?"✓":"+"}</button>
            <small id="av73-free-note">Based on each creator's published free-to-use declaration, not independently verified cost information.</small>
          </div>
        </section>
        {resource.state==="loading"&&<LoadingState label="Reading the live project catalogue"/>}
        {resource.state==="error"&&<ErrorState title={packageProjects.length?"PART OF THE CATALOGUE COULD NOT LOAD":"THE PORTAL COULD NOT LOAD"} detail="Published project data is currently unavailable. No sample projects were substituted."/>}
        {packagesInScope&&packageResource.state==="loading"&&<p className="av010-discovery-status" role="status">Checking approved browser uploads…</p>}
        {packagesInScope&&packageResource.state==="error"&&<p className="av010-discovery-status" role="status">Uploaded browser releases are temporarily unavailable.</p>}
        {resultsReady&&<>
          <div className="portal-result-toolbar">
            <div><span className="kicker">{q?"SEARCH / "+q.toUpperCase():active?"CATEGORY / "+active.label.toUpperCase():"ALL RELEASES"}{freeOnly?" / MARKED FREE":""}</span>
              <strong role="status">{shown} APPROVED PUBLISHED {shown===1?"RELEASE":"RELEASES"} ON THIS PAGE</strong>
            </div>
            <div className="portal-result-actions" role="group" aria-label="Choose project layout">
              <button type="button" className={view==="covers"?"active":""} aria-pressed={view==="covers"} onClick={()=>chooseView("covers")}>▦ GRID</button>
              <button type="button" className={view==="compact"?"active":""} aria-pressed={view==="compact"} onClick={()=>chooseView("compact")}>☷ LIST</button>
              {(q||category||cursor||freeOnly)&&<Link to={clearHref}>RESET</Link>}
            </div>
          </div>
          {shown>0&&
            <section aria-label="Published project results" data-layout={view==="compact"?"list":"grid"} className={view==="covers"?"portal-discover-results":"portal-discover-results portal-discover-compact"}>
              {packageProjects.map(p=><WorkCard key={'package:'+p.id} work={p} mode="public" compact={view==="compact"}/>)}
              {legacyProjects.map(p=><ProjectCard key={'catalogue:'+p.id} project={p} returnTo={current} presentation="editorial"/>)}
            </section>}
          {emptyVerified&&
            <div className="portal-true-empty">
              <div><span className="kicker">NOTHING HIDDEN / NOTHING FABRICATED</span>
                <h2>{cursor?"END OF CURRENT RELEASES":q||category||freeOnly?"NO MATCHING PROJECTS YET":"NO APPROVED PROJECTS YET"}</h2>
                <p>Only approved work appears here. Clear your filters, try another category or read how releases are reviewed.</p>
                <div className="portal-empty-actions"><Link to={clearHref} className="button secondary">EXPLORE ALL</Link><Link to="/guide" className="button secondary">FREE FIELD GUIDE</Link><Link to="/status" className="button secondary">RELEASE STATUS</Link></div>
              </div>
            </div>}
          {packagesInScope&&packages.length===100&&<p className="av010-discovery-status">Browser upload search covers the latest 100 approved releases.</p>}
          {resource.state==="ready"&&<PageNav route="/discover" search={params} nextCursor={resource.data.projects.nextCursor} label="Project catalogue"/>}
        </>}
      </div>

    </div>
  </div>;
}
