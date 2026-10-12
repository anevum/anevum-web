import { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { readCreator, readCreators, readProjects } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ProjectCard } from "../components/ProjectCard";
import { PageNav } from "../components/PageNav";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { OrbitalMark } from "../components/OrbitalMark";

export function CreatorsPage(){
  const [params,setParams]=useSearchParams();
  const q=params.get("q")||"",cursor=params.get("cursor")||"";
  const [draft,setDraft]=useState(q);
  useEffect(()=>setDraft(q),[q]);
  const data=useResource(signal=>readCreators({q:q||undefined,cursor:cursor||undefined,limit:"24"},signal),[q,cursor]);
  function search(event:FormEvent) {
    event.preventDefault();
    const next=new URLSearchParams(),value=draft.trim();
    if(value)next.set("q",value);
    setParams(next);
  }
  return <>
    <section className="page-masthead">
      <div><span className="kicker">PEOPLE / PUBLIC CREATORS</span><h1>MEET THE<br/><em>MAKERS.</em></h1></div>
      <p>Creator profiles only appear after approved public work exists. No placeholder accounts or fabricated follower counts.</p>
    </section>
    <form className="creator-search" role="search" onSubmit={search}>
      <input type="search" aria-label="Search published creators" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={80} placeholder="SEARCH CREATOR NAMES" />
      <button type="submit">SEARCH</button>
    </form>
    {data.state==="loading"&&<LoadingState label="Finding published creators"/>}
    {data.state==="error"&&<ErrorState/>}
    {data.state==="ready"&&<>
      <div className="creator-results-actions">
        <span>{data.data.items.length} CREATOR{data.data.items.length===1?"":"S"} ON THIS PAGE</span>
        {(q||cursor)&&<Link to="/creators">CLEAR SEARCH / FIRST PAGE</Link>}
      </div>
      {data.data.items.length ?
        <section className="creator-grid">{data.data.items.map((c,i)=>
          <Link to={ "/creators/"+encodeURIComponent(c.handle)} className={"creator-poster creator-poster-"+(i%3)} key={c.handle}>
            <span className="creator-number">{String(i+1).padStart(2,"0")}</span>
            <OrbitalMark className="creator-mark"/>
            <strong>{c.displayName}</strong><small>@{c.handle} / {c.publishedProjects} PUBLISHED</small>
          </Link>)}</section> :
        <EmptyState title={q?"NO MATCHING PUBLISHED CREATORS":"NO CREATORS AVAILABLE ON THIS PAGE"} detail="Only creators with approved published work are listed."/>}
      <PageNav route="/creators" search={params} nextCursor={data.data.nextCursor} label="Creator directory"/>
    </>}
  </>;
}

export function CreatorPage(){
  const {handle=""}=useParams();
  const [params]=useSearchParams();
  const cursor=params.get("cursor")||"";
  const data=useResource(async signal=>{
    const [profile,projects]=await Promise.all([
      readCreator(handle,signal),
      readProjects({creator:handle,cursor:cursor||undefined,limit:"24"},signal)
    ]);
    return {profile:profile.creator,projects};
  },[handle,cursor]);
  if(data.state==="loading")return <LoadingState label="Opening creator channel"/>;
  if(data.state==="error")return <ErrorState title="CREATOR NOT AVAILABLE" detail="This creator does not have a public profile or the catalogue could not be reached."/>;
  const {profile,projects}=data.data;
  const path="/creators/"+encodeURIComponent(handle);
  const current=path+(params.size?"?"+params.toString():"");
  return <>
    <section className="creator-hero">
      <div className="creator-avatar-large"><OrbitalMark/></div>
      <div><span className="kicker">CREATOR CHANNEL / PUBLISHED WORK</span><h1>{profile.displayName}</h1><p>@{profile.handle}</p>
      <strong>{profile.publishedProjects} PUBLISHED {profile.publishedProjects===1?"PROJECT":"PROJECTS"}</strong></div>
    </section>
    <div className="section-heading creator-release-intro"><div><span className="kicker">RELEASES</span><h2>PUBLISHED WORK</h2></div></div>
    {projects.items.length ?
      <section className="project-grid">{projects.items.map(p=><ProjectCard key={p.id} project={p} returnTo={current}/>)}</section> :
      <EmptyState title={cursor?"NO MORE RELEASES":"NO AVAILABLE RELEASES"} detail="Only currently approved and published projects appear on this channel."/>}
    <PageNav route={path} search={params} nextCursor={projects.nextCursor} label="Creator project releases"/>
  </>;
}
