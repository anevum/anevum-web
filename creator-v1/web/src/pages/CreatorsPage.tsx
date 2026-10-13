import {FormEvent,useEffect,useState} from "react";
import {Link,useParams,useSearchParams} from "react-router-dom";
import {readCreator,readCreators,readProjects} from "../lib/api";
import {memberCreatorProfile} from "../lib/member-api";
import {useResource} from "../lib/useResource";
import {ProjectCard} from "../components/ProjectCard";
import {PageNav} from "../components/PageNav";
import {PortalHeading} from "../components/PortalHeading";
import {LevelPanel} from "../components/LevelPanel";
import {EmptyState,ErrorState,LoadingState} from "../components/States";
import {OrbitalMark} from "../components/OrbitalMark";

export function CreatorsPage(){
  const [params,setParams]=useSearchParams();
  const q=params.get("q")||"",cursor=params.get("cursor")||"";
  const [draft,setDraft]=useState(q);
  useEffect(()=>setDraft(q),[q]);
  const data=useResource(signal=>readCreators({q:q||undefined,cursor:cursor||undefined,limit:"24"},signal),[q,cursor]);
  function search(event:FormEvent){
    event.preventDefault();
    const next=new URLSearchParams();
    if(draft.trim())next.set("q",draft.trim());
    setParams(next);
  }
  return <div className="portal-creators">
    <PortalHeading eyebrow="CREATOR CHANNELS / ORIGINAL WORK" title="MEET THE" accent="MAKERS." description="Discover the people behind the games, apps, creative experiments and useful software. Real work comes first. No fabricated followers or channels." index="CREATORS / 002" action={{to:"/create",label:"MAKE YOUR FIRST PROJECT"}}/>
    <div className="portal-browse-layout">
      <div className="portal-browse-main">
        <section className="portal-box portal-search-hall">
          <header className="portal-box-header"><div><span className="kicker">PUBLIC CREATOR DIRECTORY</span><h2>FIND YOUR PEOPLE</h2></div><span className="portal-hall-stamp">CHANNELS / ACTIVE</span></header>
          <form className="portal-wide-search" role="search" onSubmit={search}>
            <input type="search" aria-label="Search published creators" placeholder="SEARCH CREATOR NAMES..." maxLength={80} value={draft} onChange={e=>setDraft(e.target.value)}/>
            <button type="submit">FIND MAKERS ↗</button>
          </form>
        </section>
        {data.state==="loading"&&<LoadingState label="Finding actual published creators"/>}
        {data.state==="error"&&<ErrorState title="CREATOR CHANNELS UNAVAILABLE" detail="The real public directory could not be loaded. We do not substitute demo profiles."/>}
        {data.state==="ready"&&<>
          <div className="portal-result-toolbar"><div><span className="kicker">ORIGINAL PEOPLE / ORIGINAL PROJECTS</span><strong>{data.data.items.length} VERIFIED CREATOR {data.data.items.length===1?"CHANNEL":"CHANNELS"} ON THIS PAGE</strong></div>{(q||cursor)&&<Link className="portal-toolbar-link" to="/creators">CLEAR SEARCH</Link>}</div>
          {data.data.items.length?
            <section aria-label="Published creator channels" className="portal-creator-grid">{data.data.items.map((c,i)=>
              <Link className="portal-creator-tile" to={"/creators/"+encodeURIComponent(c.handle)} key={c.handle}>
                <span className="portal-creator-tile-top"><span>CREATOR CHANNEL</span><span>{String(i+1).padStart(2,"0")} / ORBIT</span></span>
                <span className="portal-creator-avatar" aria-hidden="true"><OrbitalMark/></span>
                <span className="portal-creator-tile-name">{c.displayName}</span>
                <span className="portal-creator-tile-meta">@{c.handle} · {c.publishedProjects} PUBLISHED {c.publishedProjects===1?"PROJECT":"PROJECTS"}</span>
                <span className="portal-creator-tile-cta">VISIT CHANNEL <span aria-hidden="true">↗</span></span>
              </Link>
            )}</section>:
            <div className="portal-true-empty"><span className="portal-empty-symbol" aria-hidden="true">✳</span>
              <div><span className="kicker">A BLANK PAGE IS NOT A FAKE COMMUNITY</span><h2>{q?"NO MATCHING MAKERS YET.":"THE FIRST MAKERS ARE ON THEIR WAY."}</h2>
                <p>Creator channels become visible with staff-approved original work. Search another name or explore the real project catalogue.</p><div className="portal-empty-actions"><Link className="button secondary" to="/creators">ALL CREATORS</Link><Link className="button secondary" to="/discover">EXPLORE PROJECTS</Link><Link className="button secondary" to="/guide">FREE FIELD GUIDE</Link></div>
              </div></div>}
          <PageNav route="/creators" search={params} nextCursor={data.data.nextCursor} label="Creator directory"/>
        </>}
      </div>
      <aside className="portal-sidebar">
        <LevelPanel compact/>
        <section className="portal-sidebox"><span className="kicker">THE CREATOR CODE</span><h2>BUILD SOMETHING REAL.</h2><p>Every creator gets a space for published work. Earn achievement recognition through verified participation, independent of follower counts and spending.</p><Link to="/levels" className="portal-sidebox-link">DISCOVER THE LEVEL SYSTEM →</Link></section>
        <section className="portal-sidebox"><span className="kicker">OPEN TO MORE THAN CODERS</span><h2>INDIE IS FOR EVERYONE.</h2><p>Games, utilities, artwork, music-adjacent experiences, AI experiments and open-source ideas can all be part of the network when genuinely owned and disclosed.</p><Link to="/create" className="portal-sidebox-link">BECOME A CREATOR →</Link></section>
      </aside>
    </div>
  </div>;
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
  // Public profile/achievement detail is optional; it uses the existing
  // anonymous-readable staging endpoint and never gates the public catalogue.
  const channel=useResource(async signal=>{
    if(!/^[a-z][a-z0-9_]{2,29}$/.test(handle))return null;
    try{return await memberCreatorProfile(handle,signal);}catch{return null;}
  },[handle]);
  if(data.state==="loading")return <LoadingState label="Opening a real creator channel"/>;
  if(data.state==="error")return <ErrorState title="CREATOR NOT AVAILABLE" detail="This creator has no available public profile, or the public catalogue cannot be reached."/>;
  const {profile,projects}=data.data;
  const path="/creators/"+encodeURIComponent(handle);
  const current=path+(params.size?"?"+params.toString():"");
  const detailed=channel.state==="ready"?channel.data:null;
  const earned=detailed?.achievements?.filter(a=>a.earned)||[];
  return <div className="portal-creator-channel">
    <Link to="/creators" className="project-return">← ALL PUBLIC CREATORS</Link>
    <section className="portal-channel-banner">
      <div className="portal-channel-avatar" aria-hidden="true"><OrbitalMark/></div>
      <div className="portal-channel-identity">
        <span className="kicker">ANEVUM / PUBLIC CREATOR CHANNEL</span>
        <h1>{profile.displayName}</h1><p className="portal-channel-handle">@{profile.handle}</p>
        <p className="portal-channel-bio">{detailed?.creator.bio||"An independent creator sharing approved work on ANEVUM."}</p>
        <div className="portal-channel-stats"><span><strong>{profile.publishedProjects}</strong> PUBLISHED PROJECT{profile.publishedProjects===1?"":"S"}</span>
          {detailed&&<><span><strong>{detailed.contributions.ratings}</strong> VERIFIED RATINGS</span><span><strong>{earned.length}</strong> EARNED ACHIEVEMENTS</span></>}
        </div>
      </div>
      <div className="portal-channel-badge" aria-hidden="true">CREATOR<br/>IN ORBIT</div>
    </section>
    <div className="portal-browse-layout portal-channel-content">
      <div className="portal-browse-main">
        <section className="portal-box">
          <header className="portal-box-header"><div><span className="kicker">ORIGINAL WORK / PUBLIC RELEASES</span><h2>FROM THIS MAKER</h2></div><span className="portal-hall-stamp">{profile.publishedProjects} RELEASES</span></header>
          {projects.items.length?
            <div className="portal-discover-results">{projects.items.map(p=><ProjectCard key={p.id} project={p} returnTo={current}/>)}</div>:
            <EmptyState title={cursor?"NO MORE PUBLIC RELEASES":"NO PUBLIC RELEASES AVAILABLE"} detail="Only currently approved published projects appear here. Private drafts cannot be browsed."/>}
          <PageNav route={path} search={params} nextCursor={projects.nextCursor} label="Creator project releases"/>
        </section>
      </div>
      <aside className="portal-sidebar">
        {detailed&&<section className="portal-sidebox portal-creator-level">
          <span className="kicker">EARNED ORBIT / SERVER VERIFIED</span><h2>LEVEL {detailed.progression.level}</h2>
          <p>{detailed.progression.artifact||"NEW ARTIFACT SERIES IN DEVELOPMENT"} · {detailed.progression.xp.toLocaleString()} XP</p>
          <div className="portal-level-progress" role="progressbar" aria-label="Creator earned level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(detailed.progression.progressWithinLevel*100)}><span style={{width:Math.max(0,Math.min(100,detailed.progression.progressWithinLevel*100))+"%"}}/></div>
          <small>Levels never change voting strength or grant moderation access.</small>
        </section>}
        <section className="portal-sidebox">
          <span className="kicker">CREATOR ACHIEVEMENT CABINET</span><h2>EARNED, NOT BOUGHT.</h2>
          {detailed?
            earned.length?<div className="portal-earned-achievements">{earned.map(a=><div key={a.key}><span aria-hidden="true">{a.symbol}</span><span><strong>{a.name}</strong><small>{a.description}</small></span></div>)}</div>:
              <p>No public achievements have been earned yet.</p>:
            <p>Achievement details are available where the public member-profile service is active. This listing does not invent badges.</p>}
          <Link to="/levels" className="portal-sidebox-link">LEVELS & ACHIEVEMENTS →</Link>
        </section>
        <section className="portal-sidebox"><span className="kicker">DISCOVER MORE</span><h2>KEEP EXPLORING.</h2><p>Follow the work itself: visit projects, try demos hosted by their creators, and find original things worth returning to.</p><Link className="portal-sidebox-link" to="/discover">BACK TO THE PORTAL →</Link></section>
      </aside>
    </div>
  </div>;
}
