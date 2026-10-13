import { Link } from "react-router-dom";
import { LevelPanel } from "../components/LevelPanel";
import { OrbitalStage } from "../components/OrbitalStage";
import { CosmicHorizon } from "../components/CosmicHorizon";

const achievements=[
  {label:"FIRST SIGNAL",description:"Rate a published project for the first time.",symbol:"✦"},
  {label:"KEEN EYE",description:"Rate five published projects.",symbol:"◇"},
  {label:"PORTAL GUIDE",description:"Rate twenty-five published projects.",symbol:"✳"},
  {label:"FIRST LAUNCH",description:"Publish your first staff-approved project.",symbol:"⟡"},
  {label:"THREE BUILDS",description:"Publish three approved projects.",symbol:"⬡"},
  {label:"RELEASE STEWARD",description:"Ship a versioned update to published work.",symbol:"✺"}
] as const;
const principles=[
  {title:"NO FINAL LEVEL",text:"Keep earning XP as long as you contribute. The first sixty collectible artifact names are a series, not a finish line."},
  {title:"UNLOCKED, NOT PURCHASED",text:"Reviews and approved creative work can earn recognition. Purchases, passive views and repeated clicks do not."},
  {title:"REPUTATION IS SEPARATE",text:"Higher levels do not grant stronger votes, moderation powers, special ranking priority or access to private information."},
  {title:"BUILT TO BE FAIR",text:"Actions must be verified and repeat awards are controlled. Moderators can reverse abusive rewards."}
] as const;

export function LevelsPage(){
  return <div className="levels-page">
    <section className="levels-masthead"><CosmicHorizon/><div><span className="kicker">ANEVUM / UNIVERSAL PROGRESSION</span><h1>MAKE YOUR<br/><em>MARK.</em></h1><p>Every real contribution adds to your story. No ceiling. No purchased status. No higher voting power.</p><Link to="/account" className="button primary">YOUR PROFILE ↗</Link></div><div className="levels-emblem" aria-hidden="true"><OrbitalStage variant="monument"/><span>THE UNDERGROUND NEVER ENDS</span></div></section>
    <div className="portal-layout levels-layout">
      <div className="portal-main">
        <section className="portal-box">
          <header className="portal-box-header"><div><span className="kicker">YOUR OWN ORBIT</span><h2>HOW ANEVUM LEVELS WORK</h2></div></header>
          <div className="levels-rule-grid">{principles.map((item,i)=><article key={item.title}><span className="levels-index">{String(i+1).padStart(2,"0")}</span><strong>{item.title}</strong><p>{item.text}</p></article>)}</div>
        </section>
        <section className="portal-box">
          <header className="portal-box-header"><div><span className="kicker">ACHIEVEMENT CABINET / FIRST SERIES</span><h2>THINGS WORTH EARNING</h2></div><span className="portal-box-aside">SIX DEFINED ACHIEVEMENTS</span></header>
          <div className="levels-achievements">{achievements.map((item,i)=><article key={item.label}><div className="levels-symbol" aria-hidden="true"><span>{item.symbol}</span><small>{String(i+1).padStart(2,"0")}</small></div><strong>{item.label}</strong><p>{item.description}</p></article>)}</div>
        </section>
        <section className="portal-box levels-policy"><span className="kicker">CURRENT STAGING MECHANICS</span><h2>THE SYSTEM IS STILL BEING BALANCED.</h2><p>The existing backend currently grants 2 XP for the first qualifying rating of a distinct third-party published project, with at most five XP-earning ratings per day. The XP curve and additional meaningful contribution categories are under review. Removing the level ceiling does not change earned XP or make unimplemented rewards available.</p></section>
      </div>
      <aside className="portal-sidebar"><LevelPanel/><section className="portal-sidebox"><span className="kicker">ARTIFACT COLLECTION / SERIES 01</span><h2>THE FIRST 60 ARTIFACTS.</h2><p>From Foundry Spark to The First Light, the first collection has sixty named artifacts. Higher levels continue, and later collections will be designed separately.</p><Link to="/guide">PRACTICE CONTRIBUTION SKILLS ↗</Link><Link to="/status">VIEW DEVELOPMENT STATUS ↗</Link></section></aside>
    </div>
  </div>;
}
