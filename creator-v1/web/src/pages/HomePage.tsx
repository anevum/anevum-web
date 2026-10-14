import {Link} from "react-router-dom";
import {readCategories,readCreators,readProjects,readStatus} from "../lib/api";
import {useResource} from "../lib/useResource";
import {ProjectCard} from "../components/ProjectCard";
import {LevelPanel} from "../components/LevelPanel";
import {CelestialEmblem} from "../components/CelestialEmblem";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {CosmicScene} from "../components/CosmicIllustration";
import {Icon} from "../components/Icons";
import {ErrorState, LoadingState} from "../components/States";

const worlds: ReadonlyArray<{id:string;name:string;symbol:string;scene:CosmicScene;description:string}> = [
  {id:"games",name:"Games",symbol:"✧",scene:"games",description:"Play and discover independent experiences"},
  {id:"tools",name:"Apps",symbol:"⌘",scene:"tools",description:"Useful software made with imagination"},
  {id:"creative",name:"Art & AI",symbol:"✺",scene:"creative",description:"Explore digital art and creative experiments"},
  {id:"libraries",name:"Code",symbol:"⌘",scene:"libraries",description:"Open-source projects and shared tools"},
  {id:"automation",name:"Automation",symbol:"⟡",scene:"automation",description:"Make the difficult things easier"},
  {id:"learning",name:"Learning",symbol:"◇",scene:"learning",description:"Interactive lessons and experiences"},
  {id:"research",name:"Research",symbol:"✦",scene:"research",description:"Independent investigations and ideas"},
  {id:"other",name:"More",symbol:"◎",scene:"other",description:"Everything that defies a category"}
];
const artifactMotifs=["spark","key","atlas","light"] as const;

