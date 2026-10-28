import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {OrbitalMark} from "../components/OrbitalMark";

/** First-party studio page; does not advertise unshipped products or private records. */
export function AboutStudioPage(){
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
