import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {readCreators,readProjects,readStatus,type Creator,type Project,type Status} from "../lib/api";
import {useResource} from "../lib/useResource";
import {projectDetailPath} from "../lib/navigation";
import {Icon} from "../components/Icons";
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
  {to:"/discover?category=games",title:"Play",detail:"Games & worlds",icon:"star"},
  {to:"/discover",title:"Discover",detail:"Made by people",icon:"explore"},
  {to:"/community",title:"Connect",detail:"Find your people",icon:"community"},
  {to:"/studio",title:"Create",detail:"Make something",icon:"create"}
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
  const games=projects.filter(project=>project.category==="games");
  const featured=games[0]||projects[0]||null;
  const remaining=projects.filter(project=>project.id!==featured?.id).slice(0,3);
  const verified=Boolean(snapshot);
  const featuredPath=featured?projectDetailPath(featured.id,"/"):null;
  const firstGame=games[0]?projectDetailPath(games[0].id,"/"):null;

  return <div className="anevum-cinema av9-home av79-home">
    <div className="cinema-content av79-home-content">
      <section className="av79-hero av114-arrival" aria-labelledby="av79-home-heading">
        <div className="av114-arrival-scene" aria-hidden="true">
          <span className="av114-arrival-stars"/>
          <span className="av114-arrival-planet"><i/></span>
          <span className="av114-arrival-ring av114-arrival-ring--one"/>
          <span className="av114-arrival-ring av114-arrival-ring--two"/>
          <span className="av114-arrival-arc"/>
          <span className="av114-arrival-beacon"/>
        </div>
        <div className="av79-hero-orbit" aria-hidden="true"><span/><span/><span/></div>
        <div className="av79-hero-content">
          <span className="av79-kicker"><i aria-hidden="true"/> ANEVUM / THE CREATIVE NETWORK</span>
          <span className="av114-arrival-chapter">THE CONTINUANCE INSTITUTE <span aria-hidden="true">/</span> FIRST SIGNAL</span>
          <h1 id="av79-home-heading">Create beyond <em>worlds.</em></h1>
          <p>Play independent games. Discover original apps, art and ambitious ideas. Meet the people making them—and start something of your own.</p>
          <div className="av79-hero-actions">
            <Link className="av79-button av79-button--bright" to={firstGame||"/discover?category=games"}>
              {firstGame?"Play a game":"Explore games"} <Icon name="arrow" size={18}/>
            </Link>
            <Link className="av79-button av79-button--soft" to="/discover">
              Explore ANEVUM <Icon name="arrow" size={18}/>
            </Link>
          </div>
          <div className="av114-arrival-clarity" aria-label="Visitor access and creator publishing status">
            <span><i aria-hidden="true"/> Explore freely. No account required.</span>
            <span>Creator publishing is still in testing.</span>
          </div>
        </div>
        <div className="av114-arrival-signature" aria-hidden="true">
          <span>ANEVUM // 001</span><span>PLAY · DISCOVER · CONNECT · CREATE</span>
        </div>
      </section>

      <nav className="av79-gateways" aria-label="What would you like to do?">
        {gateways.map((item,index)=><Link key={item.to} to={item.to} className="av79-gateway">
          <span className="av79-gateway-icon"><Icon name={item.icon} size={20}/></span>
          <span className="av79-gateway-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
          <span className="av79-gateway-number">0{index+1}</span>
        </Link>)}
      </nav>

      <section className="av111-onramp" aria-labelledby="av111-onramp-title">
        <div className="av111-onramp-art" aria-hidden="true">
          <span className="av111-onramp-core"/>
          <span className="av111-onramp-orbit av111-onramp-orbit-a"/>
          <span className="av111-onramp-orbit av111-onramp-orbit-b"/>
        </div>
        <div className="av111-onramp-copy">
          <span className="av111-onramp-label">THE CONTINUANCE INSTITUTE / FIRST CONTACT</span>
          <h2 id="av111-onramp-title">{signedIn?"Your next signal starts here.":"Explore first. Join when ready."}</h2>
          <p>{signedIn
            ?"Your member space, published worlds and community are ready to explore. Studio publishing is still being tested."
            :"Browse the public network without an account. Join for free when you're ready to create your member identity; publishing tools are still in testing."}</p>
        </div>
        <div className="av111-onramp-actions">
          <Link className="av111-onramp-primary" to={signedIn?"/member":"/join"}>
            {signedIn?"OPEN MY SPACE":"BECOME A MEMBER"} <Icon name="arrow" size={16}/>
          </Link>
          <button className="av111-onramp-guide" type="button"
            onClick={()=>window.dispatchEvent(new Event("anevum:iren-tour"))}>
            LET IREN SHOW ME AROUND <Icon name="arrow" size={15}/>
          </button>
        </div>
      </section>

      <section className="av79-now" aria-labelledby="av79-now-heading">
        <header className="av79-section-heading">
          <div><span className="av79-kicker">FROM THE PUBLIC NETWORK</span>
            <h2 id="av79-now-heading">Ready when you are.</h2></div>
          <Link to="/discover">ALL CREATIONS <Icon name="arrow" size={15}/></Link>
        </header>
        {featured&&featuredPath?<article className="av79-feature">
          <Link to={featuredPath} className="av79-feature-art" aria-label={"Open "+featured.title}>
            <span className="av79-feature-rings" aria-hidden="true"><i/><i/><i/></span>
            <span className="av79-feature-serial">ANEVUM / FEATURED RELEASE</span>
            <span className="av79-feature-wordmark">{featured.title}<span aria-hidden="true"> ↗</span></span>
            <span className="av79-feature-caption">VISUAL INDEX / {featured.category.toUpperCase()}</span>
          </Link>
          <div className="av79-feature-copy">
            <span className="av79-feature-status"><span aria-hidden="true"/> APPROVED AND AVAILABLE <b> / </b> {categoryName[featured.category]}</span>
            <h3><Link to={featuredPath}>{featured.title}</Link></h3>
            <p>{featured.summary}</p>
            <div className="av79-feature-author">
              <span>MADE BY</span>
              <CreatorSignature project={featured} creators={creators}/>
            </div>
            <Link className="av79-button av79-button--bright av79-feature-open" to={featuredPath}>
              {featured.category==="games"?"Open experience":"View creation"} <Icon name="arrow" size={18}/>
            </Link>
          </div>
        </article>:<div className="av79-empty-release" role="status">
          <span className="av79-kicker">{portal.state==="error"?"INDEX UNAVAILABLE":portal.state==="loading"?"CHECKING THE PUBLIC INDEX":"PUBLIC INDEX / FIRST RELEASE"}</span>
          <strong>{portal.state==="error"?"The network cannot be reached right now.":portal.state==="loading"?"Looking for approved releases…":"The next discovery is being made."}</strong>
          <p>{portal.state==="ready"?"As soon as the first project is approved it will appear here.":"Only real published work is shown. No imaginary projects or counts."}</p>
          <Link to="/discover">Explore the directory <Icon name="arrow" size={15}/></Link>
        </div>}
        {portal.state==="error"&&verified&&<p className="av79-stale" role="status">Live refresh is unavailable. Previously verified public records are shown.</p>}
      </section>

      {remaining.length>0&&<section className="av79-latest" aria-labelledby="av79-latest-heading">
        <header className="av79-section-heading">
          <div><span className="av79-kicker">LATEST / APPROVED</span><h2 id="av79-latest-heading">Keep exploring.</h2></div>
          <Link to="/discover">SEE ALL <Icon name="arrow" size={15}/></Link>
        </header>
        <div className="av79-latest-list">{remaining.map(project=>
          <article className="av79-latest-item" key={project.id}>
            <div><span className="av79-latest-kind">{categoryName[project.category]}</span>
              <h3><Link to={projectDetailPath(project.id,"/")}>{project.title}</Link></h3>
              <p>{project.summary}</p>
              <CreatorSignature project={project} creators={creators}/></div>
            <Link className="av79-latest-action" to={projectDetailPath(project.id,"/")} aria-label={"Open "+project.title}><Icon name="arrow" size={20}/></Link>
          </article>
        )}</div>
      </section>}

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
          <p>{signedIn?"Finish your profile to carry your player identity into creations and conversations.":"Build your player identity, share what you make and earn recognition through real participation."}</p>
        </div>
        <Link to={signedIn?"/member":"/join"}>{signedIn?"SET UP MY CARD":"JOIN ANEVUM"} <Icon name="arrow" size={17}/></Link>
      </section>}

      <footer className="av79-home-end">
        <span>{verified&&status?String(status.counts.publishedProjects)+" VERIFIED PUBLIC RELEASE"+(status.counts.publishedProjects===1?"":"S"):"PUBLIC NETWORK / ANEVUM"}</span>
        <Link to="/community">MEET THE PEOPLE MAKING IT <Icon name="arrow" size={14}/></Link>
      </footer>
    </div>
  </div>;
}
