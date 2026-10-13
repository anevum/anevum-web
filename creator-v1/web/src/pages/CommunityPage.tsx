import {Link} from "react-router-dom";
import {readCreators,readProjects,readStatus} from "../lib/api";
import {useResource} from "../lib/useResource";
import {PortalHeading} from "../components/PortalHeading";
import {LevelPanel} from "../components/LevelPanel";
import {ProjectCard} from "../components/ProjectCard";
import {OrbitalMark} from "../components/OrbitalMark";
import {CosmicIllustration} from "../components/CosmicIllustration";
import {LoadingState,ErrorState} from "../components/States";

const rooms=[
  {name:"THE ARCADE",tag:"GAMES / PLAY",category:"games",description:"Talk games, discover indie experiments and exchange useful playtesting feedback.",symbol:"✦"},
  {name:"THE WORKSHOP",tag:"APPS / OPEN SOURCE",category:"tools",description:"Build software, improve projects and share what actually works.",symbol:"⌘"},
  {name:"THE LAB",tag:"EXPERIMENTS / AI",category:"creative",description:"Discuss original creative experiments and responsible AI-assisted work.",symbol:"✳"},
  {name:"THE COMMON THREAD",tag:"PEOPLE / COLLABORATION",category:"libraries",description:"Open contributions, lessons learned and useful independent creations.",symbol:"⟡"}
] as const;

export function CommunityPage(){
  const data=useResource(async signal=>{
    const [status,projects,creators]=await Promise.all([
      readStatus(signal),readProjects({limit:"4"},signal),readCreators({limit:"4"},signal)
    ]);
    return {status,projects,creators};
  },[]);
  return <div className="portal-community-page">
    <PortalHeading eyebrow="ANEVUM / PEOPLE BEHIND THE WORK" title="FIND YOUR" accent="PEOPLE." description="A future home for discussion, feedback, challenges, and collaborations. For now, discover genuine makers and their work while moderation and community features are tested." index="COMMUNITY / 003" action={{to:"/levels",label:"HOW PARTICIPATION EARNS RECOGNITION"}}/>
    <div className="portal-community-notice" role="status"><span className="portal-community-notice-mark" aria-hidden="true">!</span><div><strong>THE PUBLIC MESSAGE BOARD IS NOT OPEN YET.</strong><p>These rooms are navigation and roadmap previews, not live discussion threads. No messages, likes, users, or engagement totals have been fabricated.</p></div><Link to="/status">BUILD STATUS ↗</Link></div>
    <div className="portal-layout">
      <div className="portal-main">
        <section className="portal-box">
          <header className="portal-box-header"><div><span className="kicker">THE MEETING POINTS / IN DEVELOPMENT</span><h2>FIND YOUR CORNER</h2></div><span className="portal-hall-stamp">COMMUNITY ROOMS / PLANNED</span></header>
          <div className="portal-room-grid">{rooms.map((room,i)=><article className="portal-room" key={room.name}><div className="cw-room-world" aria-hidden="true"><CosmicIllustration scene={room.category}/></div>
            <div className="portal-room-top"><span aria-hidden="true">{room.symbol}</span><small>ROOM {String(i+1).padStart(2,"0")} / PLANNED</small></div>
            <strong>{room.name}</strong><span>{room.tag}</span><p>{room.description}</p>
            <Link to={"/discover?category="+encodeURIComponent(room.category)}>EXPLORE REAL WORK ↗</Link>
          </article>)}</div>
        </section>
        {data.state==="loading"&&<LoadingState label="Checking the public creation network"/>}
        {data.state==="error"&&<ErrorState title="LIVE PROJECT SIGNAL UNAVAILABLE" detail="The community roadmap is visible, but real project data could not be loaded."/>}
        {data.state==="ready"&&<>
          <section className="portal-box">
            <header className="portal-box-header"><div><span className="kicker">REAL WORK / START HERE</span><h2>DISCOVER SOMETHING TO DISCUSS</h2></div><Link to="/discover">ALL PROJECTS ↗</Link></header>
            {data.data.projects.items.length?<div className="portal-shelf-projects">{data.data.projects.items.map(project=><ProjectCard key={project.id} project={project} returnTo="/community"/>)}</div>:
              <div className="portal-side-empty portal-community-empty"><OrbitalMark/><p>There are no publicly approved projects to discuss yet. That is the real catalogue state, not a placeholder community feed.</p><Link to="/status">FOLLOW DEVELOPMENT →</Link></div>}
          </section>
          <section className="portal-box">
            <header className="portal-box-header"><div><span className="kicker">PEOPLE / VERIFIED PUBLIC CHANNELS</span><h2>MEET SOME MAKERS</h2></div><Link to="/creators">CREATOR DIRECTORY →</Link></header>
            {data.data.creators.items.length?<div className="portal-community-creators">{data.data.creators.items.map(c=><Link to={"/creators/"+encodeURIComponent(c.handle)} key={c.handle}><span className="portal-community-creator-icon" aria-hidden="true"><OrbitalMark/></span><span><strong>{c.displayName}</strong><small>@{c.handle} / {c.publishedProjects} APPROVED RELEASES</small></span><span aria-hidden="true">↗</span></Link>)}</div>:
              <p className="portal-community-creator-empty">Public creator channels will appear after real approved releases, never through dummy accounts.</p>}
          </section>
        </>}
      </div>
      <aside className="portal-sidebar">
        <LevelPanel compact/>
        <section className="portal-sidebox"><span className="kicker">THE RULES / COMMUNITY CULTURE</span><h2>HELP EACH OTHER MAKE BETTER THINGS.</h2>
          <div className="portal-community-values"><p><strong>BE SPECIFIC.</strong> Useful feedback beats empty scores.</p><p><strong>CREDIT THE WORK.</strong> Disclose AI assistance and respect licenses.</p><p><strong>STAY ACCESSIBLE.</strong> Free and phone-friendly participation matters.</p><p><strong>EARN RESPECT.</strong> XP never purchases authority or stronger votes.</p></div>
        </section>
        <section className="portal-sidebox"><span className="kicker">WHAT'S NEXT</span><h2>REAL CONVERSATIONS, REAL MODERATION.</h2><p>Public discussions, following, reporting, community guidelines and abuse handling need independent acceptance before opening.</p><Link to="/guide" className="portal-sidebox-link">PRACTICE USEFUL FEEDBACK →</Link><Link to="/status" className="portal-sidebox-link">SEE THE ROADMAP →</Link></section>
      </aside>
    </div>
  </div>;
}
