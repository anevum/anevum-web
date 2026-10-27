import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {OrbitalMark} from "../components/OrbitalMark";

const systems=[
 {index:"01",title:"Continuous world",detail:"No final circle and no scheduled match ending. Important territory, places and world events persist beyond a single life."},
 {index:"02",title:"Temporary lives",detail:"Death resets a life and survival streak. Players re-enter quickly. Their historical record persists; carried supplies are at risk."},
 {index:"03",title:"Player-made history",detail:"Alliances, trade, conflict and territorial control are choices. Groups can build a reputation through what they actually accomplish."},
 {index:"04",title:"A hostile ecology",detail:"Creatures respond to activity, pursuit and disturbed regions. Exploration must remain meaningful even with few other people online."}
] as const;
const milestones=[
 {index:"01",state:"CURRENT / DESIGN",title:"Define rules, world and survival records",detail:"The game design and initial implementation architecture are documented. Reusable horror-prototype work is being preserved."},
 {index:"02",state:"NEXT / PROOF",title:"Real browser-to-server gameplay",detail:"Prove two real clients, server-authoritative movement and combat, synchronized hostile AI, respawn and a saved survival record."},
 {index:"03",state:"FUTURE / ALPHA",title:"One small, persistent region",detail:"Only expand after the gameplay loop, phone controls, browser performance, moderation and server economics are validated."}
] as const;

/** A concept and development page, not an unverified game launcher. */
export function SeverancePage(){
 return <div className="av137-severance" data-product-stage="design-prototype" data-public-playable="false">
  <section className="av137-sev-hero" aria-labelledby="av137-sev-title">
   <div className="av137-sev-art" aria-hidden="true"><i/><b/><span/></div>
   <div className="av137-sev-copy">
    <Link className="av137-sev-back" to="/">ANEVUM / ORIGINAL GAMES</Link>
    <div className="av137-stage-identity"><OrbitalMark/><span>TRANSCOSMIC / THE CONTINUANCE INSTITUTE</span></div>
    <span className="av137-eyebrow">WORLD EXPERIMENT 001 / PERSISTENT PvPvE</span>
    <h1 id="av137-sev-title">SEVERANCE<span>.</span></h1>
    <p className="av137-sev-lead">The world doesn't end when you do.</p>
    <p className="av137-sev-description">A multiplayer survival-horror world in development. Players enter, survive, fight, cooperate, occupy territory, die and return. The region continues and keeps its history.</p>
    <div className="av137-stage-actions"><Link className="av137-button av137-button--primary" to="/status">See the current status <Icon name="arrow" size={17}/></Link><a className="av137-button" href="#av137-sev-design">Explore the design <Icon name="arrow" size={16}/></a></div>
    <p className="av137-disclosure">DESIGN / TECHNICAL PROTOTYPING — No public server, playable beta or release date is announced.</p>
   </div>
   <div className="av137-sev-foot" aria-hidden="true">CONTINUANCE RECONSTITUTION / PLANNED SYSTEM · NOT LIVE</div>
  </section>
  <section className="av137-sev-premise"><div><span className="av137-eyebrow">THE PREMISE / ONGOING WORLD</span><h2>No final circle.<br/><em>No scheduled ending.</em></h2></div><p>A firefight may attract something worse. An enemy may become an ally. A group could hold an outpost long after its founders die. The game is designed to discover what people do when competition and cooperation are both possible.</p></section>
  <section id="av137-sev-design" className="av137-section av137-sev-systems" aria-labelledby="av137-sev-systems-title">
   <div className="av137-heading"><div><span className="av137-eyebrow">PROPOSED GAME SYSTEMS</span><h2 id="av137-sev-systems-title">Systems that create stories.</h2></div></div>
   <div className="av137-sev-grid">{systems.map(item=><article key={item.index}><span>{item.index} / DESIGN</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
  </section>
  <section className="av137-sev-record"><div className="av137-sev-record-medal" aria-hidden="true">001<span>THE ARCHIVE</span></div><div><span className="av137-eyebrow">SURVIVAL RECORDS / PLANNED</span><h2>Every return counts.</h2><p>Active survival time, longest-lived players, territorial control and major events would be validated by the game server and recorded. Offline time cannot inflate a survival record. No public leaderboard exists yet.</p></div></section>
  <section className="av137-section av137-sev-roadmap" aria-labelledby="av137-sev-roadmap-title"><div className="av137-heading"><div><span className="av137-eyebrow">DEVELOPMENT / PROOF BEFORE SCALE</span><h2 id="av137-sev-roadmap-title">From prototype to living world.</h2></div><Link to="/status">Actual site capabilities <Icon name="arrow" size={16}/></Link></div>
   <div className="av137-sev-steps">{milestones.map(item=><article key={item.index}><span>{item.index} / {item.state}</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
   <p className="av137-index-note">Browser-first play and phone controls are engineering requirements, not verified performance claims. The proposed map size and population remain subject to testing.</p>
   <div className="av137-sev-links"><Link to="/community">Visit the Commons <Icon name="arrow" size={16}/></Link><Link to="/discover">Explore approved work <Icon name="arrow" size={16}/></Link></div>
  </section>
 </div>;
}
