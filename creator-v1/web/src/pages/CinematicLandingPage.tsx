import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {readCreators,readProjects,readStatus,type Creator,type Project,type Status} from "../lib/api";
import {useResource} from "../lib/useResource";
import {projectDetailPath} from "../lib/navigation";
import {Icon} from "../components/Icons";
import {ContinuanceSignalAtlas} from "../components/ContinuanceSignalAtlas";
import {CompactMemberIdentity} from "../components/CompactMemberIdentity";
import {useOwnPlayerCard} from "../lib/useOwnPlayerCard";
import {canonicalAuthClient} from "../lib/canonical-beta";
import {publicCreatorHandle} from "../lib/public-creator-handle";

/**
 * ANEVUM / V079 — concise, member-led home.
 * The feature and activity are real approved records, not decorative pretend
 * projects. The only rewarded player identity is independently server-verified.
 * This page never opens up private submissions or moderation records.
 */
type PublicSnapshot={status:Status|null;projects:Project[];creators:Creator[]};
const gateways=[
  {to:"/discover",title:"Discover",detail:"Open approved games, apps and experiments",icon:"explore",eyebrow:"01 / EXPLORE"},
  {to:"/studio",title:"Create",detail:"Explore the creator workspace (publishing in testing)",icon:"create",eyebrow:"02 / MAKE"},
  {to:"/community",title:"Connect",detail:"Find public conversations and creators",icon:"community",eyebrow:"03 / BELONG"}
] as const;

const categoryName:Record<Project["category"],string>={
  games:"GAME / EXPERIENCE",tools:"APP / TOOL",automation:"AUTOMATION",
  research:"RESEARCH",creative:"ART / CREATIVE",learning:"LEARNING",
  libraries:"OPEN SOURCE",other:"INDEPENDENT WORK"
};

function byPublication(left:Project,right:Project){
  return (Date.parse(right.publishedAt||"")||0)-(Date.parse(left.publishedAt||"")||0);
}
function CreatorSignature({project,creators}:{project:Project;creators:readonly Creator[]}){
  const handle=publicCreatorHandle(project.creatorHandle);
  const match=handle?creators.find(c=>c.handle===handle):null;
  const displayName=match?.displayName||project.creatorName||"ANEVUM member";
  if(!handle)return <span className="av79-unlinked-creator" aria-label="Creator profile not publicly linked">
    <small>Public creator channel not linked.</small><strong>{displayName}</strong>
  </span>;
  return <CompactMemberIdentity className="av79-creator-signature" size="inline"
    href={"/creators/"+encodeURIComponent(handle)}
    member={{handle,displayName,
      source:"creator-channel",avatar:false,level:null,featuredAwards:[]}}/>;
}

