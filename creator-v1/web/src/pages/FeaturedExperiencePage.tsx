import {Link,useLocation,useNavigate,useParams} from "react-router-dom";
import {readProject,safeExternal} from "../lib/api";
import {useResource} from "../lib/useResource";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {ErrorState,LoadingState} from "../components/States";
import {OrbitAlignDemo} from "./OrbitAlignDemo";
import "./featured-play-experience.css";

function linkFor(id:string){return "/atlas/projects/"+encodeURIComponent(id);}
function dateLabel(value:string|null){
  if(!value)return "DATE NOT LISTED";
  const date=new Date(value);
  return Number.isFinite(date.getTime())?
    new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(date):
    "DATE NOT LISTED";
}

/** A real approved-project focus state. External demos remain external; this route
 * never embeds arbitrary creator scripts inside ANEVUM's member origin.
 */
export function FeaturedExperiencePage(){
  const {id=""}=useParams();
  const project=useResource(signal=>readProject(id,signal),[id]);
  const navigate=useNavigate();
  if(project.state==="loading")return <div className="fx-focus-await"><LoadingState label="Entering the approved creative experience"/></div>;
  if(project.state==="error")return <div className="fx-focus-await"><ErrorState title="EXPERIENCE NOT AVAILABLE" detail="The project may be unpublished, unavailable or withdrawn. You can return to the public catalogue."/>&nbsp;<Link to="/atlas/discover">BACK TO DISCOVERY ↗</Link></div>;
  const p=project.data.item;
  const demo=safeExternal(p.demoUrl);
  const source=safeExternal(p.sourceUrl);
  const kind=p.category==="games"?"PLAY":p.category==="tools"?"TRY":"EXPLORE";
  return <div className="fx-focus" key={p.id}>
    <section className="fx-focus-cover" aria-label={"Enter "+p.title}>
      <div className="fx-focus-art" aria-hidden="true"><CosmicArtwork scene={p.category} priority/></div>
      <div className="fx-focus-shading" aria-hidden="true"/>
      <div className="fx-focus-top">
        <Link to="/atlas" className="fx-focus-return"><span aria-hidden="true">←</span> BACK TO NETWORK</Link>
        <span>APPROVED CREATOR PROJECT / {p.category.toUpperCase()}</span>
      </div>
      <div className="fx-focus-intro">
        <span className="fx-focus-label">ANEVUM / EXPERIENCE {p.category.toUpperCase()}</span>
        <h1>{p.title}<em>.</em></h1>
        <p>{p.summary}</p>
        <div className="fx-focus-cta">
          {demo?<a className="fx-focus-primary" href={demo.href} target="_blank" rel="noopener noreferrer"
            aria-label={kind+" on "+demo.hostname+" (opens the creator's site in a new tab)"}>
            {kind} ON CREATOR SITE <span aria-hidden="true">↗</span></a>:
            <Link className="fx-focus-primary" to={linkFor(p.id)}>OPEN PROJECT PASSPORT <span aria-hidden="true">↗</span></Link>}
          <Link to={linkFor(p.id)} className="fx-focus-secondary">PROJECT DETAILS <span aria-hidden="true">→</span></Link>
        </div>
        <div className="fx-focus-assurance" role="note">
          {demo?<>This creator experience is hosted independently by <strong>{demo.hostname}</strong>. ANEVUM does not run or embed its code.</>:
            <>There is no approved playable build linked to this release. Its actual project information remains available.</>}
        </div>
      </div>
      <div className="fx-focus-meta">
        <Link to={"/atlas/creators/"+encodeURIComponent(p.creatorHandle)}>CREATOR / @{p.creatorHandle} <span aria-hidden="true">↗</span></Link>
        <span>{p.freeToUse?"FREE TO USE":"CHECK CREATOR PRICING"}</span>
        <span>{dateLabel(p.publishedAt).toUpperCase()}</span>
      </div>
    </section>
    <section className="fx-focus-about" aria-label="About this featured release">
      <div><span className="fx-eyebrow">CREATIVE TRANSMISSION / 001</span><h2>BEHIND THE<br/><em>EXPERIENCE.</em></h2></div>
      <div><p>{p.description||p.summary}</p>
        <dl><div><dt>MADE BY</dt><dd>{p.creatorName} / @{p.creatorHandle}</dd></div>
          <div><dt>CATEGORY</dt><dd>{p.category.toUpperCase()}</dd></div>
          <div><dt>PROJECT LICENSE</dt><dd>{p.license||"NOT SPECIFIED"}</dd></div>
          <div><dt>AI INVOLVEMENT</dt><dd>{p.aiDisclosure||"NOT DISCLOSED"}</dd></div></dl>
        <div className="fx-focus-extras">
          <Link to={linkFor(p.id)}>VIEW FULL PASSPORT ↗</Link>
          {source&&<a href={source.href} rel="noopener noreferrer" target="_blank">VIEW SOURCE AT {source.hostname.toUpperCase()} ↗</a>}
        </div>
      </div>
    </section>
    <aside className="fx-focus-lab">
      <span>EXPERIMENTAL ANEVUM PLAYER / SEPARATE FIRST-PARTY DEMO</span>
      <strong>Want to experience the future in-browser player?</strong>
      <p>Try our own original Orbit Align prototype. It is separate from this creator's project and does not award account XP.</p>
      <Link to="/atlas/lab/orbit-align" state={{returnTo:"/atlas/experience/"+encodeURIComponent(p.id)}}>TRY ORBIT ALIGN ↗</Link>
    </aside>
  </div>;
}

/** A genuinely interactive first-party player stage. It is not an approved
 * creator release or a general sandbox for arbitrary uploaded applications.
 */
export function OrbitAlignPage(){
  const navigate=useNavigate();
  const location=useLocation();
  const value=(location.state as {returnTo?:unknown}|null)?.returnTo;
  // The return destination is strictly scoped to an approved project-focus path.
  // No arbitrary same-origin routing, external redirect or private member URL.
  const returnTo=typeof value==="string"&&/^\/atlas\/experience\/[A-Za-z0-9_-]{1,80}$/.test(value)?value:null;
  return <OrbitAlignDemo onExit={()=>navigate(returnTo||"/atlas")} returnToProject={returnTo!==null}/>;
}
