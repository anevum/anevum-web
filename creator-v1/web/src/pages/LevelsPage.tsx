import {Link} from 'react-router-dom';
import {LevelPanel} from '../components/LevelPanel';
import {LevelCollection} from '../components/LevelCollection';
import {AwardEmblem} from '../components/LevelEmblem';
import {useMemberProgression} from '../components/AnevumNotifications';
import {OrbitalStage} from '../components/OrbitalStage';
import {CosmicHorizon} from '../components/CosmicHorizon';
const principles=[
 {title:'NO FINAL LEVEL',text:'The first 60 artifacts form Series One. Your level can keep growing beyond the collection.'},
 {title:'EARNED, NOT PURCHASED',text:'Member milestones earn XP once. The temporary staging button tests progression with separately recorded XP.'},
 {title:'RECOGNITION, NOT AUTHORITY',text:'Levels do not grant moderation powers, stronger votes or access to private information.'}
];
export function LevelsPage(){
 const {progression:p}=useMemberProgression();
 const medals=[{id:'first_signal',name:'First Signal',detail:'Save your first wall entry.',xp:10},{id:'world_shaper',name:'World Shaper',detail:'Save an introduction, profile picture and banner.',xp:25}];
 return <div className="levels-page"><section className="levels-masthead"><CosmicHorizon/><div><span className="kicker">CONTINUANCE INSTITUTE / RECOGNITION REGISTRY</span><h1>LEAVE A<br/><em>LASTING SIGNAL.</em></h1><p>Your contributions, your artifacts, your place in an expanding continuance.</p><Link to="/member?tab=awards" className="button primary">YOUR AWARDS & STATS ↗</Link></div><div className="levels-emblem" aria-hidden="true"><OrbitalStage variant="monument"/><span>THE FIRST 60 ARTIFACTS / NO FINAL LEVEL</span></div></section><div className="portal-layout levels-layout"><div className="portal-main"><section className="portal-box"><div className="levels-rule-grid">{principles.map((a,i)=><article key={a.title}><span className="levels-index">0{i+1}</span><strong>{a.title}</strong><p>{a.text}</p></article>)}</div></section><LevelCollection/><section className="portal-box"><header className="portal-box-header"><div><span className="kicker">MEMBER MEDALS / VERIFIED MILESTONES</span><h2>MARKS OF YOUR JOURNEY.</h2></div></header><div className="levels-achievements">{medals.map(a=>{const earned=Boolean(p?.awards.find(v=>v.id===a.id)?.earnedAt);return <article key={a.id}><AwardEmblem award={a.id} earned={earned}/><strong>{a.name}</strong><p>{a.detail}</p><small>{earned?'EARNED':'TO EARN'} · {a.xp} XP</small></article>})}</div><p className="artifact-section-note">First Signal awards 10 XP. World Shaper awards 25 XP. Repeating or removing a completed milestone does not grant extra XP. Earned state comes from your member service. Game and Creator Studio medals will connect as those services become available.</p></section></div><aside className="portal-sidebar"><LevelPanel/><section className="portal-sidebox"><span className="kicker">STAGING / SIGNAL CALIBRATION</span><h2>THE BUTTON.</h2><p>Test XP and the ANEVUM notification system. Each confirmed press adds 5 XP to your staging account.</p><Link to="/thebutton">OPEN THE TEST INSTRUMENT ↗</Link></section></aside></div></div>;
}
