import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { readCategories,readProjects, type Category } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ProjectCard } from "../components/ProjectCard";
import { PageNav } from "../components/PageNav";
import { PortalHeading } from "../components/PortalHeading";
import { LevelPanel } from "../components/LevelPanel";
import { CategoryArtifact } from "../components/CategoryArtifact";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

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

export function DiscoverPage(){
  const [params,setParams]=useSearchParams();
  const q=params.get("q")||"",category=params.get("category")||"",cursor=params.get("cursor")||"";
  const [draft,setDraft]=useState(q);
  const [view,setView]=useState<"covers"|"compact">("covers");
  useEffect(()=>setDraft(q),[q]);
  const resource=useResource(async signal=>{
    const [projects,categories]=await Promise.all([
      readProjects({q:q||undefined,category:category||undefined,cursor:cursor||undefined,limit:"24"},signal),
      readCategories(signal)
    ]);
    return {projects,categories};
  },[q,category,cursor]);
  const current="/discover"+(params.size?"?"+params.toString():"");
  const active=useMemo(()=>channels.find(x=>x.id===category),[category]);

  function search(e:FormEvent){
    e.preventDefault();
    const next=new URLSearchParams(params),value=draft.trim();
    if(value)next.set("q",value);else next.delete("q");
    next.delete("cursor");
    setParams(next);
  }
  function selectCategory(id:string){
    const next=new URLSearchParams(params);
    if(id)next.set("category",id);else next.delete("category");
    next.delete("cursor");
    setParams(next);
  }
  const categories=resource.state==="ready"?resource.data.categories.categories:[];
  const countByCategory=new Map(categories.map(x=>[x.category,x.count]));
  return <div className="portal-discover">
    <PortalHeading eyebrow="THE PORTALS / EVERYTHING WORTH TRYING" title="EXPLORE THE" accent="UNDERGROUND." description="Games, apps, interactive experiments and independent work. Search actual published projects, not paid placement or invented activity." index="DISCOVER / 001"/>
    <div className="portal-browse-layout">
      <div className="portal-browse-main">
        <section className="portal-box portal-search-hall" aria-label="Search and browse published projects">
          <div className="portal-box-header">
            <div><span className="kicker">THE CATALOGUE / PUBLISHED WORK</span><h2>FIND YOUR NEXT FAVORITE</h2></div>
            <span className="portal-hall-stamp">GAMES / APPS / MORE</span>
          </div>
          <form className="portal-wide-search" role="search" onSubmit={search}>
            <label htmlFor="portal-project-query" className="visually-hidden">Search published projects</label>
            <input id="portal-project-query" type="search" maxLength={100} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="SEARCH THE ENTIRE PORTAL..." />
            <button type="submit">SEARCH ↗</button>
          </form>
          <nav className="portal-channel-filters" aria-label="Filter by project type">
            <button type="button" onClick={()=>selectCategory("")} className={!category?"active":""} aria-pressed={!category}>ALL PROJECTS</button>
            {channels.map(x=><button key={x.id} type="button" aria-pressed={category===x.id} className={category===x.id?"active":""} onClick={()=>selectCategory(x.id)}>
              <span aria-hidden="true">{x.mark}</span> {x.label}
            </button>)}
          </nav>
        </section>
        {resource.state==="loading"&&<LoadingState label="Reading the live project catalogue"/>}
        {resource.state==="error"&&<ErrorState title="THE PORTAL COULD NOT LOAD" detail="Published project data is currently unavailable. No sample projects were substituted."/>}
        {resource.state==="ready"&&<>
          <div className="portal-result-toolbar">
            <div><span className="kicker">{q?"SEARCH / "+q.toUpperCase():active?"CATEGORY / "+active.label.toUpperCase():"ALL RELEASES"}</span>
              <strong>{resource.data.projects.items.length} VERIFIED PUBLISHED {resource.data.projects.items.length===1?"RELEASE":"RELEASES"} ON THIS PAGE</strong>
            </div>
            <div className="portal-result-actions" role="group" aria-label="Choose project layout">
              <button type="button" className={view==="covers"?"active":""} aria-pressed={view==="covers"} onClick={()=>setView("covers")}>▦ COVERS</button>
              <button type="button" className={view==="compact"?"active":""} aria-pressed={view==="compact"} onClick={()=>setView("compact")}>☷ LIST</button>
              {(q||category||cursor)&&<Link to="/discover">RESET</Link>}
            </div>
          </div>
          {resource.data.projects.items.length?
            <section aria-label="Published project results" className={view==="covers"?"portal-discover-results":"portal-discover-results portal-discover-compact"}>
              {resource.data.projects.items.map(p=><ProjectCard key={p.id} project={p} returnTo={current}/>)}
            </section>:
            <div className="portal-true-empty">
              <div className="portal-empty-symbol" aria-hidden="true">✳</div>
              <div><span className="kicker">NOTHING HIDDEN / NOTHING FABRICATED</span>
                <h2>{cursor?"END OF CURRENT RELEASES":q||category?"NO MATCHING PROJECTS YET":"THE FIRST RELEASES ARE ON THEIR WAY."}</h2>
                <p>ANEVUM only shows approved work. Try another portal or follow the development of the first real submissions.</p>
                <div className="portal-empty-actions"><Link to="/discover" className="button secondary">EXPLORE ALL</Link><Link to="/status" className="button secondary">RELEASE STATUS</Link></div>
              </div>
            </div>}
          <PageNav route="/discover" search={params} nextCursor={resource.data.projects.nextCursor} label="Project catalogue"/>
        </>}
      </div>
      <aside className="portal-sidebar portal-discover-side" aria-label="Discovery guide">
        <section className="portal-sidebox">
          <header><span className="kicker">FIND YOUR CORNER</span><h2>PORTAL DIRECTORY</h2></header>
          <nav className="portal-directory" aria-label="Project categories">
            {channels.map(x=><button type="button" key={x.id} onClick={()=>selectCategory(x.id)} className={x.id===category?"active":""} aria-pressed={x.id===category}>
              <span className="portal-directory-mark"><CategoryArtifact category={x.id}/></span>
              <span className="portal-directory-name"><strong>{x.label}</strong><small>{x.description}</small></span>
              <span className="portal-directory-count">{countByCategory.get(x.id)||0}</span>
            </button>)}
          </nav>
        </section>
        <LevelPanel compact/>
        <section className="portal-sidebox">
          <span className="kicker">THE RULE OF THE PORTAL</span><h2>TRY IT FIRST.</h2>
          <p>Play or try projects on the creator's own hosting. Open source code separately. A submission is not a safety endorsement, and every published project goes through review.</p>
          <Link className="portal-sidebox-link" to="/create">SUBMIT ORIGINAL WORK →</Link>
        </section>
      </aside>
    </div>
  </div>;
}
