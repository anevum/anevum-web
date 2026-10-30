import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {OrbitalMark} from "../components/OrbitalMark";
import {ProjectThumbnail} from "../components/ProjectThumbnail";
import {projectDetailPath} from "../lib/navigation";
import {SeveranceCinematicV139} from "./SeveranceCinematicV139";
import type {Project} from "../lib/api";

type Props = {
  projects:readonly Project[];
  catalogueState:"loading"|"ready"|"error";
  signedIn:boolean;
  verifiedCount:number|null;
};

/**
 * Studio-first entrance. Uses the established ANEVUM shell and approved orbital
 * emblem; the cinematic shown on the game card is concept art, not gameplay.
 * No fake activity, generated stock imagery, new APIs, billing, or auth changes.
 */
export function StudioHomeV143({projects,catalogueState,signedIn,verifiedCount}:Props){
  const approved=projects.slice(0,3);
  return <div className="av143-site av143-home" data-studio-identity="2026-10-30" data-public-playable="false">
    <section className="av143-hero" aria-labelledby="av143-home-title">
      <div className="av143-hero-scenery" aria-hidden="true">
        <span className="av143-scenery-horizon"/><span className="av143-scenery-lines"/>
        <span className="av143-scenery-star av143-scenery-star--one"/>
        <span className="av143-scenery-star av143-scenery-star--two"/>
        <span className="av143-scenery-star av143-scenery-star--three"/>
        <div className="av143-orbit-field"><i className="av143-orbit-field__ring av143-orbit-field__ring--one"/><i className="av143-orbit-field__ring av143-orbit-field__ring--two"/><i className="av143-orbit-field__ring av143-orbit-field__ring--three"/><OrbitalMark className="av143-orbit-field__mark"/></div>
      </div>
      <div className="av143-hero-content">
        <span className="av143-overline"><i aria-hidden="true"/> ANEVUM / INDEPENDENT CREATIVE STUDIO</span>
        <h1 id="av143-home-title">Original worlds.<br/><em>Built to be explored.</em></h1>
        <p>Stories, games and open-source creative technology from Devon Akins. ANEVUM is a family-rooted studio making original experiences, one working release at a time.</p>
        <div className="av143-actions">
          <Link to="/worlds" className="av143-action av143-action--primary">ENTER TRANSCOSMIC <Icon name="arrow" size={18}/></Link>
          <Link to="/games" className="av143-action">EXPLORE THE GAMES <Icon name="arrow" size={17}/></Link>
        </div>
        <p className="av143-hero-truth">Independent creation. Public progress. No fictional studio metrics or unreleased features presented as finished.</p>
      </div>
      <div className="av143-hero-bottom"><span>THE ANEVUM STUDIO / EST. 2026</span><a href="#av143-work">EXPLORE THE WORK <span aria-hidden="true">↓</span></a><span>WORLDS · GAMES · TOOLS</span></div>
    </section>

    <section className="av143-editorial" id="av143-work" aria-labelledby="av143-work-title">
      <div className="av143-heading">
        <div><span className="av143-overline">THE CREATIVE PRACTICE / 001</span><h2 id="av143-work-title">One studio.<br/><em>Many ways in.</em></h2></div>
        <p>ANEVUM is defined by what it makes, not by an account system or marketplace. Each project has its own purpose, source, and honest stage of development.</p>
      </div>
      <div className="av143-practice-grid">
        <Link to="/worlds" className="av143-practice-card av143-practice-card--worlds">
          <div className="av143-practice-art" aria-hidden="true"><span className="av143-art-ring"/><span className="av143-art-gate"/></div>
          <span className="av143-overline">01 / FICTIONAL UNIVERSES</span><h3>Worlds</h3>
          <p>Original continuity, connected places, history and stories. TRANSCOSMIC is our primary universe.</p>
          <span className="av143-card-link">ENTER THE UNIVERSE <Icon name="arrow" size={17}/></span>
        </Link>
        <Link to="/games" className="av143-practice-card av143-practice-card--games">
          <div className="av143-practice-art" aria-hidden="true"><span className="av143-art-signal"/><span className="av143-art-cross"/></div>
          <span className="av143-overline">02 / INTERACTIVE EXPERIENCES</span><h3>Games</h3>
          <p>Atmospheric play, genuine mechanics and small experiments. SEVERANCE is the first major project.</p>
          <span className="av143-card-link">SEE THE GAMES <Icon name="arrow" size={17}/></span>
        </Link>
        <Link to="/about#av143-open-source" className="av143-practice-card av143-practice-card--tools">
          <div className="av143-practice-art" aria-hidden="true"><span className="av143-art-grid"/><span className="av143-art-cursor"/></div>
          <span className="av143-overline">03 / TOOLS & ENGINEERING</span><h3>Technology</h3>
          <p>Open-source software and practical tools made to support creating, playing and sharing.</p>
          <span className="av143-card-link">OUR APPROACH <Icon name="arrow" size={17}/></span>
        </Link>
      </div>
    </section>

    <section className="av143-feature" aria-labelledby="av143-feature-title">
      <div className="av143-feature-art"><SeveranceCinematicV139/><span className="av143-feature-art-note">ILLUSTRATIVE CINEMATIC / NOT GAMEPLAY FOOTAGE</span></div>
      <div className="av143-feature-content">
        <span className="av143-overline">CURRENT MAJOR GAME / TRANSCOSMIC</span>
        <span className="av143-status-line"><i aria-hidden="true"/> PROTOTYPE IN DEVELOPMENT · NO PUBLIC PLAY ACCESS</span>
        <h2 id="av143-feature-title">SEVERANCE<span>.</span></h2>
        <p className="av143-feature-mantra">SURVIVE. RETURN. DISCOVER.</p>
        <p>A world cut off from the wider TRANSCOSMIC network. The people left behind must live with what survived the isolation.</p>
        <p>Its long-term vision is a continuous survival-horror world. A smaller Godot WebGL prototype has passed initial automated browser checks; persistent public multiplayer has not launched.</p>
        <div className="av143-actions"><Link className="av143-action av143-action--primary" to="/severance">PROJECT DOSSIER <Icon name="arrow" size={17}/></Link><Link className="av143-action" to="/journal">VIEW DEVELOPMENT <Icon name="arrow" size={17}/></Link></div>
      </div>
    </section>

    <section className="av143-progress" aria-labelledby="av143-progress-title">
      <div className="av143-heading">
        <div><span className="av143-overline">WORK IN THE OPEN / 002</span><h2 id="av143-progress-title">Progress you can follow.</h2></div>
        <Link className="av143-inline-link" to="/journal">OPEN DEVELOPMENT JOURNAL <Icon name="arrow" size={16}/></Link>
      </div>
      <div className="av143-progress-grid">
        <article><span className="av143-index">01</span><span className="av143-progress-phase">VERIFIED PROTOTYPE</span><h3>Build something playable.</h3><p>SEVERANCE has a local Godot browser graybox. The immediate milestone is reliable two-client playtesting, not a giant public map.</p></article>
        <article><span className="av143-index">02</span><span className="av143-progress-phase">CURRENT PRACTICE</span><h3>Improve it deliberately.</h3><p>Test controls, performance, accessibility, visual quality and game rules before adding new systems or expanding scope.</p></article>
        <article><span className="av143-index">03</span><span className="av143-progress-phase">OPEN DEVELOPMENT</span><h3>Publish the evidence.</h3><p>Source, releases and development records should show what exists, what is proposed and what can be tried today.</p></article>
      </div>
    </section>

    <section className="av143-catalogue" aria-labelledby="av143-catalogue-title">
      <div className="av143-heading"><div><span className="av143-overline">EXISTING PUBLIC CATALOGUE / VERIFIED RECORDS</span><h2 id="av143-catalogue-title">Published work.</h2></div><Link className="av143-inline-link" to="/discover">BROWSE THE ARCHIVE <Icon name="arrow" size={16}/></Link></div>
      {approved.length>0?<div className="av143-catalogue-grid">{approved.map(project=><article key={project.id} className="av143-project"><Link to={projectDetailPath(project.id,"/")} aria-label={"View "+project.title} className="av143-project-art"><ProjectThumbnail kind={project.category} title={project.title} decorative/></Link><div><span className="av143-overline">APPROVED / {project.category.toUpperCase()}</span><h3><Link to={projectDetailPath(project.id,"/")}>{project.title}</Link></h3><p>{project.summary}</p></div></article>)}</div>:
      <div className="av143-catalogue-empty" role="status"><strong>{catalogueState==="error"?"The public catalogue could not be verified.":catalogueState==="loading"?"Checking approved releases…":"No approved releases are available to feature yet."}</strong><p>Design concepts and private prototypes are not counted as public releases.</p></div>}
      <p className="av143-catalogue-foot">{verifiedCount===null?"Public release count not verified":verifiedCount+" approved public "+(verifiedCount===1?"release":"releases")+" recorded by the public API"} · Existing member and publishing tools remain subject to their own access rules.</p>
    </section>

    <section className="av143-final" aria-labelledby="av143-final-title"><div><span className="av143-overline">INDEPENDENT / FAMILY-ROOTED / OPEN SOURCE</span><h2 id="av143-final-title">Make something<br/><em>worth returning to.</em></h2><p>Follow the work as it becomes real. Meet the person building it, explore the source, or check the current status.</p></div><nav aria-label="Learn more about ANEVUM"><Link to="/about">ABOUT THE STUDIO <Icon name="arrow" size={17}/></Link><a href="https://github.com/anevum" target="_blank" rel="noopener noreferrer">GITHUB / SOURCE <Icon name="arrow" size={17}/></a><Link to="/status">VERIFIED SERVICE STATUS <Icon name="arrow" size={17}/></Link>{signedIn&&<Link to="/member">YOUR MEMBER SPACE <Icon name="arrow" size={17}/></Link>}</nav></section>
  </div>;
}
