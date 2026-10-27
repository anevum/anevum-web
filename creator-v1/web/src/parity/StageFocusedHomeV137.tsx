import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {ProjectThumbnail} from "../components/ProjectThumbnail";
import {projectDetailPath} from "../lib/navigation";
import {SeveranceWorldSceneV138,SeverancePlateArtV138,type SeverancePlateKindV138} from "./SeveranceWorldSceneV138";
import type {Project} from "../lib/api";

type Props={projects:readonly Project[];catalogueState:"loading"|"ready"|"error";signedIn:boolean;verifiedCount:number|null};
const values=[
 {title:"PERSISTENT WORLD",detail:"No scheduled match ending.",symbol:"◎"},
 {title:"OTHER SURVIVORS",detail:"Alliances, rivalries, factions.",symbol:"◇"},
 {title:"SURVIVE & RETURN",detail:"Death changes the story.",symbol:"⌁"},
 {title:"PLAYER HISTORY",detail:"What happens stays recorded.",symbol:"≋"}
] as const;
const portals:readonly {kind:SeverancePlateKindV138;index:string;title:string;detail:string;to:string;action:string}[]=[
 {kind:"perimeter",index:"01 / TERRITORY",title:"THE WORLD",detail:"Explore the perimeter of a failed experiment.",to:"/severance#av138-sev-world",action:"THE SETTING"},
 {kind:"containment",index:"02 / ENVIRONMENT",title:"THE THREATS",detail:"Something in the ruins has adapted.",to:"/severance#av138-sev-threats",action:"SURVIVAL DESIGN"},
 {kind:"outpost",index:"03 / MULTIPLAYER",title:"OTHER SURVIVORS",detail:"Cooperate, compete, or stay out of sight.",to:"/severance#av138-sev-people",action:"PLAYER SYSTEMS"},
 {kind:"signal",index:"04 / CONTINUANCE",title:"THE ARCHIVE",detail:"Every life leaves a record behind.",to:"/severance#av138-sev-archive",action:"WORLD RECORDS"}
];
const gates=[
 {n:"01",state:"IN DESIGN",name:"A permanent world",detail:"The rules, setting and multiplayer architecture are being defined."},
 {n:"02",state:"NEXT PROOF",name:"Two connected survivors",detail:"Verify synchronized movement, one creature, death and re-entry."},
 {n:"03",state:"LATER",name:"Public field testing",detail:"Only after browser performance and authoritative persistence are proven."}
] as const;

/**
 * V138 / Honest early-game cinematic front door.
 * Illustrations are original SVG concept direction, not screenshots or live-game claims.
 * Existing creator & member flows are never bypassed, revoked, or fabricated.
 */