export function CinematicLandingPage(){
  const [lastVerified,setLastVerified]=useState<PublicSnapshot|null>(null);
  const [revision,setRevision]=useState(0);
  const [scenePaused,setScenePaused]=useState(false);
  const ownCard=useOwnPlayerCard();
  const {data:session}=canonicalAuthClient.useSession();
  const signedIn=Boolean(session?.user?.id&&session.user.emailVerified===true);
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==="visible")setRevision(v=>v+1);};
    const interval=window.setInterval(refresh,180000);
    document.addEventListener("visibilitychange",refresh);
    return()=>{window.clearInterval(interval);document.removeEventListener("visibilitychange",refresh);};
  },[]);
  // The primary catalogue should render immediately when available; status
  // and creator metadata may refresh independently without blocking first paint.
  const portal=useResource(async signal=>{
    const projectResponse=await readProjects({limit:"32"},signal);
    return {status:null,projects:projectResponse.items,creators:[]};
  },[revision]);
  const metadata=useResource(async signal=>{
    const [statusResult,creatorResult]=await Promise.allSettled([
      readStatus(signal),
      readCreators({limit:"8"},signal)
    ]);
    return {
      status:statusResult.status==="fulfilled"?statusResult.value:null,
      creators:creatorResult.status==="fulfilled"?creatorResult.value.items:[]
    };
  },[revision]);
  useEffect(()=>{
    if(portal.state==="ready")setLastVerified(portal.data);
  },[portal]);
  const snapshot=portal.state==="ready"?portal.data:lastVerified;
  const projects=[...(snapshot?.projects||[])].sort(byPublication);
  const creators=metadata.state==="ready"?metadata.data.creators:snapshot?.creators||[];
  const status=metadata.state==="ready"?metadata.data.status:snapshot?.status||null;
  // Public API returns approved catalogue records. Early games may be shown
  // as explicitly experimental first looks, never as a finished flagship.
  // Do not suppress the only genuine public work just because it is a game.
  const firstLook=projects[0]||null;
  const showcase=projects.slice(1,4);
  const verified=Boolean(snapshot);

  return <div className="anevum-cinema av9-home av79-home" data-scene-paused={scenePaused}>
    <div className="cinema-content av79-home-content">
      <section className={"av79-hero av114-arrival av115-arrival av125-arrival av133-arrival"+(scenePaused?" av125-is-paused":"")} data-iren-anchor="arrival" aria-labelledby="av79-home-heading">
        <div className="av114-arrival-scene" aria-hidden="true">
          <span className="av114-arrival-stars"/>
          <span className="av114-arrival-planet"><i/></span>
          <span className="av114-arrival-ring av114-arrival-ring--one"/>
          <span className="av114-arrival-ring av114-arrival-ring--two"/>
          <span className="av114-arrival-arc"/>
          <span className="av114-arrival-beacon"/>
          <ContinuanceSignalAtlas/>
          <span className="av125-horizon-glow"/>
        </div>
        <div className="av79-hero-orbit" aria-hidden="true"><span/><span/><span/></div>
        <div className="av79-hero-content">
          <span className="av79-kicker"><i aria-hidden="true"/> ANEVUM / A WORLD OF THINGS PEOPLE MAKE</span>
          <span className="av114-arrival-chapter">THE CONTINUANCE INSTITUTE <span aria-hidden="true">/</span> FIRST CONTACT</span>
          <span className="av133-hero-purpose">GAMES <span aria-hidden="true">/</span> APPS <span aria-hidden="true">/</span> CREATIVE EXPERIMENTS</span>
          <h1 id="av79-home-heading">Find something <em>worth trying.</em></h1>
          <p>Discover independent games, useful apps and creative experiments. Explore real projects for free, then join when something catches your eye.</p>
          <div className="av79-hero-actions">
            <Link className="av79-button av79-button--bright" to="/discover">
              Explore real projects <Icon name="arrow" size={18}/>
            </Link>
             <Link className="av123-member-entry" to={signedIn?"/member":"/join"}>
               {signedIn?"Return to my space":"Join the early community"} <Icon name="arrow" size={16}/>
             </Link>
          </div>
          <div className="av114-arrival-clarity" aria-label="Visitor access and creator publishing status">
            <span><i aria-hidden="true"/> Free to explore. No account required.</span>
            <span>Membership is free. Creator publishing is still in testing.</span>
          </div>
          <div className="av125-arrival-utility">
            <a className="av124-hero-wayfinder" href="#wayfinder" aria-label="Jump to the ANEVUM Wayfinder">
              <span>Find your way</span><span aria-hidden="true">↓</span>
            </a>
            <button className="av125-motion-toggle" type="button"
              aria-pressed={scenePaused}
              aria-label={scenePaused?"Resume decorative background animation":"Pause decorative background animation"}
              onClick={()=>setScenePaused(previous=>!previous)}>
              <span className="av125-motion-indicator" aria-hidden="true"/>
              {scenePaused?"RESUME MOTION":"PAUSE MOTION"}
            </button>
            <span className="av125-motion-note">REDUCED MOTION</span>
          </div>
        </div>
        <aside className="av115-iren-console" aria-label="IREN arrival orientation">
          <div className="av115-iren-console-top">
            <span className="av115-console-light" aria-hidden="true"/>
            <span>IREN / FIELD GUIDE</span>
            <span>01 / ARRIVAL</span>
          </div>
          <div className="av115-iren-pulse" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
          <strong>Need a guide?</strong>
          <p>I'm IREN. I can help you find your way through the network.</p>
          <button type="button" onClick={()=>window.dispatchEvent(new Event("anevum:iren-intro"))}>
            MEET IREN <Icon name="arrow" size={15}/>
          </button>
        </aside>
        <div className="av114-arrival-signature" aria-hidden="true">
          <span>THE CONTINUANCE INSTITUTE</span><span>EXPLORE · CREATE · CONNECT · BELONG</span>
        </div>
      </section>

      <section className="av133-first-look" aria-labelledby="av133-first-look-heading">
        <div className="av133-first-look-intro">
          <span className="av133-eyebrow"><i aria-hidden="true"/> THE PUBLIC INDEX / FIRST LOOK</span>
          <h2 id="av133-first-look-heading">See what lives here.</h2>
          <p>Start with work that's genuinely available in the public catalogue. No signup required to browse.</p>
          <Link to="/discover" className="av133-index-link">Browse every project <Icon name="arrow" size={16}/></Link>
        </div>
        {firstLook?<article className="av133-first-look-card">
          <div className="av133-first-look-scene" aria-hidden="true">
            <span className="av133-first-look-orbit"/><span className="av133-first-look-core"/>
            <span className="av133-first-look-line"/><span className="av133-first-look-satellite"/>
          </div>
          <div className="av133-first-look-copy">
            <div className="av133-first-look-meta">
              <span>{categoryName[firstLook.category]}</span>
              <span>APPROVED PUBLIC PROJECT</span>
            </div>
            <h3>{firstLook.title}</h3>
            <p>{firstLook.summary}</p>
            <div className="av133-first-look-bottom">
              <span>BY {firstLook.creatorName||"ANEVUM member"}</span>
              <Link to={projectDetailPath(firstLook.id,"/")}>View this project <Icon name="arrow" size={16}/></Link>
            </div>
          </div>
        </article>:<div className="av133-first-look-empty" role="status">
          <span>{portal.state==="error"?"INDEX TEMPORARILY UNAVAILABLE":portal.state==="loading"?"CHECKING APPROVED WORK":"PUBLIC DISCOVERY"}</span>
          <strong>{portal.state==="loading"?"Finding real projects…":"Explore the public project directory."}</strong>
          <p>{portal.state==="error"?"The catalogue could not load here. Try Discover directly.":"We'll show approved creations here as they become available."}</p>
          <Link to="/discover">Open Discover <Icon name="arrow" size={16}/></Link>
        </div>}
      </section>

      <section id="wayfinder" tabIndex={-1} className="av115-wayfinder" data-iren-anchor="arrival-paths" aria-labelledby="av115-wayfinder-title">
        <div className="av115-wayfinder-heading">
          <span className="av79-kicker">SELECT A DIRECTION / WAYFINDER</span>
          <h2 id="av115-wayfinder-title">Where will you go?</h2>
          <p>There's no required path. Start wherever curiosity takes you.</p>
        </div>
        <nav className="av79-gateways av115-gateways" aria-label="Choose your way into ANEVUM">
          {gateways.map(item=><Link key={item.to} to={item.to} className="av79-gateway av115-gateway">
            <span className="av115-gateway-top"><span>{item.eyebrow}</span><Icon name="arrow" size={18}/></span>
            <span className="av79-gateway-icon"><Icon name={item.icon} size={23}/></span>
            <span className="av79-gateway-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
          </Link>)}
          <Link to={signedIn?"/member":"/join"} className="av79-gateway av115-gateway av115-gateway-member">
            <span className="av115-gateway-top"><span>04 / IDENTITY</span><Icon name="arrow" size={18}/></span>
            <span className="av79-gateway-icon"><Icon name="people" size={23}/></span>
            <span className="av79-gateway-copy"><strong>{signedIn?"My Space":"Join"}</strong>
              <small>{signedIn?"Return to your verified member identity":"Create your member identity when ready"}</small></span>
          </Link>
        </nav>
      </section>

      {/* V115: IREN now has a single entry in the arrival console and one
          existing companion dock. Membership is available in the Wayfinder;
          the V111 duplicate first-contact rail is intentionally superseded. */}

      <section className="av79-now av115-public-index" aria-labelledby="av79-now-heading">
        <header className="av79-section-heading">
          <div><span className="av79-kicker">PUBLIC INDEX / VERIFIED WORK</span>
            <h2 id="av79-now-heading">More things people are making.</h2>
            <p className="av115-index-intro">More approved public work, with access details and creators credited on each project page.</p>
          </div>
          <Link to="/discover">BROWSE THE INDEX <Icon name="arrow" size={15}/></Link>
        </header>
        {showcase.length>0?<div className="av115-public-list">
          {showcase.map(project=><article className="av115-public-item" key={project.id}>
            <div className="av115-public-item-head">
              <span>{categoryName[project.category]}</span><span>PUBLIC RECORD</span>
            </div>
            <h3><Link to={projectDetailPath(project.id,"/")}>{project.title}</Link></h3>
            <p>{project.summary}</p>
            <div className="av115-public-item-footer">
              <CreatorSignature project={project} creators={creators}/>
              <Link to={projectDetailPath(project.id,"/")} aria-label={"Open "+project.title}>
                View work <Icon name="arrow" size={15}/>
              </Link>
            </div>
          </article>)}
        </div>:<div className="av115-index-empty" role="status">
          <div><span className="av79-kicker">{portal.state==="error"?"INDEX UNAVAILABLE":portal.state==="loading"?"CHECKING THE PUBLIC INDEX":"THE NETWORK IS GROWING"}</span>
            <strong>{portal.state==="error"?"The public index is temporarily unavailable.":"More creations are on the way."}</strong>
            <p>{portal.state==="ready"
              ?"The first public project is featured above. More approved creations will appear here as they are released."
              :"Explore the public directory directly, or learn what you can create."}</p>
          </div>
          <Link to="/discover">OPEN DISCOVER <Icon name="arrow" size={17}/></Link>
        </div>}
        {portal.state==="error"&&verified&&<p className="av79-stale" role="status">Live refresh is unavailable. Previously verified public records are shown.</p>}
      </section>

      <section className="av125-charter" aria-labelledby="av125-charter-title">
        <div className="av125-charter-main">
          <span className="av125-charter-register">FIELD NOTE 001 / THE CONTINUANCE PRINCIPLE</span>
          <h2 id="av125-charter-title">What we make <em>becomes what comes next.</em></h2>
          <p>Original worlds, useful software, experiments and art belong in the same universe. Discover the work people have released and follow the tools being built to create more.</p>
          <Link to="/guide" className="av125-charter-action">
            EXPLORE THE FIELD GUIDE <Icon name="arrow" size={16}/>
          </Link>
        </div>
        <div className="av125-charter-instrument" aria-hidden="true">
          <span className="av125-charter-circle av125-charter-circle--outer"/>
          <span className="av125-charter-circle av125-charter-circle--middle"/>
          <span className="av125-charter-circle av125-charter-circle--inner"/>
          <span className="av125-charter-signal"/>
          <span className="av125-charter-axis"/>
          <span className="av125-charter-index">CONTINUANCE / OPEN HORIZONS</span>
        </div>
      </section>

      {ownCard?<section className="av79-member-section" aria-labelledby="av79-member-heading">
        <div><span className="av79-kicker">YOUR PLACE IN THE NETWORK</span>
          <h2 id="av79-member-heading">Your identity travels with you.</h2>
          <p>Your verified level and earned recognition appear with your work and conversations.</p>
          <Link to="/member">OPEN MY SPACE <Icon name="arrow" size={15}/></Link>
        </div>
        <CompactMemberIdentity member={ownCard} href="/member" size="featured" className="av79-home-player-card"/>
      </section>:<section className="av79-member-invitation" aria-label="Join the creative network">
        <span className="av79-invitation-seal" aria-hidden="true">✳</span>
        <div><span className="av79-kicker">YOUR PLACE IN THE NETWORK</span>
          <h2>{signedIn?"Complete your signature.":"Make your mark."}</h2>
          <p>{signedIn?"Finish your profile to carry your player identity into creations and conversations.":"Create your profile, save discoveries and earn recognition for eligible participation. Creator publishing is in testing."}</p>
        </div>
        <Link to={signedIn?"/member":"/join"}>{signedIn?"SET UP MY CARD":"JOIN THE EARLY COMMUNITY"} <Icon name="arrow" size={17}/></Link>
      </section>}

      <footer className="av79-home-end">
        <span>{verified&&status?String(status.counts.publishedProjects)+" VERIFIED PUBLIC RELEASE"+(status.counts.publishedProjects===1?"":"S"):"PUBLIC NETWORK / ANEVUM"}</span>
        <Link to="/community">MEET THE PEOPLE MAKING IT <Icon name="arrow" size={14}/></Link>
      </footer>
    </div>
  </div>;
}
