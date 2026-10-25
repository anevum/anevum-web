import {Link,useParams,useSearchParams} from "react-router-dom";
import {readProject,safeExternal} from "../lib/api";
import {useResource} from "../lib/useResource";
import {ErrorState,LoadingState} from "../components/States";
import {ProjectPlayerShell} from "../components/ProjectPlayerShell";
import {RepositoryPanel} from "../components/RepositoryPanel";
import {MemberEngagementPanel} from "../components/MemberEngagementPanel";
import {ProjectLaunchKit} from "../components/ProjectLaunchKit";
import {safeReturnPath} from "../lib/navigation";
import {publicCreatorHandle} from "../lib/public-creator-handle";
import {ContextDiscussions} from "../components/ContextDiscussions";
import {isAnevumHostedRelease} from "../lib/project-hosting";

const types:Record<string,string>={
  games:"GAME PROJECT",tools:"APPLICATION",creative:"CREATIVE PROJECT",libraries:"OPEN SOURCE",
  automation:"AUTOMATION",research:"RESEARCH",learning:"EDUCATIONAL WORK",other:"INDEPENDENT CREATION"
};

export function ProjectPage(){
  const {id=""}=useParams();
  const [params]=useSearchParams();
  const from=safeReturnPath(params.get("from"));
  const backLabel=from==="/"?"BACK TO PORTAL":from==="/saved"?"BACK TO SAVED WORKS":from.startsWith("/creators/")?"BACK TO CREATOR":"BACK TO RESULTS";
  const project=useResource(signal=>readProject(id,signal),[id]);
  if(project.state==="loading")return <LoadingState label="Preparing the published project page"/>;
  if(project.state==="error")return <ErrorState title="PROJECT NOT AVAILABLE" detail="This work may be unpublished, withdrawn, or the public catalogue is temporarily unavailable."/>;
  const p=project.data.item,demo=safeExternal(p.demoUrl),source=safeExternal(p.sourceUrl);
  const creatorHandle=publicCreatorHandle(p.creatorHandle);
  const hosted=isAnevumHostedRelease(p.id,demo);
  const date=p.publishedAt?new Date(p.publishedAt):null;
  const published=date&&Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(date):"DATE NOT LISTED";
  return <div className="portal-project avp-project">
    <nav className="portal-crumbs" aria-label="Project breadcrumb"><Link to={from}>← {backLabel}</Link><span>/</span><Link to={"/discover?category="+encodeURIComponent(p.category)}>{p.category.toUpperCase()}</Link><span>/</span><span>PROJECT</span></nav>
    <div className="avp-experience-layout">
      <ProjectPlayerShell project={p} demo={demo} source={source}/>
      <aside className="portal-sidebar avp-passport" aria-label="Published project passport">
        <section className="portal-sidebox portal-project-passport"><span className="kicker">THE PASSPORT / PUBLIC FACTS</span><h2>PROJECT DETAILS</h2>
          <div className="portal-facts-row"><span>ACCESS</span><strong>{hosted?"OPEN IN ANEVUM":p.freeToUse?"LISTED AS FREE":"CHECK CREATOR TERMS"}</strong></div>
          <div className="portal-facts-row"><span>CATEGORY</span><strong>{types[p.category]||p.category.toUpperCase()}</strong></div>
          <div className="portal-facts-row"><span>EXPERIENCE</span><strong>{hosted?"ANEVUM PLAYER":demo?"EXTERNAL DEMO":source?"SOURCE ONLY":"NO LINKED DEMO"}</strong></div>
          <div className="portal-facts-row"><span>DEVICE SUPPORT</span><strong>NOT SPECIFIED</strong></div>
          <div className="portal-facts-row"><span>PUBLISHED</span><strong>{published.toUpperCase()}</strong></div>
          <div className="portal-facts-row"><span>LICENSE AS LISTED</span><strong>{p.license||"NOT SPECIFIED"}</strong></div>
          <div className="portal-facts-row"><span>REVIEW STATUS</span><strong>PUBLIC / APPROVED</strong></div>
          {demo&&<div className="portal-facts-row"><span>{hosted?"HOSTED BY":"CREATOR HOST"}</span><strong>{hosted?"ANEVUM":demo.hostname}</strong></div>}
        </section>
        <ProjectLaunchKit key={p.id} project={p}/>
        <section className="portal-sidebox"><span className="kicker">THE HUMAN STORY</span><h2>WHO MADE WHAT?</h2>
          <div className="portal-project-disclosure"><strong>AI INVOLVEMENT</strong><p>{p.aiDisclosure||"The creator did not provide an AI-use disclosure."}</p></div>
          <div className="portal-project-disclosure"><strong>HUMAN CONTRIBUTION</strong><p>{p.humanContribution||"The creator did not provide details of human contributions."}</p></div>
        </section>
        {hosted?<section className="portal-sidebox"><span className="kicker">REVIEWED CREATOR RELEASE</span><h2>HOSTED ON ANEVUM</h2><p>This published release opens in the ANEVUM player. Creator files run in an isolated sandbox without access to your member account. Source links, when provided, open separately.</p></section>:<section className="portal-sidebox portal-external-warning"><span className="kicker">READ BEFORE YOU LEAVE</span><h2>INDEPENDENT HOSTING</h2><p>External demos and code are hosted by their creators. ANEVUM does not certify security, ownership, licensing or payment practices. Check costs and account requirements before sharing data.</p></section>}
      </aside>
    </div>
    <nav className="avp-subnav" aria-label="Project sections">
      <a href="#avp-about">ABOUT</a><a href="#avp-participation">PARTICIPATION</a><a href="#avp-discussion">COMMUNITY</a>
      {source&&<a href="#avp-source">SOURCE</a>}
    </nav>
    <div className="portal-project-detail-layout avp-below">
      <div className="portal-project-main">
        <section className="portal-box portal-project-about" id="avp-about">
          <header className="portal-box-header"><div><span className="kicker">WHAT THE CREATOR ACTUALLY MADE</span><h2>ABOUT THIS PROJECT</h2></div><span className="portal-hall-stamp">PUBLIC PROJECT RECORD</span></header>
          {p.summary.length>240&&p.description&&p.description!==p.summary&&<p>{p.summary}</p>}
          <p>{p.description||p.summary}</p>
        </section>
        <div id="avp-participation"><MemberEngagementPanel projectId={p.id}/></div>
        <div id="avp-discussion"><ContextDiscussions projectId={p.id}/></div>
        <div id="avp-source"><RepositoryPanel projectId={p.id} sourceUrl={p.sourceUrl}/>
          {source&&<a className="avp-inline-source" href={source.href} target="_blank" rel="noopener noreferrer" aria-label={"View source on "+source.hostname+" in a new tab"}>VIEW SOURCE ON {source.hostname.toUpperCase()} ↗</a>}
        </div>
        <section className="portal-box portal-project-discovery"><span className="kicker">KEEP THE PORTAL OPEN</span><h2>DISCOVER MORE IN {p.category.toUpperCase()}</h2><p>Explore other approved independent creations or visit the maker's channel. Only published, moderated work belongs in the catalogue.</p><div><Link className="button secondary" to={"/discover?category="+encodeURIComponent(p.category)}>MORE IN THIS CATEGORY →</Link>{creatorHandle?<Link className="button secondary" to={"/creators/"+encodeURIComponent(creatorHandle)}>CREATOR CHANNEL →</Link>:<span className="button secondary" aria-label="Creator channel not linked">CREATOR CHANNEL NOT LINKED</span>}</div></section>
      </div>
    </div>
  </div>;
}
