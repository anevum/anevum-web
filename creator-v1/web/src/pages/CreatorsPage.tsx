import {FormEvent,useEffect,useState} from "react";
import {Link,Navigate,useParams,useSearchParams} from "react-router-dom";
import {readCreator,readCreators,readProjects} from "../lib/api";
import {memberCreatorProfile} from "../lib/member-api";
import {canonicalPublic} from "../lib/canonical-beta";
import {resolveCreatorRoute} from "../lib/creator-route";
import {useResource} from "../lib/useResource";
import {ProjectCard} from "../components/ProjectCard";
import {CompactMemberIdentity} from "../components/CompactMemberIdentity";
import {PageNav} from "../components/PageNav";
import {PortalHeading} from "../components/PortalHeading";
import {LevelPanel} from "../components/LevelPanel";
import {EmptyState,ErrorState,LoadingState} from "../components/States";
import {CelestialEmblem} from "../components/CelestialEmblem";
import {achievementMotif,seriesOneMotif} from "../lib/artifact-art";
import {ContextDiscussions} from "../components/ContextDiscussions";
import {Icon} from "../components/Icons";
import {OrbitalMark} from "../components/OrbitalMark";
import {creatorChannelPath,creatorDirectoryReturnPath,safeReturnPath} from "../lib/navigation";

