import {useState} from "react";
import {Link,useSearchParams} from "react-router-dom";
import {readPublicBoards,type Category} from "../lib/api";
import {useResource} from "../lib/useResource";
import {ProjectCard} from "../components/ProjectCard";
import {CompactMemberIdentity} from "../components/CompactMemberIdentity";
import "./public-boards.css";

const BOARDS=[
  {id:"latest",name:"New releases",description:"The latest independently approved work."},
  {id:"firstLooks",name:"First looks",description:"Makers with one approved publication."},
  {id:"publishing",name:"Creator activity",description:"Approved release counts, without popularity rankings."}
] as const;
const FILTERS:readonly {id:"all"|Category;label:string}[]=[
  {id:"all",label:"All work"},{id:"games",label:"Games"},{id:"tools",label:"Apps & tools"},
  {id:"creative",label:"Creative"},{id:"libraries",label:"Open source"},{id:"learning",label:"Learning"},
  {id:"research",label:"Research"},{id:"automation",label:"Automation"},{id:"other",label:"Other"}
];

/** Bounded, read-only public lists. No inferred identities, awards or quality scores. */
export function PublicBoardsPage(){
  const [params,setParams]=useSearchParams();
  const board=BOARDS.find(item=>item.id===params.get("view"))||BOARDS[0];
  const category=FILTERS.find(item=>item.id===params.get("category"))?.id||"all";
  const [revision,setRevision]=useState(0);
  const resource=useResource(signal=>readPublicBoards(signal),[revision]);
  const contents=resource.state==="ready"?resource.data:null;
  const projects=contents?(board.id==="firstLooks"?contents.firstLooks:contents.latestReleases):[];
  const visible=category==="all"?projects:projects.filter(p=>p.category===category);
  const count=contents?(board.id==="publishing"?contents.publishingCreators.length:visible.length):null;
  const returnTo="/boards"+(params.size?"?"+params.toString():"");
  function choose(view:string,filter="all"){
    const next=new URLSearchParams();
    if(view!=="latest")next.set("view",view);
    if(filter!=="all")next.set("category",filter);
    setParams(next,{preventScrollReset:true});
  }
  return <div className="av79-boards">
    <header className="av79-boards-heading">
      <span className="av79-overline">ANEVUM / PUBLIC BOARDS</span>
      <h1>Follow the <em>work.</em></h1>
      <p>New releases, first publications and the people making them.</p>
      <nav aria-label="Explore the network"><Link to="/discover">All projects ↗</Link><Link to="/creators">Creator channels ↗</Link></nav>
    </header>
    <section className="av79-board-panel" aria-labelledby="av79-board-title" aria-busy={resource.state==="loading"}>
      <div className="av79-board-tabs" role="group" aria-label="Choose a public board">
        {BOARDS.map(item=><button key={item.id} type="button" aria-pressed={board.id===item.id}
          onClick={()=>choose(item.id)}>{item.name}</button>)}
      </div>
      <div className="av79-board-caption"><div><h2 id="av79-board-title">{board.name}</h2><p>{board.description}</p></div>
        <button type="button" className="av79-board-refresh" onClick={()=>setRevision(value=>value+1)} disabled={resource.state==="loading"}>
          {resource.state==="loading"?"Refreshing…":"Refresh ↻"}</button>
      </div>
      {board.id!=="publishing"&&<div className="av79-board-filters" role="group" aria-label="Filter displayed publications">
        {FILTERS.map(item=><button key={item.id} type="button" aria-pressed={category===item.id}
          onClick={()=>choose(board.id,item.id)}>{item.label}</button>)}
      </div>}
      {resource.state==="loading"&&<div className="av79-board-state" role="status">Loading approved publications…</div>}
      {resource.state==="error"&&<div className="av79-board-state" role="alert"><h3>These boards could not load.</h3>
        <p>The public directory is temporarily unavailable. Your filters are still here.</p>
        <button type="button" onClick={()=>setRevision(value=>value+1)}>Try again</button></div>}
      {contents&&<>
        <p className="av79-board-count" role="status">{count} {count===1?"record":"records"} shown · up to 12 per board</p>
        {count!>0?<div className="av79-board-results">
          {board.id==="publishing"?contents.publishingCreators.map(item=><article className="av79-board-creator" key={item.handle}>
            <CompactMemberIdentity size="compact" href={"/creators/"+encodeURIComponent(item.handle)}
              member={{handle:item.handle,displayName:item.displayName,source:"creator-channel",avatar:false,level:null,featuredAwards:[]}}/>
            <span>{item.publishedProjects} approved {item.publishedProjects===1?"release":"releases"}</span>
          </article>):visible.map(item=><ProjectCard key={item.id} project={item} presentation="editorial" returnTo={returnTo}/>)}
        </div>:<div className="av79-board-state" role="status"><h3>{category!=="all"?"No releases of this type in this view.":"No publications in this board yet."}</h3>
          <p>{category!=="all"?"Choose all work or search the full catalogue.":"Only independently approved public work appears here."}</p>
          <div>{category!=="all"&&<button type="button" onClick={()=>choose(board.id)}>Show all work</button>}<Link to="/discover">Explore the catalogue ↗</Link></div>
        </div>}
      </>}
      <footer className="av79-board-foot"><p>Public release counts describe publication activity. They do not measure plays, quality or reputation.</p><Link to="/levels">Earned progression ↗</Link></footer>
    </section>
  </div>;
}
