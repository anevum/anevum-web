import {Link,useParams,useSearchParams} from "react-router-dom";
import {readProject,safeExternal} from "../lib/api";
import {useResource} from "../lib/useResource";
import {ErrorState,LoadingState} from "../components/States";
import {CosmicIllustration} from "../components/CosmicIllustration";
import {RepositoryPanel} from "../components/RepositoryPanel";
import {MemberEngagementPanel} from "../components/MemberEngagementPanel";
import {safeReturnPath} from "../lib/navigation";

const types:Record<string,string>={
  games:"GAME / PLAYABLE",tools:"APPLICATION",creative:"CREATIVE PROJECT",libraries:"OPEN SOURCE",
  automation:"AUTOMATION",research:"RESEARCH",learning:"EDUCATIONAL WORK",other:"INDEPENDENT CREATION"
};

export function ProjectPage(){
  const {id=""}=useParams();
  const [params]=useSearchParams();
  const from=safeReturnPath(params.get("from"));
  const backLabel=from==="/"?"BACK TO PORTAL":from.startsWith("/creators/")?"BACK TO CREATOR":"BACK TO RESULTS";
  const project=useResource(signal=>readProject(id,signal),[id]);
  if(project.state==="loading")return <LoadingState label="Preparing the published project page"/>;
  if(project.state==="error")return <ErrorState title="PROJECT NOT AVAILABLE" detail="This work may be unpublished, withdrawn, or the public catalogue is temporarily unavailable."/>;
  const p=project.data.item,demo=safeExternal(p.demoUrl),source=safeExternal(p.sourceUrl);
  const date=p.publishedAt?new Date(p.publishedAt):null;
  const published=date&&Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(date):"DATE NOT LISTED";
  return <div className="portal-project">
    <nav className="portal-crumbs" aria-label="Project breadcrumb"><Link to={from}>← {backLabel}</Link><span>/</span><Link to={"/discover?category="+encodeURIComponent(p.category)}>{p.category.toUpperCase()}</Link><span>/</span><span>PROJECT</span></nav>
    <section className="portal-project-header">
      <div className="portal-project-art" aria-hidden="true">
        <span className="portal-project-corner">ANEVUM<br/>CATEGORY ILLUSTRATION</span>
        <CosmicIllustration scene={p.category}/>
        <span className="portal-project-art-tag">{types[p.category]||"PROJECT"}</span>
      </div>
      <div className="portal-project-intro">
        <span className="kicker">PROJECT PASSPORT / {p.category.toUpperCase()}</span>
        <h1>{p.title}</h1><p className="portal-project-summary">{p.summary}</p>
        <Link className="portal-project-maker" to={"/creators/"+encodeURIComponent(p.creatorHandle)}>
          <span className="portal-maker-symbol" aria-hidden="true">✳</span><span><small>MADE BY</small><strong>{p.creatorName} / @{p.creatorHandle}</strong></span><span aria-hidden="true">↗</span>
        </Link>
        <div className="portal-project-cta">
          {demo&&<a href={demo.href} target="_blank" rel="noopener noreferrer" className="button primary" aria-label={(p.category==="games"?"Play":"Try")+" on "+demo.hostname+" (opens in new tab)"}>{p.category==="games"?"PLAY ON CREATOR SITE":"TRY ON CREATOR SITE"} <span aria-hidden="true">↗</span></a>}
          {source&&<a href={source.href} target="_blank" rel="noopener noreferrer" className={"button "+(demo?"secondary":"primary")} aria-label={"View source code on "+source.hostname+" (opens in new tab)"}>VIEW SOURCE CODE <span aria-hidden="true">↗</span></a>}
        </div>
        <p className="portal-project-outbound">{demo?<>The project runs on <strong>{demo.hostname}</strong>, independently of ANEVUM.</>:<>There is no publicly linked live experience.{source?" The source repository can be viewed separately.":""}</>}</p>
      </div>
    </section>
    <div className="portal-project-detail-layout">
      <div className="portal-project-main">
        <section className="portal-box portal-project-about">
          <header className="portal-box-header"><div><span className="kicker">WHAT THE CREATOR ACTUALLY MADE</span><h2>ABOUT THIS PROJECT</h2></div><span className="portal-hall-stamp">ORIGINAL WORK</span></header>
          <p>{p.description||p.summary}</p>
        </section>
        <MemberEngagementPanel projectId={p.id}/>
        <RepositoryPanel projectId={p.id} sourceUrl={p.sourceUrl}/>
        <section className="portal-box portal-project-discovery"><span className="kicker">KEEP THE PORTAL OPEN</span><h2>DISCOVER MORE IN {p.category.toUpperCase()}</h2><p>Explore other approved independent creations or visit the maker's channel. Only published, moderated work belongs in the catalogue.</p><div><Link className="button secondary" to={"/discover?category="+encodeURIComponent(p.category)}>MORE IN THIS CATEGORY →</Link><Link className="button secondary" to={"/creators/"+encodeURIComponent(p.creatorHandle)}>CREATOR CHANNEL →</Link></div></section>
      </div>
      <aside className="portal-sidebar">
        <section className="portal-sidebox portal-project-passport"><span className="kicker">THE PASSPORT / PUBLIC FACTS</span><h2>PROJECT DETAILS</h2>
          <div className="portal-facts-row"><span>ACCESS</span><strong>{p.freeToUse?"FREE TO USE":"CHECK CREATOR PRICING"}</strong></div>
          <div className="portal-facts-row"><span>CATEGORY</span><strong>{types[p.category]||p.category.toUpperCase()}</strong></div>
          <div className="portal-facts-row"><span>PUBLISHED</span><strong>{published.toUpperCase()}</strong></div>
          <div className="portal-facts-row"><span>PROJECT LICENSE</span><strong>{p.license||"NOT SPECIFIED"}</strong></div>
          <div className="portal-facts-row"><span>REVIEW STATUS</span><strong>PUBLIC / APPROVED</strong></div>
        </section>
        <section className="portal-sidebox"><span className="kicker">THE HUMAN STORY</span><h2>WHO MADE WHAT?</h2>
          <div className="portal-project-disclosure"><strong>AI INVOLVEMENT</strong><p>{p.aiDisclosure||"The creator did not provide an AI-use disclosure."}</p></div>
          <div className="portal-project-disclosure"><strong>HUMAN CONTRIBUTION</strong><p>{p.humanContribution||"The creator did not provide details of human contributions."}</p></div>
        </section>
        <section className="portal-sidebox portal-external-warning"><span className="kicker">READ BEFORE YOU LEAVE</span><h2>INDEPENDENT HOSTING</h2><p>ANEVUM lists the project; external demos and code are hosted by their creators. Listings do not certify security, ownership, licensing or payment practices. Check the external destination before sharing information.</p></section>
      </aside>
    </div>
  </div>;
}
