import {Link} from "react-router-dom";
import {readCategories,readCreators,readProjects,readStatus} from "../lib/api";
import {useResource} from "../lib/useResource";
import {ProjectCard} from "../components/ProjectCard";
import {LevelPanel} from "../components/LevelPanel";
import {CelestialEmblem} from "../components/CelestialEmblem";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {CosmicScene} from "../components/CosmicIllustration";
import {Icon} from "../components/Icons";
import {WorldNavigator} from "../components/WorldNavigator";
import {ErrorState, LoadingState} from "../components/States";

const worlds: ReadonlyArray<{id:string;name:string;scene:CosmicScene;description:string}> = [
  {id:"games",name:"Games",scene:"games",description:"Play independently made experiences"},
  {id:"tools",name:"Apps & Tools",scene:"tools",description:"Discover software made to be used"},
  {id:"creative",name:"Art & AI",scene:"creative",description:"Explore artwork and creative experiments"},
  {id:"learning",name:"Learning",scene:"learning",description:"Follow curiosity into something new"},
  {id:"research",name:"Research",scene:"research",description:"Investigate questions and ideas"},
  {id:"libraries",name:"Open Source",scene:"libraries",description:"Build on code shared with everyone"},
  {id:"automation",name:"Automation",scene:"automation",description:"Tools that take work off your hands"},
  {id:"other",name:"More",scene:"other",description:"Things that cross every boundary"}
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
          <span className="cw-kicker">ANEVUM / AN INDEPENDENT CREATIVE UNIVERSE</span>
          <h1 id="cw-hero-title">CREATE<br/>BEYOND<br/><em>WORLDS.</em></h1>
          <p>Games, software, art, research and the ideas between them. A home for people who make things — and people who want to explore.</p>
          <div className="cw-hero-actions">
            <Link to="/discover" className="cw-button cw-button--gold">EXPLORE THE UNIVERSE <Icon name="arrow" size={17}/></Link>
            <Link to="/start" className="cw-button cw-button--quiet">FIND YOUR PLACE</Link>
          </div>
        </div>
        <aside className="cw-hero-feature" aria-label="About our creative universe">
          <div className="cw-hero-feature-art"><CosmicArtwork scene="portal" priority/></div>
          <div className="cw-hero-feature-info">
            <span>THE TRANSCOSMIC ATMOSPHERE</span>
            <p>Ideas do not have to fit inside familiar boundaries.</p>
            <Link to="/discover?category=creative" aria-label="Explore creative projects"><Icon name="arrow" size={18}/></Link>
          </div>
        </aside>
      </div>
    </section>

    <div className="cw-home-body">
      <section className="cw-home-section cw-home-section--worlds" aria-labelledby="cw-worlds-title">
        <div className="cw-home-heading">
          <div><span>01 / FIND YOUR WORLD</span><h2 id="cw-worlds-title">What are you into?</h2><p>Choose a direction. Every world leads into the real public catalogue.</p></div>
          <Link to="/discover">BROWSE EVERYTHING <Icon name="arrow" size={17}/></Link>
        </div>
        <WorldNavigator worlds={worlds} counts={counts} ready={portal.state==="ready"}/>
        <nav className="cw-world-more" aria-label="More ways to explore">
          <span>CURIOUS WHERE TO GO NEXT?</span>
          <Link to="/discover?free=1">Find things marked free <Icon name="arrow" size={14}/></Link>
          <Link to="/guide">Try the Field Guide <Icon name="arrow" size={14}/></Link>
          <Link to="/creators">Meet the makers <Icon name="arrow" size={14}/></Link>
        </nav>
      </section>

      <section className="cw-home-section" aria-labelledby="cw-featured-title">
        <div className="cw-home-heading">
          <div><span>02 / THE PUBLIC CATALOGUE</span><h2 id="cw-featured-title">Made by people.</h2><p>Actual approved creations, not demonstration content.</p></div>
          <Link to="/discover">EXPLORE CREATIONS <Icon name="arrow" size={17}/></Link>
        </div>
        {portal.state==="loading"&&<LoadingState label="Loading genuine public projects"/>}
        {portal.state==="error"&&<ErrorState title="PROJECT CATALOGUE UNAVAILABLE" detail="We could not read the real catalogue. No sample projects were substituted."/>}
        {portal.state==="ready"&&(projects.length?
          <div className="cw-project-grid">{projects.slice(0,5).map(project=><ProjectCard key={project.id} project={project} returnTo="/"/>)}</div>:
          <div className="cw-publishing-empty">
            <div className="cw-publishing-empty-art" aria-hidden="true"><CosmicArtwork scene="portal"/></div>
            <div className="cw-publishing-empty-copy">
              <span>THE PUBLIC SHELVES ARE OPEN</span>
              <h3>First releases are still ahead.</h3>
              <p>There are no approved public projects yet. You can explore the worlds, try the free Field Guide, and see how this place is being built while publishing stays in invited testing.</p>
              <div className="cw-publishing-empty-actions"><Link to="/guide">TRY THE FIELD GUIDE <Icon name="arrow" size={16}/></Link><Link to="/status">SEE BUILD STATUS <Icon name="arrow" size={16}/></Link></div>
            </div>
          </div>)}
        {portal.state==="ready"&&<p className="cw-catalogue-footnote">{portal.data.status.counts.publishedProjects} GENUINE PUBLISHED PROJECTS · {portal.data.status.counts.publishedCreators} VERIFIED PUBLIC CREATOR CHANNELS · No fake projects, ratings or activity</p>}
      </section>

      <section className="cw-home-section" aria-labelledby="cw-belong-title">
        <div className="cw-home-heading">
          <div><span>03 / THE PEOPLE & THE CULTURE</span><h2 id="cw-belong-title">More than a catalogue.</h2><p>Make discoveries, follow makers and find something worth learning.</p></div>
          <Link to="/community">VISIT COMMUNITY <Icon name="arrow" size={17}/></Link>
        </div>
        <div className="cw-home-columns">
          <section className="cw-home-module" aria-labelledby="cw-community-title">
            <header className="cw-module-header"><div><span aria-hidden="true">◎</span><h3 id="cw-community-title">THE COMMONS</h3></div><Link to="/community">EXPLORE →</Link></header>
            <p>A place for the people behind the projects.</p>
            <div className="cw-community-entries">
              <Link to="/community"><span aria-hidden="true">✳</span><div><strong>COMMUNITY</strong><small>See the current spaces and what is available</small></div><Icon name="arrow" size={16}/></Link>
              <Link to="/guide"><span aria-hidden="true">◇</span><div><strong>FIELD GUIDE</strong><small>12 free exercises, no upload required</small></div><Icon name="arrow" size={16}/></Link>
              <Link to="/start"><span aria-hidden="true">✦</span><div><strong>HOW IT WORKS</strong><small>Explore, make and participate at your own pace</small></div><Icon name="arrow" size={16}/></Link>
            </div>
            <span className="cw-module-notice">PUBLIC DISCUSSION AND MEMBER PRIVILEGES ARE NOT SIMULATED</span>
          </section>
          <section className="cw-home-module" aria-labelledby="cw-creators-title">
            <header className="cw-module-header"><div><span aria-hidden="true">✺</span><h3 id="cw-creators-title">CREATOR CHANNELS</h3></div><Link to="/creators">BROWSE →</Link></header>
            <p>Meet the people who share their work here.</p>
            {portal.state==="ready"&&creators.length?
              <div className="cw-creator-row">{creators.map(creator=><Link key={creator.handle} to={"/creators/"+encodeURIComponent(creator.handle)} className="cw-creator-person">
                <span className="cw-creator-medallion" aria-hidden="true">{creator.displayName.slice(0,1).toUpperCase()}</span>
                <strong>{creator.displayName}</strong><small>{creator.publishedProjects} {creator.publishedProjects===1?"project":"projects"}</small>
              </Link>)}</div>:
              <div className="cw-module-empty"><strong>THE FIRST CHANNELS ARE AHEAD.</strong><p>Only real public creators will appear here. Invited member testing is underway.</p><Link to="/creators">SEE CREATORS ↗</Link></div>}
          </section>
          <section className="cw-home-module" aria-labelledby="cw-artifacts-title">
            <header className="cw-module-header"><div><span aria-hidden="true">✦</span><h3 id="cw-artifacts-title">LEVELS & ARTIFACTS</h3></div><Link to="/levels">EXPLORE →</Link></header>
            <p>Illustrated milestones, earned by real participation.</p>
            <div className="cw-artifact-showcase">{artifactMotifs.map((motif,i)=><Link key={motif} to="/levels" aria-label={"Preview Series One artifact "+(i+1)}><CelestialEmblem motif={motif} size="medium" state="preview"/><small>ART STUDY 0{i+1}</small></Link>)}</div>
            <div className="cw-module-foot"><LevelPanel compact/></div>
          </section>
        </div>
      </section>

      <div className="cw-bottom-message"><div><span>ANEVUM / AN OPEN DOOR</span><strong>THERE'S ROOM FOR WHAT YOU MAKE.</strong><p>MAKE · SHARE · PLAY · BELONG. Explore freely. Creator publishing is still in invited testing.</p></div><Link className="cw-button cw-button--gold" to="/start">START EXPLORING <Icon name="arrow" size={16}/></Link></div>
    </div>
  </div>;
}