export function CreatorsPage(){
  const [params,setParams]=useSearchParams();
  const q=params.get("q")||"",cursor=params.get("cursor")||"";
  // The URL owns layout, search and cursor: Back, Forward and shared links
  // restore the same directory instead of a second optimistic state.
  const view=params.get("view")==="list"?"list":"grid";
  const directoryReturn=safeReturnPath("/creators"+(params.size?"?"+params.toString():""));
  const clearHref=view==="list"?"/creators?view=list":"/creators";
  const [draft,setDraft]=useState(q);
  useEffect(()=>setDraft(q),[q]);
  const data=useResource(signal=>readCreators({q:q||undefined,cursor:cursor||undefined,limit:"24"},signal),[q,cursor]);
  function submitSearch(value:string){
    const next=new URLSearchParams();
    const term=value.trim().slice(0,80);
    if(term)next.set("q",term);
    if(view==="list")next.set("view","list");
    // A different search cannot inherit an old pagination cursor.
    setParams(next);
  }
  function search(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const field=event.currentTarget.elements.namedItem("q") as HTMLInputElement|null;
    submitSearch(field?.value??draft);
  }
  function chooseView(nextView:"grid"|"list"){
    const next=new URLSearchParams(params);
    if(nextView==="list")next.set("view","list");
    else next.delete("view");
    // Layout changes keep the approved data query and cursor untouched.
    setParams(next);
  }
  return <div className="portal-creators p136-creators" data-parity-creators="v136.017" data-directory-phase="v136.025">
    {import.meta.env.VITE_PARITY_V136_FULL==="true"?<section className="p136-creators-hero" aria-labelledby="p136-creators-hero-title">
      <div className="p136-creators-hero-copy">
        <span className="p136-creators-register">ANEVUM / APPROVED CREATOR CHANNELS</span>
        <h1 id="p136-creators-hero-title">Meet the people <em>building what comes next.</em></h1>
        <p>Browse real creator channels associated with approved public work. Private accounts and unapproved projects are never listed.</p>
        <nav className="p136-creators-hero-actions" aria-label="Explore creator spaces">
          <a href="#p136-creators-index">Find creators <Icon name="search" size={16}/></a>
          <Link to="/community?view=people">Community spaces <Icon name="people" size={16}/></Link>
          <Link to="/studio">Open Creator Studio <Icon name="arrow" size={16}/></Link>
        </nav>
      </div>
      <aside className="p136-creators-register-panel" aria-label="Public channel index information">
        <span>PUBLIC CHANNEL DIRECTORY / APPROVED WORK</span>
        <strong>{data.state==="ready"?data.data.items.length:"—"}</strong>
        <p>{data.state==="error"?"The directory could not be loaded.":data.state==="loading"?"Reading the public creator index…":"Public channels with approved work on this page, not a sitewide member count."}</p>
        <Link to="/discover">Explore public work <Icon name="arrow" size={15}/></Link>
      </aside>
    </section>:<PortalHeading eyebrow="CREATOR CHANNELS / ORIGINAL WORK" title="MEET THE" accent="MAKERS." description="Discover the people behind the games, apps, creative experiments and useful software. Real work comes first. No fabricated followers or channels." index="CREATORS / 002" action={{to:"/studio",label:"MAKE YOUR FIRST PROJECT"}}/>}
    <div className="portal-browse-layout">
      <div className="portal-browse-main">
        <section className="portal-box portal-search-hall" id="p136-creators-index">
          <header className="portal-box-header"><div><span className="kicker">PUBLIC CREATOR DIRECTORY</span><h2>FIND YOUR PEOPLE</h2></div><span className="portal-hall-stamp">CHANNELS / VERIFIED PUBLIC</span></header>
          <form className="portal-wide-search p136-creators-search" role="search" action="/creators" method="get" onSubmit={search}>
            <label htmlFor="p136-creator-query" className="visually-hidden">Search published creators</label>
            <span className="p136-creators-search-icon" aria-hidden="true"><Icon name="search" size={19}/></span>
            <input id="p136-creator-query" name="q" type="search" aria-label="Search published creators" placeholder="Search creators..." maxLength={80}
              value={draft} onChange={event=>setDraft(event.target.value)}
              onKeyDown={event=>{
                if(event.key==="Enter"&&!event.nativeEvent.isComposing){
                  event.preventDefault();submitSearch(event.currentTarget.value);
                }
              }}/>
            <button type="submit" onClick={event=>{
              event.preventDefault();
              const field=event.currentTarget.form?.elements.namedItem("q") as HTMLInputElement|null;
              submitSearch(field?.value??draft);
            }}>Find creators <Icon name="arrow" size={16}/></button>
          </form>
        </section>
        {data.state==="loading"&&<LoadingState label="Finding actual published creators"/>}
        {data.state==="error"&&<ErrorState title="CREATOR CHANNELS UNAVAILABLE" detail="The real public directory could not be loaded. We do not substitute demo profiles."/>}
        {data.state==="ready"&&<>
          <div className="portal-result-toolbar p136-creators-result-toolbar">
            <div><span className="kicker">PUBLIC INDEX / CHANNELS WITH APPROVED WORK</span>
              <strong role="status">{data.data.items.length} published {data.data.items.length===1?"creator channel":"creator channels"} on this page</strong>
            </div>
            <div className="p136-creators-result-actions">
              <div className="p136-creators-view-switch" role="group" aria-label="Choose creator directory layout">
                <button type="button" aria-pressed={view==="grid"} className={view==="grid"?"is-active":""} onClick={()=>chooseView("grid")}>Grid</button>
                <button type="button" aria-pressed={view==="list"} className={view==="list"?"is-active":""} onClick={()=>chooseView("list")}>List</button>
              </div>
              {(q||cursor)&&<Link className="portal-toolbar-link" to={clearHref}>Clear search</Link>}
            </div>
          </div>
          {data.data.items.length?
            <section aria-label="Published creator channels" className="portal-creator-grid" data-layout={view}>{data.data.items.map((c,i)=>
              <Link className="portal-creator-tile" to={creatorChannelPath(c.handle,directoryReturn)} key={c.handle}>
                <span className="portal-creator-tile-top"><span>CREATOR CHANNEL</span><span>{String(i+1).padStart(2,"0")} / RESULT</span></span>
                <CompactMemberIdentity interactive={false} size="standard" className="av65-directory-channel" member={{handle:c.handle,displayName:c.displayName,avatar:false,level:null,featuredAwards:[],source:'creator-channel'}}/>
                <span className="portal-creator-tile-meta">{c.publishedProjects} PUBLISHED {c.publishedProjects===1?"PROJECT":"PROJECTS"}</span>
                <span className="portal-creator-tile-cta">VISIT CHANNEL <span aria-hidden="true">↗</span></span>
              </Link>
            )}</section>:
            <div className="portal-true-empty p136-creators-empty" role="status">
              <span className="portal-empty-symbol" aria-hidden="true"><Icon name="search" size={30}/></span>
              <div><span className="kicker">PUBLIC DIRECTORY / VERIFIED DATA ONLY</span>
                <h2>{cursor?"No further channels on this page.":q?"No matching creators yet.":"No public creator channels yet."}</h2>
                <p>{cursor?"Return to the first page or refine your search.":q?"Try another name or browse all approved creators.":"Creator channels appear when their original work is approved for public release."} Private accounts and unpublished projects are not listed.</p>
                <div className="portal-empty-actions">
                  {(q||cursor)&&<Link className="button secondary" to={clearHref}>Browse all creators</Link>}
                  <Link className="button secondary" to="/discover">Explore published work</Link>
                  <Link className="button secondary" to="/guide">Publishing guide</Link>
                </div>
              </div>
            </div>}
          <PageNav route="/creators" search={params} nextCursor={data.data.nextCursor} label="Creator directory"/>
        </>}
      </div>
      <aside className="portal-sidebar">
        <LevelPanel compact/>
        <section className="portal-sidebox"><span className="kicker">THE CREATOR CODE</span><h2>BUILD SOMETHING REAL.</h2><p>Every creator gets a space for published work. Earn achievement recognition through verified participation, independent of follower counts and spending.</p><Link to="/levels" className="portal-sidebox-link">DISCOVER THE LEVEL SYSTEM →</Link></section>
        <section className="portal-sidebox"><span className="kicker">OPEN TO MORE THAN CODERS</span><h2>INDIE IS FOR EVERYONE.</h2><p>Games, utilities, artwork, music-adjacent experiences, AI experiments and open-source ideas can all be part of the network when genuinely owned and disclosed.</p><Link to="/studio" className="portal-sidebox-link">BECOME A CREATOR →</Link></section>
      </aside>
    </div>
  </div>;
}

