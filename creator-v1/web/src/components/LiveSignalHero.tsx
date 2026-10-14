import {Link} from "react-router-dom";
import {useEffect,useState,type CSSProperties} from "react";
import {readCommunityPosts,type CommunityPost,type Creator,type Project,type Status} from "../lib/api";
import {useResource} from "../lib/useResource";
import {projectDetailPath} from "../lib/navigation";
import {CosmicArtwork} from "./CosmicArtwork";
import {Icon} from "./Icons";

type Props={
  status:Status|null;
  projects:readonly Project[];
  creators:readonly Creator[];
  state:"loading"|"ready"|"error";
};

/** The visual concept contains fictional counts, project names and events.
 * Use approved public API records only. The animated waveform is decorative,
 * not actual network, audio or member-presence telemetry.
 */
function utcClock(value:Date){
  return new Intl.DateTimeFormat("en-GB",{
    timeZone:"UTC",hour:"2-digit",minute:"2-digit",hour12:false
  }).format(value)+" UTC";
}
function monthDay(value:string|null|undefined){
  const epoch=value?Date.parse(value):NaN;
  if(!Number.isFinite(epoch))return "DATE / —";
  return new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"short",day:"2-digit"}).format(epoch).toUpperCase();
}
function sortByPublication(projects:readonly Project[]){
  return [...projects].sort((a,b)=>{
    const left=Date.parse(a.publishedAt||"")||0;
    const right=Date.parse(b.publishedAt||"")||0;
    return right-left;
  });
}
function ModuleHead({index,title,to,action}:{index:string;title:string;to:string;action:string}){
  return <div className="av8-module-head">
    <div><span className="av8-module-index">{index}</span><h2>{title}</h2></div>
    <Link to={to}>{action} <Icon name="arrow" size={14}/></Link>
  </div>;
}
function LatestReleases({projects,state}:{projects:readonly Project[];state:Props["state"]}){
  const recent=sortByPublication(projects).slice(0,3);
  return <section className="av8-module av8-module--releases" aria-label="Latest published projects">
    <ModuleHead index="01 / RECORD" title="Latest releases" to="/discover" action="VIEW ALL"/>
    {state!=="ready"?<div className="av8-module-empty"><strong>{state==="loading"?"CHECKING PUBLIC RELEASES":"RELEASES UNAVAILABLE"}</strong><p>{state==="loading"?"Reading approved project records…":"The public project index could not be reached."}</p></div>:recent.length?<div className="av8-module-list">
      {recent.map(project=><Link className="av8-release" key={project.id} to={projectDetailPath(project.id,"/")}>
        <span className="av8-release-date">{monthDay(project.publishedAt)}</span>
        <span className="av8-release-title"><strong>{project.title}</strong><small>{project.creatorName||"@"+project.creatorHandle} / {project.category.toUpperCase()}</small></span>
        <Icon name="arrow" size={14}/>
      </Link>)}
    </div>:<div className="av8-module-empty"><strong>FIRST RELEASE / AWAITING REVIEW</strong><p>Approved projects will be indexed here when their creators publish.</p><Link to="/discover">BROWSE CATEGORIES <Icon name="arrow" size={13}/></Link></div>}
  </section>;
}
function RecentConversations({enabled}:{enabled:boolean}){
  const resource=useResource(async signal=>{
    if(!enabled)return {mode:"inactive" as const,posts:[] as CommunityPost[]};
    try{
      const page=await readCommunityPosts({sort:"new",limit:"3"},signal);
      return {mode:"active" as const,posts:page.items};
    }catch(error){
      if((error as {status?:number}).status===404)return {mode:"inactive" as const,posts:[] as CommunityPost[]};
      throw error;
    }
  },[enabled]);
  return <section className="av8-module av8-module--community" aria-label="Latest approved conversations">
    <ModuleHead index="02 / COMMONS" title="Conversations" to="/community" action="OPEN"/>
    {enabled&&resource.state==="loading"&&<p className="av8-module-message">Checking reviewed public conversations…</p>}
    {enabled&&resource.state==="error"&&<p className="av8-module-message" role="status">Discussions cannot be loaded right now.</p>}
    {resource.state==="ready"&&resource.data.mode==="active"&&resource.data.posts.length>0?
      <div className="av8-module-list">
        {resource.data.posts.map(post=><Link className="av8-conversation" key={post.id} to={"/community/posts/"+encodeURIComponent(post.id)}>
          <span className="av8-conversation-mark" aria-hidden="true">✳</span>
          <span><strong>{post.title}</strong><small>@{post.authorHandle} · {post.replyCount} {post.replyCount===1?"reply":"replies"}</small></span>
          <Icon name="arrow" size={14}/>
        </Link>)}
      </div>:
      (!enabled||(resource.state==="ready"&&(!resource.data.posts.length||resource.data.mode==="inactive")))&&
      <div className="av8-module-empty"><strong>COMMONS / PUBLIC READING</strong><p>Conversations appear after community publication and moderation. Explore the existing boards meanwhile.</p><Link to="/boards">READ THE BOARDS <Icon name="arrow" size={13}/></Link></div>}
  </section>;
}
function MakerChannels({creators,state}:{creators:readonly Creator[];state:Props["state"]}){
  return <section className="av8-module av8-module--makers" aria-label="Published creator channels">
    <ModuleHead index="03 / PEOPLE" title="Creator channels" to="/creators" action="DISCOVER"/>
    {state!=="ready"?<div className="av8-module-empty"><strong>{state==="loading"?"READING CHANNELS":"CHANNELS UNAVAILABLE"}</strong><p>{state==="loading"?"Finding published creator channels…":"The creator directory cannot be checked."}</p></div>:creators.length?<div className="av8-maker-list">{creators.slice(0,3).map(creator=>
      <Link to={"/creators/"+encodeURIComponent(creator.handle)} key={creator.handle} className="av8-maker">
        <span className="av8-maker-avatar" aria-hidden="true">{(creator.displayName.charAt(0)||"A").toUpperCase()}</span>
        <span><strong>{creator.displayName}</strong><small>@{creator.handle} · {creator.publishedProjects} published</small></span>
        <Icon name="arrow" size={14}/>
      </Link>
    )}</div>:<div className="av8-module-empty"><strong>NEW CHANNELS / IN PREPARATION</strong><p>Only genuine creators with approved public work appear in the directory.</p><Link to="/creators">OPEN DIRECTORY <Icon name="arrow" size={13}/></Link></div>}
  </section>;
}
function IndexPulse({status,state,clock}:{status:Status|null;state:Props["state"];clock:string}){
  return <section className="av8-module av8-module--pulse" aria-label="Verified public catalogue status">
    <ModuleHead index="04 / INDEX" title="Public signal" to="/status" action="STATUS"/>
    <div className="av8-pulse-body">
      <div className="av8-pulse-orbit" aria-hidden="true"><span className="av8-pulse-core"/><span className="av8-pulse-ring"/><span className="av8-pulse-dot"/></div>
      <dl>
        <div><dt>INDEX STATE</dt><dd>{state==="ready"?"CONNECTED":state==="loading"?"CHECKING":"UNAVAILABLE"}</dd></div>
        {state==="ready"&&status&&<>
          <div><dt>PUBLIC PROJECTS</dt><dd>{status.counts.publishedProjects.toLocaleString("en-US")}</dd></div>
          <div><dt>CREATOR CHANNELS</dt><dd>{status.counts.publishedCreators.toLocaleString("en-US")}</dd></div>
        </>}
        <div><dt>DISCUSSIONS</dt><dd>{!status?"UNKNOWN":status.features?.communityPosts===true?"ENABLED":"GATED"}</dd></div>
        <div><dt>INDEX CLOCK</dt><dd>{clock}</dd></div>
      </dl>
    </div>
    <p className="av8-pulse-policy">Read-only · Approved public records · No synthetic presence or activity</p>
  </section>;
}
export function LiveSignalHero({status,projects,creators,state}:Props){
  const recent=sortByPublication(projects).slice(0,4);
  const messages=recent.length?recent.map(p=>"INDEXED / "+p.title):[
    state==="ready"?"AWAITING FIRST APPROVED RELEASE":state==="error"?"PUBLIC INDEX UNAVAILABLE":"CONNECTING TO PUBLIC INDEX"
  ];
  const [active,setActive]=useState(0);
  const [time,setTime]=useState(()=>new Date());
  const signature=messages.join("|");
  useEffect(()=>setActive(0),[signature]);
  useEffect(()=>{
    if(messages.length<2||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const timer=window.setInterval(()=>{
      if(document.visibilityState==="visible")setActive(i=>(i+1)%messages.length);
    },7400);
    return()=>window.clearInterval(timer);
  },[signature,messages.length]);
  useEffect(()=>{
    const timer=window.setInterval(()=>{
      if(document.visibilityState==="visible")setTime(new Date());
    },30000);
    return()=>window.clearInterval(timer);
  },[]);
  const line=messages[active%messages.length];
  return <section className="av8-live-signal" aria-labelledby="av8-hero-title">
    <div className="av8-signal-art" aria-hidden="true"><CosmicArtwork scene="hero" priority/></div>
    <div className="av8-signal-grid" aria-hidden="true"/>
    <div className="av8-signal-meta">
      <span className="av8-signal-brand"><span className="av8-status-light" aria-hidden="true"/> ANEVUM <b>//</b> LIVE SIGNAL</span>
      <span className="av8-signal-clock">PUBLIC COMMONS <b>/</b> {utcClock(time)}</span>
    </div>
    <div className="av8-signal-stage">
      <div className="av8-signal-copy">
        <span className="av8-signal-kicker">[ OPEN TRANSMISSION / 001 ]</span>
        <h1 id="av8-hero-title">Live <em>Signal.</em></h1>
        <p>What's being made, published, and shared across ANEVUM.</p>
        <div className="av8-terminal-line" aria-label={"Latest approved signal: "+line}>
          <span className="av8-terminal-prompt" aria-hidden="true">&gt;</span>
          <span className="av8-terminal-type" key={line} aria-hidden="true">{line}</span>
          <span className="av8-terminal-caret" aria-hidden="true"/>
        </div>
        <div className="av8-signal-wave" aria-hidden="true">
          {[6,12,8,18,10,22,13,7,20,26,12,8,18,10,22,15,9,17,24,8,13,21,9,15,6,20,12,16,8,24,11,7].map((height,i)=><i key={i} style={{"--av8-wave-height":height+"px","--av8-wave-delay":(i%8*-.13)+"s"} as CSSProperties}/>)}
        </div>
        <div className="av8-signal-detail"><span>{state==="ready"?"SOURCE: APPROVED PUBLIC API":state==="loading"?"SOURCE: CONNECTING":"SOURCE: UNAVAILABLE"}</span><span>INDEX / AUTOMATIC</span></div>
      </div>
      <div className="av8-orbit-label" aria-hidden="true"><span>CELESTIAL<br/>TRANSMISSION</span><span>∞</span></div>
    </div>
    <div className="av8-module-grid">
      <LatestReleases projects={projects} state={state}/>
      <RecentConversations enabled={state==="ready"&&status?.features?.communityPosts===true}/>
      <MakerChannels creators={creators} state={state}/>
      <IndexPulse status={status} state={state} clock={utcClock(time)}/>
    </div>
    <div className="av8-signal-bottom"><span>NETWORK / CREATIVE COMMONS</span><a href="#community-index">SCROLL TO THE PUBLIC INDEX <Icon name="arrow" size={14}/></a><span>SOURCE // ANEVUM</span></div>
  </section>;
}