export function HomePage(){
  const portal=useResource(async signal=>{
    const [status,latest,categories,creators]=await Promise.all([
      readStatus(signal),readProjects({limit:"10"},signal),readCategories(signal),readCreators({limit:"5"},signal)
    ]);
    return {status,latest,categories,creators};
  },[]);
  const projects=portal.state==="ready"?portal.data.latest.items:[];
  const creators=portal.state==="ready"?portal.data.creators.items:[];
  const counts=new Map<string,number>(portal.state==="ready"?portal.data.categories.categories.map(x=>[x.category,x.count] as const):[]);

  return <div className="cw-home">
    <section className="cw-hero" aria-labelledby="cw-hero-title">
      <div className="cw-hero-art" aria-hidden="true"><CosmicArtwork scene="hero" priority/></div>
      <div className="cw-hero-shade" aria-hidden="true"/>
      <div className="cw-hero-inner">
        <div className="cw-hero-copy">
          <span className="cw-kicker">A CREATIVE UNIVERSE / THE INDEPENDENT CREATOR NETWORK</span>
          <h1 id="cw-hero-title">CREATE<br/>BEYOND<br/><em>WORLDS.</em></h1>
          <p>Games. Apps. Art. Experiments. Ideas worth trying.<br/>A universe for creators, built by creators.</p>
          <div className="cw-hero-actions">
            <Link to="/discover" className="cw-button cw-button--gold">EXPLORE WORLDS <Icon name="arrow" size={17}/></Link>
            <Link to="/start" className="cw-button cw-button--quiet">FIND YOUR PLACE</Link>
            <Link to="/atlas" className="cw-button cw-button--quiet cw-button--atlas">ENTER ATLAS <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <aside className="cw-hero-feature" aria-label="About our creative universe">
          <div className="cw-hero-feature-art"><CosmicArtwork scene="portal" priority/></div>
          <div className="cw-hero-feature-info">
            <span>THE TRANSCOSMIC ATMOSPHERE</span>
            <p>Beyond familiar boundaries. Explore original experiments and discoveries.</p>
            <Link to="/discover?category=creative" aria-label="Explore creative projects"><Icon name="arrow" size={18}/></Link>
          </div>
        </aside>
      </div>
    </section>

    <nav className="cw-world-strip" aria-label="Explore categories">
      <Link to="/discover" className="cw-world-strip-all"><span aria-hidden="true">◎</span><strong>All</strong></Link>
      {worlds.map(world=><Link key={world.id} to={"/discover?category="+world.id}><span aria-hidden="true">{world.symbol}</span><strong>{world.name}</strong></Link>)}
    </nav>

    <div className="cw-home-body">
      <section className="cw-collection" aria-labelledby="cw-featured-title">
        <header className="cw-section-header">
          <div><span className="cw-section-emblem" aria-hidden="true">✧</span><h2 id="cw-featured-title">FEATURED WORLDS</h2><p>{projects.length?"Newest approved projects from real independent creators.":"Explore the worlds that future creators can fill."}</p></div>
          <Link to="/discover">VIEW ALL <Icon name="arrow" size={16}/></Link>
        </header>
        {portal.state==="loading"&&<LoadingState label="Loading genuine public projects"/>}
        {portal.state==="error"&&<ErrorState title="PROJECT CATALOGUE UNAVAILABLE" detail="We could not read the real catalogue. No sample projects were substituted."/>}
        {portal.state==="ready"&&(projects.length?
          <div className="cw-project-grid">{projects.slice(0,5).map(project=><ProjectCard key={project.id} project={project} returnTo="/"/>)}</div>:
          <div className="cw-world-preview-grid">{worlds.slice(0,5).map(world=><Link key={world.id} className="cw-world-preview" to={"/discover?category="+world.id}>
            <div className="cw-world-preview-art"><CosmicArtwork scene={world.scene}/></div>
            <div className="cw-world-preview-label"><span>DISCOVER / {world.name.toUpperCase()}</span><strong>{world.description}</strong></div>
            <span className="cw-world-preview-cta">EXPLORE CATEGORY <Icon name="arrow" size={15}/></span>
          </Link>)}</div>)}
        {portal.state==="ready"&&<div className="cw-catalogue-footnote">{portal.data.status.counts.publishedProjects} GENUINE PUBLISHED PROJECTS · {portal.data.status.counts.publishedCreators} VERIFIED PUBLIC CREATOR CHANNELS · No fake projects, ratings or activity</div>}
      </section>

      <section className="cw-collection" aria-labelledby="cw-worlds-title">
        <header className="cw-section-header">
          <div><span className="cw-section-emblem" aria-hidden="true">✶</span><h2 id="cw-worlds-title">FIND YOUR NEXT WORLD</h2><p>Discover something to play, use, learn, or build upon.</p></div>
          <Link to="/discover">EXPLORE ALL <Icon name="arrow" size={16}/></Link>
        </header>
        <div className="cw-small-world-grid">{worlds.slice(0,5).map(world=><Link key={world.id} to={"/discover?category="+world.id} className="cw-small-world">
          <div aria-hidden="true" className="cw-small-world-image"><CosmicArtwork scene={world.scene}/></div>
          <div><strong>{world.name}</strong><small>{portal.state==="ready"?(counts.get(world.id)||0)+" PUBLISHED":world.description}</small></div>
          <Icon name="arrow" size={15}/>
        </Link>)}</div>
      </section>

      <div className="cw-home-columns">
        <section className="cw-home-module" aria-labelledby="cw-artifacts-title">
          <header className="cw-module-header"><div><span aria-hidden="true">✦</span><h2 id="cw-artifacts-title">CELESTIAL ARTIFACTS</h2></div><Link to="/levels">VIEW ALL →</Link></header>
          <p>Illustrated collectibles. Recognition is earned through real participation.</p>
          <div className="cw-artifact-showcase">{artifactMotifs.map((motif,i)=><Link key={motif} to="/levels" aria-label={"Preview Series One artifact "+(i+1)}><CelestialEmblem motif={motif} size="medium" state="preview"/><small>ART STUDY 0{i+1}</small></Link>)}</div>
          <div className="cw-module-foot"><LevelPanel compact/></div>
        </section>
        <section className="cw-home-module" aria-labelledby="cw-creators-title">
          <header className="cw-module-header"><div><span aria-hidden="true">♟</span><h2 id="cw-creators-title">FEATURED CREATORS</h2></div><Link to="/creators">VIEW ALL →</Link></header>
          <p>The real people sharing what they make.</p>
          {portal.state==="ready"&&creators.length?
            <div className="cw-creator-row">{creators.map(creator=><Link key={creator.handle} to={"/creators/"+encodeURIComponent(creator.handle)} className="cw-creator-person">
              <span className="cw-creator-medallion" aria-hidden="true">{creator.displayName.slice(0,1).toUpperCase()}</span>
              <strong>{creator.displayName}</strong><small>{creator.publishedProjects} {creator.publishedProjects===1?"project":"projects"}</small>
            </Link>)}</div>:
            <div className="cw-module-empty"><strong>THE FIRST CREATOR CHANNELS ARE AHEAD.</strong><p>Join the early creative community and help define what comes next.</p><Link to="/start">START HERE ↗</Link></div>}
        </section>
        <section className="cw-home-module" aria-labelledby="cw-community-title">
          <header className="cw-module-header"><div><span aria-hidden="true">◎</span><h2 id="cw-community-title">COMMUNITY ACTIVITY</h2></div><Link to="/community">VIEW ALL →</Link></header>
          <p>The conversation belongs to the makers and the people who discover them.</p>
          <div className="cw-community-entries">
            <Link to="/community"><span aria-hidden="true">✳</span><div><strong>COMMUNITY FORUM</strong><small>Explore actual conversations as they become available</small></div><Icon name="arrow" size={16}/></Link>
            <Link to="/guide"><span aria-hidden="true">◇</span><div><strong>FIELD GUIDE</strong><small>Learn and participate for free, without uploading work</small></div><Icon name="arrow" size={16}/></Link>
            <Link to="/create"><span aria-hidden="true">✦</span><div><strong>SHARE YOUR WORK</strong><small>Creator publishing is subject to review and access limits</small></div><Icon name="arrow" size={16}/></Link>
          </div>
          <span className="cw-module-notice">LIVE ACTIVITY COUNTS AND MEMBER PRIVILEGES ARE NOT SIMULATED</span>
        </section>
      </div>
      <div className="cw-bottom-message"><div><span>ANEVUM / THE CREATIVE UNIVERSE</span><strong>YOUR WORLD BELONGS HERE.</strong><p>MAKE · SHARE · PLAY · BELONG. Discover what others have built.</p></div><Link className="cw-button cw-button--gold" to="/start">START EXPLORING <Icon name="arrow" size={16}/></Link></div>
    </div>
  </div>;
}