export function CreatorPage(){
  const {handle=""}=useParams();
  return <CreatorIdentityPage key={handle} handle={handle}/>;
}
function CreatorIdentityPage({handle}:{handle:string}){
  const [params]=useSearchParams();
  const cursor=params.get("cursor")||"";
  const directoryReturn=creatorDirectoryReturnPath(params.get("from"));
  const data=useResource(async signal=>{
    const identity=await resolveCreatorRoute(handle,
      async()=>(await readCreator(handle,signal)).creator,
      ()=>canonicalPublic(handle,signal));
    if(identity.kind!=="channel")return identity;
    const projects=await readProjects({creator:handle,cursor:cursor||undefined,limit:"24"},signal);
    return {...identity,projects};
  },[handle,cursor]);
  // Independent public-member enhancements are optional for real Creator V1
  // channels. This client cannot grant roles, XP or publication permissions.
  const legacyChannelVerified=data.state==="ready"&&data.data.kind==="channel";
  const channel=useResource(async signal=>{
    if(!legacyChannelVerified||!/^[a-z][a-z0-9_]{2,29}$/.test(handle))return null;
    try{return await memberCreatorProfile(handle,signal);}catch{return null;}
  },[handle,legacyChannelVerified]);
  if(data.state==="loading")return <LoadingState label="Finding verified public identity"/>;
  if(data.state==="error")return <ErrorState title="CREATOR INDEX UNAVAILABLE" detail="The published creator index could not be reached. Try discovery or return later."/>;
  if(data.data.kind==="member")return <Navigate to={"/@"+encodeURIComponent(handle)} replace/>;
  if(data.data.kind==="missing")return <ErrorState title="NO PUBLIC CREATOR CHANNEL" detail="There is no published Creator V1 channel under this handle. Private member accounts remain protected; explore approved work instead."/>;
  const {profile,projects}=data.data;
  const path="/creators/"+encodeURIComponent(handle);
  const current=path+(params.size?"?"+params.toString():"");
  const detailed=channel.state==="ready"?channel.data:null;
  const earned=detailed?.achievements?.filter(a=>a.earned)||[];
  return <div className="portal-creator-channel p136-creator-channel" data-parity-profile="creator" data-channel-phase="v136.029">
    <Link to={directoryReturn} className="project-return">← ALL PUBLIC CREATORS</Link>
    <section className="portal-channel-banner">
      <div className="portal-channel-avatar" aria-hidden="true">{import.meta.env.VITE_PARITY_V136_FULL==="true"?<OrbitalMark/>:<span className="cw-letter-avatar">{profile.displayName.slice(0,1).toUpperCase()}</span>}</div>
      <div className="portal-channel-identity">
        <span className="kicker">ANEVUM / PUBLIC CREATOR CHANNEL</span>
        <h1>{profile.displayName}</h1><p className="portal-channel-handle">@{profile.handle}</p>
        <p className="portal-channel-bio">{detailed?.creator.bio||"An independent creator sharing approved work on ANEVUM."}</p>
        <div className="portal-channel-stats"><span><strong>{profile.publishedProjects}</strong> PUBLISHED PROJECT{profile.publishedProjects===1?"":"S"}</span>
          {detailed&&<><span><strong>{detailed.contributions.ratings}</strong> VERIFIED RATINGS</span><span><strong>{earned.length}</strong> EARNED ACHIEVEMENTS</span></>}
        </div>
      </div>
    </section>
    <nav className="p136-profile-wayfinder" aria-label="Public creator channel sections">
      <a href="#p136-creator-releases">Published work <Icon name="explore" size={16}/></a>
      <a href="#p136-creator-discussions">Discussions <Icon name="community" size={16}/></a>
      <Link to="/community?view=people">Meet the community <Icon name="arrow" size={16}/></Link>
    </nav>
    <div className="portal-browse-layout portal-channel-content">
      <div className="portal-browse-main">
        <section className="portal-box" id="p136-creator-releases">
          <header className="portal-box-header"><div><span className="kicker">ORIGINAL WORK / PUBLIC RELEASES</span><h2>FROM THIS MAKER</h2></div><span className="portal-hall-stamp">{profile.publishedProjects} {profile.publishedProjects===1?"RELEASE":"RELEASES"}</span></header>
          {projects.items.length?
            <div className="portal-discover-results">{projects.items.map(p=><ProjectCard key={p.id} project={p} returnTo={current} presentation="editorial"/>)}</div>:
            <EmptyState title={cursor?"NO MORE PUBLIC RELEASES":"NO PUBLIC RELEASES AVAILABLE"} detail="Only currently approved published projects appear here. Private drafts cannot be browsed."/>}
          <PageNav route={path} search={params} nextCursor={projects.nextCursor} label="Creator project releases"/>
        </section>
        <div id="p136-creator-discussions"><ContextDiscussions creator={profile.handle}/></div>
      </div>
      <aside className="portal-sidebar">
        {detailed&&<section className="portal-sidebox portal-creator-level">
          <span className="kicker">EARNED ORBIT / SERVER VERIFIED</span>
          <div className="portal-channel-celestial">
            <CelestialEmblem motif={seriesOneMotif(detailed.progression.level,detailed.progression.artifact)} size="medium" state={detailed.progression.artifactEarned?"earned":"preview"}/>
            <div><h2>LEVEL {detailed.progression.level}</h2><strong>{detailed.progression.artifact||"NO NAMED ARTIFACT IN THIS SERIES"}</strong></div>
          </div>
          <p>{detailed.progression.artifact||"NEW ARTIFACT SERIES IN DEVELOPMENT"} · {detailed.progression.xp.toLocaleString()} XP</p>
          <div className="portal-level-progress" role="progressbar" aria-label="Creator earned level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(detailed.progression.progressWithinLevel*100)}><span style={{width:Math.max(0,Math.min(100,detailed.progression.progressWithinLevel*100))+"%"}}/></div>
          <small>Levels never change voting strength or grant moderation access.</small>
        </section>}
        <section className="portal-sidebox">
          <span className="kicker">CREATOR ACHIEVEMENT CABINET</span><h2>EARNED, NOT BOUGHT.</h2>
          {detailed?
            earned.length?<div className="portal-earned-achievements">{earned.map(a=><div key={a.key}><CelestialEmblem motif={achievementMotif(a.key)||"orbital"} size="small" state="earned"/><span><strong>{a.name}</strong><small>{a.description}</small></span></div>)}</div>:
              <p>No public achievements have been earned yet.</p>:
            <p>Achievement details are available where the public member-profile service is active. This listing does not invent badges.</p>}
          <Link to="/levels" className="portal-sidebox-link">LEVELS & ACHIEVEMENTS →</Link>
        </section>
        <section className="portal-sidebox"><span className="kicker">DISCOVER MORE</span><h2>KEEP EXPLORING.</h2><p>Follow the work itself: visit projects, try demos hosted by their creators, and find original things worth returning to.</p><Link className="portal-sidebox-link" to="/discover">BACK TO THE PORTAL →</Link></section>
      </aside>
    </div>
  </div>;
}
