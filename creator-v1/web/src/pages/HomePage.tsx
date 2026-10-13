import {Link} from "react-router-dom";
import {readCategories,readCreators,readProjects,readStatus} from "../lib/api";
import {useResource} from "../lib/useResource";
import {ProjectCard} from "../components/ProjectCard";
import {PortalShelf} from "../components/PortalShelf";
import {LevelPanel} from "../components/LevelPanel";
import {OrbitalStage} from "../components/OrbitalStage";
import {OrbitalMark} from "../components/OrbitalMark";
import {ErrorState,LoadingState} from "../components/States";

const shelves=[
  {eyebrow:"01 / INDEPENDENT PLAY",title:"GAMES",category:"games",description:"Playable games, demos and interactive experiences belong here.",icon:"✦"},
  {eyebrow:"02 / THINGS THAT WORK",title:"APPS & TOOLS",category:"tools",description:"Useful independent software, utilities and applications belong here.",icon:"⌘"},
  {eyebrow:"03 / THE EXPERIMENTAL EDGE",title:"CREATIVE / AI",category:"creative",description:"Artwork and experimental projects, including honestly disclosed AI-assisted creations, belong here.",icon:"✳"},
  {eyebrow:"04 / BUILD IN THE OPEN",title:"OPEN SOURCE",category:"libraries",description:"Shared libraries and public-code projects with truthful rights information belong here.",icon:"⟡"}
] as const;

export function HomePage(){
  const portal=useResource(async signal=>{
    const [status,latest,categories,creators,...categoriesProjects]=await Promise.all([
      readStatus(signal),readProjects({limit:"6"},signal),readCategories(signal),
      readCreators({limit:"4"},signal),
      ...shelves.map(s=>readProjects({category:s.category,limit:"4"},signal))
    ]);
    return {status,latest,categories,creators,categoriesProjects};
  },[]);
  return <div className="portal-home">
    <section className="portal-welcome" aria-labelledby="portal-home-title">
      <div className="portal-welcome-copy"><span className="kicker">ANEVUM / THE INDEPENDENT CREATOR UNDERGROUND</span>
        <h1 id="portal-home-title">A WORLD OF<br/><em>THINGS PEOPLE MAKE.</em></h1>
        <p>PLAY IT. TRY IT. MAKE IT. SHARE IT. Games, software, AI experiences and independent creations worth discovering.</p>
        <div className="portal-welcome-buttons"><Link className="button primary" to="/discover">EXPLORE THE WORK ↗</Link><Link className="button secondary" to="/create">SUBMIT YOUR PROJECT</Link></div>
        <span className="portal-welcome-mantra">MAKE · SHARE · PLAY · BELONG</span>
      </div>
      <div className="portal-welcome-emblem" aria-hidden="true"><OrbitalStage variant="hero"/><span>CREATIVE<br/>BEYOND<br/>GROUND</span></div>
    </section>
    {portal.state==="loading"&&<LoadingState label="Loading the real public catalogue"/>}
    {portal.state==="error"&&<ErrorState title="PORTAL DATA UNAVAILABLE" detail="Live public projects and creators could not be loaded. Try again shortly."/>}
    {portal.state==="ready"&&<>
      <div className="portal-stats" aria-label="Public catalogue counts">
        <span><b>{portal.data.status.counts.publishedProjects}</b> PUBLISHED PROJECTS</span>
        <span><b>{portal.data.status.counts.publishedCreators}</b> PUBLIC CREATORS</span>
        <span><b>{portal.data.categories.categories.length}</b> ACTIVE CATEGORIES</span>
        <span className="portal-stats-proof">GENUINE RELEASES ONLY / NO FABRICATED ACTIVITY</span>
      </div>
      <div className="portal-layout">
        <div className="portal-main">
          <section className="portal-box">
            <header className="portal-box-header"><div><span className="kicker">FRESH SIGNAL / NEWEST APPROVED WORK</span><h2>RECENT RELEASES</h2></div><Link to="/discover">EXPLORE ALL →</Link></header>
            {portal.data.latest.items.length?
              <div className="portal-recent-grid">{portal.data.latest.items.map(p=><ProjectCard key={p.id} project={p} returnTo="/"/>)}</div>:
              <div className="portal-new-release-empty">
                <span className="portal-new-release-stamp">FIRST WAVE / WAITING</span>
                <div><strong>THE FIRST PUBLIC RELEASES ARE STILL AHEAD.</strong>
                  <p>No fake projects, ratings or activity. This space fills with genuine approved work, never demonstration accounts.</p>
                </div><Link to="/status">SEE THE ROADMAP ↗</Link>
              </div>}
          </section>
          {shelves.map((s,i)=><PortalShelf key={s.category} {...s} projects={portal.data.categoriesProjects[i].items}/>)}
          <section className="portal-footer-panel"><div><span className="kicker">THIS IS YOUR UNDERGROUND, TOO</span><h2>THE NEXT GREAT RELEASE COULD BE YOURS.</h2><p>Share independent work, try new ideas, and make real contributions. Free meaningful participation is a permanent goal of ANEVUM.</p></div><Link className="button primary" to="/status">WHAT'S COMING ↗</Link></section>
        </div>
        <aside className="portal-sidebar" aria-label="Community and member information">
          <LevelPanel/>
          <section className="portal-sidebox">
            <header><span className="kicker">PEOPLE BEHIND THE PROJECTS</span><h2>CREATOR CHANNELS</h2></header>
            {portal.data.creators.items.length?
              <div className="portal-creator-entries">{portal.data.creators.items.map((c,i)=><Link to={"/creators/"+encodeURIComponent(c.handle)} key={c.handle}>
                <span className="portal-creator-number">{String(i+1).padStart(2,"0")}</span>
                <span><strong>{c.displayName}</strong><small>@{c.handle} · {c.publishedProjects} RELEASES</small></span>
                <span aria-hidden="true">↗</span>
              </Link>)}</div>:
              <div className="portal-sidebar-empty"><strong>CREATORS ARE ON THE WAY.</strong><p>Channels open here after actual approved projects are published.</p></div>}
            <Link className="portal-sidebox-link" to="/creators">MEET THE MAKERS →</Link>
          </section>
          <section className="portal-sidebox portal-messageboard">
            <header><span className="kicker">COMMUNITY / BUILDING</span><h2>THE MESSAGE BOARD</h2></header>
            <p>Find collaborators, discuss games, give useful feedback, and share what you are creating. Public discussions are not live yet.</p>
            <Link className="portal-sidebox-link" to="/community">COMMUNITY DEVELOPMENT →</Link>
          </section>
          <section className="portal-sidebox"><header><span className="kicker">WAYS TO TAKE PART</span><h2>PLAY. BUILD. CONTRIBUTE.</h2></header>
            <div className="portal-steps"><div><strong>01 / DISCOVER</strong><p>Find something worth trying.</p></div><div><strong>02 / PARTICIPATE</strong><p>Share feedback and original work.</p></div><div><strong>03 / EARN YOUR PLACE</strong><p>Collect verified XP and achievements.</p></div></div>
            <Link className="portal-sidebox-link" to="/levels">UNLIMITED LEVELS & ARTIFACTS →</Link>
          </section>
          <section className="portal-sidebox portal-side-seal"><OrbitalMark/><span>ANEVUM<br/>CREATIVES BEYOND GROUND.</span></section>
        </aside>
      </div>
    </>}
  </div>;
}
