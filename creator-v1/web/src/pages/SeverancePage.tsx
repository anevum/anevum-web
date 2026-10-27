import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {SeverancePlateArtV138,type SeverancePlateKindV138} from "../parity/SeveranceWorldSceneV138";
import {SeveranceCinematicV139} from "../parity/SeveranceCinematicV139";

const principles=[
 {index:"01",anchor:"av138-sev-world",title:"THE WORLD ENDURES",detail:"No final circle, match timer or scheduled reset. A single region keeps its territory, landmarks, encounters and recorded history.",kind:"perimeter"},
 {index:"02",anchor:"av138-sev-threats",title:"THE RUINS ARE HUNGRY",detail:"Hostile organisms respond to sound, disturbance and players. Horror stays present even when there are few survivors online.",kind:"containment"},
 {index:"03",anchor:"av138-sev-people",title:"TRUST IS A CHOICE",detail:"Every meeting might become an alliance, rivalry or betrayal. Cooperation matters, but no faction is forced on the player.",kind:"outpost"},
 {index:"04",anchor:"av138-sev-archive",title:"DEATH ISN'T THE END",detail:"A life can end, but the person returns. Survival streaks reset while verified achievements and world events remain in history.",kind:"signal"}
] as const satisfies readonly {index:string;anchor:string;title:string;detail:string;kind:SeverancePlateKindV138}[];
const milestones=[
 {number:"01",state:"DESIGN DOCUMENTED",name:"Establish the game contract",detail:"World logic, reconstitution, server-owned survival records and social systems are proposed. No public release is implied."},
 {number:"02",state:"NEXT BUILD PROOF",name:"Two browsers in one shared world",detail:"Authority, position, one creature encounter, death, automatic respawn and persistent history must be demonstrated on an actual running server."},
 {number:"03",state:"TESTING AFTER PROOF",name:"Small persistent field test",detail:"Validate reconnection, moderation, phone controls, server costs and memory limits before increasing territory or player capacity."}
] as const;

/** Original concept media. Always label illustrative design as such and never
 * add a playable CTA without a verified signed build and server availability.
 */
