import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { readCategories, readProjects } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ProjectCard } from "../components/ProjectCard";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

const labels: Record<string,string>={games:"Games",tools:"Apps + Tools",automation:"Automation",research:"Research",creative:"Creative",learning:"Learning",libraries:"Open Source",other:"Other"};

export function DiscoverPage() {
  const [params,setParams]=useSearchParams();
  const q=params.get("q")||"",category=params.get("category")||"";
  const [draft,setDraft]=useState(q);
  useEffect(()=>setDraft(q),[q]);
  const key=q+"|"+category;
  const data=useResource(async signal=>Promise.all([readProjects({q:q||undefined,category:category||undefined,limit:"24"},signal),readCategories(signal)]).then(([projects,categories])=>({projects,categories})),[key]);
  const activeLabel=useMemo(()=>category?labels[category]||category:"Everything",[category]);

  function search(event:FormEvent){event.preventDefault();const next=new URLSearchParams(params);const value=draft.trim();if(value)next.set("q",value);else next.delete("q");setParams(next);}
  function selectCategory(value:string){const next=new URLSearchParams(params);if(value)next.set("category",value);else next.delete("category");setParams(next);}

  return <>
    <section className="page-masthead"><div><span className="kicker">DISCOVER / PUBLIC CATALOGUE</span><h1>FIND SOMETHING<br/><em>WORTH TRYING.</em></h1></div><p>Search real published work. Source code, demos, pricing and compatibility are kept distinct so you know what you are opening.</p></section>
    <section className="discover-toolbar">
      <form onSubmit={search}><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={100} placeholder="SEARCH PROJECTS" aria-label="Search projects"/><button type="submit">SEARCH</button></form>
      <div className="filter-summary"><span>VIEW</span><strong>{activeLabel.toUpperCase()}</strong></div>
    </section>
    {data.state==="loading"&&<LoadingState label="Scanning published work"/>}
    {data.state==="error"&&<ErrorState/>}
    {data.state==="ready"&&<>
      <nav className="category-tabs" aria-label="Project categories"><button className={!category?"active":""} onClick={()=>selectCategory("")}>ALL</button>{data.data.categories.categories.map(item=><button className={category===item.category?"active":""} key={item.category} onClick={()=>selectCategory(item.category)}>{labels[item.category]||item.category} <span>{item.count}</span></button>)}</nav>
      <div className="results-heading"><span>{data.data.projects.count} SHOWN</span>{(q||category)&&<Link to="/discover">CLEAR FILTERS</Link>}</div>
      {data.data.projects.items.length?<section className="project-grid project-grid-wide">{data.data.projects.items.map(project=><ProjectCard key={project.id} project={project}/>)}</section>:<EmptyState title="NO PUBLISHED PROJECTS MATCH" detail="Try another search or clear the active filters."/>}
    </>}
  </>;
}
