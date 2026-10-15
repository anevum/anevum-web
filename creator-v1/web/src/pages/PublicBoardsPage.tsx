import {useEffect,useState} from "react";
import {Link,useLocation} from "react-router-dom";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {readPublicBoards,type Category,type Creator,type Project} from "../lib/api";
import {useResource} from "../lib/useResource";
import "./community-network.css";

type BoardId="latest"|"firstLooks"|"publishing";
type CategoryFilter="all"|Category;
const BOARDS:readonly {id:BoardId;name:string;description:string}[]=[
  {id:"latest",name:"NEW RELEASES",description:"The most recent approved work, ordered by publication time."},
  {id:"firstLooks",name:"FIRST LOOKS",description:"A discoverability lane for makers with one approved publication."},
  {id:"publishing",name:"CREATOR ACTIVITY",description:"Published release counts, not a judgment of creative quality."}
];
const FILTERS:readonly {id:CategoryFilter;label:string}[]=[
  {id:"all",label:"EVERYTHING"},{id:"games",label:"GAMES"},{id:"tools",label:"TOOLS"},
  {id:"creative",label:"CREATIVE"},{id:"libraries",label:"OPEN SOURCE"},{id:"learning",label:"LEARNING"},
  {id:"research",label:"RESEARCH"}
];
function readingView(search:string):BoardId {
  const value=new URLSearchParams(search).get("view");
  return value==="firstLooks"||value==="publishing"?value:"latest";
}
function date(value:string|null){
  const time=Date.parse(value||"");
  return Number.isFinite(time)?
    new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"short",day:"numeric",year:"numeric"}).format(new Date(time)).toUpperCase():
    "DATE UNLISTED";
}
function ProjectRow({item}:{item:Project}){
  return <article className="cnb-project" key={item.id}>
    <Link className="cnb-project-art" to={"/projects/"+encodeURIComponent(item.id)} aria-label={"Explore "+item.title}>
      <CosmicArtwork scene={item.category}/>
      <span>CATEGORY ARTWORK</span>
    </Link>
    <div className="cnb-project-body">
      <small>{item.category.toUpperCase()} / {date(item.publishedAt)}</small>
      <h3><Link to={"/projects/"+encodeURIComponent(item.id)}>{item.title}</Link></h3>
      <p>{item.summary}</p>
      <div className="cnb-project-links">
        <Link to={"/creators/"+encodeURIComponent(item.creatorHandle)}>@{item.creatorHandle}</Link>
        <Link to={"/projects/"+encodeURIComponent(item.id)}>PROJECT PASSPORT ↗</Link>
      </div>
    </div>
  </article>;
}
function CreatorRow({item,index}:{item:Creator;index:number}){
  return <article className="cnb-creator" key={item.handle}>
    <span className="cnb-creator-index" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
    <div className="cnb-creator-avatar" aria-hidden="true">{item.displayName.charAt(0).toUpperCase()}</div>
    <div className="cnb-creator-data">
      <h3><Link to={"/creators/"+encodeURIComponent(item.handle)}>{item.displayName}</Link></h3>
      <small>@{item.handle}</small>
    </div>
    <div className="cnb-creator-count">
      <strong>{item.publishedProjects}</strong>
      <span>APPROVED {item.publishedProjects===1?"RELEASE":"RELEASES"}</span>
    </div>
  </article>;
}

/** Read-only boards built entirely from approved public projects.
 * Quality, popularity, collaboration and XP leaderboards require separate verified signals.
 */
