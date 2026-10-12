import { Link } from "react-router-dom";
import { readCategories, readProjects, readStatus } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ProjectCard } from "../components/ProjectCard";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { OrbitalMark } from "../components/OrbitalMark";
import { Icon } from "../components/Icons";

const categoryNames: Record<string,string> = {
  games:"GAMES + PLAY",tools:"APPS + TOOLS",creative:"CREATIVE",libraries:"OPEN SOURCE",automation:"AUTOMATION",research:"RESEARCH",learning:"LEARNING",other:"OTHER"
};

export function HomePage() {
  const data = useResource(async signal => {
    const [status, projects, categories] = await Promise.all([readStatus(signal), readProjects({limit:"8"}, signal), readCategories(signal)]);
    return { status, projects, categories };
  }, []);

  return <>
    <section className="hero-poster">
      <div className="poster-noise" aria-hidden="true" />
      <div className="hero-copy">
        <span className="kicker">INDEPENDENT CREATOR NETWORK / EST. 2026</span>
        <h1><span>MAKE</span><span className="hot">SHARE</span><span>PLAY</span><span className="violet">BELONG</span></h1>
        <p>A world of things people make. Games, useful apps, AI experiences, open-source tools and digital experiments — made by people worth discovering.</p>
        <div className="hero-actions"><Link className="button primary" to="/discover">EXPLORE THE WORK <Icon name="arrow" size={17}/></Link><Link className="button secondary" to="/creators">MEET CREATORS</Link></div>
      </div>
      <div className="hero-emblem" aria-hidden="true"><OrbitalMark className="hero-mark"/><span className="hero-stamp">IDEAS<br/>PEOPLE<br/>PLACES<br/>IN ORBIT</span></div>
      <div className="hero-corner hero-corner-left">ANEVUM<br/>ORBITAL UNDERGROUND</div>
      <div className="hero-corner hero-corner-right">CREATE / PLAY / CONTRIBUTE</div>
      <div className="hero-tape">CREATIVES BEYOND GROUND</div>
    </section>

    {data.state === "loading" && <LoadingState />}
    {data.state === "error" && <ErrorState />}
    {data.state === "ready" && <>
      <section className="metrics-rack" aria-label="Public catalogue counts">
        <div><strong>{data.data.status.counts.publishedProjects}</strong><span>PUBLISHED PROJECTS</span></div>
        <div><strong>{data.data.status.counts.publishedCreators}</strong><span>PUBLISHED CREATORS</span></div>
        <div><strong>V1</strong><span>BUILDING IN PUBLIC</span></div>
        <div><strong>FREE</strong><span>MEANINGFUL PARTICIPATION</span></div>
      </section>

      <div className="section-heading"><div><span className="kicker">FIND YOUR CORNER</span><h2>EXPLORE THE NETWORK</h2></div><Link to="/discover">VIEW EVERYTHING <Icon name="arrow" size={15}/></Link></div>
      <section className="category-rack">
        {data.data.categories.categories.length ? data.data.categories.categories.slice(0,6).map((item,index)=><Link key={item.category} to={`/discover?category=${item.category}`} className={`category-poster category-${index%4}`}><span className="category-index">0{index+1}</span><OrbitalMark className="category-mark"/><strong>{categoryNames[item.category]||item.category}</strong><small>{item.count} PUBLISHED</small></Link>) : <div className="category-placeholder"><strong>CATEGORIES ACTIVATE WITH REAL WORK</strong><span>No fake catalogue counts.</span></div>}
      </section>

      <div className="section-heading"><div><span className="kicker">LATEST SIGNAL</span><h2>PUBLISHED WORK</h2></div><Link to="/discover">OPEN DISCOVER <Icon name="arrow" size={15}/></Link></div>
      {data.data.projects.items.length ? <section className="project-grid">{data.data.projects.items.map(project=><ProjectCard key={project.id} project={project} returnTo="/"/>)}</section> : <EmptyState title="THE FIRST PROJECTS ARE STILL AHEAD" detail="ANEVUM will show genuine approved work here. No fake projects, ratings or activity will be used to make the network look busy."/>}

      <section className="manifesto-grid">
        <article className="manifesto-card manifesto-accent"><span className="kicker">WHY ANEVUM</span><h2>NOT ANOTHER APP STORE.</h2><p>Projects have people behind them. Follow the maker, understand the work, give useful feedback, contribute, and come back when it changes.</p></article>
        <article className="manifesto-card"><span className="kicker">CREATOR V1</span><h2>MAKE SOMETHING WORTH FINDING.</h2><p>Creator submission, moderation, profiles, reviews, saves and earned recognition are being accepted in staging before public access opens.</p><Link className="text-action" to="/status">SEE WHAT IS BEING BUILT <Icon name="arrow" size={14}/></Link></article>
        <article className="manifesto-card manifesto-violet"><span className="kicker">NO PAYWALL TO BELONG</span><h2>SHOW UP. HELP. EARN YOUR PLACE.</h2><p>Progression is designed around legitimate participation — not purchased status, fake engagement or forced daily check-ins.</p></article>
      </section>
    </>}
  </>;
}
