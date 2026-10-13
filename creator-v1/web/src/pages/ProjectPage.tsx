import { Link, useParams, useSearchParams } from "react-router-dom";
import { readProject, safeExternal } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ErrorState, LoadingState } from "../components/States";
import { OrbitalMark } from "../components/OrbitalMark";
import { Icon } from "../components/Icons";
import { RepositoryPanel } from "../components/RepositoryPanel";
import { MemberEngagementPanel } from "../components/MemberEngagementPanel";
import { safeReturnPath } from "../lib/navigation";

export function ProjectPage(){
  const {id=""}=useParams();
  const [params]=useSearchParams();
  const from=safeReturnPath(params.get("from"));
  const backLabel=from==="/"?"BACK TO HOME":from.startsWith("/creators/")?"BACK TO CREATOR":"BACK TO RESULTS";
  const data=useResource(signal=>readProject(id,signal),[id]);
  if(data.state==="loading")return <LoadingState label="Opening project"/>;
  if(data.state==="error")return <ErrorState title="PROJECT NOT AVAILABLE" detail="This project may be unpublished, unavailable, or the public catalogue could not be reached."/>;
  const p=data.data.item,demo=safeExternal(p.demoUrl),source=safeExternal(p.sourceUrl);
  return <>
    <Link className="project-return" to={from}>← {backLabel}</Link>
    <section className="project-hero">
      <div className="project-hero-art"><OrbitalMark className="project-hero-mark"/><span>{p.category.toUpperCase()}</span></div>
      <div className="project-hero-copy">
        <span className="kicker">PROJECT / {p.category.toUpperCase()}</span>
        <h1>{p.title}</h1>
        <p className="project-summary">{p.summary}</p>
        <p className="byline">BY <Link to={"/creators/"+encodeURIComponent(p.creatorHandle)}>{p.creatorName} / @{p.creatorHandle}</Link></p>
        <div className="hero-actions">
          {demo&&<a className="button primary" href={demo.href} target="_blank" rel="noopener noreferrer" aria-label={(p.category==="games"?"Play game":"Try project")+" on "+demo.hostname+" (opens in a new tab)"}>{p.category==="games"?"PLAY ON CREATOR SITE":"TRY ON CREATOR SITE"} <Icon name="arrow" size={17}/></a>}
          {source&&<a className={"button "+(demo?"secondary":"primary")} href={source.href} target="_blank" rel="noopener noreferrer" aria-label={"View source on "+source.hostname+" (opens in a new tab)"}>VIEW SOURCE <Icon name="arrow" size={17}/></a>}
        </div>
        <p className="project-destination-line">{demo?<>The experience opens on <b>{demo.hostname}</b>, outside ANEVUM.</>:<>No playable or usable destination is published.{source?" Source is available separately.":""}</>}</p>
      </div>
    </section>
    <section className="project-detail-grid">
      <article>
        <span className="kicker">ABOUT THE WORK</span><h2>WHAT IS THIS?</h2><p>{p.description||p.summary}</p>
        <div className="project-facts">
          <div><span>ACCESS</span><strong>{p.freeToUse?"FREE TO USE":"CHECK EXTERNAL PRICING"}</strong></div>
          <div><span>LICENSE</span><strong>{p.license||"NOT SPECIFIED"}</strong></div>
          <div><span>STATUS</span><strong>PUBLISHED</strong></div>
        </div>
      </article>
      <aside>
        <div className="detail-block"><span className="kicker">AI DISCLOSURE</span><p>{p.aiDisclosure||"Not supplied."}</p></div>
        <div className="detail-block"><span className="kicker">HUMAN CONTRIBUTION</span><p>{p.humanContribution||"Not supplied."}</p></div>
        <div className="detail-block warning"><strong>EXTERNAL PROJECT</strong><p>ANEVUM lists the work and its creator. External projects run on their creator's hosting; a listing is not a safety certification.</p></div>
      </aside>
    </section>
    <RepositoryPanel projectId={p.id} sourceUrl={p.sourceUrl}/>
    <MemberEngagementPanel projectId={p.id}/>
  </>;
}