export function SeverancePage(){
 return <div className="av137-severance av138-severance av138-site" data-product-stage="design-prototype" data-public-playable="false" data-visual-pass="v138-hushwire">
  <section className="av138-sev-hero" aria-labelledby="av137-sev-title">
   <SeveranceCinematicV139 className="av138-sev-hero-art"/>
   <div className="av138-sev-hero-shade" aria-hidden="true"/>
   <div className="av138-sev-hero-inner">
    <Link className="av138-sev-back" to="/">ANEVUM <span>/</span> ORIGINAL GAMES</Link>
    <span className="av138-section-eyebrow">TRANSCOSMIC <span>/</span> CONTINUANCE EXPERIMENT 001</span>
    <h1 id="av137-sev-title" className="av139-glitch-title" data-glitch-title="SEVERANCE">SEVERANCE<span>.</span></h1>
    <p className="av138-sev-mantra">SURVIVE. RETURN. DISCOVER.</p>
    <p className="av138-sev-hero-lead">The world doesn't end when you do.</p>
    <p className="av138-sev-hero-intro">A persistent multiplayer survival-horror experience in design and technical prototyping. The world remains; the survivors determine what happens inside it.</p>
    <div className="av138-cta-row"><a className="av138-cta av138-cta--red" href="#av138-sev-world">EXPLORE THE GAME <Icon name="arrow" size={17}/></a><Link className="av138-cta av138-cta--outline" to="/status">DEVELOPMENT STATUS <Icon name="status" size={17}/></Link></div>
    <p className="av138-availability"><span aria-hidden="true"/> IN DEVELOPMENT / No public server, playable beta or release date is announced.</p>
   </div>
   <div className="av138-sev-index" aria-hidden="true">ANEVUM FIELD REPORT 001 <span>·</span> CONCEPT ENVIRONMENT — NOT GAMEPLAY FOOTAGE</div>
  </section>

  <section className="av138-sev-statement" aria-labelledby="av138-sev-statement-title">
   <div><span className="av138-section-eyebrow">THE EXPERIMENT / ONE CONTINUOUS HISTORY</span><h2 id="av138-sev-statement-title">NO FINAL CIRCLE.<br/><em>NO FINAL STORY.</em></h2></div>
   <p>Every death is a new beginning, but the world does not forget. People can battle for supplies, negotiate a truce, defend an outpost, or simply disappear into the ruins. Survival is measured in decisions as much as minutes.</p>
  </section>

  <section id="av137-sev-design" className="av138-sev-mechanics" aria-labelledby="av138-mechanics-title">
   <div className="av138-section-bar"><div><span className="av138-section-eyebrow">FIELD FILE / PROPOSED GAME SYSTEMS</span><h2 id="av138-mechanics-title">A dangerous world. A human story.</h2></div><span className="av138-sev-design-label">01 / EXPERIMENTAL DESIGN</span></div>
   <div className="av138-sev-mechanic-grid">{principles.map(item=><article id={item.anchor} key={item.index} className="av138-sev-mechanic">
    <div className="av138-sev-mechanic-visual"><SeverancePlateArtV138 kind={item.kind}/><span>{item.index} / FIELD SYSTEM</span></div>
    <div className="av138-sev-mechanic-copy"><h3>{item.title}</h3><p>{item.detail}</p></div>
   </article>)}</div>
   <p className="av138-media-disclaimer">ILLUSTRATIVE ART DIRECTION / NO CAPTURED GAMEPLAY SHOWN</p>
  </section>

  <section className="av138-sev-archive" aria-labelledby="av138-archive-title">
   <div className="av138-sev-archive-mark" aria-hidden="true"><span>01</span><small>RECONSTITUTION</small></div>
   <div><span className="av138-section-eyebrow">PROPOSED / PLAYER RECORDS</span><h2 id="av138-archive-title">EVERY LIFE HAS AN END.<br/>EVERY LIFE LEAVES A TRACE.</h2><p>Longest active survival, territory, factions, alliances and exceptional encounters are intended to enter an authoritative world archive. Offline time cannot inflate a streak, and no public leaderboard exists before the actual game servers and verified records do.</p></div>
  </section>

  <section className="av138-sev-roadmap" aria-labelledby="av138-sev-roadmap-title">
   <div className="av138-section-bar"><div><span className="av138-section-eyebrow">ANEVUM / DEVELOPMENT PHASES</span><h2 id="av138-sev-roadmap-title">PROOF BEFORE SCALE.</h2></div><Link to="/status">LIVE SERVICE CAPABILITIES <Icon name="arrow" size={16}/></Link></div>
   <ol className="av138-sev-roadmap-grid">{milestones.map(item=><li key={item.number}><span className="av138-sev-step-n">{item.number}</span><span className="av138-sev-step-state">{item.state}</span><h3>{item.name}</h3><p>{item.detail}</p></li>)}</ol>
   <p className="av138-sev-disclaimer">Browser-first and mobile-friendly are design objectives, not verified performance claims. The final map, capacity and launch dates remain undecided.</p>
  </section>

  <section className="av138-sev-last"><div><span className="av138-section-eyebrow">TRANSCOSMIC / ANEVUM ORIGINAL</span><h2>THE WORLD ISN'T READY.<br/><em>WE'RE BUILDING IT.</em></h2><p>Explore the progress and the independent work happening around the experiment.</p></div><nav aria-label="Explore ANEVUM"><Link to="/status">SEE DEVELOPMENT STATUS <Icon name="arrow" size={16}/></Link><Link to="/community">VISIT THE COMMONS <Icon name="arrow" size={16}/></Link><Link to="/discover">DISCOVER APPROVED PROJECTS <Icon name="arrow" size={16}/></Link></nav></section>
 </div>;
}
