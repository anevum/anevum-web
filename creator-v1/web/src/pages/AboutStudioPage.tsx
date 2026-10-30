import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {OrbitalMark} from "../components/OrbitalMark";

function StudioAboutV143(){
 return <div className="av143-site av143-inner" data-studio-page="about">
  <section className="av143-interior-hero"><div className="av143-studio-mark"><OrbitalMark/></div>
   <span className="av143-overline">ANEVUM / INDEPENDENT CREATIVE STUDIO</span>
   <h1>We make<br/><em>worlds worth exploring.</em></h1>
   <p>Founded by Devon Akins, ANEVUM is a family-rooted creative studio developing original fictional universes, games, stories and open-source creative technology.</p>
  </section>
  <section className="av143-list-section"><div className="av143-heading"><div><span className="av143-overline">THE STUDIO / PURPOSE</span><h2>Creation before infrastructure.</h2></div><p>ANEVUM is defined by its work, not by trading systems, billing, accounts or a speculative marketplace.</p></div>
    <div className="av143-progress-grid">
     <article><span className="av143-index">01</span><h3>Originality.</h3><p>Distinctive worlds, original stories, purposeful artwork and working interactions rather than decorative claims.</p></article>
     <article><span className="av143-index">02</span><h3>Continuity.</h3><p>Preserve established canon and existing functioning code. Treat new proposals separately from approved creative decisions.</p></article>
     <article><span className="av143-index">03</span><h3>Craft & truth.</h3><p>Prioritize quality and actual playable work. Clearly label concepts, prototypes, tests and released projects.</p></article>
    </div></section>
  <section id="av143-open-source" className="av143-list-section av143-about-source"><span className="av143-overline">CREATIVE TECHNOLOGY / SOURCE</span><h2>Open by design.</h2><p>ANEVUM favors free, open-source software that can be studied, modified and independently maintained. Repository-level licenses govern code. Original fictional worlds, artwork and studio marks have separate rights and should never be assumed to carry the software license.</p><a className="av143-action av143-action--primary" href="https://github.com/anevum" target="_blank" rel="noopener noreferrer">VIEW PUBLIC SOURCE <Icon name="arrow" size={17}/></a></section>
  <section className="av143-list-section"><span className="av143-overline">THE FOUNDER</span><h2>Devon Akins.</h2><p>Author, independent developer and worldbuilder. ANEVUM is an ongoing creative endeavor, built sustainably around family, writing and the pursuit of making things that last.</p><div className="av143-actions"><a className="av143-action av143-action--primary" href="https://devonakins.com" target="_blank" rel="noopener noreferrer">PERSONAL WEBSITE <Icon name="arrow" size={17}/></a><Link to="/worlds" className="av143-action">EXPLORE THE WORLDS <Icon name="arrow" size={17}/></Link></div></section>
  <section className="av143-footer-cta"><span className="av143-overline">ANEVUM / MADE OVER TIME</span><h2>Build deliberately.<br/>Release what works.</h2><Link to="/journal" className="av143-action av143-action--primary">FOLLOW DEVELOPMENT <Icon name="arrow" size={16}/></Link></section>
 </div>;
}

/** First-party studio page; does not advertise unshipped products or private records. */
export function LegacyAboutStudioPage(){
 return <div className="av137-about" data-studio-stage="active-development">
  <section className="av137-about-hero">
   <div className="av137-stage-identity"><OrbitalMark/><span>ANEVUM / INDEPENDENT SOFTWARE STUDIO</span></div>
   <p className="av137-eyebrow">ANEVUM / INDEPENDENT DEVELOPMENT / 2026</p>
   <h1>Make things.<br/><em>Make them matter.</em></h1>
   <p>ANEVUM develops original games, practical software and experimental creative tools. We prefer working prototypes, real evidence and useful releases over promising features before they exist.</p>
   <div className="av137-stage-actions"><Link className="av137-button av137-button--primary" to="/severance">Current game <Icon name="arrow" size={16}/></Link><Link className="av137-button" to="/status">What's live now <Icon name="arrow" size={16}/></Link></div>
  </section>
  <section className="av137-section av137-about-grid" aria-label="ANEVUM work areas">
   <article><span>01 / ORIGINAL WORLDS</span><h2>Games</h2><p>TRANSCOSMIC: SEVERANCE is our current persistent survival-horror design and technical prototype priority.</p><Link to="/severance">Explore the game <Icon name="arrow" size={16}/></Link></article>
   <article><span>02 / CREATION SYSTEMS</span><h2>Software</h2><p>ANEVUM Creator Studio and the review pipeline remain in development, with private drafts, protected accounts and release permissions preserved.</p><Link to="/studio">Explore Studio <Icon name="arrow" size={16}/></Link></article>
   <article><span>03 / COMMUNITY</span><h2>The Commons</h2><p>Approved projects, public creator profiles and community conversations remain discoverable wherever the underlying service is verified.</p><Link to="/discover">Explore real work <Icon name="arrow" size={16}/></Link></article>
  </section>
  <div className="av137-about-foot"><span>ANEVUM / CONTINUANCE OF CREATION</span><p>Build deliberately. Test on real devices. Release only what works.</p><Link to="/">Back to ANEVUM <Icon name="arrow" size={16}/></Link></div>
 </div>;
}

export function AboutStudioPage(){return import.meta.env.VITE_ANEVUM_STUDIO_V143==='true'?<StudioAboutV143/>:<LegacyAboutStudioPage/>;}
