import { Link } from "react-router-dom";
import { LevelPanel } from "../components/LevelPanel";
import { OrbitalStage } from "../components/OrbitalStage";
import { CosmicHorizon } from "../components/CosmicHorizon";
import { CelestialEmblem } from "../components/CelestialEmblem";
import { achievementArt, seriesOneStudies } from "../lib/artifact-art";

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
        <section className="portal-box artifact-museum" aria-labelledby="artifact-museum-heading">
          <header className="portal-box-header"><div><span className="kicker">VISUAL DESIGN / SERIES ONE</span><h2 id="artifact-museum-heading">THE CELESTIAL ARTIFACTS.</h2></div><span className="portal-box-aside">FOUR ARTWORK STUDIES / NOT AWARDED</span></header>
          <p className="artifact-section-note">These are <strong>illustrative artwork studies</strong> of four named milestones from the first 60-artifact series. They are not badges earned by you, confirmed inventory, or new progression rewards. Actual milestones still come only from the server.</p>
          <div className="artifact-showcase">
            {seriesOneStudies.map(study=><article className="artifact-showcase-tile" key={study.level}>
              <span className="artifact-showcase-index"><span>SERIES 01 / LEVEL {String(study.level).padStart(2,"0")}</span><span>ART CONCEPT</span></span>
              <CelestialEmblem motif={study.motif} size="large" state="preview"/>
              <h3>{study.name.toUpperCase()}</h3>
              <p>{study.finish.toUpperCase()} / ILLUSTRATIVE STUDY</p>
            </article>)}
          </div>
          <div className="artifact-size-bench" aria-label="Emblem scale comparison, not earned rewards">
            <span><CelestialEmblem motif="beacon" size="nano"/><small>16PX</small></span>
            <span><CelestialEmblem motif="beacon" size="tiny"/><small>20PX</small></span>
            <span><CelestialEmblem motif="beacon" size="micro"/><small>24PX</small></span>
            <span><CelestialEmblem motif="beacon" size="compact"/><small>32PX</small></span>
            <span><CelestialEmblem motif="beacon" size="small"/><small>48PX COMPACT</small></span>
            <span><CelestialEmblem motif="beacon" size="medium"/><small>96PX CABINET</small></span>
          </div>
        </section>
        <section className="portal-box">
          <header className="portal-box-header"><div><span className="kicker">ACHIEVEMENT CABINET / VISUAL REFERENCE</span><h2>THINGS WORTH EARNING</h2></div><span className="portal-box-aside">SIX DEFINED ACHIEVEMENTS</span></header>
          <p className="artifact-section-note">Six defined achievement conditions. These images are <strong>unearned examples</strong>; private and public profiles show the earned state only after the existing member service verifies it.</p>
          <div className="levels-achievements">{achievementArt.map((item,i)=><article key={item.key}>
            <div className="levels-symbol" aria-hidden="true"><CelestialEmblem motif={item.art} size="medium" state="preview"/><small>{String(i+1).padStart(2,"0")}</small></div>
            <strong>{item.name}</strong><p>{item.description}</p></article>)}</div>
        </section>
        <section className="portal-box levels-policy"><span className="kicker">CURRENT STAGING MECHANICS</span><h2>THE SYSTEM IS STILL BEING BALANCED.</h2><p>The member dashboard starts with two one-time milestones: 10 XP for your first wall entry, and 25 XP for a saved introduction, picture and banner. Repeating or removing these actions does not grant extra XP. Game achievements and Creator Studio contributions will be connected as those services become available. These new member milestones do not import progress from older accounts.</p></section>
      </div>
      <aside className="portal-sidebar"><LevelPanel/><section className="portal-sidebox"><span className="kicker">ARTIFACT COLLECTION / SERIES 01</span><h2>THE FIRST 60 ARTIFACTS.</h2><p>From Foundry Spark to The First Light, the first collection has sixty named artifacts. Higher levels continue, and later collections will be designed separately.</p><Link to="/guide">PRACTICE CONTRIBUTION SKILLS ↗</Link><Link to="/status">VIEW DEVELOPMENT STATUS ↗</Link></section></aside>
    </div>
  </div>;
}
