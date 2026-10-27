import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {OrbitalMark} from "../components/OrbitalMark";
import {ProjectThumbnail} from "../components/ProjectThumbnail";
import {CinematicArrivalV136} from "./CinematicArrivalV136";
import {projectDetailPath} from "../lib/navigation";
import type {Project} from "../lib/api";

type Props={projects:readonly Project[];catalogueState:"loading"|"ready"|"error";signedIn:boolean;verifiedCount:number|null};

/** Public, honest development-stage home. Existing tools and routes are retained. */
export function StageFocusedHomeV137({projects,catalogueState,signedIn,verifiedCount}:Props){
 const publicWork=projects.slice(0,3);
 return <div className="av137-stage-home" data-stage-focus="severance-development">
  <section className="p136-hero av137-stage-hero" aria-labelledby="av137-stage-title">
   <CinematicArrivalV136/><div className="p136-hero-shade" aria-hidden="true"/>
   <div className="av137-stage-copy">
    <div className="av137-stage-identity"><OrbitalMark/><span>ANEVUM / INDEPENDENT SOFTWARE STUDIO</span></div>
    <p className="av137-eyebrow">CONTINUANCE INSTITUTE / FIELD REPORT 001</p>
    <h1 id="av137-stage-title">We build things<br/><em>worth returning to.</em></h1>
    <p className="av137-stage-intro">Original games, experimental software and the tools to make them. Our current game project is <strong>TRANSCOSMIC: SEVERANCE</strong> — a persistent multiplayer survival-horror world in design and technical prototyping.</p>
    <div className="av137-stage-actions"><Link to="/severance" className="av137-button av137-button--primary">Explore Severance <Icon name="arrow" size={17}/></Link><Link to="/status" className="av137-button">Development status <Icon name="status" size={17}/></Link></div>
    <p className="av137-disclosure">IN DEVELOPMENT / No public multiplayer game or open beta is available yet.</p>
   </div>
   <aside className="av137-stage-summary" aria-label="Current studio focus"><span className="av137-eyebrow">PROJECT SIGNAL / 001</span><strong>SEVERANCE</strong><p>A world that continues. Temporary lives. Permanent history.</p><div><span>PLANNED / PvPvE</span><span>TARGET / BROWSER</span></div><Link to="/severance">Read the concept <Icon name="arrow" size={15}/></Link></aside>
  </section>
  <section className="av137-section" aria-labelledby="av137-focus-title">
   <div className="av137-heading"><div><span className="av137-eyebrow">THE WORK / OCTOBER 2026</span><h2 id="av137-focus-title">What exists. What's next.</h2></div><Link to="/status">Verify capabilities <Icon name="arrow" size={15}/></Link></div>
   <div className="av137-focus-grid">
    <article><span>01 / ACTIVE GAME DESIGN</span><h3>TRANSCOSMIC: SEVERANCE</h3><p>Persistent survival, auto-return after death, player alliances, territorial control, hostile organisms and recorded world history. Real browser networking must be proven before expansion.</p><Link to="/severance">Game direction <Icon name="arrow" size={15}/></Link></article>
    <article><span>02 / CONTROLLED DEVELOPMENT</span><h3>Creator Studio</h3><p>Existing editor, preview and publishing workflows remain available where permissioned. Signing up does not automatically grant public publishing.</p><Link to="/studio">Open Studio <Icon name="arrow" size={15}/></Link></article>
    <article><span>03 / PUBLIC RECORDS</span><h3>Discover</h3><p>Approved work, creator channels and discussions are preserved. ANEVUM is an independent software workshop, not only a game.</p><Link to="/discover">Browse projects <Icon name="arrow" size={15}/></Link></article>
   </div>
  </section>
  <section className="av137-section av137-public-work" aria-labelledby="av137-work-title">
   <div className="av137-heading"><div><span className="av137-eyebrow">REAL RECORDS / VERIFIED INDEX</span><h2 id="av137-work-title">Released work, not placeholders.</h2></div><Link to="/discover">Full index <Icon name="arrow" size={15}/></Link></div>
   {publicWork.length?<div className="av137-public-grid">{publicWork.map(project=><article key={project.id}><Link to={projectDetailPath(project.id,"/")} aria-label={"Open "+project.title} className="av137-public-cover"><ProjectThumbnail kind={project.category} title={project.title} decorative/></Link><div><span>{project.category.toUpperCase()} / APPROVED PROJECT</span><h3><Link to={projectDetailPath(project.id,"/")}>{project.title}</Link></h3><p>{project.summary}</p><small>By {project.creatorName||"ANEVUM member"}</small></div></article>)}</div>:<div className="av137-public-empty" role="status"><strong>{catalogueState==="error"?"The approved public index is unavailable.":catalogueState==="loading"?"Checking published work.":"No approved releases to feature yet."}</strong><p>No invented projects, ratings, activity or playable builds are substituted for real releases.</p><Link to="/discover">Open Discover <Icon name="arrow" size={15}/></Link></div>}
   <p className="av137-index-note">{verifiedCount===null?"Catalogue count unavailable":verifiedCount+" approved public "+(verifiedCount===1?"release":"releases")}. Severance development is not a published game listing.</p>
  </section>
  <section className="av137-stage-outro"><div><span className="av137-eyebrow">THE CONTINUANCE PRINCIPLE</span><h2>Build in public.<br/>Prove the work.</h2><p>Follow the journey from a game idea to a verified playable experience.</p></div><nav aria-label="More ANEVUM destinations"><Link to="/community">Community <Icon name="arrow" size={15}/></Link><Link to={signedIn?"/member":"/join"}>{signedIn?"My account":"Member access"} <Icon name="arrow" size={15}/></Link><Link to="/about">About ANEVUM <Icon name="arrow" size={15}/></Link></nav></section>
 </div>;
}