export function PublicBoardsPage(){
  const location=useLocation();
  const [active,setActive]=useState<BoardId>(()=>readingView(location.search));
  useEffect(()=>{setActive(readingView(location.search));setCategory("all");},[location.search]);
  const [category,setCategory]=useState<CategoryFilter>("all");
  const [revision,setRevision]=useState(0);
  const resource=useResource(signal=>readPublicBoards(signal),[revision]);
  const board=BOARDS.find(item=>item.id===active)!;
  const contents=resource.state==="ready"?resource.data:null;
  const projects=contents?(active==="firstLooks"?contents.firstLooks:contents.latestReleases):[];
  const visible=category==="all"?projects:projects.filter(p=>p.category===category);
  function choose(next:BoardId){setActive(next);setCategory("all");}
  return <div className="cnb-hub">
    <header className="cnb-hero">
      <div className="cnb-hero-art" aria-hidden="true"><CosmicArtwork scene="portal"/></div>
      <div className="cnb-hero-content">
        <span className="cnb-kicker">ANEVUM / COMMUNITY SIGNAL</span>
        <h1>THE PEOPLE <em>BEHIND THE WORK.</em></h1>
        <p>Real creations. New voices. Publicly verifiable progress. Browse recent releases and discover creators without paying for visibility.</p>
        <div className="cnb-hero-actions">
          <Link to="/discover">EXPLORE PROJECTS ↗</Link>
          <Link to="/community">COMMUNITY SPACES ↗</Link>
        </div>
      </div>
    </header>

    <section className="cnb-board-deck" aria-labelledby="cnb-heading">
      <div className="cnb-deck-intro">
        <div><span className="cnb-kicker">COMMUNITY / BOARDS</span><h2 id="cnb-heading">DISCOVER THE <em>NETWORK.</em></h2></div>
        <button type="button" onClick={()=>setRevision(value=>value+1)} disabled={resource.state==="loading"}>REFRESH ACTUAL DATA ↻</button>
      </div>
      <div className="cnb-tabs" role="group" aria-label="Choose a verified public board">
        {BOARDS.map(item=><button key={item.id} type="button" aria-pressed={active===item.id}
          className={active===item.id?"is-active":""} onClick={()=>choose(item.id)}>
          <strong>{item.name}</strong><small>{item.description}</small>
        </button>)}
      </div>
      <div className="cnb-board-caption">
        <div><span className="cnb-kicker">{active==="publishing"?"PUBLIC RELEASE VOLUME":"VERIFIED PUBLICATIONS"}</span>
          <h3>{board.name}</h3><p>{board.description}</p></div>
        <span className="cnb-count">{contents?
          (active==="publishing"?contents.publishingCreators.length:projects.length)+" SHOWN":"NO VERIFIED COUNT"} / UP TO 12</span>
      </div>

      {active!=="publishing"&&<div className="cnb-filters" role="group" aria-label="Filter displayed publications">
        {FILTERS.map(item=><button key={item.id} type="button" aria-pressed={category===item.id}
          onClick={()=>setCategory(item.id)}>{item.label}</button>)}
      </div>}
      {resource.state==="loading"&&<div className="cnb-empty" role="status">CONNECTING TO APPROVED PUBLIC RECORDS…</div>}
      {resource.state==="error"&&<div className="cnb-empty" role="alert">
        <strong>BOARD DATA UNAVAILABLE.</strong>
        <p>The public catalogue could not be reached. This page will not substitute invented activity.</p>
        <button type="button" onClick={()=>setRevision(value=>value+1)}>RETRY THE CONNECTION ↗</button>
      </div>}
      {contents&&(active==="publishing"?contents.publishingCreators.length>0:visible.length>0)&&
        <div className={active==="publishing"?"cnb-creator-list":"cnb-project-grid"}>
          {active==="publishing"?
            contents.publishingCreators.map((item,index)=><CreatorRow key={item.handle} item={item} index={index}/>):
            visible.map(item=><ProjectRow key={item.id} item={item}/>)}
        </div>}
      {contents&&(active==="publishing"?contents.publishingCreators.length===0:visible.length===0)&&
        <div className="cnb-empty" role="status">
          <strong>NO ELIGIBLE PUBLICATIONS IN THIS VIEW.</strong>
          <p>{category!=="all"?"Try another category. These filters apply to the displayed public releases, not the entire catalogue.":
            "This board activates as genuine creations receive independent approval. No demo profiles, reactions, or rankings are being substituted."}</p>
          <Link to="/discover">VISIT THE FULL CATALOGUE ↗</Link>
        </div>}
      <div className="cnb-board-foot">
        <p>These are factual public lists, not quality or popularity leaderboards. The release sample is limited to twelve records per board. Creator activity means approved release count; it does not measure reputation, downloads or genuine plays.</p>
        <Link to="/creators">ALL CREATOR CHANNELS ↗</Link>
      </div>
    </section>

    <section className="cnb-coming" aria-labelledby="cnb-next-title">
      <span className="cnb-kicker">FUTURE VERIFIED RECOGNITION</span>
      <h2 id="cnb-next-title">QUALITY MUST BE <em>EARNED.</em></h2>
      <div className="cnb-coming-grid">
        <article><span>01 / REVIEW</span><h3>APPRECIATED WORK</h3><p>Real independent ratings, confidence thresholds and abuse review must exist before publishing quality rankings.</p></article>
        <article><span>02 / CONTRIBUTE</span><h3>VALUABLE HELPERS</h3><p>Useful accepted reviews, reproduced issues, credited improvements and moderation reversals will power future recognition.</p></article>
        <article><span>03 / COMMUNITY</span><h3>CREATIVE EVENTS</h3><p>Jams and challenges will publish rules and results before showing ranked outcomes. Participation remains meaningfully free.</p></article>
      </div>
      <Link to="/levels">HOW VERIFIED PROGRESSION WORKS ↗</Link>
    </section>
  </div>;
}
