import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {SeveranceCinematicV139} from "../parity/SeveranceCinematicV139";

const sectors=[
 {num:"01",name:"TRANSCOSMIC",status:"PRIMARY ORIGINAL UNIVERSE",description:"A connected fictional universe of distant worlds, transportation networks, lost civilizations and institutions. Its history supports multiple stories and interactive experiences.",to:"/severance",action:"EXPLORE THE FIRST GAME"},
 {num:"02",name:"THE ISOLATED WORLD",status:"SEVERANCE SETTING / DEVELOPMENT",description:"An inhabited world is disconnected from the transcosmic network following a containment crisis. Its people are left to survive what remains.",to:"/severance",action:"READ THE GAME DOSSIER"}
];
export function WorldsPageV143(){
 return <div className="av143-site av143-inner" data-studio-page="worlds">
   <section className="av143-interior-hero av143-interior-hero--worlds">
    <span className="av143-overline">ANEVUM / ORIGINAL FICTIONAL UNIVERSES</span><h1>Worlds beyond<br/><em>the familiar.</em></h1>
    <p>ANEVUM develops interconnected fictional settings with consistent history, original stories and experiences worth exploring.</p>
    <span className="av143-page-marker">TRANSCOSMIC / PRIMARY UNIVERSE</span>
   </section>
   <section className="av143-list-section"><div className="av143-heading"><div><span className="av143-overline">WORLD ARCHIVE / 001</span><h2>TRANSCOSMIC.</h2></div><p>A fictional universe, not a real institute or operating company.</p></div>
   <div className="av143-world-list">{sectors.map(item=><article key={item.num}><span className="av143-index">{item.num}</span><div><span className="av143-overline">{item.status}</span><h3>{item.name}</h3><p>{item.description}</p><Link to={item.to} className="av143-inline-link">{item.action} <Icon name="arrow" size={16}/></Link></div></article>)}</div>
   <p className="av143-annotation">Additional TRANSCOSMIC lore, worlds, and canon will be published when reviewed. Development concepts are not represented as completed public stories.</p></section>
   <section className="av143-footer-cta"><span className="av143-overline">FIRST INTERACTIVE PROJECT</span><h2>One world went silent.</h2><Link to="/severance" className="av143-action av143-action--primary">DISCOVER SEVERANCE <Icon name="arrow" size={16}/></Link></section>
 </div>;
}

export function GamesPageV143(){
 return <div className="av143-site av143-inner" data-studio-page="games">
  <section className="av143-interior-hero av143-interior-hero--games"><span className="av143-overline">ANEVUM / ORIGINAL GAMES</span><h1>Play the<br/><em>unknown.</em></h1><p>From original horror worlds to smaller interactive experiments. Each game is tracked by its actual development and release status.</p><span className="av143-page-marker">PROTOTYPES ARE NOT RELEASES</span></section>
  <section className="av143-feature av143-feature--games"><div className="av143-feature-art"><SeveranceCinematicV139/><span className="av143-feature-art-note">ILLUSTRATIVE CINEMATIC / NOT GAMEPLAY</span></div><div className="av143-feature-content"><span className="av143-overline">TRANSCOSMIC / MAJOR GAME PROJECT 001</span><span className="av143-status-line"><i aria-hidden="true"/> PRE-ALPHA DEVELOPMENT</span><h2>SEVERANCE<span>.</span></h2><p>Long-term persistent survival horror with an initial tested Godot WebGL prototype. Multiplayer production servers, public play access, and a release date have not been announced.</p><Link className="av143-action av143-action--primary" to="/severance">OPEN PROJECT DOSSIER <Icon name="arrow" size={17}/></Link></div></section>
  <section className="av143-list-section"><div className="av143-heading"><div><span className="av143-overline">OTHER INTERACTIVE WORK</span><h2>Experiments & future work.</h2></div></div><div className="av143-progress-grid"><article><span className="av143-progress-phase">CONCEPT / PRESERVED</span><h3>ABSENCE PROTOCOL</h3><p>An original horror game concept retained for future consideration; not represented as a released experience.</p></article><article><span className="av143-progress-phase">INDEPENDENT PROTOTYPE</span><h3>The Adventure Book</h3><p>An experimental family adventure project with local-save demo source. No public launch is claimed.</p></article><article><span className="av143-progress-phase">SMALL INDEPENDENT GAME</span><h3>BRANDLE</h3><p>A standalone word-game project for Brandi. Its source and deployment are distinct from the flagship universe.</p><a className="av143-inline-link" href="https://github.com/anevum/anevum-web/tree/main/games/brandle" target="_blank" rel="noopener noreferrer">VIEW SOURCE <Icon name="arrow" size={16}/></a></article></div></section>
  </div>;
}

export function JournalPageV143(){
 const entries=[
  {date:"OCT 28, 2026",label:"SEVERANCE / PROTOTYPE",title:"First verified browser graybox",text:"Godot WebGL 2 browser acceptance and a separate authoritative WebSocket client test passed on the prototype branch. Multiplayer human playtesting and persistent-world services remain outstanding.",url:"https://github.com/anevum/anevum-web/pull/788"},
  {date:"OCT 27–28, 2026",label:"ANEVUM / WEBSITE",title:"Cinematic presentation and route refinement",text:"Recent source revisions introduced first-party motion, a game dossier, a corrected orbital identity and verified navigation work. Source merges do not by themselves prove a live production release.",url:"https://github.com/anevum/anevum-web/pull/787"},
  {date:"OCT 29, 2026",label:"SMALL GAMES / RELEASE",title:"BRANDLE added as independent Cloudflare game",text:"The word game was merged as isolated source and given its own Worker deployment, without changing the main ANEVUM application.",url:"https://github.com/anevum/anevum-web/pull/790"}
 ];
 return <div className="av143-site av143-inner" data-studio-page="journal">
   <section className="av143-interior-hero av143-interior-hero--journal"><span className="av143-overline">ANEVUM / DEVELOPMENT RECORD</span><h1>Building<br/><em>in the open.</em></h1><p>Verified milestones, genuine constraints and what is being made next. No simulated updates, fabricated statistics or invented launch dates.</p></section>
   <section className="av143-list-section"><div className="av143-heading"><div><span className="av143-overline">SOURCE-REFERENCED DEVELOPMENT</span><h2>Recent work.</h2></div><Link className="av143-inline-link" to="/status">CHECK LIVE SERVICE STATUS <Icon name="arrow" size={16}/></Link></div>
   <div className="av143-journal-list">{entries.map(e=><article key={e.title}><span className="av143-overline">{e.date} / {e.label}</span><h3>{e.title}</h3><p>{e.text}</p><a className="av143-inline-link" href={e.url} target="_blank" rel="noopener noreferrer">VIEW SOURCE RECORD <Icon name="arrow" size={16}/></a></article>)}</div><p className="av143-annotation">This journal records source-verified milestones as of October 30, 2026. The independent /status page checks current service capabilities when available.</p></section>
   <section className="av143-footer-cta"><h2>Follow individual projects.</h2><p>Each independent game and tool should have its own GitHub repository, issues and releases as the portfolio is reorganized.</p><a className="av143-action av143-action--primary" href="https://github.com/anevum" target="_blank" rel="noopener noreferrer">VIEW ANEVUM ON GITHUB <Icon name="arrow" size={16}/></a></section>
 </div>;
}