export function StageFocusedHomeV137({projects,catalogueState,signedIn,verifiedCount}:Props){
 const publicWork=projects.slice(0,3);
 return <div className="av137-stage-home av138-site" data-stage-focus="severance-development" data-visual-pass="v138-hushwire">
  <section className="p136-hero av137-stage-hero av138-hero" aria-labelledby="av137-stage-title">
   <SeveranceWorldSceneV138/>
   <div className="av138-hero-shade" aria-hidden="true"/>
   <div className="av138-frame-mark av138-frame-mark--tl" aria-hidden="true"/>
   <div className="av138-frame-mark av138-frame-mark--br" aria-hidden="true"/>
   <div className="av138-hero-content">
    <p className="av138-eyebrow"><span className="av138-red-rule" aria-hidden="true"/> TRANSCOSMIC <span className="av138-eyebrow-break">/</span> ANEVUM ORIGINAL GAME</p>
    <h1 id="av137-stage-title" className="av138-title">SEVERANCE<span className="av138-title-dot">.</span></h1>
    <p className="av138-mantra">SURVIVE <span>·</span> RETURN <span>·</span> DISCOVER</p>
    <p className="av138-intro">A persistent multiplayer survival-horror world. Explore a hostile experiment, navigate encounters with other survivors, and leave a history that survives your death.</p>
    <div className="av138-cta-row">
     <Link to="/severance" className="av138-cta av138-cta--red">EXPLORE THE GAME <Icon name="arrow" size={18}/></Link>
     <Link to="/status" className="av138-cta av138-cta--outline">DEVELOPMENT STATUS <Icon name="status" size={18}/></Link>
    </div>
    <p className="av138-availability"><span aria-hidden="true"/> IN DEVELOPMENT <span className="av138-availability-divider" aria-hidden="true">/</span> No public multiplayer game or open beta is available yet.</p>
   </div>
   <aside className="av138-hero-readout" aria-label="Project classification">
    <span>ANEVUM / TRANSMISSION 001</span>
    <strong>INACTIVE FIELD SERVER</strong>
    <p>PRE-ALPHA DESIGN / BROWSER-FIRST TARGET</p>
    <div><span>WORLD STATE</span><b>NOT DEPLOYED</b></div>
    <div><span>PLAY ACCESS</span><b>NOT AVAILABLE</b></div>
    <Link to="/severance">READ PROJECT BRIEF <Icon name="arrow" size={14}/></Link>
   </aside>
   <div className="av138-hero-bottom" aria-hidden="true"><span>THE CONTINUANCE INSTITUTE</span><span>DESIGN VISUALIZATION · NOT GAMEPLAY FOOTAGE</span><span>001 / TRANSCOSMIC</span></div>
  </section>

  <section className="av138-pillars" aria-label="Planned game pillars">
   {values.map((item,i)=><div key={item.title} className="av138-pillar">
    <span className="av138-pillar-glyph" aria-hidden="true">{item.symbol}</span>
    <div><strong>{item.title}</strong><p>{item.detail}</p></div>
    <span className="av138-pillar-index" aria-hidden="true">0{i+1}</span>
   </div>)}
  </section>

  <section className="av138-gallery" aria-labelledby="av138-gallery-title">
   <header className="av138-section-bar">
    <div><span className="av138-section-eyebrow">TRANSCOSMIC / THE EXPERIMENT</span><h2 id="av138-gallery-title">A world that remembers.</h2></div>
    <Link to="/severance">EXPLORE GAME DESIGN <Icon name="arrow" size={17}/></Link>
   </header>
   <div className="av138-plate-grid">
    {portals.map(item=><article className="av138-plate" key={item.kind}>
     <Link to={item.to} className="av138-plate-link" aria-label={item.title+" — "+item.action}>
      <div className="av138-plate-visual"><SeverancePlateArtV138 kind={item.kind}/><span className="av138-plate-label">{item.index}</span></div>
      <div className="av138-plate-body"><h3>{item.title}</h3><p>{item.detail}</p><span className="av138-plate-action">{item.action} <Icon name="arrow" size={16}/></span></div>
     </Link>
    </article>)}
   </div>
   <p className="av138-media-disclaimer">ILLUSTRATIVE ART DIRECTION — NOT IN-GAME SCREENSHOTS OR RELEASED CONTENT</p>
  </section>

  <section className="av138-development" aria-labelledby="av138-development-title">
   <div className="av138-development-lead">
    <span className="av138-section-eyebrow">ANEVUM / ACTIVE DEVELOPMENT</span>
    <h2 id="av138-development-title">We're building the first proof.<em>Not selling a finished world.</em></h2>
    <p>Start with a real browser connection, immediate return after death, and trustworthy survival records. Expand only when the underlying experience works.</p>
    <Link className="av138-text-action" to="/status">SEE THE VERIFIED DEVELOPMENT STATUS <Icon name="arrow" size={16}/></Link>
   </div>
   <ol className="av138-gates">{gates.map(item=><li key={item.n}>
    <span className="av138-gate-index">{item.n}</span>
    <div><span className="av138-gate-state">{item.state}</span><strong>{item.name}</strong><p>{item.detail}</p></div>
   </li>)}</ol>
  </section>

  <section className="av138-studio-access" aria-label="Current ANEVUM spaces">
   <div><span className="av138-section-eyebrow">THE STUDIO / INDEPENDENT SOFTWARE STUDIO</span><h2>Independent creation continues.</h2><p>ANEVUM's creator tools, public catalogue, and member spaces remain part of the project. Their availability and publishing permissions are checked separately from Severance development.</p></div>
   <nav aria-label="Existing platform areas"><Link to="/studio"><span>CREATOR STUDIO <small>Creation tools under controlled access</small></span><Icon name="arrow" size={18}/></Link><Link to="/community"><span>THE COMMONS <small>Approved conversations and public activity</small></span><Icon name="arrow" size={18}/></Link><Link to={signedIn?"/member":"/join"}><span>{signedIn?"MY SPACE":"MEMBER ACCESS"} <small>Your verified account and eligible features</small></span><Icon name="arrow" size={18}/></Link></nav>
  </section>

  <section className="av138-approved" aria-labelledby="av138-approved-title">
   <header className="av138-section-bar"><div><span className="av138-section-eyebrow">PUBLIC INDEX / VERIFIED WORK</span><h2 id="av138-approved-title">Real work. Real releases.</h2></div><Link to="/discover">OPEN DISCOVER <Icon name="arrow" size={16}/></Link></header>
   {publicWork.length>0?<div className="av138-public-grid">{publicWork.map(project=><article key={project.id}>
    <Link className="av138-public-cover" to={projectDetailPath(project.id,"/")} aria-label={"Open "+project.title}><ProjectThumbnail kind={project.category} title={project.title} decorative/></Link>
    <div><span>APPROVED / {project.category.toUpperCase()}</span><h3><Link to={projectDetailPath(project.id,"/")}>{project.title}</Link></h3><p>{project.summary}</p><small>By {project.creatorName||"ANEVUM member"}</small></div>
   </article>)}</div>:<div className="av138-public-empty" role="status">
    <span className="av138-public-empty-mark" aria-hidden="true">∅</span><div><strong>{catalogueState==="error"?"The public index is temporarily unavailable.":catalogueState==="loading"?"Checking the public catalogue…":"No approved projects are available to feature yet."}</strong>
    <p>Nothing is invented to fill an empty catalogue. Game design work is not presented as a published release.</p><Link to="/discover">BROWSE THE PUBLIC INDEX <Icon name="arrow" size={16}/></Link></div>
   </div>}
   <p className="av138-catalogue-foot">{verifiedCount===null?"Public release count unverified":verifiedCount+" verified public "+(verifiedCount===1?"release":"releases")} · Severance is separately marked IN DEVELOPMENT.</p>
  </section>

  <section className="av138-endcap"><span>CONTINUANCE IS A CHOICE.</span><h2>THE WORLD WILL<br/>REMEMBER WHAT WE BUILD.</h2><div><Link to="/severance">DISCOVER SEVERANCE <Icon name="arrow" size={16}/></Link><Link to="/about">ABOUT ANEVUM <Icon name="arrow" size={16}/></Link></div></section>
 </div>;
}
